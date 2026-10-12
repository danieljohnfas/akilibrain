"""
Checks the live-trading safety limits against a fake exchange. No internet, no real orders.
Run with:  python tests/test_live.py     (or: python -m pytest tests)
"""
import copy
import os
import sys
import tempfile
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config  # noqa: E402
import live  # noqa: E402

NOW = datetime(2026, 9, 29, 0, 20, tzinfo=timezone.utc)
DAY = 86_400_000


class FakeExchange:
    def __init__(self, closes, base=0.0, usdt=20.0, price=None, fill=True):
        end = int(datetime(2026, 9, 28, tzinfo=timezone.utc).timestamp() * 1000)
        n = len(closes)
        self.rows = [[end - (n - 1 - i) * DAY, c, c, c, c, 1.0] for i, c in enumerate(closes)]
        self.base, self.usdt, self.fill = base, usdt, fill
        self.price = price or closes[-1]
        self.orders = []

    def milliseconds(self): return int(NOW.timestamp() * 1000)
    def load_markets(self): return {}
    def market(self, s): return {"base": "BTC", "quote": "USDT",
                                 "limits": {"amount": {"min": 0.00001}, "cost": {"min": 1.0}}}
    def fetch_ohlcv(self, s, timeframe="1d", since=None, limit=None): return list(self.rows)
    def fetch_ticker(self, s): return {"bid": self.price * 0.9995, "ask": self.price * 1.0005, "last": self.price}
    def fetch_balance(self): return {"BTC": {"total": self.base, "free": self.base},
                                     "USDT": {"total": self.usdt, "free": self.usdt}}
    def amount_to_precision(self, s, a): return f"{int(a * 1e6) / 1e6:.6f}"
    def price_to_precision(self, s, p): return f"{p:.2f}"

    def create_order(self, s, typ, side, amount, price, params):
        assert typ == "limit" and params.get("timeInForce") == "IOC"
        self.orders.append((side, amount, price))
        filled = amount if self.fill else 0.0
        return {"id": "1", "status": "closed" if self.fill else "canceled", "filled": filled,
                "average": price, "cost": filled * price}


BREAKOUT = [100.0] * 60 + [110.0]            # last close is above the previous 50-day high: LONG
BREAKDOWN = [100.0] * 55 + [120.0] * 5 + [90.0]   # a long position: close below the 20-day low: EXIT
QUIET = [100.0] * 61                          # nothing happens: HOLD


def go(ex, execute=True, read_balances=True, limits=None, kill=False, **kw):
    d = tempfile.mkdtemp()
    ks = os.path.join(d, "KILL_SWITCH")
    if kill:
        open(ks, "w").close()
    log = os.path.join(d, "results", "live_log.csv")
    res = live.run(ex, "BTC/USDT", 50, 20, execute=execute, read_balances=read_balances,
                   log_path=log, kill_switch_path=ks, limits=limits, now=NOW, **kw)
    return res, log


def refused(fn, text=""):
    try:
        fn()
    except live.Refused as e:
        assert text in str(e), f"wrong reason: {e}"
        return
    raise AssertionError("expected Refused")


def test_dry_run_sends_no_orders():
    ex = FakeExchange(BREAKOUT, usdt=500)
    res, log = go(ex, execute=False)
    assert ex.orders == [] and res["action"] == "WOULD BUY"
    assert os.path.exists(log)


def test_buy_is_capped_at_the_20_dollar_limit_even_with_500_in_the_account():
    ex = FakeExchange(BREAKOUT, usdt=500)
    go(ex)
    side, amount, price = ex.orders[0]
    assert side == "buy" and amount * price <= 20.0, amount * price


def test_buy_limit_price_is_at_most_half_a_percent_above_the_ask():
    ex = FakeExchange(BREAKOUT, usdt=20)
    go(ex)
    assert ex.orders[0][2] <= 110.0 * 1.0005 * 1.005 + 0.01


def test_no_signal_means_no_order():
    ex = FakeExchange(QUIET, usdt=20)
    res, _ = go(ex)
    assert ex.orders == [] and res["action"] == "NONE"


def test_exit_sells_the_whole_holding_and_only_that():
    ex = FakeExchange(BREAKDOWN, base=0.25, usdt=1.0)     # 0.25 BTC at ~90 = ~22 USD
    go(ex)
    side, amount, price = ex.orders[0]
    assert side == "sell" and amount <= 0.25 and price >= 90 * 0.9995 * 0.995 - 0.01


