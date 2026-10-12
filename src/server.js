import http from 'node:http';
import { config } from './config.js';
import { isBlocked, checkRobots, waitForDomain } from './policy.js';
import { fetchPage } from './fetcher.js';
import { Stats } from './stats.js';

const stats = new Stats(config.statsFile);

const send = (res, code, body) => {
  res.writeHead(code, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function auth(req) {
  const key = (req.headers.authorization || '').replace(/^Bearer /, '');
  return Object.entries(config.apiKeys).find(([, k]) => k === key)?.[0] || null;
}

async function handleScrape(project, body) {
  const { url, render = 'auto', formats } = body;
  try {
    if (!/^https?:/.test(new URL(url).protocol)) throw 0;
  } catch {
    return [400, { error: 'invalid url' }];
  }
  if (isBlocked(url, config.blocklist)) return [403, { error: 'host is on the blocklist' }];
  if (!(await checkRobots(url, config.userAgent))) return [403, { error: 'disallowed by robots.txt' }];

  await waitForDomain(url, config.minDomainIntervalMs);
  try {
    const page = await fetchPage(url, { render, formats });
    stats.recordFetch(project, url, true);
    // Guidelines §7: every result carries provenance
    return [200, { source_url: url, scraped_at: new Date().toISOString(), ...page }];
  } catch (e) {
    stats.recordFetch(project, url, false);
    return [502, { error: e.message, details: e.details }];
  }
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return send(res, 200, { ok: true });
    const project = auth(req);
    if (!project) return send(res, 401, { error: 'invalid api key' });

    if (req.method === 'POST' && req.url === '/scrape') {
      const [code, body] = await handleScrape(project, await readJson(req));
      return send(res, code, body);
    }
    if (req.method === 'POST' && req.url === '/yield') {
      const { url, ...counts } = await readJson(req);
      stats.recordYield(project, url, counts);
      return send(res, 200, { ok: true });
    }
    if (req.method === 'GET' && req.url === '/stats') {
      return send(res, 200, { project, sources: stats.data[project] || {}, lowYield: stats.lowYield(project) });
    }
    send(res, 404, { error: 'not found' });
  } catch (e) {
    send(res, 500, { error: e.message });
  }
});

server.listen(config.port, () => console.log(`[scrapelab] listening on :${config.port}`));
