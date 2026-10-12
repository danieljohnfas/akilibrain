# trendbot

A daily trend-following backtester and paper trader for **crypto** (spot, through any exchange the `ccxt` library supports) and **forex** (through Yahoo Finance, your broker's MetaTrader 5 terminal, or CSV files).

Backtest first, paper-trade for a month or two, and only then use `live`, which places real spot orders with hard limits (see *Live trading*). It is a dry run unless you deliberately turn it on.

## Install

Python 3.9 or newer.

```
python -m pip install -r requirements.txt
python tests/test_engine.py        # 10 checks on made-up prices, no internet needed
```

## The strategy

A breakout trend follower, checked once a day on completed daily candles:

- Flat, and today's close is above the highest close of the previous 50 days: go long.
- Flat, and today's close is below the lowest close of the previous 50 days: go short (forex only by default).
- Long, and today's close is below the lowest close of the previous 20 days: exit (the mirror image for shorts).

Every decision is made at the close and carried out at the **next day's open**, so the backtest never uses a price it wouldn't have had. Crypto is long-only with no leverage (spot). Forex trades both directions and sizes each trade so that hitting the exit level costs about 1% of the account.

## Commands

```
python bot.py backtest BTC/USDT ETH/USDT EURUSD     # how it would have done
python bot.py backtest EURUSD --balance 2000        # forex needs a bigger account (see below)
python bot.py optimize BTC/USDT                     # tune on old data, check on unseen data
python bot.py paper BTC/USDT EURUSD --since 2026-10-01
```

A slash means crypto (`BTC/USDT`); six-letter pairs are forex (`EURUSD`). Run `python bot.py backtest -h` for every option.

`backtest` prints a report and saves `results/<SYMBOL>_trades.csv`, `_equity.csv` and `_chart.png`.

`optimize` tries 29 entry/exit combinations on the first 70% of the history, then shows how each did on the last 30%, which it never saw while tuning. If the combination that looked best on old data lands mid-table on new data, the "best" settings were fitting noise. Stick with sensible defaults rather than chasing the top of the tuning list.

`paper` rebuilds a paper account from `--since` every time it runs (there are no state files to get out of sync), prints what to do at the next open, and appends a line to `results/paper_log.csv`.

## Reading a backtest report

- **Final value vs buy & hold** (crypto): if the bot doesn't beat simply buying and holding after costs, or at least do it with much smaller drawdowns, it isn't earning its complexity.
- **Worst drawdown**: the biggest fall from a peak. Assume you'll live through something at least this bad.
- **Trades**: under about 20 trades, the result is mostly luck either way.
- **Costs paid**: fees, spread and slippage, and overnight financing. On a small account these add up fast.
- **Skipped**: signals the account was too small to take, and the balance that would have been needed.

## Forex with a small account

On a standard account the smallest position is 0.01 lot (1,000 units, roughly $10 per 100 pips on EURUSD). The exit level of this strategy is usually well over 100 pips away, so a single micro lot risks far more than 1% of $20. The backtest therefore skips those trades and tells you the balance you'd need. Three ways to explore that:

```
python bot.py backtest EURUSD --balance 2000                          # judge the strategy itself
python bot.py backtest EURUSD --min-units 10                          # a cent account
python bot.py backtest EURUSD --force-min-size --max-leverage 500     # ignore the risk rule and watch
```

The last one usually ends with the account wiped out, which is the point of running it.

## Make the costs match your exchange or broker

Edit `config.py`. Every number there is a cost the backtest charges or a rule it enforces, and each has a comment. The ones worth checking first:

- **Crypto**: your exchange's trading fee (spot taker fee) and minimum order size.
- **Forex spreads**: watch your broker's spread at the time of day you'd trade, and use a slightly worse number.
- **Forex swap**: the default 2% a year is a placeholder. In MT5, right-click a symbol in Market Watch and open *Specification* to see swap long/short, minimum volume and volume step. If swap is shown in points, the yearly rate is roughly `points x point size x 365 / price`; for example 6.5 points on EURUSD at 1.10 is about 2.2% a year.
- **Minimum position**: `min_units` 1000 is a 0.01 lot on a standard account; 10 on a cent account.

Most settings can also be changed for a single run (`--fee`, `--spread-pips`, `--swap`, `--risk`, `--min-units` and so on).

## Data sources

**Crypto** uses `ccxt` and defaults to Binance, whose BTC/USDT history starts in 2017. If Binance refuses the connection where you are, try `--exchange okx`, `bybit` or `kucoin`; how far back their history goes varies. Downloads are cached in `data/`; add `--refresh` to update them (`paper` always refreshes).

**Forex** defaults to Yahoo Finance: free and about 20 years deep, but it's an average price rather than your broker's, and it has occasional glitches. Two better options:

- `--fx-source mt5` reads daily bars directly from a running MetaTrader 5 terminal (Windows only, `pip install MetaTrader5`). Use your broker's exact symbol name, including any suffix, such as `EURUSDm`.
- `--csv file.csv` reads an MT5 export as-is (in MT5: View > Symbols > Bars, choose D1, Request, Export Bars), or any CSV with date, open, high, low and close columns.

## Paper trading every day

Pick a start date and keep it fixed:

```
python bot.py paper BTC/USDT EURUSD --since 2026-10-01
```

Crypto daily candles close at 00:00 UTC; forex candles close at the end of your data source's trading day (with MT5, your broker's server midnight). Run it once a day after that, for example with cron on Linux or macOS:

