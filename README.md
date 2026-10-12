# scrapelab

One shared, polite scraping gateway for all sites (akilihub, tiketichap, getproducts, vault),
built on the lessons in [notes/SCRAPING_GUIDELINES.md](notes/SCRAPING_GUIDELINES.md).

Every request goes through the same rules:
- **Blocklist** of known-blocked / low-yield hosts (§6, §8)
- **robots.txt** respected, cached 6h
- **Per-domain rate limit** (default 2s between requests to the same host)
- **Plain HTTP first**, self-hosted Firecrawl only when the page needs JS rendering (§3)
- **Provenance** on every result: `source_url`, `scraped_at`, `method` (§7)
- **Per-project, per-host yield stats** so silent zero-insert runs show up (§5, §8)

## Run
```bash
cp .env.example .env   # set real keys
npm test
npm start
```
Optional JS rendering: `git clone https://github.com/mendableai/firecrawl` into `firecrawl/`
(gitignored), then `cd firecrawl && docker compose up -d` and set `FIRECRAWL_URL`.

## API (Bearer key per project)
| Method | Path | Body | |
|---|---|---|---|
| POST | `/scrape` | `{ url, render?: "auto"\|"always"\|"never", formats? }` | fetch a page |
| POST | `/yield` | `{ url, inserted, duplicates, rejected }` | report what your DB actually kept |
| GET | `/stats` | | per-host stats + low-yield hosts to blocklist |
| GET | `/health` | | no auth |

## Next steps
1. Point akilihub's scrapers and tiketichap/sgr at `/scrape` instead of fetching directly.
2. Have each pipeline call `/yield` after inserts.
3. Review `/stats` weekly and move `lowYield` hosts into `BLOCKLIST`.
