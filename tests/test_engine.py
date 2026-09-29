"""
Checks that the backtester is honest, using made-up prices so no internet is needed.
Run with:  python tests/test_engine.py     (or: python -m pytest tests)
"""
import math
import os
import sys
import tempfile
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from data import load_csv  # noqa: E402
from engine import backtest  # noqa: E402
from markets import make_instrument  # noqa: E402


def candles_from_closes(closes, start="2019-01-01", wick=0.002):
    closes = np.asarray(closes, float)
    opens = np.r_[closes[0], closes[:-1]]
    return pd.DataFrame({
        "open": opens,
        "high": np.maximum(opens, closes) * (1 + wick),
        "low": np.minimum(opens, closes) * (1 - wick),
        "close": closes,
    }, index=pd.date_range(start, periods=len(closes), freq="D"))


def random_walk(n=1500, seed=7, drift=0.0004, vol=0.025, p0=100.0):
    rng = np.random.default_rng(seed)
    closes = p0 * np.exp(np.cumsum(rng.normal(drift, vol, n)))
    df = candles_from_closes(closes)
    df["open"] *= np.exp(rng.normal(0, vol / 4, n))           # overnight gaps
    df["high"] = df[["open", "close"]].max(axis=1) * np.exp(np.abs(rng.normal(0, vol / 2, n)))
    df["low"] = df[["open", "close"]].min(axis=1) * np.exp(-np.abs(rng.normal(0, vol / 2, n)))
    return df


def test_future_prices_never_change_past_decisions():
    df = random_walk()
    for symbol, scale in (("BTC/USDT", 1.0), ("EURUSD", 0.011)):
        prices = df * scale
        inst = make_instrument(symbol, {"min_units": 1})
        full = backtest(prices, inst, 50, 20, 10_000)
        assert full.trades
        for cut in range(120, len(prices), 20):
            part = backtest(prices.iloc[:cut], inst, 50, 20, 10_000)
            assert np.allclose(full.equity.loc[:part.end].to_numpy(), part.equity.to_numpy()), \
                f"{symbol}: prices after day {cut} changed earlier results (lookahead!)"
            assert (full.actions.loc[:part.end] == part.actions).all(), \
                f"{symbol}: prices after day {cut} changed a decision (lookahead!)"


def test_every_cent_is_accounted_for():
    df = random_walk(seed=3)
    for symbol, scale in (("BTC/USDT", 1.0), ("EURUSD", 0.011), ("USDJPY", 1.5)):
        inst = make_instrument(symbol, {"min_units": 1})
        res = backtest(df * scale, inst, 30, 15, 10_000)
        assert res.trades, symbol
        open_pnl = res.open_trade["pnl_so_far"] if res.open_trade else 0.0
        expected = 10_000 + sum(t.pnl for t in res.trades) + open_pnl
        assert math.isclose(res.equity.iloc[-1], expected, rel_tol=1e-9), symbol


def test_crypto_trade_matches_hand_calculation():
    # flat at 100 for 60 days, breakout to 110, then a drop to 90
    df = candles_from_closes([100.0] * 60 + [110.0] * 10 + [90.0] * 5)
    res = backtest(df, make_instrument("BTC/USDT"), 50, 20, 1000.0)   # 0.1% fee, 0.05% slippage
    assert len(res.trades) == 1
    t = res.trades[0]
    buy, sell = 110 * 1.0005, 90 * 0.9995
    units = 1000 / (buy * 1.001)
    pnl = units * (sell - buy) - units * buy * 0.001 - units * sell * 0.001
    assert t.entry_date == df.index[61] and t.exit_date == df.index[71]   # acted at the NEXT open
    assert math.isclose(t.units, units) and math.isclose(t.pnl, pnl)
    assert math.isclose(res.equity.iloc[-1], 1000 + pnl)


def test_usd_base_pair_profit_is_converted_to_dollars():
    df = candles_from_closes([150.0] * 60 + [151.5] * 10 + [140.0] * 3)
    inst = make_instrument("USDJPY", {"spread_pips": 0, "slippage_pips": 0, "financing_rate": 0})
    res = backtest(df, inst, 50, 20, 100_000)
    t = res.trades[0]
    assert math.isclose(t.pnl, t.units * (140.0 - 151.5) / 140.0)   # yen loss divided by the exit price


def test_shorts_make_money_in_a_downtrend():
    df = candles_from_closes([1.30] * 60 + list(np.linspace(1.29, 1.00, 60)) + [1.00] * 25 + [1.20] * 3)
    res = backtest(df, make_instrument("EURUSD"), 50, 20, 10_000)
    shorts = [t for t in res.trades if t.side == "SHORT"]
    assert shorts and shorts[0].pnl > 0


def test_tiny_forex_account_cannot_take_a_standard_lot():
    df = random_walk(seed=11, drift=0.0001, vol=0.006, p0=1.10)
    res = backtest(df, make_instrument("EURUSD"), 50, 20, 20.0)
    assert not res.trades and res.skips
    assert min(s.balance_needed for s in res.skips) > 100


def test_cent_account_lets_a_tiny_forex_account_trade():
    df = random_walk(seed=11, drift=0.0001, vol=0.006, p0=1.10)
    res = backtest(df, make_instrument("EURUSD", {"min_units": 10}), 50, 20, 20.0)
    assert res.trades


def test_forcing_a_standard_lot_on_a_tiny_account_can_wipe_it_out():
    df = candles_from_closes([1.10] * 60 + [1.12] * 4 + list(np.linspace(1.12, 1.06, 10)))
    inst = make_instrument("EURUSD", {"force_min_size": True, "max_leverage": 500})
    res = backtest(df, inst, 50, 20, 20.0)
    assert res.wiped_out_on is not None and res.equity.iloc[-1] == 0
    assert res.trades[-1].exit_reason == "account wiped out"


def test_csv_loader_reads_mt5_exports_and_drops_today():
    today = datetime.now(timezone.utc).strftime("%Y.%m.%d")
    text = ("<DATE>\t<TIME>\t<OPEN>\t<HIGH>\t<LOW>\t<CLOSE>\t<TICKVOL>\t<VOL>\t<SPREAD>\n"
            "2024.01.02\t00:00:00\t1.10420\t1.10450\t1.09380\t1.09410\t60000\t0\t1\n"
            "2024.01.03\t00:00:00\t1.09410\t1.09690\t1.09140\t1.09200\t58000\t0\t1\n"
            f"{today}\t00:00:00\t1.09200\t1.09300\t1.09100\t1.09250\t100\t0\t1\n")
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
        f.write(text)
    try:
        df = load_csv(f.name)
    finally:
        os.unlink(f.name)
    assert list(df.index) == [pd.Timestamp("2024-01-02"), pd.Timestamp("2024-01-03")]
    assert math.isclose(df["close"].iloc[-1], 1.092)


def test_csv_loader_reads_plain_csv():
    with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
        f.write("Date,Open,High,Low,Close,Volume\n2021-03-01,45000,49000,44800,48000,10\n"
                "2021-03-02,48000,50000,47000,49500,12\n")
    try:
        df = load_csv(f.name)
    finally:
        os.unlink(f.name)
    assert len(df) == 2 and math.isclose(df["high"].iloc[1], 50000)


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
