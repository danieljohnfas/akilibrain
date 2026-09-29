"""Turns a backtest Result into numbers, console reports, CSV files and a chart."""
from __future__ import annotations

import math
import os
from dataclasses import fields
from datetime import datetime

import numpy as np
import pandas as pd

from engine import Result, Trade, fill_price, size_position
from strategy import EXIT, LONG, SHORT

LINE, THIN = "=" * 78, "-" * 78


# --- formatting -----------------------------------------------------------------

def price_str(p: float) -> str:
    if p >= 1000:
        return f"{p:,.2f}"
    if p >= 20:
        return f"{p:,.3f}"
    if p >= 0.01:
        return f"{p:,.5f}"
    return f"{p:.4g}"


def units_str(inst, u: float) -> str:
    if inst.market == "forex":
        lots = u / inst.lot_size
        return f"{u:,.0f} units ({lots:.2f} lot)" if lots >= 0.01 else f"{u:,.0f} units ({lots * 100:.2f} cent lot)"
    return f"{u:.6g} {inst.symbol.split('/')[0]}"


def money(x: float, ccy: str) -> str:
    return f"{x:,.2f} {ccy}"


def pct(x: float) -> str:
    return f"{x * 100:+.1f}%"


def dd_str(x: float) -> str:
    return f"{x * 100:.1f}%"


def row(label: str, text: str) -> None:
    print(f"{label:<16}{text}")


def describe(res: Result) -> str:
    inst = res.inst
    sides = "long + short" if inst.allow_short else "long only"
    sizing = (f"risk {inst.risk_per_trade:.1%} a trade" if inst.sizing == "risk"
              else f"{inst.alloc:.0%} of account a trade")
    return f"{inst.symbol} | {inst.market} | {res.entry_days}/{res.exit_days}-day breakout | {sides} | {sizing}"


# --- numbers --------------------------------------------------------------------

def stats(res: Result) -> dict:
    eq = res.equity
    years = max((res.end - res.start).days / 365.25, 1 / 365.25)
    final = float(eq.iloc[-1])
    growth = final / res.start_balance
    rets = eq.pct_change().replace([np.inf, -np.inf], np.nan).dropna()
    sd = rets.std()
    trades = res.trades
    wins = [t for t in trades if t.pnl > 0]
    losses = [t for t in trades if t.pnl <= 0]
    gross_win, gross_loss = sum(t.pnl for t in wins), -sum(t.pnl for t in losses)
    needed = [s.balance_needed for s in res.skips]
    return dict(
        years=years, final=final, total_return=growth - 1,
        cagr=growth ** (1 / years) - 1 if growth > 0 else -1.0,
        max_dd=float((eq / eq.cummax() - 1).min()),
        sharpe=float(rets.mean() / sd * math.sqrt(len(eq) / years)) if sd and sd > 0 else 0.0,
        trades=len(trades),
        win_rate=len(wins) / len(trades) if trades else 0.0,
        avg_win=float(np.mean([t.return_pct for t in wins])) if wins else 0.0,
        avg_loss=float(np.mean([t.return_pct for t in losses])) if losses else 0.0,
        profit_factor=gross_win / gross_loss if gross_loss > 0 else (math.inf if gross_win > 0 else 0.0),
        exposure=float((res.position != 0).mean()),
        needed_typical=float(np.median(needed)) if needed else 0.0,
        needed_max=max(needed) if needed else 0.0,
    )


def score(s: dict) -> float:
    """Return per unit of pain: yearly growth divided by the worst drawdown."""
    return s["cagr"] / max(-s["max_dd"], 0.05)


def buy_and_hold(res: Result):
    """Simply buying on the first day and holding (spot crypto), with the same fees."""
    inst, d = res.inst, res.data.loc[res.start:res.end]
    buy = fill_price(inst, float(d["open"].iloc[0]), +1)
    units = res.start_balance / (buy * (1 + inst.fee_rate))
    sell = fill_price(inst, float(d["close"].iloc[-1]), -1)
    return units * d["close"], units * sell * (1 - inst.fee_rate)


# --- backtest report ------------------------------------------------------------

