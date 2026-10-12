import https from 'https';

const workableCandidates = [
  'fairmoney', 'kuda', 'kudabank', 'piggyvest', 'opay', 'palmpay',
  'yellowcard', 'pula', 'cellulant', 'sendy', 'twiga', 'wasoko',
  'copia', 'jumia', 'maxab', 'chari', 'swvl', 'autochek', 'moove',
  'stitch', 'carry1st', 'yoco', 'dlight', 'freshlife', 'sanergy',
  'komaza', 'victoryfarms', 'marketforce', 'inuka', 'tappi',
  'alx', 'african-leadership-group', 'alat', 'wema-bank', 'stanbic'
];

function checkWorkable(account) {
  return new Promise((resolve) => {
    const data = JSON.stringify({});
    const req = https.request({
      hostname: 'apply.workable.com',
      path: `/api/v3/accounts/${account}/jobs`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 6000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const total = json.total || json.results?.length || 0;
          resolve({ account, status: res.statusCode, total, results: json.results || [] });
        } catch {
          resolve({ account, status: res.statusCode, total: 0 });
        }
      });
    });
    req.on('error', () => resolve({ account, total: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ account, total: 0 }); });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Probing Workable candidates...');
  for (const acc of workableCandidates) {
    const r = await checkWorkable(acc);
    if (r.total > 0) {
      console.log(`[Workable FOUND] ${acc}: ${r.total} jobs`);
      for (const j of r.results.slice(0, 3)) {
        console.log(`  - ${j.title} (${j.location?.city || ''}, ${j.location?.country || ''})`);
      }
    }
  }
}

main().catch(console.error);
