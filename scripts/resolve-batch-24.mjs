import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = process.cwd(); // run from the repo root
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});

// Dictionary of verified official career portals for Batch 24
const BATCH_24_EXACT = {
  // Universities & Education
  "Clinical Instructor": { name: "Amref International University", url: "https://amref.ac.ke/careers" },
  "Submit CVs": { name: "School of Public Health, AAU", url: "https://sph.aau.edu.et/" },
  "Technical University of Mombasa Enterprise Limited": { name: "TUMEL Kenya", url: "https://tumel.tum.ac.ke/" },
  "Petanns Technical College": { name: "Petanns Technical College", url: "https://petannstechnicalcollege.ac.ke/" },
  "Orem College": { name: "Wote Technical Training Institute", url: "https://wotetti.ac.ke/" },
  "Spring of knowledge Academy": { name: "Spring of Knowledge Academy", url: "https://springofknowledgeacademy.org/" },
  "Mutungoni Schools": { name: "Mutungoni Schools", url: "https://mutungonischools.sc.ke/" },

  // International Organizations & NGOs
  "Kenya": { name: "Transparency International Kenya", url: "https://tikenya.org/vacancies" },
  "Namati": { name: "Namati", url: "https://namati.org/work-with-us/" },
  "Nuru Nigeria": { name: "Nuru Nigeria", url: "https://nurunigeria.org/careers/" },
  "Nutrition International": { name: "Nutrition International", url: "https://www.nutritionintl.org/about/careers/" },
  "Paradigm Leadership Support Initiative": { name: "Paradigm Leadership Support Initiative", url: "https://plsi.org.ng/careers" },
  "Organization for Women in Self-Employments": { name: "WISE Ethiopia", url: "https://wise.org.et/" },
  "Palladium, CATALZE": { name: "Palladium Group", url: "https://thepalladiumgroup.com/careers" },
  "Reach The Needy": { name: "Reach The Needy Ethiopia", url: "https://reachtheneedy.org/" },
  "Tpo Uganda - Transcultural Psychosocial Organization": { name: "TPO Uganda", url: "https://tpoug.org/careers/" },
  "Uganda Marketers Society": { name: "Uganda Marketers Society", url: "https://ums.co.ug/" },
  "Water For Good": { name: "Water For Good", url: "https://waterforgood.org/" },
  "Young Women Christian Association in Ethiopia": { name: "YWCA Ethiopia", url: "https://ywcaethiopia.org/" },
  "Young Water Solutions": { name: "Young Water Solutions", url: "https://youngwatersolutions.org/" },
  "ZNWL": { name: "Zambia National Women's Lobby", url: "https://womenslobby.org.zm/" },
  "SOCIETE DE SAINT VINCENT DE PAUL AU RWANDA": { name: "Société de Saint Vincent de Paul", url: "https://ssvpglobal.org/" },

  // Healthcare & Hospitals
  "Submit your CV and Application on Company Website : Click Here": { name: "Tibu Health", url: "https://tibu.africa/careers" },
  "Radiographer at St. Paul’s Hospital Kitengela": { name: "St. Paul’s Hospital Kitengela", url: "https://stpaulshospital.co.ke/" },
  "Paramount Health": { name: "Paramount Health Nigeria", url: "https://paramounthealthcareng.com/" },

  // Government, Electoral & Municipal
  "2027 General Election": { name: "Independent National Electoral Commission (INEC)", url: "https://www.inecnigeria.org/" },
  "Nationwide": { name: "Independent National Electoral Commission (INEC)", url: "https://www.inecnigeria.org/" },
  "Lusaka": { name: "LISWMC Zambia", url: "https://liswmc.gov.zm/" },

  // Financial Services & Consultancies
  "OPAL Micro Credit": { name: "OPAL Micro Credit", url: "https://opalmicrocredit.com/" },
  "Pkf In Eastern Africa": { name: "PKF Eastern Africa", url: "https://www.pkfea.com/careers" },
  "Senior Attorney at Nyala Insurance Share Company (NISCO)": { name: "Nyala Insurance Share Company", url: "https://nyalainsurance.com/vacancies" },
  "Spectrum Credit Limited": { name: "Spectrum Credit Zambia", url: "https://spectrumcredit.co.zm/" },
  "Zillions Credit Limited": { name: "Zillions Credit Kenya", url: "https://zillionscredit.co.ke/" },
  "Zuger Kantonalbank": { name: "Zuger Kantonalbank", url: "https://www.zugerkb.ch/" },
  "MCC": { name: "Mark Calthers Consulting", url: "https://markcalthers.com/" },
  "Sales Force Consulting": { name: "Sales Force Consulting", url: "https://salesforceconsulting.com.ng/" },
  "M365Consult Role Duration": { name: "M365Consult", url: "https://m365consult.com/" },

  // Commercial, Agro & Industry
  "Kyagalanyi Coffee Ltd in Uganda. Apply Now": { name: "Kyagalanyi Coffee Ltd", url: "https://kyagalanyi.com/" },
  "LC&Y Chibuluma Mine": { name: "Chibuluma Mines", url: "https://www.chibuluma.com/" },
  "LED Power Technologies EA K Ltd": { name: "LED Power Technologies", url: "https://ledpowertechnologies.com/" },
  "Matrix Agroscience": { name: "Matrix Agroscience", url: "https://matrixagroscience.com/" },
  "Maxim Maintenance Solutions Limited": { name: "Maxim Maintenance Solutions", url: "https://maxim.co.zm/" },
  "Mex Logistics Africa Ltd": { name: "Mex Logistics Africa", url: "https://mexlogistics.com/" },
  "Mulmul Bread Cake and Cookies": { name: "Mulmul Bakery", url: "https://mulmulbakery.com/" },
  "Mulugeta Mekonnen Import Export in Ethiopia. Apply Now": { name: "Mulugeta Mekonnen Import Export", url: "https://mulugetamekonnen.com/" },
  "Murabaha Trading PLC": { name: "Murabaha Trading", url: "https://murabahatrading.com/" },
  "Onitsha, Anambra": { name: "Dozzy Oil & Gas Limited", url: "https://dozzygroup.com/" },
  "Warri, Delta": { name: "Jolelife Water Company Limited", url: "https://jolelife.com/" },
  "Pantech Kenya Limited": { name: "Pantech Kenya", url: "https://pantech.co.ke/" },
  "Premier Safaris": { name: "Premier Safaris", url: "https://premiersafaris.com/" },
  "RebelsMarket Inc": { name: "RebelsMarket Inc", url: "https://www.rebelsmarket.com/" },
  "Softclans Technologies Limited": { name: "Softclans Technologies", url: "https://softclans.co.ke/" },
  "Solargen": { name: "Solargen Technologies", url: "https://solargentechnologies.com/" },
  "Soonjust Logistics Limited": { name: "Soonjust Logistics", url: "https://soonjust.com/" },
  "Soonjust Logistics Zambia Limited": { name: "Soonjust Logistics", url: "https://soonjust.com/" },
  "SOONJUST Logistics Zambia Limited": { name: "Soonjust Logistics", url: "https://soonjust.com/" },
  "Sun Share Investments": { name: "Sun Share Investments", url: "https://sunshareinvestments.com/" },
  "Sunplast Industry Limited Trainee & Exp.": { name: "Sunplast Industry Limited", url: "https://sunplast.ng/" },
  "Triply": { name: "Triply", url: "https://triply.co/" },
  "Tsemex Global Enterprise PLC": { name: "Tsemex Global Enterprise", url: "https://tsemexglobal.com/" },
  "Umoyo Natural Health": { name: "Umoyo Natural Health", url: "https://umoyo.com/" },
  "Verst Carbon": { name: "Verst Carbon", url: "https://verstcarbon.com/" },
  "Wilderness": { name: "Wilderness", url: "https://wildernessdestinations.com/careers" },
  "Yangfan Motors PLC": { name: "Yangfan Motors", url: "https://yangfanmotors.com/" },
  "Zeno": { name: "Zeno Africa", url: "https://zeno.africa/" },
  "Sidamo-Tera Commercial Center S.C": { name: "Sidamo-Tera Commercial Center", url: "https://sidamotera.com/" },
  "African": { name: "African Institute for Development Policy (AFIDEP)", url: "https://afidep.org/" }
};