def print_report(res: Result) -> None:
    s, inst = stats(res), res.inst
    ccy = inst.account_ccy
    print(LINE)
    print(describe(res))
    print(f"{res.start:%Y-%m-%d} -> {res.end:%Y-%m-%d} ({s['years']:.1f} years) | "
          f"starting balance {money(res.start_balance, ccy)}")
    print(THIN)
    row("Final value", f"{money(s['final'], ccy)}  ({pct(s['total_return'])} total, {pct(s['cagr'])} a year)")
    row("Worst drawdown", dd_str(s["max_dd"]))
    if inst.market == "crypto":
        curve, final = buy_and_hold(res)
        bh_dd = float((curve / curve.cummax() - 1).min())
        row("Buy & hold", f"{money(final, ccy)}  ({pct(final / res.start_balance - 1)} total, "
                          f"worst drawdown {dd_str(bh_dd)})")
    else:
        closes = res.data.loc[res.start:res.end, "close"]
        row("Pair moved", f"{pct(closes.iloc[-1] / closes.iloc[0] - 1)} over the period")
    if s["trades"]:
        pf = "n/a" if math.isinf(s["profit_factor"]) else f"{s['profit_factor']:.2f}"
        row("Trades", f"{s['trades']} closed | {s['win_rate']:.0%} winners | profit factor {pf}")
        row("Avg win / loss", f"{s['avg_win']:+.1f}% / {s['avg_loss']:+.1f}% of the account")
        if s["trades"] < 20:
            row("", "(fewer than 20 trades: too few to tell skill from luck)")
    else:
        row("Trades", "none")
    row("Time in market", f"{s['exposure']:.0%}")
    row("Costs paid", f"{money(res.costs, ccy)} = {res.costs / res.start_balance:.0%} of the starting balance")
    row("", f"fees {res.fees:,.2f} | spread + slippage {res.spread_slippage:,.2f} | financing {res.financing:,.2f}")
    if res.skips:
        row("Skipped", f"{len(res.skips)} signals: the position would have been under the minimum size")
        row("", f"balance needed: ~{money(s['needed_typical'], ccy)} typically, "
                f"{money(s['needed_max'], ccy)} to take every signal")
    if res.wiped_out_on is not None:
        row("WIPED OUT", f"the account went to zero on {res.wiped_out_on:%Y-%m-%d}")
    if res.open_trade:
        t = res.open_trade
        row("Open position", f"{t['side']} {units_str(inst, t['units'])} @ {price_str(t['entry_price'])} "
                             f"since {t['entry_date']:%Y-%m-%d} ({t['pnl_so_far']:+,.2f} {ccy} so far)")
    print(LINE)


def save(res: Result, folder: str, tag: str) -> list:
    os.makedirs(folder, exist_ok=True)
    base = os.path.join(folder, tag)
    cols = [f.name for f in fields(Trade)]
    pd.DataFrame([t.__dict__ for t in res.trades], columns=cols).to_csv(base + "_trades.csv", index=False)
    pd.concat([res.equity, res.position], axis=1).to_csv(base + "_equity.csv")
    chart = plot(res, base + "_chart.png")
    return [p for p in (base + "_trades.csv", base + "_equity.csv", chart) if p]


def plot(res: Result, path: str):
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
    except ImportError:
        return None
    inst = res.inst
    d = res.data.loc[res.start:res.end]
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(12, 9), sharex=True,
                                        gridspec_kw={"height_ratios": [3, 2, 1]})
    ax1.plot(d.index, d["close"], color="#222222", lw=0.9, label="close")
    ax1.plot(d.index, d["entry_high"], color="#2a9d8f", lw=0.7, alpha=0.7, label=f"{res.entry_days}-day high")
    ax1.plot(d.index, d["exit_low"], color="#e76f51", lw=0.7, alpha=0.7, label=f"{res.exit_days}-day low")
    trades = list(res.trades)
    for t in trades:
        colour = "#2a9d8f" if t.side == "LONG" else "#7b2cbf"
        ax1.scatter(t.entry_date, t.entry_price, marker="^" if t.side == "LONG" else "v", color=colour, s=36, zorder=3)
        ax1.scatter(t.exit_date, t.exit_price, marker="x", color="#222222", s=28, zorder=3)
    if res.open_trade:
        t = res.open_trade
        ax1.scatter(t["entry_date"], t["entry_price"], marker="^" if t["side"] == "LONG" else "v",
                    color="#f4a261", s=50, zorder=3, label="open position")
    if inst.market == "crypto":
        ax1.set_yscale("log")
    ax1.set_title(describe(res), fontsize=10)
    ax1.legend(loc="upper left", fontsize=8)

    ax2.plot(res.equity.index, res.equity, color="#264653", lw=1.2, label="strategy")
    if inst.market == "crypto":
        curve, _ = buy_and_hold(res)
        ax2.plot(curve.index, curve, color="#999999", lw=0.9, label="buy & hold")
    ax2.axhline(res.start_balance, color="#999999", lw=0.6, ls="--")
    if res.equity.min() > 0 and res.equity.max() / res.equity.min() > 10:
        ax2.set_yscale("log")
    ax2.set_ylabel(f"account ({inst.account_ccy})")
    ax2.legend(loc="upper left", fontsize=8)

    dd = (res.equity / res.equity.cummax() - 1) * 100
    ax3.fill_between(dd.index, dd.to_numpy(), 0, color="#e76f51", alpha=0.5)
    ax3.set_ylabel("drawdown %")
    fig.tight_layout()
    fig.savefig(path, dpi=110)
    plt.close(fig)
    return path


# --- optimisation ---------------------------------------------------------------

