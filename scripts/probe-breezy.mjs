import https from 'https';

const breezyCandidates = [
  'wasoko', 'twiga', 'copia', 'kuda', 'cellulant', 'pula', 'turaco',
  'm-kopa', 'mkopa', 'shara', 'tappi', 'remedialhealth', 'reliancehmo',
  'chari', 'maxab', 'wasoko-uganda', 'marketforce', 'marketforce360',
  'sendy', 'sendyit', 'gobebba', 'koko', 'kokonetworks', 'jumia',
  'ilarahealth', 'tibabu', 'myhealthafrica', 'm-shule', 'eha-clinics'
];

function fetchJson(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(u, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: 6000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ ok: true, status: res.statusCode, data: JSON.parse(body) });
            } catch {
              resolve({ ok: false, status: res.statusCode });
            }
          } else {
            resolve({ ok: false, status: res.statusCode });
          }
        });
      });
      req.on('error', () => resolve({ ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
      req.end();
    } catch {
      resolve({ ok: false });
    }
  });
}

async function main() {
  console.log('Probing Breezy HR candidate boards...');
  for (const token of breezyCandidates) {
    const res = await fetchJson(`https://${token}.breezy.hr/json`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      console.log(`[Breezy FOUND] ${token}: ${res.data.length} jobs`);
      for (const j of res.data.slice(0, 3)) {
        console.log(`  - ${j.name} (${j.location?.city || 'No city'}, ${j.location?.country?.name || 'No country'})`);
      }
    }
  }
}

main().catch(console.error);