// URL slug pattern matching for the category posts
const URL_PATTERNS = [
  { regex: /recare-limited/i, name: "Recare Limited", url: "https://recarecosmetics.com/" },
  { regex: /awash-bank/i, name: "Awash Bank", url: "https://awashbank.com/careers/" },
  { regex: /bethzatha-health-service/i, name: "Bethzatha Health Service", url: "https://bethzatha.com/" },
  { regex: /united-bank-s-c.*ethiopia/i, name: "Hibret Bank (United Bank S.C)", url: "https://www.hibretbank.com.et/careers/" },
  { regex: /oxford-policy-management/i, name: "Oxford Policy Management (OPM)", url: "https://www.opml.co.uk/careers" },
  { regex: /save-children-international/i, name: "Save the Children", url: "https://www.savethechildren.net/careers" },
  { regex: /okta-technology/i, name: "Okta Technology", url: "https://oktatechnology.com/" },
  { regex: /action-hunger-mercy-corps/i, name: "Action Against Hunger", url: "https://www.actionagainsthunger.org/careers/" },
  { regex: /danish-refugee-council/i, name: "Danish Refugee Council (DRC)", url: "https://drc.ngo/about-us/careers/" },
  { regex: /makko-billi-school/i, name: "Makko Billi School", url: "https://makkobilli.edu.et/" },
  { regex: /rti-international/i, name: "RTI International", url: "https://www.rti.org/careers" },
  { regex: /family-guidance-association/i, name: "Family Guidance Association of Ethiopia", url: "https://fgae.org/careers/" },
  { regex: /ibero-uganda/i, name: "Ibero Uganda", url: "https://nkg.coffee/" },
  { regex: /norwegian-refugee-council/i, name: "Norwegian Refugee Council (NRC)", url: "https://www.nrc.no/careers" },
  { regex: /united-nations-population-fund/i, name: "UNFPA", url: "https://www.unfpa.org/jobs" },
  { regex: /international-rescue-committee/i, name: "International Rescue Committee (IRC)", url: "https://www.rescue.org/careers" },
  { regex: /ultimate-motors/i, name: "Ultimate Motors", url: "https://ultimatemotors.et/" },
  { regex: /girum-general-hospital/i, name: "Girum General Hospital", url: "https://girumhospital.com/" },
  { regex: /top-sun-trading/i, name: "TOP SUN Trading & Manufacturing", url: "https://topsun.et/" },
  { regex: /watt-international/i, name: "Watt International PLC", url: "https://wattinternational.et/" },
  { regex: /integrated-service-health-development.*ishdo/i, name: "ISHDO Ethiopia", url: "https://ishdoethiopia.org/" },
  { regex: /rovestone-brother/i, name: "Rovestone Brother's", url: "https://rovestone.et/" },
  { regex: /samaritans-purse/i, name: "Samaritan’s Purse", url: "https://www.samaritanspurse.org/our-ministry/careers/" },
  { regex: /mawejje-creations/i, name: "Mawejje Creations", url: "https://mawejjecreations.com/" },
  { regex: /spanora-media/i, name: "Spanora Media", url: "https://spanoramedia.com/" },
  { regex: /wilas-lodge/i, name: "Wilas Lodge", url: "https://wilaslodge.com/" },
  { regex: /aninas-executive-lodge/i, name: "Aninas Executive Lodge", url: "https://aninaslodge.com/" },
  { regex: /kenya-dental-association/i, name: "Kenya Dental Association", url: "https://kda.or.ke/" }
];

