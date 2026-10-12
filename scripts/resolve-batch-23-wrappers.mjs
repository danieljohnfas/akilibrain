import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'c:/Users/nnm/Documents/projects/akilihub';
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
});

// Definitions for exact URL slug pattern to real employer name and career URL
const PATTERNS = [
  // Kenya
  { regex: /international-livestock-research-institute-ilri/i, name: "International Livestock Research Institute (ILRI)", url: "https://www.ilri.org/careers" },
  { regex: /green-wells-energies-limited/i, name: "Green Wells Energies", url: "https://greenwellsenergies.com/" },
  { regex: /kenya-institute-management-kim/i, name: "Kenya Institute of Management (KIM)", url: "https://kim.ac.ke/vacancies" },
  { regex: /international-centre-evaluation-development-iced/i, name: "International Centre for Evaluation and Development (ICED)", url: "https://iced-eval.org/" },
  { regex: /cabi-centre-agriculture-biosciences-international/i, name: "CABI", url: "https://www.cabi.org/careers/" },
  { regex: /danchurchaid-dca/i, name: "DanChurchAid (DCA)", url: "https://www.danchurchaid.org/" },
  { regex: /christian-blind-mission-cbm/i, name: "Christian Blind Mission (CBM)", url: "https://www.cbm.org/careers" },
  { regex: /kenya-leather-development-council-kldc/i, name: "Kenya Leather Development Council (KLDC)", url: "https://leathercouncil.go.ke/vacancies" },
  { regex: /cimmyt-world-agroforestry-centre-icraf/i, name: "World Agroforestry (ICRAF) / CIMMYT", url: "https://www.worldagroforestry.org/careers" },
  { regex: /kca-university-kcau/i, name: "KCA University", url: "https://www.kcau.ac.ke/careers" },
  { regex: /africa-management-solutions-limited-amsol/i, name: "Africa Management Solutions Limited (AMSOL)", url: "https://amsol.co.ke/" },
  { regex: /kuehne-nagel/i, name: "Kuehne+Nagel", url: "https://jobs.kuehne-nagel.com/" },
  { regex: /british-american-tobacco-bat/i, name: "British American Tobacco (BAT)", url: "https://careers.bat.com/" },
  { regex: /gertrudes-childrens-hospital/i, name: "Gertrude's Children's Hospital", url: "https://gerties.org/careers/" },
  { regex: /international-committee-red-cross-icrc/i, name: "International Committee of the Red Cross (ICRC)", url: "https://careers.icrc.org/" },
  { regex: /cfao-motors-kenya-limited/i, name: "CFAO Motors Kenya", url: "https://cfaogroup.com/en/careers/" },
  { regex: /dla-piper-africa-kenya-ikm-advocates/i, name: "DLA Piper Africa (IKM Advocates)", url: "https://www.dlapiperafrica.com/en/kenya" },
  { regex: /global-alliance-improved-nutrition-gain/i, name: "Global Alliance for Improved Nutrition (GAIN)", url: "https://www.gainhealth.org/careers" },
  { regex: /wwf-international-world-wide-fund-nature-wwf-kenya/i, name: "WWF Kenya", url: "https://www.wwfkenya.org/careers/" },
  { regex: /institute-software-technologies-limited-ist/i, name: "Institute of Software Technologies (IST)", url: "https://www.istinstitute.co.ke/" },
  { regex: /rift-valley-technical-training-institute/i, name: "Rift Valley Technical Training Institute (RVTTI)", url: "https://rvtti.ac.ke/vacancies" },
  { regex: /equity-afia/i, name: "Equity Afia", url: "https://equityafia.co.ke/careers/" },
  { regex: /sun-king-formerly-greenlight-planet/i, name: "Sun King", url: "https://sunking.com/careers/" },
  { regex: /aga-khan-education-service-kenya-akesk/i, name: "Aga Khan Education Service Kenya", url: "https://www.agakhanschools.org/careers" },

  // Rwanda
  { regex: /united-african-institute-of-technology-uait/i, name: "United African Institute of Technology (UAIT)", url: "https://uait.ac.rw/" },
  { regex: /rwanda-convention-bureau-rcb/i, name: "Rwanda Convention Bureau (RCB)", url: "https://www.rcb.rw/careers" },
  { regex: /partners-in-health-inshuti-mu-buzima-pih/i, name: "Partners In Health (PIH Rwanda)", url: "https://www.pih.org/careers" },
  { regex: /university-of-rwanda-holdings-group-limited-ur-hg-ltd/i, name: "University of Rwanda Holdings Group", url: "https://urhg.rw/" },
  { regex: /university-of-global-health-equity-ughe/i, name: "University of Global Health Equity (UGHE)", url: "https://ughe.org/careers/" },
  { regex: /abahizi-sacco-ngoma-asn/i, name: "Abahizi SACCO Ngoma", url: "https://abahizisacco.rw/" },
  { regex: /rwanda-institute-for-conservation-agriculture-rica/i, name: "Rwanda Institute for Conservation Agriculture (RICA)", url: "https://www.rica.rw/careers/" },
  { regex: /korea-international-cooperation-agency-koica/i, name: "KOICA Rwanda", url: "https://www.koica.go.kr/" },
  { regex: /icyerekezo-sacco-nyarugenge-isn/i, name: "Icyerekezo SACCO Nyarugenge", url: "https://icyerekezosacco.rw/" },
  { regex: /pro-femmes-twese-hamwe-pfth/i, name: "Pro-Femmes / Twese Hamwe", url: "https://profemmes.org/" },
  { regex: /the-pharo-foundation-the-foundation/i, name: "The Pharo Foundation", url: "https://www.pharofoundation.org/careers" },
  { regex: /clinton-health-access-initiative-chai/i, name: "Clinton Health Access Initiative (CHAI)", url: "https://www.clintonhealthaccess.org/careers/" },

  // Uganda
  { regex: /kyebambe-girls-secondary-school/i, name: "Kyebambe Girls Secondary School", url: "https://kyebambegirls.sc.ug/" },
  { regex: /wagagai-mining-u-ltd-wgg/i, name: "Wagagai Mining (U) Ltd", url: "https://wagagai.com/" },
  { regex: /branch-manager-united-bank-africa-uba/i, name: "United Bank for Africa (UBA) Uganda", url: "https://www.ubagroup.com/careers/" },
  { regex: /mengo-school-science-technology-messt/i, name: "Mengo School of Science & Technology", url: "https://mengo.ac.ug/" },
  { regex: /girls-not-brides-uganda-gnbu/i, name: "Girls Not Brides Uganda", url: "https://www.girlsnotbrides.org/careers" },
  { regex: /nile-vocational-institute-nvi/i, name: "Nile Vocational Institute (NVI)", url: "https://nvi.ac.ug/" },
  { regex: /national-anti-doping-organization-nado/i, name: "National Anti-Doping Organization (NADO)", url: "https://nado.ug/" },
  { regex: /infectious-diseases-institute-idi/i, name: "Infectious Diseases Institute (IDI)", url: "https://idi.mak.ac.ug/careers" },
  { regex: /norwegian-refugee-council-uganda/i, name: "Norwegian Refugee Council (NRC) Uganda", url: "https://www.nrc.no/careers" },
  { regex: /grant-thornton-norwegian-refugee-council/i, name: "Grant Thornton Uganda", url: "https://www.grantthornton.co.ug/careers" },
  { regex: /uganda-airlines/i, name: "Uganda Airlines", url: "https://ugandairlines.com/careers" },
  { regex: /uganda-post-limited-t-aposta-uganda/i, name: "Posta Uganda", url: "https://www.ugapost.co.ug/" },
  { regex: /greenhouse-gas-management-institute-ghgmi/i, name: "Greenhouse Gas Management Institute (GHGMI)", url: "https://ghginstitute.org/careers/" },

  // Zambia
  { regex: /industrial-development-corporation-idc-limited/i, name: "Industrial Development Corporation (IDC Limited)", url: "https://www.idc.co.zm/vacancies" },
  { regex: /undikumbukire-project-zambia/i, name: "UP Zambia (Undikumbukire Project)", url: "https://www.upzambia.org/" },

  // Ethiopia
  { regex: /teklehaimanot-general-hospital-ethiopia/i, name: "Teklehaimanot General Hospital", url: "https://teklehaimanothospital.com/" },
  { regex: /oromia-international-bank-s-c-ethiopia/i, name: "Oromia International Bank", url: "https://oromiabank.com/vacancies" },
  { regex: /bunna-international-bank-s-c-oromia-insurance/i, name: "Bunna International Bank", url: "https://bunnabanksc.com/careers" },
  { regex: /unilever-ethiopia/i, name: "Unilever Ethiopia", url: "https://careers.unilever.com/" },
  { regex: /ilu-women-children-integrated-development-association-iwcida/i, name: "IWCIDA Ethiopia", url: "https://iwcida.org/" },
  { regex: /mesay-oli-general-contractor-ethiopia/i, name: "Mesay Oli General Contractor", url: "https://mesayoliconstruction.com/" },
  { regex: /international-organization-migration-bgi-ethiopia/i, name: "IOM - UN Migration Agency", url: "https://www.iom.int/careers" },
  { regex: /frontieri-consult-p-l-c-ethiopia/i, name: "Frontieri Consult", url: "https://frontieri.com/careers" },
  { regex: /derba-midroc-cement-plc-ethiopia/i, name: "Derba MIDROC Cement PLC", url: "https://derbamidroc.com/" },
  { regex: /beaeka-general-business-plc/i, name: "BEAEKA General Business PLC", url: "https://beaeka.com/careers" },
  { regex: /get-international-plc-medecins-sans-frontieres/i, name: "Get-As International PLC", url: "https://getasinternational.com/" },
  { regex: /kerchanshe-trading-plc-ethiopia/i, name: "Kerchanshe Trading PLC", url: "https://kerchanshe.com/careers" },
  { regex: /management-science-health-msh-ethiopia/i, name: "Management Sciences for Health (MSH)", url: "https://www.msh.org/careers/" },
  { regex: /samket-engineering-construction-plc-ethiopia/i, name: "SAMKET Engineering & Construction PLC", url: "https://samketconstruction.com/" },
  { regex: /united-beverages-share-company-ethiopia/i, name: "United Beverages Share Company", url: "https://unitedbeverages.et/careers" },
  { regex: /deutsche-gesellschaft-fur-internationale-zusammenarbeit-giz-gmbh/i, name: "Deutsche Gesellschaft für Internationale Zusammenarbeit (GIZ)", url: "https://www.giz.de/en/jobs.html" },
  { regex: /dugda-childrens-family-charitable-organization/i, name: "Dugda Children's & Family Charitable Organization", url: "https://dugdachildren.org/" },

  // Nigeria
  { regex: /dangote-cement-plc/i, name: "Dangote Cement PLC", url: "https://www.dangote.com/careers/" },
  { regex: /independent-nat.*election/i, name: "Independent National Electoral Commission (INEC)", url: "https://www.inecnigeria.org/" },
  { regex: /stratostaff-6-positions/i, name: "Stratostaff", url: "https://stratostaff.co.ke/careers" },
  { regex: /sbm-bank-9-positions/i, name: "SBM Bank Kenya", url: "https://www.sbmbank.co.ke/careers" },
  { regex: /milestone-institute-medical-health-sciences/i, name: "Milestone Institute of Medical & Health Sciences", url: "https://milestoneinstitute.ac.ke/" },
  { regex: /kibish-construction/i, name: "Kibish Construction", url: "https://kibishconstruction.com/careers" },
  { regex: /avocado-virtual/i, name: "Avocado Virtual Solutions", url: "https://avocadovirtual.com/" },
  { regex: /smart-partners-consulting/i, name: "Smart Partners Consulting Limited", url: "https://smartpartnersng.com/careers" }
];

async function run() {
  console.log("Starting Batch 23: Resolving generic wrapper category jobs...");

  const candidateJobs = await sql`
    SELECT id, title, company_name, source_url
    FROM jobs
    WHERE 
      is_active = true 
      AND employer_url IS NULL
  `;

  console.log(`Scanning ${candidateJobs.length} unresolved jobs against pattern dictionary...`);
  let updatedCount = 0;

  for (const job of candidateJobs) {
    const url = job.source_url || '';
    const title = job.title || '';
    const textToMatch = `${url} ${title}`;

    for (const pat of PATTERNS) {
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
        updatedCount++;
        console.log(`✓ [${job.id}] "${job.title}" -> ${pat.name} (${pat.url})`);
        break;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`BATCH 23 COMPLETE: ${updatedCount} jobs resolved and upgraded!`);

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
  console.error("Batch 23 error:", err);
  process.exit(1);
});
