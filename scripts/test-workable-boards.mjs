import https from 'https';

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
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ account, status: res.statusCode, total: json.total || json.results?.length || 0, results: json.results || [] });
        } catch {
          resolve({ account, status: res.statusCode, error: 'parse_error' });
        }
      });
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  for (const acc of ['andela', 'flutterwave', 'chipper']) {
    const r = await checkWorkable(acc);
    console.log(`[Workable] ${acc}: total = ${r.total}`);
    if (r.results && r.results.length > 0) {
      console.log(`  Sample: ${r.results[0].title} (${r.results[0].location?.country || ''})`);
    }
  }
}

main().catch(console.error);
