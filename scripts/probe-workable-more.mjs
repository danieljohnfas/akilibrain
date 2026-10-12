import https from 'https';

const workableCandidates = [
  'flutterwave-technologies', 'flutterwave-inc', 'paystack', 'interswitch',
  'opay-nigeria', 'palmpay-nigeria', 'piggyvest-limited', 'alat-by-wema',
  'stanbic-ibtc', 'sterling-bank', 'sterling', 'providus-bank', 'wema-bank',
  'first-bank-of-nigeria', 'firstbank', 'fidelity-bank', 'fidelitybank'
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
      timeout: 5000
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
  for (const acc of workableCandidates) {
    const r = await checkWorkable(acc);
    if (r.total > 0) {
      console.log(`[Workable FOUND] ${acc}: ${r.total} jobs`);
      for (const j of r.results.slice(0, 2)) {
        console.log(`  - ${j.title} (${j.location?.city || ''}, ${j.location?.country || ''})`);
      }
    }
  }
}

main().catch(console.error);
