#!/usr/bin/env python3
"""
trendbot: a daily trend-following backtester and paper trader for crypto and forex.

  python bot.py backtest BTC/USDT EURUSD                 # how would it have done?
  python bot.py backtest EURUSD --balance 2000           # forex needs a bigger account (see README)
  python bot.py optimize BTC/USDT                        # tune on old data, check on unseen data
  python bot.py paper BTC/USDT EURUSD --since 2026-10-01 # run once a day to paper-trade

Symbols with a slash are crypto (ccxt format, e.g. BTC/USDT); six-letter pairs are forex (EURUSD).
"""
from __future__ import annotations

import argparse
import os
import re
import sys

import pandas as pd

import config
import report
from data import get_candles
from engine import backtest
from markets import detect_market, make_instrument

HERE = os.path.dirname(os.path.abspath(__file__))
RESULTS = os.path.join(HERE, "results")
ENTRY_GRID = [20, 30, 40, 50, 60, 80, 100]
EXIT_GRID = [10, 15, 20, 30, 40]


def build_parser() -> argparse.ArgumentParser:
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("symbols", nargs="+", help="e.g. BTC/USDT ETH/USDT EURUSD USDJPY (a slash means crypto)")

    g = common.add_argument_group("strategy and account")
    g.add_argument("--balance", type=float, default=config.DEFAULT_BALANCE,
                   help="starting balance (default %(default)s)")
    g.add_argument("--entry", type=int, default=config.DEFAULT_ENTRY_DAYS,
                   help="enter on a close beyond the last N days' range (default %(default)s)")
    g.add_argument("--exit", type=int, default=config.DEFAULT_EXIT_DAYS,
                   help="exit on a close beyond the last N days' range the other way (default %(default)s)")
    g.add_argument("--risk", type=float, help="size each trade to risk this %% of the account (forex default 1)")
    g.add_argument("--alloc", type=float, help="put this %% of the account into each trade (crypto default 100)")
    g.add_argument("--max-leverage", type=float, help="cap on position value / account (crypto 1, forex 30)")
    g.add_argument("--short", dest="allow_short", action="store_true", default=None, help="allow short trades")
    g.add_argument("--no-short", dest="allow_short", action="store_false", default=None, help="long trades only")
    g.add_argument("--min-units", type=float,
                   help="smallest position in units (forex: 1000 = 0.01 lot standard; 10 on a cent account)")
    g.add_argument("--min-notional", type=float, help="smallest order value (crypto default 5)")
    g.add_argument("--force-min-size", action="store_true",
                   help="take the minimum position even when it breaks the risk rule, to see what happens")

    c = common.add_argument_group("costs")
    c.add_argument("--fee", type=float, help="crypto exchange fee, %% per side (default 0.1)")
    c.add_argument("--slippage", type=float, help="crypto slippage, %% per side (default 0.05)")
    c.add_argument("--spread-pips", type=float, help="forex spread in pips (default: table in config.py)")
    c.add_argument("--slippage-pips", type=float, help="forex slippage in pips per side (default 0.2)")
    c.add_argument("--commission", type=float, help="forex commission per lot per side (default 0)")
    c.add_argument("--swap", type=float, help="forex overnight financing, %% of position value a year (default 2)")

    s = common.add_argument_group("data")
    s.add_argument("--start", help="first day to trade, YYYY-MM-DD")
    s.add_argument("--end", help="last day to trade, YYYY-MM-DD")
    s.add_argument("--exchange", help=f"crypto exchange for ccxt (default {config.CRYPTO['exchange']})")
    s.add_argument("--fx-source", choices=["yahoo", "mt5"], help=f"forex data source (default {config.FOREX['source']})")
    s.add_argument("--csv", help="read candles from this CSV file instead (e.g. an MT5 export); one symbol only")
    s.add_argument("--refresh", action="store_true", help="download fresh data instead of using the cache")

    p = argparse.ArgumentParser(description="Daily trend-following backtester and paper trader for crypto and forex.")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("backtest", parents=[common], help="test the strategy on history")
    o = sub.add_parser("optimize", parents=[common], help="tune entry/exit on older data, then check on unseen data")
    o.add_argument("--split", help="first day of the unseen period (default: 70%% of the way through the data)")
    o.add_argument("--top", type=int, default=10, help="rows to show (default %(default)s)")
    pp = sub.add_parser("paper", parents=[common], help="today's instruction plus a paper account; run once a day")
    pp.add_argument("--since", help="day the paper account starts, YYYY-MM-DD (default: the latest completed day)")
    return p


