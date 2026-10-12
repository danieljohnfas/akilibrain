// Guidelines §5/§8: per-source yield tracking, so 0-insert runs and low-yield hosts are visible.
import fs from 'node:fs';
import path from 'node:path';

export class Stats {
  constructor(file) {
    this.file = file;
    try {
      this.data = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      this.data = {};
    }
  }

  #bucket(project, host) {
    const p = (this.data[project] ??= {});
    return (p[host] ??= { fetches: 0, failures: 0, inserted: 0, duplicates: 0, rejected: 0, lastAt: null });
  }

  recordFetch(project, url, ok) {
    const b = this.#bucket(project, new URL(url).hostname);
    b.fetches++;
    if (!ok) b.failures++;
    b.lastAt = new Date().toISOString();
    this.save();
  }

  // Called by the consuming site after DB insertion: distinguishes real zero-yield from dropped rows.
  recordYield(project, url, { inserted = 0, duplicates = 0, rejected = 0 }) {
    const b = this.#bucket(project, new URL(url).hostname);
    b.inserted += inserted;
    b.duplicates += duplicates;
    b.rejected += rejected;
    this.save();
  }

  // Hosts that fail most of the time or never yield are candidates for the blocklist.
  lowYield(project) {
    return Object.entries(this.data[project] || {})
      .filter(([, b]) => b.fetches >= 5 && (b.failures / b.fetches > 0.8 || b.inserted === 0))
      .map(([host]) => host);
  }

  save() {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }
}
