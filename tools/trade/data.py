"""
Daily candles for crypto (via ccxt) and forex (Yahoo Finance or your MT5 terminal),
or from any CSV file. Downloads are cached in ./data so backtests don't hit the
network every time. Every source ends up as the same table: a date index plus
open, high, low, close columns.
"""
from __future__ import annotations

import os
import re
from datetime import datetime, timezone

import numpy as np
import pandas as pd

import config
from markets import split_pair

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
COLUMNS = ["open", "high", "low", "close"]
DAY_MS = 86_400_000


def get_candles(symbol: str, market: str, *, refresh: bool = False, exchange: str | None = None,
                fx_source: str | None = None, csv_path: str | None = None) -> pd.DataFrame:
    if csv_path:
        return load_csv(csv_path)
    if market == "crypto":
        ex = exchange or config.CRYPTO["exchange"]
        name = f"{ex}_{symbol}"
        fetch = lambda: fetch_ccxt(symbol, ex, config.CRYPTO["history_start"])  # noqa: E731
    else:
        src = fx_source or config.FOREX["source"]
        name = f"{src}_{symbol}"
        fetcher = fetch_mt5 if src == "mt5" else fetch_yahoo
        fetch = lambda: fetcher(symbol, config.FOREX["history_start"])  # noqa: E731

    path = os.path.join(DATA_DIR, re.sub(r"[^A-Za-z0-9]+", "-", name).strip("-") + "_1d.csv")
    if os.path.exists(path) and not refresh:
        return clean(pd.read_csv(path, index_col=0, parse_dates=True))
    df = clean(fetch())
    if df.empty:
        raise RuntimeError(f"No usable daily candles came back for {symbol}")
    os.makedirs(DATA_DIR, exist_ok=True)
    df.to_csv(path)
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    df = df[COLUMNS].astype(float).replace([np.inf, -np.inf], np.nan).dropna()
    df = df[(df > 0).all(axis=1)]
    df = df[~df.index.duplicated(keep="last")].sort_index().copy()
    # Free data sometimes has highs/lows that don't contain the open/close; repair them.
    df["high"] = df[COLUMNS].max(axis=1)
    df["low"] = df[COLUMNS].min(axis=1)
    # Drop today's candle: it hasn't closed yet, and the strategy only acts on completed days.
    today = pd.Timestamp(datetime.now(timezone.utc).date())
    df = df[df.index < today]
    df.index.name = "date"
    return df


def _naive_days(index) -> pd.DatetimeIndex:
    index = pd.DatetimeIndex(index)
    if index.tz is not None:
        index = index.tz_localize(None)
    return index.normalize()


# --- crypto -------------------------------------------------------------------

def fetch_ccxt(symbol: str, exchange_id: str, start: str) -> pd.DataFrame:
    try:
        import ccxt
    except ImportError as e:
        raise RuntimeError("ccxt isn't installed: pip install ccxt") from e
    if not hasattr(ccxt, exchange_id):
        raise RuntimeError(f"ccxt doesn't know an exchange called '{exchange_id}'")
    ex = getattr(ccxt, exchange_id)({"enableRateLimit": True})
    ex.load_markets()
    if symbol not in ex.markets:
        raise RuntimeError(f"{exchange_id} has no market called {symbol}")

    print(f"Downloading {symbol} daily candles from {exchange_id}...")
    since, rows = ex.parse8601(f"{start}T00:00:00Z"), []
    while True:
        batch = ex.fetch_ohlcv(symbol, timeframe="1d", since=since, limit=1000)
        if not batch:
            break
        rows.extend(batch)
        nxt = batch[-1][0] + DAY_MS
        if nxt <= since or nxt > ex.milliseconds():
            break
        since = nxt
    df = pd.DataFrame(rows, columns=["ts", "open", "high", "low", "close", "volume"])
    df.index = _naive_days(pd.to_datetime(df["ts"], unit="ms", utc=True))
    return df


# --- forex --------------------------------------------------------------------

def fetch_yahoo(pair: str, start: str) -> pd.DataFrame:
    try:
        import yfinance as yf
    except ImportError as e:
        raise RuntimeError("yfinance isn't installed: pip install yfinance") from e
    base, quote = split_pair(pair)
    tickers = [f"{base}{quote}=X"] + ([f"{quote}=X"] if base == "USD" else [])
    print(f"Downloading {pair} daily candles from Yahoo Finance...")
    problem = "no data"
    for ticker in tickers:
        try:
            hist = yf.Ticker(ticker).history(start=start, interval="1d")
        except Exception as e:  # Yahoo is free and occasionally blocks or rate-limits
            problem = f"{type(e).__name__}: {e}"
            continue
        if hist is not None and not hist.empty:
            hist = hist.rename(columns=str.lower)
            hist.index = _naive_days(hist.index)
            return hist
    raise RuntimeError(f"Couldn't get {pair} from Yahoo ({problem}). If the pair name is right "
                       "(forex looks like EURUSD; crypto needs a slash, like BTC/USDT), wait a while and retry")


def fetch_mt5(symbol: str, start: str) -> pd.DataFrame:
    """Daily bars straight from your broker's MetaTrader 5 terminal (Windows only; the terminal must be running)."""
    try:
        import MetaTrader5 as mt5
    except ImportError as e:
        raise RuntimeError("The MetaTrader5 package isn't installed (Windows only): pip install MetaTrader5") from e
    if not mt5.initialize():
        raise RuntimeError(f"Couldn't connect to MetaTrader 5 (is the terminal open and logged in?): {mt5.last_error()}")
    try:
        if not mt5.symbol_select(symbol, True):
            raise RuntimeError(f"Your broker has no symbol '{symbol}'. Use the exact name from Market Watch "
                               "(some brokers add a suffix, e.g. EURUSDm)")
        t0 = datetime.fromisoformat(start).replace(tzinfo=timezone.utc)
        rates = mt5.copy_rates_range(symbol, mt5.TIMEFRAME_D1, t0, datetime.now(timezone.utc))
        if rates is None or len(rates) == 0:
            raise RuntimeError(f"MT5 returned no daily bars for {symbol}: {mt5.last_error()}")
    finally:
        mt5.shutdown()
    df = pd.DataFrame(rates)
    df.index = _naive_days(pd.to_datetime(df["time"], unit="s"))  # broker server time
    return df


# --- files --------------------------------------------------------------------

def load_csv(path: str) -> pd.DataFrame:
    """Reads MT5 'Bars' exports as-is (tab-separated, <DATE> columns) or any CSV with
    a date column plus open, high, low, close."""
    raw = pd.read_csv(path, sep=None, engine="python")
    raw.columns = [str(c).strip().strip("<>").strip().lower() for c in raw.columns]
    date_col = next((c for c in ("date", "datetime", "timestamp", "time") if c in raw.columns), None)
    if date_col is None or not set(COLUMNS) <= set(raw.columns):
        raise RuntimeError(f"{path}: expected a date column plus open, high, low and close columns")
    col = raw[date_col]
    if pd.api.types.is_numeric_dtype(col):
        dates = pd.to_datetime(col, unit="ms" if col.max() > 1e11 else "s", utc=True)
    else:  # MT5 writes 2024.01.02 -> 2024-01-02
        text = col.astype(str).str.replace(r"^(\d{4})\.(\d{2})\.(\d{2})", r"\1-\2-\3", regex=True)
        dates = pd.to_datetime(text, errors="coerce", utc=True)
    raw.index = _naive_days(dates)
    raw = raw[raw.index.notna()]
    return clean(raw)
