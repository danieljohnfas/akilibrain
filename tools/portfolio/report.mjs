// Weekly Search Console report for all seven sites.
// Needs GSC_SERVICE_ACCOUNT_JSON (a Google service-account key). Add that account's email as a
// user (Restricted is enough) on each site's Search Console property.
// Run: GSC_SERVICE_ACCOUNT_JSON="$(cat key.json)" node tools/portfolio/report.mjs
import crypto from 'node:crypto';
import fs from 'node:fs';

const DOMAINS = [
  'akilibrain.com', 'tiketichap.com', 'is-my-internet-working.com', 'photosplitstudio.com',
  'audiorap.com', 'getnyash.com', 'hentaivault.me',
];

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function accessToken(key) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), key.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${b64url(signature)}`,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Google token error: ${data.error_description || data.error}`);
  return data.access_token;
}

const day = (offset) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10);

async function query(token, property, body) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    { method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify(body) },
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.rows ?? [];
}

async function siteSummary(token, domain) {
  // Search Console data lags ~3 days, so periods end 3 days ago.
  const current = { startDate: day(30), endDate: day(3) };
  const previous = { startDate: day(58), endDate: day(31) };
  for (const property of [`sc-domain:${domain}`, `https://${domain}/`]) {
    try {
      const [[cur], [prev], top] = await Promise.all([
        query(token, property, current),
        query(token, property, previous),
        query(token, property, { ...current, dimensions: ['query'], rowLimit: 5 }),
      ]);
      return { domain, property, cur: cur ?? { clicks: 0, impressions: 0 }, prev: prev ?? { clicks: 0, impressions: 0 }, top };
    } catch (e) {
      if (property.startsWith('https://')) return { domain, error: e.message };
    }
  }
}

const change = (a, b) => (b ? `${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}%` : a ? 'new' : '–');

async function main() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    console.log('GSC_SERVICE_ACCOUNT_JSON is not set; skipping the Search Console report.');
    return;
  }
  const token = await accessToken(JSON.parse(raw));
  const results = [];
  for (const domain of DOMAINS) results.push(await siteSummary(token, domain));

  const lines = [
    `# Portfolio report, week of ${day(0)}`,
    '',
    'Google search, last 28 days (ending 3 days ago) vs the 28 days before.',
    '',
    '| Site | Clicks | Change | Impressions | Change | Top searches |',
    '|---|---:|---:|---:|---:|---|',
  ];
  for (const r of results) {
    if (r.error) {
      lines.push(`| ${r.domain} | – | – | – | – | no access: add the service account to this property |`);
      continue;
    }
    const top = r.top.map((t) => `${t.keys[0]} (${t.clicks})`).join(', ') || '–';
    lines.push(`| ${r.domain} | ${r.cur.clicks} | ${change(r.cur.clicks, r.prev.clicks)} | ${r.cur.impressions} | ${change(r.cur.impressions, r.prev.impressions)} | ${top} |`);
  }
  const md = lines.join('\n') + '\n';
  console.log(md);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
}

main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
