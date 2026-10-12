// Politeness rules: blocklist, robots.txt, per-domain rate limiting.

export function isBlocked(url, blocklist) {
  const host = new URL(url).hostname;
  return blocklist.some((b) => host === b || host.endsWith('.' + b));
}

// Minimal robots.txt parser: groups for our UA or "*", longest-match Allow/Disallow.
export function parseRobots(text, ua) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, field, value] = [m[0], m[1].toLowerCase(), m[2].trim()];
    if (field === 'user-agent') {
      if (!lastWasAgent) groups.push((current = { agents: [], rules: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else {
      lastWasAgent = false;
      if (current && (field === 'allow' || field === 'disallow') && value) {
        current.rules.push({ allow: field === 'allow', path: value });
      }
    }
  }
  const token = ua.toLowerCase().split('/')[0];
  const specific = groups.filter((g) => g.agents.some((a) => a !== '*' && token.includes(a)));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

export function robotsAllows(rules, pathname) {
  let best = null;
  for (const r of rules) {
    const prefix = r.path.replace(/\*.*$/, '').replace(/\$$/, '');
    if (pathname.startsWith(prefix) && (!best || prefix.length > best.len)) {
      best = { len: prefix.length, allow: r.allow };
    }
  }
  return best ? best.allow : true;
}

const robotsCache = new Map(); // origin -> { rules, at }

export async function checkRobots(url, ua, fetchImpl = fetch) {
  const { origin, pathname } = new URL(url);
  let entry = robotsCache.get(origin);
  if (!entry || Date.now() - entry.at > 6 * 3600_000) {
    let rules = [];
    try {
      const res = await fetchImpl(origin + '/robots.txt', {
        headers: { 'user-agent': ua },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) rules = parseRobots(await res.text(), ua);
    } catch { /* unreachable robots.txt => treat as allow-all */ }
    entry = { rules, at: Date.now() };
    robotsCache.set(origin, entry);
  }
  return robotsAllows(entry.rules, pathname);
}

const nextSlot = new Map(); // host -> timestamp when next request may start

// Reserves a slot for the host and resolves when it is our turn.
export function waitForDomain(url, minIntervalMs) {
  const host = new URL(url).hostname;
  const now = Date.now();
  const start = Math.max(now, nextSlot.get(host) || 0);
  nextSlot.set(host, start + minIntervalMs);
  return new Promise((r) => setTimeout(r, start - now));
}
