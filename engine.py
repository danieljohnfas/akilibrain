"""
The backtester. It walks through history one day at a time, exactly as the bot
would live: decide on a completed daily close, act at the next day's open. It
never looks at a price it wouldn't have had yet.

Costs charged on every trade:
  - exchange fee / broker commission
  - spread and slippage (built into the price you get)
  - overnight financing (forex swap) for every night a position is held
Account rules enforced:
  - minimum order size and size steps (a trade too small to place is skipped and logged)
  - leverage cap
  - an account can't go below zero: if a leveraged position would do that, it's closed out
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field

import numpy as np
import pandas as pd

from markets import Instrument
from strategy import EXIT, HOLD, LONG, SHORT, add_channels, decide


@dataclass
class Trade:
    side: str
    entry_date: pd.Timestamp
    entry_price: float
    exit_date: pd.Timestamp
    exit_price: float
    units: float
    pnl: float          # account currency, after every cost
    return_pct: float   # pnl as a % of the account when the trade opened
    costs: float        # fees + financing (spread and slippage are already inside the prices)
    days_held: int
    exit_reason: str


@dataclass
class Skip:
    date: pd.Timestamp
    side: str
    price: float
    balance: float
    balance_needed: float


@dataclass
class Result:
    inst: Instrument
    entry_days: int
    exit_days: int
    start_balance: float
    data: pd.DataFrame                  # candles + channel levels, whole history
    equity: pd.Series = None            # account value at each close in the tested window
    position: pd.Series = None          # signed units held at each close
    actions: pd.Series = None           # what the bot decided at each close (LONG/SHORT/EXIT/HOLD)
    trades: list = field(default_factory=list)
    skips: list = field(default_factory=list)
    fees: float = 0.0
    spread_slippage: float = 0.0
    financing: float = 0.0
    open_trade: dict | None = None
    next_action: str = HOLD             # decision from the last close, for the next open
    wiped_out_on: pd.Timestamp | None = None

    @property
    def start(self):
        return self.equity.index[0]

    @property
    def end(self):
        return self.equity.index[-1]

    @property
    def costs(self):
        return self.fees + self.spread_slippage + self.financing


def fill_price(inst: Instrument, mid: float, direction: int) -> float:
    """The price you actually get: buying (+1) pays above the quote, selling (-1) receives below it."""
    return mid + direction * (mid * inst.slippage_rate + inst.spread / 2 + inst.slippage)


def size_position(inst: Instrument, equity: float, fill: float, stop: float) -> tuple[float, float]:
    """How many units to trade. Returns (units, balance_needed); units == 0 means no trade is possible."""
    conv = inst.to_account(fill)
    unit_cost = fill * conv * (1 + inst.fee_rate)                # account money per unit of position
    risk_per_unit = max(abs(fill - stop), fill * 0.001) * conv   # loss per unit if the exit level is hit
    if inst.sizing == "risk":
        units = equity * inst.risk_per_trade / risk_per_unit
    else:
        units = equity * inst.alloc / unit_cost
    units = min(units, equity * inst.max_leverage / unit_cost)

    smallest = max(inst.min_units, inst.min_notional / (fill * conv))
    if inst.unit_step > 0:
        units = math.floor(units / inst.unit_step + 1e-9) * inst.unit_step
        smallest = math.ceil(smallest / inst.unit_step - 1e-9) * inst.unit_step

    # the balance at which the smallest allowed position would fit inside the rules
    if inst.sizing == "risk":
        needed = smallest * risk_per_unit / inst.risk_per_trade
    else:
        needed = smallest * unit_cost / inst.alloc
    needed = max(needed, smallest * unit_cost / inst.max_leverage)

    if units > 0 and units >= smallest:
        return units, needed
    if inst.force_min_size and smallest > 0 and smallest * unit_cost <= equity * inst.max_leverage:
        return smallest, needed
    return 0.0, needed


def backtest(candles: pd.DataFrame, inst: Instrument, entry_days: int = 50, exit_days: int = 20,
             balance: float = 20.0, start=None, end=None) -> Result:
    if entry_days < 2 or exit_days < 1:
        raise ValueError("entry needs at least 2 days and exit at least 1")
    d = add_channels(candles, entry_days, exit_days)
    dates = d.index
    o, h, l, c = (d[k].to_numpy(float) for k in ("open", "high", "low", "close"))
    eh, el = d["entry_high"].to_numpy(float), d["entry_low"].to_numpy(float)
    xl, xh = d["exit_low"].to_numpy(float), d["exit_high"].to_numpy(float)
    stop_long, stop_short = d["next_exit_low"].to_numpy(float), d["next_exit_high"].to_numpy(float)

    ready = ~np.isnan(eh) & ~np.isnan(xl)
    if not ready.any():
        raise ValueError(f"Need more than {max(entry_days, exit_days)} days of data (have {len(d)})")
    lo = int(np.argmax(ready))
    if start is not None:
        lo = max(lo, int(dates.searchsorted(pd.Timestamp(start))))
    hi = len(d) - 1 if end is None else int(dates.searchsorted(pd.Timestamp(end), side="right")) - 1
    if lo > hi:
        raise ValueError("No tradable days in that date range (the first days warm up the channels)")

    res = Result(inst, entry_days, exit_days, balance, d)
    conv = inst.to_account
    n = hi - lo + 1
    eq, pos, acts = np.zeros(n), np.zeros(n), np.full(n, HOLD, dtype=object)
    bal, units, entry_px, entry_i, entry_equity, trade_costs = balance, 0.0, 0.0, lo, balance, 0.0
    pending, last_skip = None, None

    def record(i, exit_px, pnl, reason):
        res.trades.append(Trade(
            side="LONG" if units > 0 else "SHORT", entry_date=dates[entry_i], entry_price=entry_px,
            exit_date=dates[i], exit_price=exit_px, units=abs(units), pnl=pnl,
            return_pct=100 * pnl / entry_equity if entry_equity else 0.0, costs=trade_costs,
            days_held=(dates[i] - dates[entry_i]).days, exit_reason=reason))

    for k, i in enumerate(range(lo, hi + 1)):
        if res.wiped_out_on is not None:
            continue  # nothing left to trade with; equity stays at zero

        # 1) overnight financing on a position carried over from the previous close
        if units and i > lo:
            nights = (dates[i] - dates[i - 1]).days
            f = abs(units) * c[i - 1] * conv(c[i - 1]) * inst.financing_rate * nights / 365.0
            bal -= f
            res.financing += f
            trade_costs += f

        # 2) carry out yesterday's decision at today's open
        if pending == EXIT and units:
            direction = -1 if units > 0 else 1
            fill = fill_price(inst, o[i], direction)
            fee = abs(units) * (fill * conv(fill) * inst.fee_rate + inst.commission_per_unit)
            gross = units * (fill - entry_px) * conv(fill)
            res.fees += fee
            res.spread_slippage += abs(units) * abs(fill - o[i]) * conv(fill)
            bal += gross - fee
            trade_costs += fee
            record(i, fill, gross - trade_costs, "exit signal")
            units = 0.0
        elif pending in (LONG, SHORT) and not units:
            direction = 1 if pending == LONG else -1
            fill = fill_price(inst, o[i], direction)
            stop = stop_long[i - 1] if direction > 0 else stop_short[i - 1]
            size, needed = size_position(inst, bal, fill, stop)
            if size > 0:
                fee = size * (fill * conv(fill) * inst.fee_rate + inst.commission_per_unit)
                res.fees += fee
                res.spread_slippage += size * abs(fill - o[i]) * conv(fill)
                entry_equity, entry_i, entry_px = bal, i, fill
                bal -= fee
                trade_costs = fee
                units = direction * size
            else:
                if last_skip != (i - 1, pending):   # log each breakout once, not every day it persists
                    res.skips.append(Skip(dates[i], pending, o[i], bal, needed))
                last_skip = (i, pending)
        pending = None

        # 3) could the day's worst price have taken the account to zero? Then the broker closes it out.
        if units:
            worst = l[i] if units > 0 else h[i]
            if bal + units * (worst - entry_px) * conv(worst) <= 0:
                if inst.inverse_quote:
                    denom = bal + units
                    zero_px = units * entry_px / denom if abs(denom) > 1e-12 else worst
                else:
                    zero_px = entry_px - bal / units
                exit_px = min(zero_px, o[i]) if units > 0 else max(zero_px, o[i])
                record(i, exit_px, -entry_equity, "account wiped out")
                bal, units = 0.0, 0.0
                res.wiped_out_on = dates[i]
                continue

        # 4) value the account at the close
        eq[k] = bal + (units * (c[i] - entry_px) * conv(c[i]) if units else 0.0)
        pos[k] = units

        # 5) decide what to do at the next open
        side = 1 if units > 0 else (-1 if units < 0 else 0)
        action = decide(side, c[i], eh[i], el[i], xl[i], xh[i], inst.allow_short)
        acts[k] = action
        pending = None if action == HOLD else action

    idx = dates[lo:hi + 1]
    res.equity = pd.Series(eq, index=idx, name="equity")
    res.position = pd.Series(pos, index=idx, name="units")
    res.actions = pd.Series(acts, index=idx, name="action")
    res.next_action = pending or HOLD
    if units:
        res.open_trade = dict(side="LONG" if units > 0 else "SHORT", entry_date=dates[entry_i],
                              entry_price=entry_px, units=abs(units), pnl_so_far=eq[-1] - entry_equity)
    return res