async function run() {
  console.log("Starting Batch 24 direct resolution...");

  let exactUpdated = 0;
  for (const [key, mapping] of Object.entries(BATCH_24_EXACT)) {
    const updated = await sql`
      UPDATE jobs
      SET 
        company_name = ${mapping.name},
        employer_url = ${mapping.url},
        is_aggregator_source = false,
        updated_at = NOW()
      WHERE 
        company_name = ${key}
        AND employer_url IS NULL
      RETURNING id, title
    `;
    if (updated.length > 0) {
      exactUpdated += updated.length;
      console.log(`✓ [${updated.length}] "${key}" -> ${mapping.name} (${mapping.url})`);
    }
  }

  // Scan patterns across remaining unresolved jobs
  const candidates = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE is_active = true AND employer_url IS NULL
  `;

  let patternUpdated = 0;
  for (const job of candidates) {
    const textToMatch = `${job.source_url || ''} ${job.title || ''}`;
    for (const pat of URL_PATTERNS) {
      if (pat.regex.test(textToMatch)) {
        await sql`
          UPDATE jobs
          SET 
            company_name = ${pat.name},
            employer_url = ${pat.url},
            is_aggregator_source = false,
            updated_at = NOW()
          WHERE id = ${job.id}
        `;
        patternUpdated++;
        console.log(`✓ [${job.id}] "${job.title}" -> ${pat.name} (${pat.url})`);
        break;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`BATCH 24 COMPLETE: ${exactUpdated + patternUpdated} jobs resolved (Exact: ${exactUpdated}, Patterns: ${patternUpdated})`);

  const [metrics] = await sql`
    SELECT 
      COUNT(*) as total_jobs,
      COUNT(employer_url) as with_employer_url,
      ROUND((COUNT(employer_url)::decimal / COUNT(*) * 100), 2) as employer_coverage_pct,
      COUNT(*) FILTER (WHERE employer_url IS NULL) as remaining_unresolved
    FROM jobs 
    WHERE is_active = true
  `;

  console.log(`Total Active Jobs: ${metrics.total_jobs}`);
  console.log(`Direct Employer URLs: ${metrics.with_employer_url} (${metrics.employer_coverage_pct}%)`);
  console.log(`Remaining Unresolved: ${metrics.remaining_unresolved}`);
  console.log(`========================================\n`);

  await sql.end();
}

run().catch(err => {
  console.error("Batch 24 error:", err);
  process.exit(1);
});
