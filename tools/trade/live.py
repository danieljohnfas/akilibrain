"""
Live spot trading with hard limits. Uses the same strategy code as the backtest and paper trader.

Safety design:
  - Dry run unless execute=True. Nothing is ever ordered in a dry run.
  - No state files to drift: whether we're long is read from the exchange balance every run,
    so re-running the same day is harmless.
  - Long only, spot only, no leverage, one symbol from an allow-list.
  - Orders are limit orders, immediate-or-cancel, priced at most `max_slippage` past the best
    bid/ask, so they can never fill at a worse price than that.
  - Every limit lives in config.LIVE. Anything unexpected raises Refused and does nothing.
"""
from __future__ import annotations

import csv
import os
import time
from datetime import datetime, timezone

import pandas as pd

import config
from strategy import EXIT, HOLD, LONG, add_channels, decide

DAY_MS = 86_400_000
HISTORY_DAYS = 300
LOG_FIELDS = ["run_at", "symbol", "mode", "signal", "action", "amount", "price", "cost", "status",
              "quote_free", "base_total", "equity_usd", "note"]


class Refused(Exception):
    """A safety limit stopped the run. Nothing was ordered."""


class NotFilled(Exception):
    """An order was sent but did not fill completely."""


def make_exchange(exchange_id: str, with_keys: bool):
    import ccxt
    if not hasattr(ccxt, exchange_id):
        raise Refused(f"ccxt doesn't know an exchange called '{exchange_id}'")
    prefix = exchange_id.upper()
    params = {"enableRateLimit": True, "options": {"defaultType": "spot"}}
    if with_keys:
        key, secret = os.environ.get(f"{prefix}_API_KEY"), os.environ.get(f"{prefix}_API_SECRET")
        if not key or not secret:
            raise Refused(f"set {prefix}_API_KEY and {prefix}_API_SECRET "
                          f"(and {prefix}_API_PASSPHRASE if the exchange uses one)")
        params.update(apiKey=key, secret=secret)
        if os.environ.get(f"{prefix}_API_PASSPHRASE"):
            params["password"] = os.environ[f"{prefix}_API_PASSPHRASE"]
    return getattr(ccxt, exchange_id)(params)


def recent_candles(ex, symbol: str, now: datetime) -> pd.DataFrame:
    rows = ex.fetch_ohlcv(symbol, timeframe="1d", since=ex.milliseconds() - HISTORY_DAYS * DAY_MS, limit=1000)
    df = pd.DataFrame(rows, columns=["ts", "open", "high", "low", "close", "volume"])
    df.index = pd.to_datetime(df["ts"], unit="ms", utc=True).dt.tz_localize(None).dt.normalize()
    df = df[["open", "high", "low", "close"]].astype(float).dropna()
    df = df[~df.index.duplicated(keep="last")].sort_index()
    return df[df.index < pd.Timestamp(now.date())]      # today's candle isn't finished


def orders_today(log_path: str, now: datetime) -> int:
    if not os.path.exists(log_path):
        return 0
    day = f"{now:%Y-%m-%d}"
    with open(log_path, newline="") as f:
        return sum(1 for r in csv.DictReader(f) if r["mode"] == "live" and r["run_at"].startswith(day)
                   and r["action"] in ("BUY", "SELL"))


def write_log(log_path: str, row: dict) -> None:
    os.makedirs(os.path.dirname(log_path), exist_ok=True)
    new = not os.path.exists(log_path)
    with open(log_path, "a", newline="") as f:
        w = csv.DictWriter(f, fieldnames=LOG_FIELDS)
        if new:
            w.writeheader()
        w.writerow({k: row.get(k, "") for k in LOG_FIELDS})


def place(ex, symbol: str, side: str, amount: float, price: float) -> dict:
    """One immediate-or-cancel limit order; returns what actually filled."""
    order = ex.create_order(symbol, "limit", side, amount, price, {"timeInForce": "IOC"})
    if order.get("status") not in ("closed", "canceled", "expired") or order.get("filled") is None:
        time.sleep(2)
        order = ex.fetch_order(order["id"], symbol)
    filled = float(order.get("filled") or 0)
    avg = order.get("average") or order.get("price") or price
    return {"filled": filled, "price": float(avg), "cost": float(order.get("cost") or filled * float(avg)),
            "status": order.get("status", "unknown")}


