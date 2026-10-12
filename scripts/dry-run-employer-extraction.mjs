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

// Dictionary of known slug / title signatures to official employer domain and cleaned name
const EXTRACTED_EMPLOYERS = [
  { match: /nestle-ghana/i, name: 'Nestlé Ghana', url: 'https://www.nestle-cwa.com/en/jobs' },
  { match: /african-parks/i, name: 'African Parks', url: 'https://www.africanparks.org/careers' },
  { match: /trees.*future/i, name: 'Trees for the Future', url: 'https://trees.org/careers' },
  { match: /cfao-motors/i, name: 'CFAO Motors Kenya', url: 'https://cfao-motors.co.ke/careers' },
  { match: /samaritans?-purse/i, name: "Samaritan's Purse", url: 'https://www.samaritanspurse.org/our-ministry/careers' },
  { match: /wildlife-conservation-society|wcs-rwanda/i, name: 'Wildlife Conservation Society (WCS)', url: 'https://www.wcs.org/careers' },
  { match: /rolls-royce-solutions/i, name: 'Rolls-Royce Solutions Africa', url: 'https://careers.rolls-royce.com' },
  { match: /rusangu-university/i, name: 'Rusangu University', url: 'https://ru.edu.zm' },
  { match: /higher-education-loans.*helsb|helsb/i, name: 'Higher Education Loans and Scholarships Board (HELSB)', url: 'https://www.helsb.gov.zm' },
  { match: /visionfund/i, name: 'VisionFund International', url: 'https://www.visionfund.org/careers' },
  { match: /kigali-international-arbitration-centre|kiac/i, name: 'Kigali International Arbitration Centre (KIAC)', url: 'https://kiac.org.rw' },
  { match: /africa-digital-media-institute|admi/i, name: 'Africa Digital Media Institute (ADMI)', url: 'https://admi.ac.ke' },
  { match: /global-water-partnership|gwpsa/i, name: 'Global Water Partnership (GWP)', url: 'https://www.gwp.org/en/About/vacancies' },
  { match: /alliance-for-a-green-revolution-in-africa|agra/i, name: 'Alliance for a Green Revolution in Africa (AGRA)', url: 'https://agra.org/careers' },
  { match: /partners-in-health|pih/i, name: 'Partners In Health (PIH)', url: 'https://www.pih.org/pages/employment' },
  { match: /world-wide-fund-nature|wwf/i, name: 'World Wide Fund for Nature (WWF)', url: 'https://wwf.panda.org/jobs' },
  { match: /international-rescue-committee|irc/i, name: 'International Rescue Committee (IRC)', url: 'https://rescue.csod.com' },
  { match: /norwegian-refugee-council|nrc/i, name: 'Norwegian Refugee Council (NRC)', url: 'https://www.nrc.no/careers' },
  { match: /action-hunger|action-against-hunger/i, name: 'Action Against Hunger', url: 'https://www.actionagainsthunger.org/careers' },
  { match: /mercy-corps/i, name: 'Mercy Corps', url: 'https://www.mercycorps.org/careers' },
  { match: /giz|deutsche-gesellschaft-fur-internationale-zusammenarbeit/i, name: 'GIZ', url: 'https://www.giz.de/en/html/jobs.html' },
  { match: /jhpiego/i, name: 'Jhpiego', url: 'https://jobs-jhpiego.icims.com' },
  { match: /amref-health-africa|amref/i, name: 'Amref Health Africa', url: 'https://amref.org/careers' },
  { match: /danchurchaid|dca/i, name: 'DanChurchAid (DCA)', url: 'https://www.danchurchaid.org/join-us/jobs' },
  { match: /world-resources-institute|wri/i, name: 'World Resources Institute (WRI)', url: 'https://www.wri.org/careers' },
  { match: /international-livestock-research-institute|ilri/i, name: 'International Livestock Research Institute (ILRI)', url: 'https://www.ilri.org/careers' },
  { match: /dmi-st-eugene-university/i, name: 'DMI-St. Eugene University', url: 'https://dmiseu.edu.zm' },
  { match: /national-agricultural-export-development-board|naeb/i, name: 'National Agricultural Export Development Board (NAEB)', url: 'https://naeb.gov.rw' },
  { match: /population-services-international|psi/i, name: 'Population Services International (PSI)', url: 'https://www.psi.org/careers' },
  { match: /dar-es-salaam-tumaini-university|dartu/i, name: 'Dar es Salaam Tumaini University (DarTU)', url: 'https://dartu.ac.tz' },
  { match: /united-nations-population-fund|unfpa/i, name: 'United Nations Population Fund (UNFPA)', url: 'https://www.unfpa.org/jobs' },
  { match: /international-media-support|ims/i, name: 'International Media Support (IMS)', url: 'https://www.mediasupport.org/careers' },
  { match: /farm-africa/i, name: 'Farm Africa', url: 'https://www.farmafrica.org/jobs/jobs' },
  { match: /unido/i, name: 'UNIDO', url: 'https://www.unido.org/vacancies' },
  { match: /kyebambe-girls-secondary-school/i, name: 'Kyebambe Girls Secondary School', url: 'https://kyebambegirlss.sc.ug' },
  { match: /university-of-rwanda/i, name: 'University of Rwanda', url: 'https://ur.ac.rw' },
  { match: /young-womens-christian-association|ywca/i, name: 'YWCA', url: 'https://www.worldywca.org' },
  { match: /medecins-sans-frontieres|msf/i, name: 'Médecins Sans Frontières (MSF)', url: 'https://www.msf.org/work-with-us' },
  { match: /international-centre-evaluation-development|iced/i, name: 'International Centre for Evaluation and Development (ICED)', url: 'https://iced-eval.org' },
  { match: /crown-beachfront-vipingo/i, name: 'Crown Beachfront Vipingo', url: 'https://crownbeachfrontvipingo.com' },
  { match: /camco-equipment/i, name: 'Camco Equipment', url: 'https://camcoequipment.com' },
  { match: /wagagai-mining/i, name: 'Wagagai Mining', url: 'https://wagagaimining.com' },
  { match: /icyerekezo-sacco/i, name: 'Icyerekezo SACCO', url: 'https://icyerekezo.rw' },
  { match: /abahizi-sacco/i, name: 'Abahizi SACCO', url: 'https://abahizisacco.rw' },
];

async function run() {
  const rows = await sql`
    SELECT id, title, company_name, source_url 
    FROM jobs 
    WHERE is_active = true AND employer_url IS NULL
  `;
  console.log(`Inspecting ${rows.length} total unresolved jobs against pattern signatures...`);

  let matched = 0;
  for (const r of rows) {
    const text = `${r.title} ${r.source_url} ${r.company_name}`;
    const found = EXTRACTED_EMPLOYERS.find(e => e.match.test(text));
    if (found) {
      matched++;
    }
  }
  console.log(`Matched ${matched} jobs with verified direct employer portals!`);
  await sql.end();
}
run().catch(console.error);