def overrides(a) -> dict:
    to_frac = lambda v: None if v is None else v / 100.0  # noqa: E731
    o = dict(fee_rate=to_frac(a.fee), slippage_rate=to_frac(a.slippage), spread_pips=a.spread_pips,
             slippage_pips=a.slippage_pips, commission_per_lot=a.commission, financing_rate=to_frac(a.swap),
             max_leverage=a.max_leverage, min_units=a.min_units, min_notional=a.min_notional,
             allow_short=a.allow_short, force_min_size=True if a.force_min_size else None)
    if a.risk is not None:
        o.update(sizing="risk", risk_per_trade=a.risk / 100)
    if a.alloc is not None:
        o.update(sizing="percent", alloc=a.alloc / 100)
    return o


def load(symbol: str, a, refresh: bool = False):
    inst = make_instrument(symbol, overrides(a))
    candles = get_candles(symbol, inst.market, refresh=refresh or a.refresh, exchange=a.exchange,
                          fx_source=a.fx_source, csv_path=a.csv)
    return inst, candles


def tag(symbol: str) -> str:
    return re.sub(r"[^A-Za-z0-9]+", "-", symbol).strip("-")


def cmd_backtest(a, symbol: str) -> None:
    inst, candles = load(symbol, a)
    res = backtest(candles, inst, a.entry, a.exit, a.balance, a.start, a.end)
    report.print_report(res)
    for path in report.save(res, RESULTS, tag(symbol)):
        print(f"  saved {os.path.relpath(path, HERE)}")


def cmd_optimize(a, symbol: str) -> None:
    inst, candles = load(symbol, a)
    data = candles.loc[a.start:a.end] if (a.start or a.end) else candles
    first, last = data.index[0], data.index[-1]
    split = pd.Timestamp(a.split) if a.split else (first + (last - first) * 0.7).normalize()
    tune_end = split - pd.Timedelta(days=1)
    print(f"Testing {sum(x < n for n in ENTRY_GRID for x in EXIT_GRID)} entry/exit combinations on {symbol}...")
    rows = []
    for n_in in ENTRY_GRID:
        for n_out in (x for x in EXIT_GRID if x < n_in):
            tune = backtest(candles, inst, n_in, n_out, a.balance, a.start, tune_end)
            test = backtest(candles, inst, n_in, n_out, a.balance, split, a.end)
            rows.append(dict(entry=n_in, exit=n_out, tune=report.stats(tune), test=report.stats(test),
                             tune_range=(tune.start, tune.end), test_range=(test.start, test.end)))
    tune_range = (min(r["tune_range"][0] for r in rows), max(r["tune_range"][1] for r in rows))
    test_range = rows[0]["test_range"]
    report.print_optimization(inst, rows, tune_range, test_range, (a.entry, a.exit), a.top)


def cmd_paper(a, symbol: str) -> None:
    inst, candles = load(symbol, a, refresh=True)
    last = candles.index[-1]
    since = min(pd.Timestamp(a.since), last) if a.since else last
    res = backtest(candles, inst, a.entry, a.exit, a.balance, since, None)
    action = report.print_paper(res)
    report.append_paper_log(RESULTS, res, action)
    if not a.since:
        print(f"To paper-trade from here, run this once a day:\n"
              f"  python bot.py paper {symbol} --since {last:%Y-%m-%d}")


def main(argv=None) -> int:
    parser = build_parser()
    a = parser.parse_args(argv)
    if a.risk is not None and a.alloc is not None:
        parser.error("use --risk or --alloc, not both")
    if a.csv and len(a.symbols) > 1:
        parser.error("--csv works with one symbol at a time")
    run = {"backtest": cmd_backtest, "optimize": cmd_optimize, "paper": cmd_paper}[a.cmd]
    failed = False
    for symbol in a.symbols:
        try:
            run(a, symbol)
        except Exception as e:  # report and carry on with the other symbols
            failed = True
            if detect_market(symbol) == "crypto":
                hint = "try another exchange (--exchange okx, bybit or kucoin) or load a file with --csv"
            else:
                hint = "try --fx-source mt5 (Windows, MT5 terminal open) or a file exported from MT5 with --csv"
            print(f"\n[{symbol}] {type(e).__name__}: {e}\n  ({hint})", file=sys.stderr)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
