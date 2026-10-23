// Daily health check for all seven sites. Run: node tools/portfolio/health.mjs
// Exits non-zero when any check fails, so the scheduled GitHub workflow emails the owner.

const AD_NETWORK = /adsterra|highperformanceformat|profitablecpmratenetwork|effectivecpmnetwork|effectivegatecpm|atOptions/i;

const SITES = [
  {
    name: 'akilibrain.com',
    ok: ['https://akilibrain.com/', 'https://akilibrain.com/jobs', 'https://akilibrain.com/tenders', 'https://akilibrain.com/sitemap.xml'],
    hidden: ['https://akilibrain.com/pricing'], // redirects home now; must not render a paid plan
    noAds: ['https://akilibrain.com/'],
  },
  {
    name: 'tiketichap.com',
    ok: ['https://tiketichap.com/', 'https://tiketichap.com/routes', 'https://tiketichap.com/sitemap.xml'],
    noAds: ['https://tiketichap.com/'],
  },
  {
    name: 'is-my-internet-working.com',
    ok: ['https://is-my-internet-working.com/', 'https://is-my-internet-working.com/speed-test/', 'https://is-my-internet-working.com/what-is-my-ip/'],
    contains: [['https://is-my-internet-working.com/assets/js/offers.js', 'photoid03-20']],
    noAds: ['https://is-my-internet-working.com/'],
  },
  {
    name: 'photosplitstudio.com',
    ok: ['https://photosplitstudio.com/', 'https://photosplitstudio.com/app'],
    missing: ['https://photosplitstudio.com/package.json', 'https://photosplitstudio.com/reports/', 'https://photosplitstudio.com/README.md'],
    contains: [['https://photosplitstudio.com/js/amazon-products.js', 'photoid03-20'], ['https://photosplitstudio.com/', 'As an Amazon Associate']],
    noAds: ['https://photosplitstudio.com/'],
  },
  {
    name: 'audiorap.com',
    ok: ['https://audiorap.com/'],
    noAds: ['https://audiorap.com/'],
  },
  {
    name: 'getnyash.com',
    ok: ['https://getnyash.com/', 'https://getnyash.com/butt-lifting-leggings'],
    contains: [['https://getnyash.com/butt-lifting-leggings', 'tag=photoid03-20']],
    noAds: ['https://getnyash.com/'],
  },
  {
    name: 'hentaivault.me',
    ok: ['https://hentaivault.me/', 'https://hentaivault.me/sitemap.xml'],
    missing: ['https://hentaivault.me/gsc-credentials.json', 'https://hentaivault.me/.env', 'https://hentaivault.me/package.json'],
    noAds: ['https://hentaivault.me/', 'https://hentaivault.me/blog/'],
  },
];

async function get(url, { redirect = 'follow' } = {}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        redirect,
        headers: { 'user-agent': 'portfolio-health/1.0 (+https://github.com/danieljohnfas/akilibrain)' },
        signal: AbortSignal.timeout(30_000),
      });
      const body = redirect === 'manual' ? '' : await res.text();
      // Cloudflare bot protection challenges data-centre IPs (such as GitHub's runners) with 403 or 503.
      const challenged = (res.status === 403 || res.status === 503) && (
        res.headers.get('cf-mitigated') === 'challenge' ||
        /just a moment|cf-chl|challenge-platform|cloudflare/i.test(body)
      );
      if ((challenged || res.status === 503) && attempt < 2) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      return { status: res.status, location: res.headers.get('location'), body, challenged };
    } catch (e) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      throw e;
    }
  }
}

const skipped = new Set();

const failures = [];
const fail = (site, msg) => failures.push(`${site}: ${msg}`);

for (const site of SITES) {
  for (const url of site.ok ?? []) {
    try {
      const r = await get(url);
      if (r.challenged || r.status === 503) { skipped.add(site.name); continue; }
      if (r.status !== 200) fail(site.name, `${url} returned ${r.status}`);
    } catch (e) {
      fail(site.name, `${url} unreachable (${e.message})`);
    }
  }
  for (const url of site.missing ?? []) {
    try {
      const r = await get(url);
      if (r.status === 200) fail(site.name, `${url} is publicly readable (expected 404)`);
    } catch {}
  }
  for (const url of site.hidden ?? []) {
    try {
      const r = await get(url, { redirect: 'manual' });
      if (r.status === 200) fail(site.name, `${url} still renders (expected a redirect)`);
    } catch {}
  }
  for (const [url, needle] of site.contains ?? []) {
    try {
      const r = await get(url);
      if (r.challenged || r.status === 503) { skipped.add(site.name); continue; }
      if (!r.body.includes(needle)) fail(site.name, `${url} no longer contains "${needle}"`);
    } catch (e) {
      fail(site.name, `${url} unreachable (${e.message})`);
    }
  }
  for (const url of site.noAds ?? []) {
    try {
      const r = await get(url);
      const m = r.body.match(AD_NETWORK);
      if (m) fail(site.name, `${url} contains ad-network code ("${m[0]}")`);
    } catch {}
  }
}

if (skipped.size) {
  console.log(`⚠ Bot protection blocked some checks from this network for: ${[...skipped].join(', ')}`);
}

if (failures.length) {
  console.error(`✖ ${failures.length} problem(s):\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
} else {
  console.log(`✔ All checks passed for ${SITES.length} sites.`);
}
