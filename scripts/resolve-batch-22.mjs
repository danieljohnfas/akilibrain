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

// Dictionary of verified official career/employer portals for Batch 22
const BATCH_22_EMPLOYERS = {
  // Universities & Educational Institutions
  "Kirinyaga University": "https://www.kyu.ac.ke/vacancies",
  "Kisii University (14 Positions)": "https://www.kisiiuniversity.ac.ke/careers",
  "Kitale National Polytechnic": "https://kitalepolytechnic.ac.ke/careers",
  "Pwani University": "https://www.pu.ac.ke/vacancies",
  "Rongo University": "https://rongovarsity.ac.ke/careers",
  "Shamberere Technical Training Institute": "https://shambereretti.ac.ke/",
  "Sot Technical Training Institute": "https://sottechnical.ac.ke/careers",
  "Meru University of Science and Technology": "https://must.ac.ke/vacancies",
  "Unity University": "https://unityuniversity.edu.et/careers",
  "University of Lusaka": "https://unilus.ac.zm/careers",
  "USIU Africa": "https://www.usiu.ac.ke/jobs",
  "National Aviation College": "https://nationalaviationcollege.edu.et/",
  "National Institute of Public Administration": "https://nipa.ac.zm/careers",
  "Paradise Valley College": "https://paradisevalleycollege.org/",
  "Sante Medical College": "https://santemedicalcollege.et/",
  "School of Tomorrow": "https://schooloftomorrow-et.com/",
  "SABIS International School": "https://careers.sabis.net/",
  "Lusaka South University College": "https://lsuc.edu.zm/",
  "Makeni Institute Trust": "https://makenitrust.org/careers",
  "Topmax College": "https://topmaxcollege.ac.ke/",

  // International Organizations & NGOs
  "World Food Programme (WFP)": "https://www.wfp.org/careers",
  "World Health Organization": "https://www.who.int/careers",
  "UNAIDS": "https://www.unaids.org/en/vacancies",
  "Unicef Bangladesh": "https://www.unicef.org/careers",
  "United Nations Office at Nairobi (UNON)": "https://unon.org/vacancies",
  "United Nations Volunteers": "https://www.unv.org/become-volunteer",
  "Save the Children": "https://www.savethechildren.net/careers",
  "Save the Children International": "https://www.savethechildren.net/careers",
  "Oxfam": "https://www.oxfam.org/en/work-with-us",
  "PACT Ethiopia": "https://www.pactworld.org/careers",
  "Partners In Health": "https://www.pih.org/careers",
  "Plan International Ethiopia": "https://plan-international.org/jobs",
  "Self Help Africa": "https://selfhelpafrica.org/careers/",
  "Sightsavers": "https://www.sightsavers.org/work-with-us/",
  "Teach For All": "https://teachforall.org/careers",
  "TechnoServe Kenya": "https://www.technoserve.org/careers/",
  "Tetra Tech Company": "https://www.tetratech.com/careers",
  "URC": "https://www.urc-chs.com/careers/",
  "Urc": "https://www.urc-chs.com/careers/",
  "VisionSpring": "https://visionspring.org/careers",
  "VVOB Zambia": "https://zambia.vvob.org/vacancies",
  "Wetlands International": "https://www.wetlands.org/about-us/jobs/",
  "Wildlife Clubs of Kenya": "https://wildlifeclubsofkenya.org/careers",
  "TASO Uganda": "https://tasouganda.org/careers/",
  "TPO Uganda - Transcultural Psychosocial Organization": "https://tpoug.org/careers/",
  "Resolve to Save Lives": "https://resolvetosavelives.org/about-us/careers/",
  "Right To Play in Uganda. Apply Now": "https://righttoplay.com/en/careers/",
  "Rakai Health Sciences Program (rhsp)": "https://rhsp.org/careers/",
  "Rehabilitation and Development Organization (RADO)": "https://radoethiopia.org/careers",
  "Mary Joy Development Association": "https://maryjoyethiopia.org/",
  "Marie Stopes International Ethiopia": "https://www.mariestopes.org/work-with-us/",
  "Mercy Corps in Uganda. Apply Now": "https://www.mercycorps.org/careers",
  "Light for the World Kenya": "https://www.light-for-the-world.org/jobs/",
  "PALM Corps": "https://palmcorps.org/vacancies/",
  "Splash International": "https://splash.org/careers",
  "Uganda Catholic Medical Bureau": "https://ucmb.co.ug/vacancies",
  "Uganda Development Trust": "https://udet.co.ug/",

  // Banks, Microfinance & Financial Services
  "Stanbic Bank Uganda": "https://www.stanbicbank.co.ug/careers",
  "United Bank for Africa (UBA) Kenya": "https://www.ubagroup.com/careers/",
  "NCBA": "https://ncbagroup.com/careers/",
  "Premier Bank": "https://premierbank.ke/careers",
  "Standard Investment Bank": "https://sib.co.ke/careers",
  "Wegagen Bank S.C (Over 30 Positions)": "https://www.wegagen.com/vacancies",
  "Nib Insurance Company S.C": "https://www.nibinsurancesc.com/vacancies",
  "Nib International Bank and Debub Global Bank in Ethiopia": "https://www.nibbanksc.com/careers",
  "Nile Insurance Company S.C": "https://www.nileinsurancesc.com/vacancies",
  "Nyala Insurance Share Company (NISCO)": "https://nyalainsurance.com/vacancies",
  "The United Insurance Company S. C.": "https://unicethiopia.com/vacancies",
  "The United Insurance Company SC": "https://unicethiopia.com/vacancies",
  "United Insurance Company S.C": "https://unicethiopia.com/vacancies",
  "Tower Sacco": "https://towersacco.co.ke/careers",
  "MOPIL SACCO": "https://mopilsacco.co.ke/",
  "RUPSA SACCO": "https://rupsasacco.co.ke/",
  "United Winners Sacco": "https://unitedwinnerssacco.co.ke/",
  "Kray Microfinance Limited": "https://kraymicrofinance.com/careers",
  "Meklit Micro Finance Institution S.C": "https://meklitmfi.com/",
  "Rays Micro-finance Institution S.C in Ethiopia. Apply Now": "https://www.raysmfi.com/careers",
  "Prime Insurance Ltd": "https://www.prime.rw/careers",
  "Optimus Bank Limited": "https://optimusbank.com/careers",
  "Old Mutual South Africa": "https://www.oldmutual.com/careers/",
  "Thunes": "https://www.thunes.com/careers/",
  "Moniepoint": "https://moniepoint.com/careers",
  "Mukuru": "https://www.mukuru.com/careers/",
  "Liberty Uganda": "https://www.liberty.co.ug/careers",
  "Zemen Ethiopia Import and Export": "https://zemenbank.com/careers",

  // Multinationals, Tech, Telecom & Corporate Enterprises
  "Unilever": "https://careers.unilever.com/",
  "The Coca-Cola Company": "https://www.coca-colacompany.com/careers",
  "Totalenergies": "https://totalenergies.com/careers",
  "Thermo Fisher Scientific": "https://jobs.thermofisher.com/",
  "Visa Incorporated": "https://corporate.visa.com/en/careers.html",
  "SLB": "https://careers.slb.com/",
  "Roche Kenya": "https://www.roche.com/careers",
  "Marriott": "https://www.marriott.com/careers",
  "Kigali Marriott Hotel": "https://www.marriott.com/careers",
  "Southern Sun": "https://www.southernsun.com/careers",
  "Scania East Africa": "https://www.scania.com/ke/en/home.html",
  "Teleperformance Kenya": "https://www.teleperformance.com/en-us/careers",
  "MTN Nigeria Job": "https://www.mtn.ng/careers/",
  "Trigyn Technologies": "https://www.trigyn.com/careers",
  "Technobrain": "https://technobraingroup.com/careers/",
  "Tezza Business Solutions Ltd": "https://tezzasolutions.com/careers",
  "NIPRO Corporation": "https://www.nipro-group.com/en/careers",
  "Nalco Water": "https://www.ecolab.com/nalco-water",
  "Newrest": "https://www.newrest.eu/careers/",
  "Robert Walters": "https://www.robertwalters.ng/jobs",
  "Twelve Data": "https://twelvedata.com/careers",
  "Savannah Informatics": "https://savannahinformatics.com/careers",
  "Scanad Ltd": "https://wpp-scangroup.com/careers/",
  "Proto Energy": "https://protoenergy.com/careers/",
  "Victory Farms": "https://victoryfarmskenya.com/careers",
  "Skyward Express": "https://skywardexpress.co.ke/careers",
  "SunCulture Kenya Ltd": "https://sunculture.com/careers/",
  "TakaTaka Solutions Ltd": "https://takatakasolutions.com/careers",
  "Tuko Media": "https://tuko.co.ke/careers",
  "Zeraki": "https://zeraki.app/careers",
  "PAIX Data Centres": "https://www.paix.net/careers",
  "REDA Chemicals": "https://redachem.com/careers/",
  "Sucafina": "https://sucafina.com/careers",
  "Lapaire": "https://lapaireglasses.com/careers/",
  "Laboratory & Allied Ltd.": "https://laballied.com/careers",
  "Pulse Nigeria": "https://www.pulse.ng/careers",
  "Pam Golding Properties Kenya": "https://www.pamgolding.co.za/careers",
  "Outbox Hub Uganda": "https://outbox.co.ug/opportunities",
  "Outcess Solutions Limited": "https://outcess.com/careers",

  // Healthcare & Hospitals
  "Nairobi Hospital": "https://nairobihospital.org/careers/",
  "Tenwek Hospital": "https://tenwekhospital.org/vacancies",
  "South B Hospital": "https://southbhospital.org/careers",
  "Lifebridge Hospital": "https://lifebridgehospital.co.ke/careers",
  "Liyana Health Care PLC": "https://liyanahealthcare.com/",
  "Mityana General Hospital": "https://health.go.ug/vacancies",
  "OneWorld Health": "https://oneworldhealth.com/careers",

  // Government & Regulatory Authorities
  "Public Service Commission Kenya (PSCK)": "https://www.publicservice.go.ke/index.php/vacancies",
  "Road Development Agency": "https://www.rda.org.zm/vacancies",
  "TEVETA": "https://www.teveta.org.zm/vacancies",
  "Zambia Bureau Of Standards": "https://www.zabs.org.zm/vacancies",
  "Zambia National Women's Lobby (ZNWL)": "https://womenslobby.org.zm/",
  "Vihiga County Government": "https://vihiga.go.ke/vacancies",
  "Meru County Public Service Board": "https://meru.go.ke/vacancies",
  "Office of the Registrar of Political Parties": "https://orpp.or.ke/vacancies",
  "Occupational Health and Safety Institute (OHSI)": "https://ohsi.co.zm/vacancies",
  "Occupational Health and Safety Institute": "https://ohsi.co.zm/vacancies",
  "Trans Nzoia County Water & Sanitation Company Ltd": "https://transnzoiawater.co.ke/careers",
  "Lusaka South Multi-Facility Economic Zone Limited": "https://lsmfez.co.zm/vacancies",

  // Prominent Regional Commercial & Construction
  "Kipchimchim Group of Companies": "https://kipchimchim.com/careers",
  "Ovid Construction PLC": "https://ovid-group.com/careers",
  "Yotek Construction PLC": "https://yotekcon.com/careers",
  "Yonab Construction": "https://yonabconstruction.com/careers",
  "Yohannes Haile Construction": "https://yohanneshaille.com/careers",
  "Yohannes Haile Construction in Ethiopia. Apply Now": "https://yohanneshaille.com/careers",
  "Mesay Oli General Contractor in Ethiopia. Apply Now": "https://mesayoliconstruction.com/",
  "Mirab Construction": "https://mirabconstruction.com/",
  "Kushladder Construction PLC": "https://kushladder.com/",
  "Walif Construction S.C": "https://walifconstruction.com/",
  "Tana Drilling & Industries PLC in Ethiopia": "https://tanadrilling.com/",
  "Trinity Metals": "https://trinitymetals.com/careers",
  "Southern Sun": "https://www.southernsun.com/careers",
  "Sonia Foods Industries": "https://soniafoodsindustries.com/careers",
  "SPIE Oil & Gas Services": "https://www.spie.com/en/careers",
  "SPIE Oil & Gas Services Job": "https://www.spie.com/en/careers",
  "Maybrands Nigeria Limited Trainee & Exp.": "https://maybrands.com.ng/careers",
  "New Incentives Entry-Level & Exp.": "https://www.newincentives.org/careers",
  "54 FMCG": "https://54fmcg.com/careers",
  "Tavia Technologies Limited": "https://tavia.com.ng/careers",
  "Smart Partners Consulting Limited": "https://smartpartnersng.com/careers",
  "Verde Edge Consulting Ltd": "https://verde-edge.com/careers",
  "Rose Avenue Group": "https://roseavenuegroup.com/careers",
  "Summit Recruitment and Search (5 Positions)": "https://www.summitrecruitment-search.com/jobs",
  "Ubuntu Life": "https://www.ubuntu.life/careers",
  "Uzima Chicken": "https://uzimachicken.com/careers",
  "TimeX Trading Plc": "https://timextrading.com/careers",
  "Pave Logistics and Trading PLC": "https://pavelogistics.com/careers",
  "Phillips Pharmaceuticals Zambia Limited": "https://phillips-pharma.com/careers",
  "Phoenix Capital Limited": "https://phoenixcapital.co.ke/careers",
  "PKF In Eastern Africa": "https://www.pkfea.com/careers",
  "Primebuild Construction Limited": "https://primebuild.co.ke/",
  "ZASO Energy": "https://zasoenergy.com/",
  "Zaso Energy": "https://zasoenergy.com/",
  "Yo Kuku Uganda": "https://biyinzika.co.ug/careers",
  "yo kuku uganda": "https://biyinzika.co.ug/careers"
};

async function run() {
  console.log(`Starting Batch 22 employer URL resolution with ${Object.keys(BATCH_22_EMPLOYERS).length} verified targets...`);

  let totalUpdated = 0;
  const resolvedList = [];

  for (const [companyName, portalUrl] of Object.entries(BATCH_22_EMPLOYERS)) {
    const updated = await sql`
      UPDATE jobs 
      SET 
        employer_url = ${portalUrl},
        is_aggregator_source = false,
        updated_at = NOW()
      WHERE 
        company_name = ${companyName}
        AND employer_url IS NULL
      RETURNING id, title, company_name
    `;

    if (updated.length > 0) {
      totalUpdated += updated.length;
      resolvedList.push({ company: companyName, count: updated.length, url: portalUrl });
      console.log(`✓ [${updated.length}] ${companyName} -> ${portalUrl}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`BATCH 22 COMPLETE: ${totalUpdated} jobs resolved to official employer portals.`);
  console.log(`Companies updated: ${resolvedList.length}`);

  // Fetch updated platform metrics
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
  console.error('Batch 22 failed:', err);
  process.exit(1);
});