def test_already_long_and_breakout_continues_holds():
    ex = FakeExchange(BREAKOUT, base=0.18, usdt=0.0)      # ~19.8 USD held: already long
    res, _ = go(ex)
    assert ex.orders == [] and res["action"] == "NONE"


def test_dust_counts_as_flat():
    ex = FakeExchange(BREAKOUT, base=0.00001, usdt=20)    # ~0.001 USD of coin
    go(ex)
    assert ex.orders and ex.orders[0][0] == "buy"


def test_refuses_when_account_holds_more_coin_than_the_limit():
    ex = FakeExchange(BREAKDOWN, base=10.0, usdt=0)       # ~900 USD of coin: not the bot's money
    refused(lambda: go(ex), "dedicated account")
    assert ex.orders == []


def test_refuses_other_symbols():
    ex = FakeExchange(BREAKOUT)
    d = tempfile.mkdtemp()
    try:
        live.run(ex, "DOGE/USDT", 50, 20, execute=True, read_balances=True, log_path=d + "/l.csv",
                 kill_switch_path=d + "/k", now=NOW)
    except live.Refused:
        return
    raise AssertionError("expected Refused")


def test_kill_switch_file_blocks_orders():
    ex = FakeExchange(BREAKOUT)
    refused(lambda: go(ex, kill=True), "KILL_SWITCH")
    assert ex.orders == []


def test_live_needs_api_keys():
    ex = FakeExchange(BREAKOUT)
    refused(lambda: go(ex, read_balances=False), "API keys")


def test_stale_candles_are_refused():
    ex = FakeExchange(BREAKOUT)
    ex.rows = ex.rows[:-1]                                # yesterday's candle missing
    refused(lambda: go(ex), "stale")
    assert ex.orders == []


def test_price_far_from_yesterdays_close_is_refused():
    ex = FakeExchange(BREAKOUT, price=150.0)
    refused(lambda: go(ex), "suspicious")
    assert ex.orders == []


def test_circuit_breaker_blocks_new_positions_but_not_exits():
    ex = FakeExchange(BREAKOUT, usdt=8.0)                 # equity 8 < 10 breaker
    refused(lambda: go(ex), "circuit breaker")
    assert ex.orders == []
    ex2 = FakeExchange(BREAKDOWN, base=0.08, usdt=0.0)    # equity ~7 but must still be able to exit
    go(ex2)
    assert ex2.orders and ex2.orders[0][0] == "sell"


def test_order_below_exchange_minimum_is_refused():
    ex = FakeExchange(BREAKOUT, usdt=3.0)
    refused(lambda: go(ex, limits={**config.LIVE, "halt_buys_below_equity_usd": 0}), "minimum")
    assert ex.orders == []


def test_daily_order_limit():
    ex = FakeExchange(BREAKOUT, usdt=20)
    d = tempfile.mkdtemp()
    log = os.path.join(d, "live_log.csv")
    for _ in range(2):
        live.write_log(log, dict(run_at="2026-09-29 00:05", symbol="BTC/USDT", mode="live", action="BUY"))
    try:
        live.run(ex, "BTC/USDT", 50, 20, execute=True, read_balances=True, log_path=log,
                 kill_switch_path=d + "/k", now=NOW)
    except live.Refused as e:
        assert "daily limit" in str(e) and ex.orders == []
        return
    raise AssertionError("expected Refused")


def test_dry_run_rows_do_not_count_toward_the_daily_limit():
    d = tempfile.mkdtemp()
    log = os.path.join(d, "live_log.csv")
    for _ in range(5):
        live.write_log(log, dict(run_at="2026-09-29 00:05", symbol="BTC/USDT", mode="dry-run", action="WOULD BUY"))
    assert live.orders_today(log, NOW) == 0


def test_unfilled_order_is_reported_not_hidden():
    ex = FakeExchange(BREAKOUT, usdt=20, fill=False)
    try:
        go(ex)
    except live.NotFilled:
        return
    raise AssertionError("expected NotFilled")


def test_dry_run_without_keys_assumes_flat_with_the_budget():
    ex = FakeExchange(BREAKOUT)
    res, _ = go(ex, execute=False, read_balances=False)
    assert res["action"] == "WOULD BUY" and ex.orders == []


if __name__ == "__main__":
    tests = [(name, fn) for name, fn in sorted(globals().items()) if name.startswith("test_")]
    failures = 0
    for name, fn in tests:
        try:
            fn()
            print(f"ok    {name}")
        except Exception as e:  # noqa: BLE001
            failures += 1
            print(f"FAIL  {name}: {type(e).__name__}: {e}")
    print(f"\n{len(tests) - failures}/{len(tests)} passed")
    sys.exit(1 if failures else 0)
