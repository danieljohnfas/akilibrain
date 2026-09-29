"""
Costs and account rules. Edit these to match YOUR exchange and broker.

Everything here is either a cost the backtest charges you or a rule it won't let
you break. If these numbers are kinder than reality, the results will flatter you,
so when in doubt make them a little worse. Most can also be changed for a single
run from the command line (see: python bot.py backtest -h).
"""

ACCOUNT_CURRENCY = "USD"
DEFAULT_BALANCE = 20.0      # starting balance for backtests and the paper account
DEFAULT_ENTRY_DAYS = 50     # enter when the close breaks out of the last 50 days' range
DEFAULT_EXIT_DAYS = 20      # exit when the close breaks the last 20 days' range the other way

# Crypto: spot trading on any exchange the ccxt library supports ---------------
CRYPTO = {
    "exchange": "binance",       # ccxt id with long daily history: binance, okx, bybit, kucoin...
    "history_start": "2017-01-01",
    "fee_rate": 0.001,           # 0.1% per side, a typical spot taker fee
    "slippage_rate": 0.0005,     # 0.05% per side: market orders rarely fill exactly at the last price
    "min_notional": 5.0,         # smallest order the exchange accepts, in the quote currency
    "allow_short": False,        # spot: you can only sell what you own
    "sizing": "percent",         # each trade uses a fixed share of the account...
    "alloc": 1.0,                # ...100% here, i.e. fully in or fully out
    "risk_per_trade": 0.01,      # only used if you switch sizing to "risk"
    "max_leverage": 1.0,         # spot = no borrowing
}

# Forex: currency pairs that include USD (EURUSD, GBPUSD, USDJPY, ...) ---------
FOREX = {
    "source": "yahoo",           # "yahoo" (free, any OS) or "mt5" (your broker's own data, Windows only)
    "history_start": "2005-01-01",
    "spread_pips": {             # rough standard-account spreads: replace with your broker's
        "EURUSD": 1.0, "GBPUSD": 1.4, "USDJPY": 1.2, "AUDUSD": 1.2,
        "USDCHF": 1.5, "USDCAD": 1.8, "NZDUSD": 1.8,
    },
    "default_spread_pips": 2.0,
    "slippage_pips": 0.2,        # per side
    "commission_per_lot": 0.0,   # per side per 100,000 units; "raw spread" accounts charge ~3-3.5 USD
    "swap_rate": 0.02,           # overnight financing, ~2% a year of the position's value. A placeholder:
                                 # real swaps depend on the pair, the direction and the broker.
    "lot_size": 100_000,
    "min_units": 1_000,          # smallest position: 0.01 lot on a standard account (cent account: 10)
    "unit_step": 1_000,          # sizes go up in 0.01-lot steps
    "allow_short": True,         # forex is two-sided, so the bot follows trends down as well as up
    "sizing": "risk",            # size each trade so that hitting the exit level costs about...
    "risk_per_trade": 0.01,      # ...1% of the account
    "alloc": 1.0,                # only used if you switch sizing to "percent"
    "max_leverage": 30.0,        # position value never exceeds 30x the account, whatever the broker allows
}
