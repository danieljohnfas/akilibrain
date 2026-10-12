"""
How a symbol trades: what it costs, how small a position can be, and how its
profits convert into your account currency. Built from config.py plus any
command-line overrides.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

import config

USD_LIKE = {"USD", "USDT", "USDC", "BUSD", "FDUSD", "TUSD", "DAI"}


@dataclass
class Instrument:
    symbol: str
    market: str                 # "crypto" or "forex"
    account_ccy: str
    inverse_quote: bool         # USDxxx pairs: profit arrives in xxx and is divided by the price
    pip_size: float
    lot_size: float
    # costs
    fee_rate: float             # fraction of trade value, per side
    commission_per_unit: float  # account currency per unit, per side
    spread: float               # full bid/ask spread, in price units
    slippage: float             # price units, per side
    slippage_rate: float        # fraction of price, per side
    financing_rate: float       # per year, fraction of position value
    # account rules
    allow_short: bool
    sizing: str                 # "percent" or "risk"
    alloc: float
    risk_per_trade: float
    max_leverage: float
    min_units: float
    unit_step: float
    min_notional: float
    force_min_size: bool = False

    def to_account(self, price: float) -> float:
        """Multiplier that turns a profit measured in the quote currency into account currency."""
        return 1.0 / price if self.inverse_quote else 1.0


def detect_market(symbol: str) -> str:
    return "crypto" if "/" in symbol else "forex"


def split_pair(symbol: str) -> tuple[str, str]:
    letters = re.sub(r"[^A-Za-z]", "", symbol).upper()
    if len(letters) < 6:
        raise ValueError(f"'{symbol}' doesn't look like a currency pair such as EURUSD "
                         "(crypto symbols need a slash, like BTC/USDT)")
    return letters[:3], letters[3:6]


def make_instrument(symbol: str, overrides: dict | None = None) -> Instrument:
    o = {k: v for k, v in (overrides or {}).items() if v is not None}

    if detect_market(symbol) == "crypto":
        c = config.CRYPTO
        quote = symbol.split("/")[1].split(":")[0].upper()
        return Instrument(
            symbol=symbol, market="crypto",
            account_ccy=config.ACCOUNT_CURRENCY if quote in USD_LIKE else quote,
            inverse_quote=False, pip_size=0.0, lot_size=1.0,
            fee_rate=o.get("fee_rate", c["fee_rate"]),
            commission_per_unit=0.0, spread=0.0, slippage=0.0,
            slippage_rate=o.get("slippage_rate", c["slippage_rate"]),
            financing_rate=0.0,
            allow_short=o.get("allow_short", c["allow_short"]),
            sizing=o.get("sizing", c["sizing"]),
            alloc=o.get("alloc", c["alloc"]),
            risk_per_trade=o.get("risk_per_trade", c["risk_per_trade"]),
            max_leverage=o.get("max_leverage", c["max_leverage"]),
            min_units=o.get("min_units", 0.0),
            unit_step=o.get("unit_step", 0.0),
            min_notional=o.get("min_notional", c["min_notional"]),
            force_min_size=o.get("force_min_size", False),
        )

    f = config.FOREX
    base, quote = split_pair(symbol)
    acct = config.ACCOUNT_CURRENCY
    if quote == acct:
        inverse = False
    elif base == acct:
        inverse = True
    else:
        raise ValueError(f"{symbol}: profits would arrive in {quote}. For now only pairs that include "
                         f"{acct} are supported (EURUSD, GBPUSD, USDJPY, ...)")
    pip = 0.01 if quote == "JPY" else 0.0001
    spread_pips = o.get("spread_pips", f["spread_pips"].get(base + quote, f["default_spread_pips"]))
    min_units = o.get("min_units", f["min_units"])
    return Instrument(
        symbol=symbol, market="forex", account_ccy=acct, inverse_quote=inverse,
        pip_size=pip, lot_size=f["lot_size"],
        fee_rate=0.0,
        commission_per_unit=o.get("commission_per_lot", f["commission_per_lot"]) / f["lot_size"],
        spread=spread_pips * pip,
        slippage=o.get("slippage_pips", f["slippage_pips"]) * pip,
        slippage_rate=0.0,
        financing_rate=o.get("financing_rate", f["swap_rate"]),
        allow_short=o.get("allow_short", f["allow_short"]),
        sizing=o.get("sizing", f["sizing"]),
        alloc=o.get("alloc", f["alloc"]),
        risk_per_trade=o.get("risk_per_trade", f["risk_per_trade"]),
        max_leverage=o.get("max_leverage", f["max_leverage"]),
        min_units=min_units,
        # a cent account (--min-units 10) also trades in steps of 10
        unit_step=o.get("unit_step", min_units if "min_units" in o else f["unit_step"]),
        min_notional=o.get("min_notional", 0.0),
        force_min_size=o.get("force_min_size", False),
    )
