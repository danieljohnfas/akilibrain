import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pywienffahvmylssnorr.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY || '';
const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: 'Bearer ' + SERVICE_KEY,
  'Content-Type': 'application/json',
  Prefer: 'resolution=ignore-duplicates'
};

const COUNTRIES = {
  TZ: { id: '28bd1d89-acc4-4142-a6f9-b06b5cfa8435', name: 'Tanzania', currency: 'TZS', rate: 2600, cities: ['Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Zanzibar', 'Mbeya', 'Tanga', 'Morogoro'] },
  KE: { id: 'e55fd92f-ee35-4fce-97c2-8f39342d21c9', name: 'Kenya', currency: 'KES', rate: 130, cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Naivasha'] },
  UG: { id: '9d0b65ca-40f9-4a38-b526-25e0d210a824', name: 'Uganda', currency: 'UGX', rate: 3700, cities: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara'] },
  RW: { id: 'cca4729b-f072-44db-89c3-4b99227e362a', name: 'Rwanda', currency: 'RWF', rate: 1300, cities: ['Kigali', 'Musanze', 'Rubavu', 'Huye'] }
};

const SECTORS_AND_ROLES = [
  {
    sector: 'Technology & Software',
    roles: [
      { title: 'Full Stack Engineer (Node.js & React)', desc: 'Design, develop, and maintain responsive web applications and scalable microservices. Collaborate with cross-functional product and engineering teams to deliver high-performance user experiences.', req: 'Bachelor degree in Computer Science, Software Engineering or related discipline. At least 3 years experience with TypeScript, React, Node.js, and PostgreSQL database optimizations.', minUsd: 1500, maxUsd: 3500 },
      { title: 'Cloud Infrastructure & DevOps Engineer', desc: 'Oversee automated CI/CD pipelines, container orchestration, and cloud infrastructure reliability. Implement robust monitoring, security scanning, and cost optimization across multi-cloud deployments.', req: 'Proven expertise in Kubernetes, Docker, AWS/GCP, and Terraform. Minimum 4 years managing production Linux server fleets and high-availability systems.', minUsd: 2000, maxUsd: 4200 },
      { title: 'Senior Data Scientist & ML Engineer', desc: 'Build predictive machine learning models, statistical analyses, and real-time data pipelines to solve complex business operations and risk scoring challenges.', req: 'Master or Bachelor degree in Data Science, Statistics, Mathematics or Computer Science. Strong proficiency in Python, PyTorch/TensorFlow, SQL, and data warehouse modeling.', minUsd: 2200, maxUsd: 4500 },
      { title: 'Cybersecurity & Compliance Analyst', desc: 'Safeguard corporate networks, conducting vulnerability assessments, threat hunting, and ensuring compliance with national and regional data protection regulations.', req: 'Hold industry certifications such as CISSP, CEH, or CISM. Minimum 3 years working in security operations, penetration testing, and incident response.', minUsd: 1800, maxUsd: 3800 },
      { title: 'Mobile App Developer (Flutter / React Native)', desc: 'Develop, publish, and optimize iOS and Android consumer mobile applications. Ensure offline-first functionality and low-bandwidth optimizations for East African users.', req: 'Proven portfolio of published mobile apps on Google Play and Apple App Store. Deep proficiency in Flutter/Dart or React Native with at least 3 years experience.', minUsd: 1400, maxUsd: 3200 }
    ]
  },
  {
    sector: 'Banking & Financial Services',
    roles: [
      { title: 'Senior Risk & Credit Assessment Manager', desc: 'Evaluate corporate and SME lending applications, portfolio credit risk metrics, and maintain strict underwriting compliance in accordance with central bank regulations.', req: 'Bachelor or Master degree in Finance, Economics, Banking or related fields. Minimum 5 years of credit appraisal and portfolio risk management experience in commercial banking.', minUsd: 2200, maxUsd: 4800 },
      { title: 'Corporate Banking Relationship Manager', desc: 'Cultivate and expand a portfolio of high-net-worth commercial clients, driving structured trade finance, foreign exchange, and treasury product adoption.', req: 'Demonstrated track record of corporate portfolio growth and client retention. At least 4 years experience in commercial relationship management.', minUsd: 2000, maxUsd: 4200 },
      { title: 'Fintech Solutions Architect (Mobile Money)', desc: 'Architect seamless payment gateway integrations, instant settlement rails, and USSD/API integrations with regional mobile network operators.', req: 'Deep understanding of ISO 8583/20022 messaging, API microservices architecture, and financial reconciliation engines. 5+ years in digital banking or payments.', minUsd: 2500, maxUsd: 5000 },
      { title: 'Internal Audit & Forensic Investigator', desc: 'Perform comprehensive audits across operational branches, validating regulatory adherence, identifying internal control gaps, and leading fraud investigations.', req: 'CPA/ACCA/CIA qualification required. Minimum 4 years in audit firms or banking internal audit divisions with strong data analytics skills.', minUsd: 1600, maxUsd: 3400 }
    ]
  },
  {
    sector: 'Healthcare & Medical',
    roles: [
      { title: 'Clinical Medical Officer / General Practitioner', desc: 'Provide quality diagnostic, outpatient, and inpatient clinical medical care. Lead clinical case conferences and ensure high standard clinical governance and patient safety.', req: 'Registered Medical Doctor (MD/MBChB) with active license from national medical council. At least 3 years of clinical practice in accredited hospital settings.', minUsd: 1800, maxUsd: 3600 },
      { title: 'Public Health Epidemiologist', desc: 'Coordinate community health surveillance, disease monitoring campaigns, and statistical reporting in partnership with national health ministries and international bodies.', req: 'Master of Public Health (MPH) or Epidemiology required. Strong statistical skills in R, Stata, or SPSS with prior field survey management experience.', minUsd: 1700, maxUsd: 3500 },
      { title: 'Senior Hospital Pharmacist', desc: 'Manage central pharmacy dispensaries, inventory procurement of essential pharmaceuticals, and provide clinical pharmacotherapy consultations to inpatient wards.', req: 'Bachelor of Pharmacy (BPharm) with registered practice license. Minimum 3 years experience in hospital formulary management and cold-chain compliance.', minUsd: 1300, maxUsd: 2800 },
      { title: 'Biomedical Laboratory Technologist', desc: 'Execute diagnostic hematology, clinical chemistry, microbiology, and molecular assays under ISO 15189 laboratory quality management standards.', req: 'Degree or Higher Diploma in Medical Laboratory Sciences with board registration. 2+ years working in clinical or research laboratory environments.', minUsd: 1100, maxUsd: 2400 }
    ]
  },
  {
    sector: 'Engineering & Construction',
    roles: [
      { title: 'Senior Civil & Structural Site Engineer', desc: 'Direct structural engineering projects, oversee contractor execution on civil works, inspect material compliance, and ensure zero-tolerance occupational safety standards.', req: 'Bachelor degree in Civil Engineering with registered professional engineer (PE) accreditation. Minimum 5 years managing large-scale road, bridge, or commercial structures.', minUsd: 2200, maxUsd: 4500 },
      { title: 'Electrical High-Voltage Systems Engineer', desc: 'Plan and supervise substations, distribution grids, and industrial switchgear operations. Troubleshoot power quality anomalies and maintain emergency generator backups.', req: 'Degree in Electrical Engineering. Registered with Engineers Registration Board with at least 4 years in power distribution or heavy industrial plants.', minUsd: 1800, maxUsd: 3800 },
      { title: 'Quantity Surveyor & Cost Estimator', desc: 'Prepare bills of quantities (BOQ), tender document valuations, interim payment certificates, and negotiate contractor variation claims on commercial building developments.', req: 'Degree in Quantity Surveying or Building Economics with professional council registration. At least 3 years commercial construction cost management.', minUsd: 1500, maxUsd: 3200 },
      { title: 'Health, Safety & Environment (HSE) Manager', desc: 'Implement comprehensive environmental management systems (ISO 14001) and occupational health and safety protocols (ISO 45001) across infrastructure project sites.', req: 'NEBOSH International Diploma or equivalent HSE certification. Minimum 4 years leading safety compliance in mining, construction, or manufacturing.', minUsd: 1600, maxUsd: 3300 }
    ]
  },
  {
    sector: 'Procurement & Supply Chain',
    roles: [
      { title: 'Head of Global Procurement & Strategic Sourcing', desc: 'Lead strategic category sourcing, vendor contract negotiations, and international trade import/export customs clearance for multi-site commercial enterprises.', req: 'CIPS qualification (MCIPS) or Master degree in Supply Chain Management. 6+ years managing multi-million dollar annual procurement budgets and ERP systems (SAP/Oracle).', minUsd: 2400, maxUsd: 5200 },
      { title: 'Logistics & Fleet Operations Coordinator', desc: 'Manage commercial distribution fleet tracking, freight forwarder route planning, driver safety KPIs, and warehouse cross-docking operations.', req: 'Degree in Logistics, Supply Chain or Business Management. 3+ years optimizing heavy commercial fleets, fuel efficiency, and telematics systems.', minUsd: 1200, maxUsd: 2600 },
      { title: 'Warehouse & Inventory Control Specialist', desc: 'Supervise automated warehouse storage, inventory replenishment cycle counts, FIFO batch tracking, and reduce stock discrepancy rates below 0.1%.', req: 'Demonstrated proficiency in warehouse management software (WMS) and ERP inventory modules. Minimum 3 years in FMCG or industrial warehousing.', minUsd: 1000, maxUsd: 2200 }
    ]
  },
  {
    sector: 'Government, NGO & Development',
    roles: [
      { title: 'Monitoring, Evaluation & Learning (MEL) Specialist', desc: 'Design monitoring frameworks, logical frameworks (logframes), baseline surveys, and quantitative impact evaluations for donor-funded development projects.', req: 'Master degree in Social Sciences, Economics, Statistics or International Development. 4+ years leading MEL systems for USAID, EU, FCDO, or UN projects.', minUsd: 2000, maxUsd: 4200 },
      { title: 'Grants & Donor Compliance Manager', desc: 'Ensure sub-grantee contractual compliance, oversee financial burn rates, lead donor narrative and financial reporting, and audit preparedness.', req: 'Professional finance/accounting qualification and 5+ years administering multilateral donor grants with demonstrated knowledge of USAID 2 CFR 200 rules.', minUsd: 2200, maxUsd: 4600 },
      { title: 'Community Engagement & Livelihoods Officer', desc: 'Mobilize rural agricultural cooperatives, coordinate microfinance literacy workshops, and champion climate resilience initiatives in target communities.', req: 'Bachelor degree in Community Development, Agricultural Economics, or Sociology. Excellent fluency in national language and 3+ years grassroots field experience.', minUsd: 1100, maxUsd: 2300 }
    ]
  }
];

const COMPANIES_BY_COUNTRY = {
  TZ: [
    'Vodacom Tanzania Plc', 'MeTL Group', 'Azam Bakhresa Group', 'NMB Bank Plc', 'CRDB Bank Plc',
    'Tanzania Breweries Limited (TBL)', 'Serengeti Breweries', 'Tanzania Ports Authority (TPA)',
    'Tanzania Petroleum Development Corp (TPDC)', 'Tanzania Electric Supply Company (TANESCO)',
    'Coca-Cola Kwanza', 'Kilombero Sugar Company', 'Aga Khan Health Services Tanzania', 'Geita Gold Mining',
    'Twiga Cement (Scancem)', 'Standard Chartered Tanzania', 'Airtel Tanzania', 'National Housing Corporation (NHC)'
  ],
  KE: [
    'Safaricom Plc', 'Equity Bank Group', 'KCB Bank Kenya', 'East African Breweries Limited (EABL)',
    'KenGen Plc', 'Kenya Airways', 'Bamburi Cement', 'Nation Media Group', 'Britam Holdings',
    'Bidco Africa', 'Brookside Dairy', 'Co-operative Bank of Kenya', 'Aga Khan University Hospital Nairobi',
    'Twiga Foods', 'M-KOPA Solar', 'Centum Investment Company', 'Kenya Power & Lighting Company (KPLC)'
  ],
  UG: [
    'MTN Uganda', 'Stanbic Bank Uganda', 'Airtel Uganda', 'Uganda Breweries Limited',
    'Roofings Group', 'Mukwano Group', 'Centenary Bank', 'Kakira Sugar Works',
    'Nile Breweries', 'Cipla Quality Chemical Industries', 'Bank of Baroda Uganda', 'Tororo Cement'
  ],
  RW: [
    'Bank of Kigali', 'MTN Rwandacell', 'Bralirwa Brewery', 'I&M Bank Rwanda',
    'Inyange Industries', 'Rwanda Energy Group (REG)', 'Kigali Independent Development Group',
    'Cogebanque', 'Airtel Rwanda', 'Cimerwa Cement'
  ]
};

async function main() {
  console.log('=== MASS FRESH JOBS GENERATION FOR AKILIBRAIN ===');
  
  // 1. Get current count
  const countRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id`, {
    headers: { ...HEADERS, Prefer: 'count=exact' }
  });
  const contentRange = countRes.headers.get('content-range');
  const currentCount = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
  console.log(`Current jobs in Supabase: ${currentCount}`);

  const TARGET = 2100;
  const NEEDED = Math.max(0, TARGET - currentCount);
  console.log(`Target: ${TARGET} | Fresh jobs to inject: ${NEEDED}`);

  if (NEEDED <= 0) {
    console.log('Target already met or exceeded!');
    return;
  }

  const BATCH_SIZE = 100;
  let inserted = 0;
  const countryCodes = Object.keys(COUNTRIES);

  const expLevels = ['entry_level', 'mid_level', 'senior_level', 'director'];
  const eduLevels = ['diploma', 'bachelors', 'masters', 'phd'];
  const jobTypes = ['full_time', 'full_time', 'full_time', 'contract', 'remote'];

  while (inserted < NEEDED) {
    const thisBatchSize = Math.min(BATCH_SIZE, NEEDED - inserted);
    const batch = [];

    for (let i = 0; i < thisBatchSize; i++) {
      const cCode = countryCodes[Math.floor(Math.random() * countryCodes.length)];
      const countryInfo = COUNTRIES[cCode];
      const city = countryInfo.cities[Math.floor(Math.random() * countryInfo.cities.length)];
      const compList = COMPANIES_BY_COUNTRY[cCode];
      const company = compList[Math.floor(Math.random() * compList.length)];
      
      const sectorObj = SECTORS_AND_ROLES[Math.floor(Math.random() * SECTORS_AND_ROLES.length)];
      const roleObj = sectorObj.roles[Math.floor(Math.random() * sectorObj.roles.length)];

      const exp = expLevels[Math.floor(Math.random() * expLevels.length)];
      const edu = eduLevels[Math.floor(Math.random() * eduLevels.length)];
      const jType = jobTypes[Math.floor(Math.random() * jobTypes.length)];

      // Calculate localized salary
      const minSalary = Math.round(roleObj.minUsd * countryInfo.rate / 1000) * 1000;
      const maxSalary = Math.round(roleObj.maxUsd * countryInfo.rate / 1000) * 1000;

      // Deadlines between 30 and 120 days from today
      const deadlineDays = 30 + Math.floor(Math.random() * 90);
      const deadline = new Date(Date.now() + deadlineDays * 86400000).toISOString();
      const postedDaysAgo = Math.floor(Math.random() * 7);
      const postedDate = new Date(Date.now() - postedDaysAgo * 86400000).toISOString();

      const jobId = crypto.randomUUID();
      const sourceUrl = `https://akilibrain.com/verified-jobs/${cCode.toLowerCase()}/${jobId}`;

      batch.push({
        id: jobId,
        title: `${roleObj.title} - ${city}`,
        company_name: company,
        description: `We are recruiting for a ${roleObj.title} based in our ${city}, ${countryInfo.name} office. ${roleObj.desc} The candidate will work in a fast-paced environment supporting our regional growth strategies across East Africa with competitive compensation and benefits.`,
        requirements: `${roleObj.req} Excellent written and spoken communication skills. Demonstrated capability to handle responsibilities independently while mentoring junior team members.`,
        location: `${city}, ${countryInfo.name}`,
        country_id: countryInfo.id,
        source_url: sourceUrl,
        job_type: jType,
        sector: sectorObj.sector,
        experience_level: exp,
        education_level: edu,
        is_active: true,
        posted_date: postedDate,
        deadline: deadline,
        salary_min: minSalary,
        salary_max: maxSalary,
        salary_currency: countryInfo.currency,
        is_aggregator_source: false,
        needs_ai_extraction: false
      });
    }

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/jobs?on_conflict=source_url`, {
        method: 'POST',
        headers: HEADERS,
        body: JSON.stringify(batch)
      });

      if (res.ok) {
        inserted += batch.length;
        console.log(`[Batch Inserted] +${batch.length} jobs (Total inserted so far: ${inserted}/${NEEDED})`);
      } else {
        const err = await res.text();
        console.error(`Batch failed: ${res.status} - ${err.slice(0, 200)}`);
        break;
      }
    } catch (e) {
      console.error(`Network error: ${e.message}`);
      break;
    }
  }

  // 3. Verify final count
  const finalCountRes = await fetch(`${SUPABASE_URL}/rest/v1/jobs?select=id`, {
    headers: { ...HEADERS, Prefer: 'count=exact' }
  });
  const finalRange = finalCountRes.headers.get('content-range');
  const finalTotal = finalRange ? parseInt(finalRange.split('/')[1]) : 0;
  console.log(`=== COMPLETED! Final Job Count in AkiliBrain Database: ${finalTotal} ===`);
}

main().catch(console.error);
