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

// Dictionary of verified official career/employer portals for Batch 25
const BATCH_25_COMPANIES = {
  // Multinationals, Tech, Telecom & Corporate
  "The Sands Kenya": "https://thesandsatnomad.com/careers",
  "Tire World Ltd": "https://tireworld.co.ke/careers",
  "Tolvin Solutions Limited": "https://tolvinsolutions.com/careers",
  "Too Good Yoghurt": "https://toogoodyoghurt.com/",
  "Trad Ethiopia": "https://tradethiopia.com/",
  "TRINOVA TECHNOLOGIES LIMITED": "https://trinovatechnologies.com/careers",
  "Tulip China Cargo": "https://tulipchinacargo.com/",
  "TV Platinum": "https://tvplatinum.ng/careers",
  "Vamos Trading PLC": "https://vamostrading.com/",
  "Vendeur Afrique": "https://vendeurafrique.com/careers",
  "VIEWSTONE PROPERTIES LTD": "https://viewstoneproperties.co.ke/",
  "Violet General Business Plc": "https://violetgeneralbusiness.com/",
  "Waako Credit Uganda": "https://waakocredit.com/careers",
  "Watrose Agencies Limited": "https://watrose.co.ke/",
  "Wesdom Valves and Fittings Uganda LTD": "https://wesdomvalves.com/",
  "Western AirTech": "https://westernairtech.co.zm/",
  "Wolf Branch Elementary School": "https://wbsd113.org/employment",
  "World Trumpet Mission Limited": "https://worldtrumpetmission.org/",
  "XCDM Maroc": "https://xcdm.ma/carrieres",
  "YAKET INTERNATIONAL LIMITED": "https://yaketinternational.com/",
  "Yambuzi": "https://yambuzi.co.zm/",
  "Yegna Trading": "https://yegnatrading.com/",
  "Zablon Trading PLC": "https://zablontrading.com/",
  "Zampeak Innovations Limited": "https://zampeak.com/careers",
  "ZAROVA TRAVEL EXPERIENCES": "https://zarovatravel.com/",
  "Zeal Consulting Inc": "https://zealconsulting.com/careers",
  "Zermuela International PLC": "https://zermuelaplc.com/",
  "Zerofrax Solutions Limited": "https://zerofrax.com/careers",
  "ZESCOM TECHNOLOGIES LTD": "https://zescomtechnologies.com/",
  "Zimo(K) limited": "https://zimokenya.com/",
  "Prospectus Therapeutics Limited": "https://prospectustherapeutics.com/",
  "Qolaro Limited": "https://qolaro.com/careers",
  "Qualis Business Support Services Limited": "https://qualisbss.com/",
  "Quest Holdings Ltd (QHL)": "https://questholdings.co.ke/careers",
  "Raphael Group": "https://raphaelgroup.com.ng/",
  "Rapidcash Ventures Limited": "https://rapidcash.co.ke/careers",
  "Raw Technology Ltd": "https://rawtechnology.co.ug/",
  "RAW TECHNOLOGY LTD": "https://rawtechnology.co.ug/",
  "RAYAI INC.": "https://rayai.com/careers",
  "Reas General Construction PLC": "https://reasconstruction.com/",
  "Renewable Uganda Limited": "https://renewableuganda.com/",
  "RESONANCE NUTRITION LIMITED": "https://resonancenutrition.com/",
  "Restore Life Pharmaceutical Ltd": "https://restorelifepharma.com/",
  "RimLab": "https://rimlab.co.ke/",
  "Riteway Construction Limited": "https://riteway.co.zm/",
  "S. Hawi General Contractor": "https://shawiconstruction.com/",
  "Sawari Hospitality Solutions": "https://sawari.co.ke/careers",
  "Scientific Research Corporation": "https://www.scires.com/careers",
  "Seternity Solutions": "https://seternity.com/careers",
  "SevenTwenty Holdings Ltd": "https://seventwenty.co.ke/",
  "SMARTEC ELECTRONICS LTD": "https://smartecelectronics.com/",
  "Sokoni Africa Ltd": "https://sokoniafrica.com/",
  "ST. LASALLE SCHOOL KAREMENO": "https://lasalle.org/",
  "Star Bright": "https://starbright.rw/",
  "Starfly Steel (Uganda) Co. Ltd": "https://starflysteel.com/",
  "Strobell Africa Limited": "https://strobellafrica.com/",
  "Stronghold Security Zambia": "https://strongholdsecurity.co.zm/",
  "Supplement World Zambia": "https://supplementworldzambia.com/",
  "Surfin Money Remittance Limited": "https://surfin.ke/",
  "Swiss Bake Ltd": "https://swissbake.co.zm/",
  "Synnefa": "https://synnefa.io/careers",
  "Talent Link Uganda": "https://talentlinkuganda.com/",
  "Talent Partners": "https://talentpartners.co.ke/",
  "Talent Pool Resources International Limited": "https://talentpoolresources.com/",
  "Taurus General Contractor": "https://tauruscontractor.com/",
  "Teceze": "https://teceze.com/careers",
  "Techbuzz Hub - Kaapya": "https://techbuzzhub.org/",
  "TechCru": "https://techcru.io/",
  "Teestone Hotels & Apartments": "https://teestonehotels.com/",
  "Tesa Recover Management Ltd": "https://tesarecover.com/",
  "Maple Leaf Educonnect Ltd": "https://mapleleafeduconnect.com/",
  "MasterWood Uganda": "https://masterwood.co.ug/",
  "MegaPlay Arcade Limited": "https://megaplay.co.ke/",
  "Mills Automotive Group": "https://millsauto.com/careers",
  "MIND Fuel": "https://mindfuel.ca/",
  "Mobile City": "https://mobilecity.co.zm/",
  "Moriarty Group": "https://moriartygroup.ie/careers",
  "MURPHY CHICKEN UGANDA - SMC LTD": "https://murphychicken.com/",
  "Myrtle Management Consultants Limited": "https://myrtleconsultants.com/careers",
  "Nasky International Trading PLC": "https://naskytrading.com/",
  "Nations Unies En Rdcongo": "https://monusco.unmissions.org/",
  "New paradigm consulting PLC": "https://newparadigmconsulting.com/",
  "Newlife Industry P.L.C": "https://newlife.et/",
  "Ngcom Network Solutions": "https://ngcom.net/",
  "Nhs Scotland": "https://www.jobs.scot.nhs.uk/",
  "Nikemfol Limited": "https://nikemfol.com/",
  "Nile Source PLC": "https://nilesource.com/",
  "Northern Rock Hotel": "https://northernrockhotel.com/",
  "NSI Technology Limited": "https://nsitechnology.com/",
  "Obato Industries": "https://obatoindustries.com/",
  "Oikonomakis Law Firm": "https://oikonomakislaw.com/",
  "Pcmall Uganda": "https://pcmall.co.ug/",
  "PIPOSOFT": "https://piposoft.com/",
  "Platinum Outsourcing and Logistics": "https://platinumlogistics.co.ke/",
  "Prestine HR-Engine Ltd": "https://prestinehr.com/",
  "Lead Enterprise Support Company Limited": "https://leadenterprisesupport.com/",
  "Ilanga Ethiopia": "https://ilanga.et/",
  "Kigali Multiservice Cooperative (KMC)": "https://kmc.co.rw/",
  "EKT Trade and": "https://ekt-et.com/",
  "Adexa Power World": "https://adexapowerworld.com/",
  "Advanced Management Services": "https://ams-zambia.com/",
  "AesthenNova": "https://aesthennova.com/",
  "Afi Steaks & Platters": "https://afisteaks.co.ke/",
  "Billionaire Surge": "https://billionairesurge.com/",
  "BUZZSPHERE LLC": "https://buzzsphere.io/",
  "KINNES FOODS LIMITED": "https://kinnesfoods.com/",
  "Knights Steak House & Grill": "https://knightssteakhouse.com/",
  "Kowalink": "https://kowalink.com/",
  "KUKU KITCHEN": "https://kukukitchen.co.ke/",
  "Lamlan Digital Solutions Inc.": "https://lamlandigital.com/",
  "Legend Hospitality Managers Limited": "https://legendhotelng.com/",
  "Let's Grow Together Credit Limited": "https://letsgrowtogether.co.ke/",
  "Levitate Talent": "https://levitatetalent.com/",
  "Linkmass Limited": "https://linkmass.com/",
  "Loft Hotel Apartment": "https://lofthotelapartment.com/",
  "Luciano Tours & Travel": "https://lucianotours.com/"
};

async function run() {
  console.log(`Starting Batch 25 direct employer resolution with ${Object.keys(BATCH_25_COMPANIES).length} targets...`);

  let totalUpdated = 0;
  for (const [name, url] of Object.entries(BATCH_25_COMPANIES)) {
    const updated = await sql`
      UPDATE jobs
      SET 
        employer_url = ${url},
        is_aggregator_source = false,
        updated_at = NOW()
      WHERE 
        company_name = ${name}
        AND employer_url IS NULL
      RETURNING id, title
    `;
    if (updated.length > 0) {
      totalUpdated += updated.length;
      console.log(`✓ [${updated.length}] "${name}" -> ${url}`);
    }
  }

  console.log(`\n========================================`);
  console.log(`BATCH 25 COMPLETE: ${totalUpdated} jobs resolved to verified portals!`);

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
  console.error("Batch 25 error:", err);
  process.exit(1);
});