def run(ex, symbol: str, entry_days: int, exit_days: int, *, execute: bool, read_balances: bool,
        log_path: str, kill_switch_path: str, limits: dict | None = None, now: datetime | None = None) -> dict:
    lim = limits or config.LIVE
    now = now or datetime.now(timezone.utc)
    mode = "live" if execute else "dry-run"
    log = lambda **kw: write_log(log_path, dict(run_at=f"{now:%Y-%m-%d %H:%M}", symbol=symbol, mode=mode, **kw))  # noqa: E731

    if symbol not in lim["allowed_symbols"]:
        raise Refused(f"{symbol} is not in the allowed list {lim['allowed_symbols']}")
    if execute and os.path.exists(kill_switch_path):
        raise Refused("KILL_SWITCH file exists: no orders will be placed")
    if execute and not read_balances:
        raise Refused("live trading needs API keys to read your balance")

    ex.load_markets()
    market = ex.market(symbol)
    base, quote = market["base"], market["quote"]

    # 1. Yesterday's completed candle and the strategy's decision -----------------
    candles = recent_candles(ex, symbol, now)
    if len(candles) < max(entry_days, exit_days) + 2:
        raise Refused(f"only {len(candles)} daily candles came back, not enough for a {entry_days}-day channel")
    last = candles.index[-1]
    if last != pd.Timestamp(now.date()) - pd.Timedelta(days=1):
        raise Refused(f"latest completed candle is {last:%Y-%m-%d}, expected yesterday: data is stale")
    row = add_channels(candles, entry_days, exit_days).iloc[-1]
    close = float(row["close"])

    # 2. Live price sanity check ----------------------------------------------------
    t = ex.fetch_ticker(symbol)
    bid, ask = float(t.get("bid") or t["last"]), float(t.get("ask") or t["last"])
    mid = (bid + ask) / 2
    if abs(mid / close - 1) > lim["max_price_deviation"]:
        raise Refused(f"live price {mid:,.2f} is more than {lim['max_price_deviation']:.0%} from "
                      f"yesterday's close {close:,.2f}: refusing to trade on suspicious data")

    # 3. What we hold ---------------------------------------------------------------
    if read_balances:
        bal = ex.fetch_balance()
        base_total = float((bal.get(base) or {}).get("total") or 0)
        base_free = float((bal.get(base) or {}).get("free") or 0)
        quote_total = float((bal.get(quote) or {}).get("total") or 0)
        quote_free = float((bal.get(quote) or {}).get("free") or 0)
    else:  # dry run without keys: pretend we're flat with the full budget
        base_total = base_free = quote_total = 0.0
        quote_free = quote_total = float(lim["max_capital_usd"])
    holding_usd = base_total * mid
    equity = quote_total + holding_usd
    if holding_usd > lim["max_holding_usd"]:
        raise Refused(f"account holds {holding_usd:,.2f} USD of {base}, over the {lim['max_holding_usd']:,.0f} limit. "
                      "This account has coin the bot shouldn't manage: use a dedicated account")
    side = 1 if holding_usd >= lim["min_notional"] else 0
    signal = decide(side, close, float(row["entry_high"]), float(row["entry_low"]),
                    float(row["exit_low"]), float(row["exit_high"]), allow_short=False)

    ctx = dict(signal=signal, quote_free=round(quote_free, 4), base_total=base_total, equity_usd=round(equity, 2))
    print(f"{symbol} | last completed day {last:%Y-%m-%d} close {close:,.2f} | price now {mid:,.2f} | mode {mode}")
    print(f"Holding {base_total:.8f} {base} (~{holding_usd:,.2f} USD) + {quote_free:,.2f} {quote} free | "
          f"{'LONG' if side else 'flat'} | signal {signal}")

    if signal == HOLD:
        log(action="NONE", note="hold: no signal", **ctx)
        print("Nothing to do.")
        return dict(action="NONE", **ctx)

    # 4. Build the order within the limits ------------------------------------------
    if signal == LONG:
        if equity < lim["halt_buys_below_equity_usd"]:
            log(action="NONE", note="circuit breaker", **ctx)
            raise Refused(f"account value {equity:,.2f} is under the {lim['halt_buys_below_equity_usd']:,.2f} "
                          "circuit breaker: no new positions")
        order_side = "buy"
        price = float(ex.price_to_precision(symbol, ask * (1 + lim["max_slippage"])))
        budget = min(quote_free, lim["max_order_usd"], lim["max_capital_usd"]) * (1 - lim["fee_buffer"])
        amount = float(ex.amount_to_precision(symbol, budget / price))
    elif signal == EXIT:
        order_side = "sell"
        price = float(ex.price_to_precision(symbol, bid * (1 - lim["max_slippage"])))
        amount = float(ex.amount_to_precision(symbol, base_free))
    else:
        raise Refused(f"unexpected signal {signal}")

    limits_mkt = market.get("limits") or {}
    min_amount = ((limits_mkt.get("amount") or {}).get("min")) or 0
    min_cost = max(((limits_mkt.get("cost") or {}).get("min")) or 0, lim["min_notional"])
    cost = amount * price
    if amount <= 0 or amount < min_amount or cost < min_cost:
        log(action="NONE", amount=amount, price=price, note="order below exchange minimum", **ctx)
        raise Refused(f"the {order_side} would be {amount} {base} (~{cost:,.2f} USD), below the minimum "
                      f"({min_amount} {base} / {min_cost:,.2f} USD). Not enough balance")
    if order_side == "buy" and cost > lim["max_order_usd"] * 1.001:
        raise Refused(f"order value {cost:,.2f} exceeds the {lim['max_order_usd']:,.2f} limit")

    print(f">> {order_side.upper()} {amount} {base} at limit {price:,.2f} (~{cost:,.2f} USD, IOC)")

    # 5. Send it (or just report, in a dry run) ---------------------------------------
    if not execute:
        log(action=f"WOULD {order_side.upper()}", amount=amount, price=price, cost=round(cost, 2),
            note="dry run, nothing sent", **ctx)
        print("Dry run: no order sent. Add --execute (with LIVE_TRADING=yes) to trade for real.")
        return dict(action=f"WOULD {order_side.upper()}", amount=amount, price=price, **ctx)
    if orders_today(log_path, now) >= lim["max_orders_per_day"]:
        raise Refused(f"already placed {lim['max_orders_per_day']} orders today: daily limit reached")

    result = place(ex, symbol, order_side, amount, price)
    log(action=order_side.upper(), amount=result["filled"], price=result["price"], cost=round(result["cost"], 2),
        status=result["status"], note="", **ctx)
    print(f"Order {result['status']}: filled {result['filled']} of {amount} {base} at {result['price']:,.2f}")
    if result["filled"] < amount * 0.999:
        raise NotFilled(f"{order_side} filled {result['filled']} of {amount} {base} (price moved past the "
                        f"{lim['max_slippage']:.1%} limit). Re-run to retry; the state is read from the exchange")
    return dict(action=order_side.upper(), **result, **ctx)