def print_optimization(inst, rows: list, tune: tuple, test: tuple, default: tuple, top: int) -> None:
    ranked = sorted(rows, key=lambda r: score(r["tune"]), reverse=True)
    by_test = sorted(rows, key=lambda r: score(r["test"]), reverse=True)
    print(LINE)
    print(f"{inst.symbol} | tuning on {tune[0]:%Y-%m-%d} -> {tune[1]:%Y-%m-%d} | "
          f"checking on unseen {test[0]:%Y-%m-%d} -> {test[1]:%Y-%m-%d}")
    print("Ranked by the tuning period's yearly return divided by its worst drawdown.")
    print(THIN)
    print(f"{'#':>3} {'entry':>5} {'exit':>4} |  TUNING  {'a year':>7} {'worst DD':>8} {'trades':>6} "
          f"|  UNSEEN  {'a year':>7} {'worst DD':>8} {'trades':>6}")

    def line(label, r):
        a, b = r["tune"], r["test"]
        print(f"{label:>3} {r['entry']:>5} {r['exit']:>4} |          {pct(a['cagr']):>7} {dd_str(a['max_dd']):>8} "
              f"{a['trades']:>6} |          {pct(b['cagr']):>7} {dd_str(b['max_dd']):>8} {b['trades']:>6}")

    for n, r in enumerate(ranked[:top], 1):
        line(str(n), r)
    dflt = next((r for r in rows if (r["entry"], r["exit"]) == default), None)
    if dflt and dflt not in ranked[:top]:
        print(THIN)
        line("dflt", dflt)
    print(THIN)
    if all(r["tune"]["trades"] == 0 for r in rows):
        print("No trades were possible at this balance. Try a bigger --balance, or --min-units 10 for a cent account.")
    else:
        best = ranked[0]
        print(f"The combination that looked best while tuning ({best['entry']}/{best['exit']}) ranked "
              f"#{by_test.index(best) + 1} of {len(rows)} on the unseen period.")
        print("If the top of the tuning list doesn't hold up on unseen data, you were fitting noise.")
    print(LINE)


# --- paper trading --------------------------------------------------------------

def print_paper(res: Result) -> str:
    """Prints today's instruction for one symbol and returns it as a one-line summary."""
    inst, ccy, s = res.inst, res.inst.account_ccy, stats(res)
    bar = res.data.loc[res.end]
    print(LINE)
    print(f"{inst.symbol}   last completed day {res.end:%Y-%m-%d}   close {price_str(bar['close'])}")
    print(f"Paper account since {res.start:%Y-%m-%d}: {money(res.start_balance, ccy)} -> {money(s['final'], ccy)} "
          f"({pct(s['total_return'])}), {s['trades']} closed trade(s)")
    t = res.open_trade
    if t:
        print(f"Position: {t['side']} {units_str(inst, t['units'])} @ {price_str(t['entry_price'])} "
              f"since {t['entry_date']:%Y-%m-%d} ({t['pnl_so_far']:+,.2f} {ccy} so far)")
    else:
        print("Position: none")

    if res.wiped_out_on is not None:
        action = f"Account wiped out on {res.wiped_out_on:%Y-%m-%d}. Nothing left to trade."
    elif res.next_action in (LONG, SHORT):
        direction = 1 if res.next_action == LONG else -1
        verb = "BUY" if direction > 0 else "SELL SHORT"
        stop = float(bar["next_exit_low"] if direction > 0 else bar["next_exit_high"])
        # the next open isn't known yet; the last close is the best estimate
        units, needed = size_position(inst, s["final"], fill_price(inst, float(bar["close"]), direction), stop)
        if units:
            action = (f"NEXT OPEN: {verb} about {units_str(inst, units)}. "
                      f"It exits on a daily close {'below' if direction > 0 else 'above'} {price_str(stop)} "
                      f"(that level moves each day).")
        else:
            action = (f"Signal to {verb}, but at this balance the position would be under the minimum size "
                      f"(needs about {money(needed, ccy)}). No trade.")
    elif res.next_action == EXIT:
        action = f"NEXT OPEN: CLOSE the {t['side']} position."
    elif t and t["side"] == "LONG":
        action = f"HOLD. Exit if a daily close finishes below {price_str(bar['next_exit_low'])}."
    elif t:
        action = f"HOLD. Exit if a daily close finishes above {price_str(bar['next_exit_high'])}."
    else:
        action = f"WAIT. Buy if a daily close finishes above {price_str(bar['next_entry_high'])}"
        if inst.allow_short:
            action += f"; sell short if one finishes below {price_str(bar['next_entry_low'])}"
        action += "."
    print(f">> {action}")
    print(LINE)
    return action


def append_paper_log(folder: str, res: Result, action: str) -> None:
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, "paper_log.csv")
    t = res.open_trade
    entry = pd.DataFrame([{
        "run_at": datetime.now().strftime("%Y-%m-%d %H:%M"), "symbol": res.inst.symbol,
        "last_day": f"{res.end:%Y-%m-%d}", "close": float(res.data.loc[res.end, "close"]),
        "position": f"{t['side']} {t['units']:.6g}" if t else "none",
        "paper_equity": round(float(res.equity.iloc[-1]), 4), "instruction": action,
    }])
    entry.to_csv(path, mode="a", header=not os.path.exists(path), index=False)
