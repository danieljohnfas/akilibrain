// Guidelines §3: try plain HTTP first, fall back to Firecrawl (JS rendering) only when needed.
import { config } from './config.js';

// An empty SPA mount point, or a "please enable JavaScript" page with almost no text
const looksJsOnly = (html) => {
  const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' ').replace(/\s+/g, ' ');
  return /<div id="(root|app|__next)">\s*<\/div>/i.test(html) || (/enable javascript/i.test(html) && text.length < 500);
};

async function plainFetch(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': config.userAgent, accept: 'text/html,application/json;q=0.9,*/*;q=0.8' },
    redirect: 'follow',
    signal: AbortSignal.timeout(config.fetchTimeoutMs),
  });
  const body = await res.text();
  return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') || '', body };
}

async function firecrawlFetch(url, formats) {
  const res = await fetch(config.firecrawlUrl.replace(/\/$/, '') + '/v1/scrape', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(config.firecrawlKey && { authorization: 'Bearer ' + config.firecrawlKey }),
    },
    body: JSON.stringify({ url, formats }),
    signal: AbortSignal.timeout(config.fetchTimeoutMs * 4),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(`firecrawl ${res.status}: ${json.error || 'failed'}`);
  return json.data;
}

export async function fetchPage(url, { render = 'auto', formats = ['markdown'] } = {}) {
  const errors = [];
  if (render !== 'always') {
    try {
      const r = await plainFetch(url);
      const html = r.contentType.includes('html');
      // Without Firecrawl there is nothing better to fall back to, so return what we got
      if (r.ok && (render === 'never' || !config.firecrawlUrl || !html || !looksJsOnly(r.body))) {
        return { method: 'http', status: r.status, contentType: r.contentType, content: r.body };
      }
      errors.push(r.ok ? 'http: page looks JS-rendered' : `http: status ${r.status}`);
    } catch (e) {
      errors.push('http: ' + e.message);
    }
  }
  if (render !== 'never' && config.firecrawlUrl) {
    try {
      const data = await firecrawlFetch(url, formats);
      return { method: 'firecrawl', status: data.metadata?.statusCode ?? 200, content: data };
    } catch (e) {
      errors.push(e.message);
    }
  }
  const err = new Error('all fetch methods failed');
  err.details = errors;
  throw err;
}
