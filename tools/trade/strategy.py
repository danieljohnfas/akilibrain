"""
The trading rules: a daily breakout (Donchian channel) trend follower.

  - Flat, and today's close is above the highest close of the previous N days -> go long
  - Flat, and today's close is below the lowest close of the previous N days   -> go short (if allowed)
  - Long, and today's close is below the lowest close of the previous M days   -> exit
  - Short, and today's close is above the highest close of the previous M days -> exit

Decisions are made on a completed daily close and carried out at the next open.
The backtester and the paper trader both call these functions, so they can't disagree.
"""
import math

LONG, SHORT, EXIT, HOLD = "LONG", "SHORT", "EXIT", "HOLD"


def add_channels(candles, entry_days: int, exit_days: int):
    c = candles["close"]
    out = candles.copy()
    # Levels built from the PREVIOUS N closes (shift(1)): today's close is compared against these.
    out["entry_high"] = c.rolling(entry_days).max().shift(1)
    out["entry_low"] = c.rolling(entry_days).min().shift(1)
    out["exit_low"] = c.rolling(exit_days).min().shift(1)
    out["exit_high"] = c.rolling(exit_days).max().shift(1)
    # The same levels including today's close: what TOMORROW's close will be compared against.
    out["next_entry_high"] = c.rolling(entry_days).max()
    out["next_entry_low"] = c.rolling(entry_days).min()
    out["next_exit_low"] = c.rolling(exit_days).min()
    out["next_exit_high"] = c.rolling(exit_days).max()
    return out


def decide(side: int, close: float, entry_high: float, entry_low: float,
           exit_low: float, exit_high: float, allow_short: bool) -> str:
    """What to do at the next open. side: +1 long, -1 short, 0 flat."""
    if any(math.isnan(x) for x in (entry_high, entry_low, exit_low, exit_high)):
        return HOLD
    if side > 0:
        return EXIT if close < exit_low else HOLD
    if side < 0:
        return EXIT if close > exit_high else HOLD
    if close > entry_high:
        return LONG
    if allow_short and close < entry_low:
        return SHORT
    return HOLD
