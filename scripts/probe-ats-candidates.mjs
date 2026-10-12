import https from 'https';

const greenhouseCandidates = [
  'paystack', 'wave', 'wavemobilemoney', 'kuda', 'kudabank', 'branch', 'branchinternational',
  'tala', 'copia', 'copiaglobal', 'turaco', 'basigo', 'twiga', 'twigafoods', 'wasoko',
  'fairmoney', 'opay', 'palmpay', 'piggyvest', 'yellowcard', 'ona', 'dlight', 'freshlife',
  'sanergy', 'komaza', 'victoryfarms', 'cellulant', 'pula', 'pulaadvisors', 'apolloagriculture',
  'carry1st', 'yoco', 'luno', 'stitch', 'stitchmoney', 'moove', 'mooveio', 'koko', 'kokonetworks',
  'autochek', 'swvl', 'mpharma', 'heliumhealth', 'sandtechnologies', 'thesandtech', 'africacdc',
  'bayer', 'novartis', 'wfp', 'unicef', 'unhcr', 'undp', 'irc', 'rescue', 'mercycorps'
];

const leverCandidates = [
  'paystack', 'kuda', 'kudabank', 'branch', 'tala', 'turaco', 'basigo', 'twiga', 'wasoko',
  'fairmoney', 'yellowcard', 'pula', 'apolloagriculture', 'carry1st', 'yoco', 'luno',
  'moove', 'koko', 'kokonetworks', 'autochek', 'mpharma', 'heliumhealth', 'sandtechnologies',
  'copia', 'cellulant', 'shara', 'tappi', 'inuka', 'reliancehmo', 'remedialhealth'
];

const ashbyCandidates = [
  'apolloagriculture', 'kuda', 'branch', 'turaco', 'basigo', 'carry1st', 'yoco', 'luno',
  'stitch', 'moove', 'koko', 'autochek', 'mpharma', 'shara', 'tappi', 'moniepoint', 'palmpay',
  'fairmoney', 'piggyvest', 'yellowcard', 'wasoko', 'twiga', 'copia', 'cellulant'
];

const smartRecruitersCandidates = [
  'TotalEnergies', 'SchneiderElectric', 'Decathlon', 'CatholicReliefServices', 'MercyCorps',
  'ActionAgainstHunger', 'BolloreLogistics', 'AGL', 'CFAO', 'Carrefour', 'BamburiCement',
  'EastAfricanBreweries', 'EABL', 'Diageo', 'StandardBank', 'EquityBank', 'CooperativeBank'
];

function fetchJson(url, options = {}) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = https.request(u, {
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          ...(options.headers || {})
        },
        timeout: 8000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({ ok: true, status: res.statusCode, data: JSON.parse(body) });
            } catch {
              resolve({ ok: false, status: res.statusCode, body });
            }
          } else {
            resolve({ ok: false, status: res.statusCode });
          }
        });
      });
      if (options.body) req.write(options.body);
      req.on('error', () => resolve({ ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false }); });
      req.end();
    } catch {
      resolve({ ok: false });
    }
  });
}

async function probeGreenhouse() {
  console.log('--- Probing Greenhouse Boards ---');
  const valid = [];
  for (const token of greenhouseCandidates) {
    const res = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs`);
    if (res.ok && res.data && Array.isArray(res.data.jobs) && res.data.jobs.length > 0) {
      console.log(`[Greenhouse FOUND] ${token}: ${res.data.jobs.length} jobs`);
      valid.push({ token, jobs: res.data.jobs.length, sample: res.data.jobs[0].title });
    }
  }
  return valid;
}

async function probeLever() {
  console.log('\n--- Probing Lever Boards ---');
  const valid = [];
  for (const token of leverCandidates) {
    const res = await fetchJson(`https://api.lever.co/v0/postings/${token}?mode=json`);
    if (res.ok && Array.isArray(res.data) && res.data.length > 0) {
      console.log(`[Lever FOUND] ${token}: ${res.data.length} jobs`);
      valid.push({ token, jobs: res.data.length, sample: res.data[0].text });
    }
  }
  return valid;
}

async function probeAshby() {
  console.log('\n--- Probing Ashby Boards ---');
  const valid = [];
  for (const token of ashbyCandidates) {
    const res = await fetchJson('https://jobs.ashbyhq.com/api/non-user-graphql?op=ApiJobBoardWithTeams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'ApiJobBoardWithTeams',
        variables: { organizationHostedJobsPageName: token },
        query: 'query ApiJobBoardWithTeams($organizationHostedJobsPageName: String!) { jobBoard: jobBoardWithTeams(organizationHostedJobsPageName: $organizationHostedJobsPageName) { jobPostings { id title locationName } } }'
      })
    });
    const jobPostings = res.data?.data?.jobBoard?.jobPostings;
    if (res.ok && Array.isArray(jobPostings) && jobPostings.length > 0) {
      console.log(`[Ashby FOUND] ${token}: ${jobPostings.length} jobs`);
      valid.push({ token, jobs: jobPostings.length, sample: jobPostings[0].title });
    }
  }
  return valid;
}

async function probeSmartRecruiters() {
  console.log('\n--- Probing SmartRecruiters Companies ---');
  const valid = [];
  for (const token of smartRecruitersCandidates) {
    const res = await fetchJson(`https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=10`);
    if (res.ok && res.data && Array.isArray(res.data.content) && res.data.content.length > 0) {
      console.log(`[SmartRecruiters FOUND] ${token}: ${res.data.totalFound || res.data.content.length} jobs`);
      valid.push({ token, jobs: res.data.totalFound || res.data.content.length, sample: res.data.content[0].name });
    }
  }
  return valid;
}

async function main() {
  const gh = await probeGreenhouse();
  const lv = await probeLever();
  const as = await probeAshby();
  const sr = await probeSmartRecruiters();

  console.log('\n=== Summary of Discovered Live ATS Feeds ===');
  console.log('Greenhouse:', gh);
  console.log('Lever:', lv);
  console.log('Ashby:', as);
  console.log('SmartRecruiters:', sr);
}

main().catch(console.error);