```
15 0 * * * cd /path/to/trendbot && python3 bot.py paper BTC/USDT EURUSD --since 2026-10-01 >> results/paper.out 2>&1
```

(cron uses the machine's local time, so shift 00:15 UTC to your time zone.) On Windows, create a daily task in Task Scheduler that runs `python bot.py paper ...` with *Start in* set to this folder.

After a month or two, compare the paper log with what the backtest led you to expect. Only then is it worth adding live order execution (`ccxt`'s `create_order` for exchanges, `order_send` in the MetaTrader5 package for brokers) behind the same `decide()` function in `strategy.py`.

## What it doesn't model

- Daily candles only. One position per symbol, and each symbol is tested as its own separate account.
- Exits happen at the open after a close through the exit level, so a gap can make a loss bigger than planned. That is modelled; intraday stop orders are not.
- Forex: only pairs that include USD. Swap is one flat rate in both directions. Spreads are an average, though real spreads widen around rollover and news.
- A leveraged account is closed out when it hits zero. Real brokers close you out earlier, at their margin level.
- A good backtest is necessary, not sufficient: markets change, and past results don't promise future ones.

## Files

| File | What it does |
|---|---|
| `bot.py` | command line: `backtest`, `optimize`, `paper` |
| `config.py` | costs and account rules: edit this |
| `strategy.py` | the trading rules, shared by backtest and paper trading |
| `engine.py` | day-by-day simulation: fills, costs, sizing, minimum sizes, wipe-outs |
| `markets.py` | per-symbol settings and currency conversion |
| `data.py` | downloads (ccxt, Yahoo, MT5), CSV loading, caching |
| `report.py` | statistics, reports, charts, paper output |
| `tests/test_engine.py` | lookahead, accounting and sizing checks |

This is a learning and testing tool, not financial advice.

## Running on GitHub Actions

- `tests` runs the checks on every push.
- `backtest` (manual): Actions tab, backtest, Run workflow. Results are uploaded as an artifact.
- `paper-trade` runs daily at 00:20 UTC and commits `results/paper_log.csv`. Set the repo variable `PAPER_SINCE` (and optionally `PAPER_SYMBOLS`, `PAPER_EXCHANGE`).
- GitHub's runners are in the US, and Binance.com blocks US addresses, so the default exchange is KuCoin. OKX, Bybit and Binance were tested and are blocked or return no data from the runners.

## Live trading (real money, hard limits)

`python bot.py live BTC/USDT` is a **dry run**: it computes today's decision and prints the order it *would* send. Nothing is ordered unless all three are true: you pass `--execute`, the environment has `LIVE_TRADING=yes`, and there is no file named `KILL_SWITCH` in the repo root.

The limits are in `config.LIVE` and can only be changed by editing that file:

| Limit | Default |
|---|---|
| Symbols allowed | BTC/USDT only |
| Most in one position / one order | 20 USD |
| Order type | limit, immediate-or-cancel, at most 0.5% past the best bid/ask |
| Long only, spot, no leverage | always |
| Real orders per day | 2 |
| No new positions if the account falls below | 10 USD |
| Abort if live price is off yesterday's close by | 5% |
| Abort if the account holds more coin than | 200 USD (use a dedicated account) |

It keeps no state file: whether it is long is read from your exchange balance on every run, so re-running the same day is harmless. Any unexpected condition (stale data, odd price, missing keys, below-minimum order) stops the run and orders nothing.

**Setup, once:**
1. On KuCoin, create an API key with **trading on and withdrawals off**. Enable two-factor authentication and test a small withdrawal before depositing.
2. Add repo secrets `KUCOIN_API_KEY`, `KUCOIN_API_SECRET`, `KUCOIN_API_PASSPHRASE` (Settings, Secrets and variables, Actions, Secrets). GitHub's IPs change, so the key can't be IP-restricted: the withdrawals-off setting is what protects you.
3. Run the `live-trade` workflow by hand. With keys but no `LIVE_TRADING` variable it is a dry run that also reads your balance, which proves the keys work.
4. Only when you are ready: set the repo variable `LIVE_TRADING` to `yes`.

**Stop:** delete the `LIVE_TRADING` variable, or commit an empty `KILL_SWITCH` file. To exit a position, sell it by hand on the exchange.

The order logic is tested against a fake exchange (`tests/test_live.py`), but it has **not** been run against the real KuCoin API. Do the dry run with real keys first. A trend follower loses on most trades and can sit in a 50% drawdown; only use money you can afford to lose.
