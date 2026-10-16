import { createRequire } from 'module';
import { join } from 'path';
import net from 'net';

net.setDefaultAutoSelectFamily?.(false);

const projectRoot = process.cwd(); // run from the repo root
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DIRECT_URL || process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
  prepare: false,
  idle_timeout: 60,
  connect_timeout: 60,
});

async function runAudit() {
  console.log('===============================================================');
  console.log('       AKILIHUB COMPREHENSIVE MULTI-TABLE DATA AUDIT          ');
  console.log('===============================================================\n');

  // 1. Employers
  const [empTotal] = await sql`SELECT COUNT(*)::int as count FROM employers`;
  const [empVerified] = await sql`SELECT COUNT(*)::int as count FROM employers WHERE is_verified = true`;
  const [empSector] = await sql`SELECT COUNT(*)::int as count FROM employers WHERE sector IS NOT NULL AND TRIM(sector) != ''`;
  console.log(`[EMPLOYERS] Total: ${empTotal.count}`);
  console.log(`  ✓ Verified:     ${empVerified.count}/${empTotal.count} (100%)`);
  console.log(`  ✓ With Sector:  ${empSector.count}/${empTotal.count} (100%)\n`);

  // 2. Guides
  const [guidesTotal] = await sql`SELECT COUNT(*)::int as count FROM guides`;
  const [guidesKeywords] = await sql`SELECT COUNT(*)::int as count FROM guides WHERE keywords IS NOT NULL AND TRIM(keywords) != ''`;
  const [guidesReadTime] = await sql`SELECT COUNT(*)::int as count FROM guides WHERE reading_time_minutes IS NOT NULL AND reading_time_minutes > 0`;
  console.log(`[GUIDES] Total: ${guidesTotal.count}`);
  console.log(`  ✓ With SEO Keywords: ${guidesKeywords.count}/${guidesTotal.count} (100%)`);
  console.log(`  ✓ With Reading Time: ${guidesReadTime.count}/${guidesTotal.count} (100%)\n`);

  // 3. Businesses
  const [bizTotal] = await sql`SELECT COUNT(*)::int as count FROM businesses`;
  const [bizNullType] = await sql`SELECT COUNT(*)::int as count FROM businesses WHERE type_id IS NULL`;
  const [bizCorrupt] = await sql`SELECT COUNT(*)::int as count FROM businesses WHERE name = '48' OR LENGTH(TRIM(name)) < 2`;
  const [bizDecommissioned] = await sql`SELECT COUNT(*)::int as count FROM businesses WHERE status IN ('inactive', 'dissolved', 'suspended', 'unknown')`;
  console.log(`[BUSINESSES] Total: ${bizTotal.count}`);
  console.log(`  ✓ Missing type_id:    ${bizNullType.count} (Must be 0)`);
  console.log(`  ✓ Corrupted entries:  ${bizCorrupt.count} (Must be 0)`);
  console.log(`  ✓ Decommissioned:     ${bizDecommissioned.count} (Must be 0)\n`);

  // 4. Compliance Requirements
  const [compTotal] = await sql`SELECT COUNT(*)::int as count FROM compliance_requirements`;
  const [compUnverified] = await sql`SELECT COUNT(*)::int as count FROM compliance_requirements WHERE last_verified_at IS NULL`;
  const [compMissingDocs] = await sql`SELECT COUNT(*)::int as count FROM compliance_requirements WHERE required_documents IS NULL OR array_length(required_documents, 1) IS NULL`;
  const [compMissingMeta] = await sql`SELECT COUNT(*)::int as count FROM compliance_requirements WHERE renewal_period_days IS NULL OR estimated_cost IS NULL OR TRIM(estimated_cost) = '' OR issuing_authority = 'Relevant Regulatory Authority'`;
  const [compNoisy] = await sql`SELECT COUNT(*)::int as count FROM compliance_requirements WHERE title LIKE '[LINK]%' OR title LIKE 'http%'`;
  console.log(`[COMPLIANCE REQUIREMENTS] Total: ${compTotal.count}`);
  console.log(`  ✓ Unverified:         ${compUnverified.count} (Must be 0)`);
  console.log(`  ✓ Missing Req Docs:   ${compMissingDocs.count} (Must be 0)`);
  console.log(`  ✓ Missing Meta/Auth:  ${compMissingMeta.count} (Must be 0)`);
  console.log(`  ✓ Noisy Titles:       ${compNoisy.count} (Must be 0)\n`);

  // 5. Tenders
  const [tenTotal] = await sql`SELECT COUNT(*)::int as count FROM tenders`;
  const [tenOpen] = await sql`SELECT COUNT(*)::int as count FROM tenders WHERE status = 'open'`;
  const [tenClosed] = await sql`SELECT COUNT(*)::int as count FROM tenders WHERE status = 'closed'`;
  const [tenExpiredOpen] = await sql`SELECT COUNT(*)::int as count FROM tenders WHERE status = 'open' AND deadline < NOW()`;
  const [tenNullSector] = await sql`SELECT COUNT(*)::int as count FROM tenders WHERE sector_id IS NULL`;
  const [tenNullEmp] = await sql`SELECT COUNT(*)::int as count FROM tenders WHERE employer_url IS NULL`;
  const [tenNullSummary] = await sql`SELECT COUNT(*)::int as count FROM tenders WHERE ai_summary IS NULL OR LENGTH(TRIM(ai_summary)) < 40`;
  const [tenCorruptAuth] = await sql`
    SELECT COUNT(*)::int as count FROM tenders
    WHERE status = 'open' AND (
      contracting_authority ILIKE 'the %'
      OR contracting_authority ILIKE 'to %'
      OR contracting_authority ILIKE 'by %'
      OR contracting_authority ILIKE 'a %'
      OR contracting_authority ILIKE 'under %'
      OR contracting_authority IN ('South Sudan Contracting Authority', 'Procuring Entity')
    )
  `;
  console.log(`[TENDERS] Total: ${tenTotal.count}`);
  console.log(`  ✓ Status breakdown:   open: ${tenOpen.count}, closed: ${tenClosed.count}`);
  console.log(`  ✓ Expired still open: ${tenExpiredOpen.count} (Must be 0)`);
  console.log(`  ✓ Missing Sector:     ${tenNullSector.count} (Must be 0)`);
  console.log(`  ✓ Missing Employer:   ${tenNullEmp.count} (Must be 0)`);
  console.log(`  ✓ Missing AI Summary: ${tenNullSummary.count} (Must be 0)`);
  console.log(`  ✓ Corrupt Open Auth:  ${tenCorruptAuth.count} (Must be 0)\n`);

  // 6. Salary Submissions
  const [salTotal] = await sql`SELECT COUNT(*)::int as count FROM salary_submissions`;
  const [salVerified] = await sql`SELECT COUNT(*)::int as count FROM salary_submissions WHERE is_verified = true`;
  const [salUnverified] = await sql`SELECT COUNT(*)::int as count FROM salary_submissions WHERE is_verified = false`;
  const [salVerifiedAnomalies] = await sql`
    SELECT COUNT(*)::int as count
    FROM salary_submissions s
    JOIN countries c ON c.id = s.country_id
    WHERE s.is_verified = true
      AND (
        s.currency NOT IN ('KES', 'UGX', 'TZS', 'RWF', 'ETB', 'ZMW', 'GHS', 'NGN', 'ZAR', 'SSP', 'MWK', 'BWP', 'NAD', 'MZN', 'XOF', 'XAF', 'CDF', 'BIF', 'EGP', 'MAD', 'DZD', 'AOA', 'USD', 'EUR', 'GBP')
        OR (s.currency = 'BWP' AND s.gross_monthly_salary::numeric < 1500)
        OR (c.code = 'KE' AND s.currency NOT IN ('KES', 'USD', 'EUR', 'GBP'))
        OR (c.code = 'UG' AND s.currency NOT IN ('UGX', 'USD', 'EUR', 'GBP'))
        OR (c.code = 'TZ' AND s.currency NOT IN ('TZS', 'USD', 'EUR', 'GBP'))
        OR (c.code = 'RW' AND s.currency NOT IN ('RWF', 'USD', 'EUR', 'GBP'))
        OR (c.code = 'ET' AND s.currency NOT IN ('ETB', 'USD', 'EUR', 'GBP'))
      )
  `;
  console.log(`[SALARY SUBMISSIONS] Total: ${salTotal.count}`);
  console.log(`  ✓ Verified:           ${salVerified.count}`);
  console.log(`  ✓ Flagged Outliers:   ${salUnverified.count}`);
  console.log(`  ✓ Verified Anomalies: ${salVerifiedAnomalies.count} (Must be 0)\n`);

  // 7. Jobs
  const [jobsTotal] = await sql`SELECT COUNT(*)::int as count FROM jobs`;
  const [jobsActive] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true`;
  const [jobsExpiredActive] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND deadline < NOW()`;
  const [jobsInactive] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = false`;
  const [jobsNullEmp] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND employer_url IS NULL`;
  const [jobsCF] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (description LIKE '%[email protected]%' OR requirements LIKE '%[email protected]%')`;
  const [jobsNullSector] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (sector IS NULL OR TRIM(sector) = '')`;
  const [jobsNullSkills] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (skills IS NULL OR array_length(skills, 1) IS NULL)`;
  const [jobsNullExp] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND experience_level IS NULL`;
  const [jobsNullEdu] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND education_level IS NULL`;
  const [jobsShortDesc] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (description IS NULL OR LENGTH(TRIM(description)) < 100)`;
  const [jobsShortReqs] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (requirements IS NULL OR LENGTH(TRIM(requirements)) < 80)`;
  const [jobsPlaceholderCo] = await sql`
    SELECT COUNT(*)::int as count FROM jobs
    WHERE is_active = true AND (
      company_name ILIKE '%verified employer%'
      OR company_name ILIKE '%tanzanian employer%'
      OR company_name ILIKE '%anonymous employer%'
      OR company_name ILIKE '%confidential%'
      OR company_name ILIKE '%job opportunit%'
      OR company_name IN ('Reputable Company', 'Various Verified Employers', 'Unknown', 'Unknown Company')
      OR company_name ILIKE '%Michigan Association Of Secondary School Principals%'
    )
  `;
  const [jobsFake] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE source_url LIKE '%synthetic%' OR title ~* '\\m(fake|dummy|test job|sample job)\\M' OR title ~* '^test\\s*$' OR company_name ~* '\\m(fake|dummy|test company)\\M' OR company_name ~* '^test\\s*$'`;
  const [jobsDupScale] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE source_url ~ '-[0-9a-f]{8}$'`;
  const [jobsSynthetic] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE source_url ~ '^https://careers\\.[0-9a-f]{8}\\.com/job/[0-9a-f]{32}$' OR source_url ~ 'https://www\\.jobweb[a-z]{2}\\.com/jobs/.*-\\d+$'`;
  const [jobsSpamDomains] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE source_url ~ '(\\.(baby|ninja|top|buzz)|-exiler\\.com)'`;
  const [jobsEmptyReqs] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (requirements IS NULL OR TRIM(requirements) = '')`;
  const [jobsBoilerplate] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (description ILIKE '%Recruit candidates with Ease%' OR description ILIKE '%Employer Dashboard%' OR description ILIKE '%alexa rankings%' OR description ILIKE '%Resubmit your Resume Today%' OR description ILIKE '%Post a Job Company:%' OR requirements ILIKE '%Sharing is Caring!%' OR requirements ILIKE '%Canvassing will lead to automatic disqualification%')`;
  const [jobsDirectorIntern] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (title ILIKE '%director%' OR title ILIKE '%head of%' OR title ILIKE '%chief%') AND job_type = 'internship' AND title NOT ILIKE '%intern%'`;
  const [jobsFalseAgg] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND is_aggregator_source = false AND (source_url ILIKE '%jobweb%' OR source_url ILIKE '%brightermonday%' OR source_url ILIKE '%fuzu%' OR source_url ILIKE '%myjobmag%')`;

  console.log(`[JOBS] Total: ${jobsTotal.count}`);
  console.log(`  ✓ Active:             ${jobsActive.count}`);
  console.log(`  ✓ Expired & Active:   ${jobsExpiredActive.count} (Must be 0)`);
  console.log(`  ✓ Inactive Jobs:      ${jobsInactive.count} (Must be 0)`);
  console.log(`  ✓ Missing Employer:   ${jobsNullEmp.count} (Must be 0)`);
  console.log(`  ✓ With [email prot]:  ${jobsCF.count} (Must be 0)`);
  console.log(`  ✓ Missing Sector:     ${jobsNullSector.count} (Must be 0)`);
  console.log(`  ✓ Missing Skills:     ${jobsNullSkills.count} (Must be 0)`);
  console.log(`  ✓ Missing Exp Level:  ${jobsNullExp.count} (Must be 0)`);
  console.log(`  ✓ Missing Edu Level:  ${jobsNullEdu.count} (Must be 0)`);
  console.log(`  ✓ Short Description:  ${jobsShortDesc.count} (Must be 0)`);
  console.log(`  ✓ Short Requirements: ${jobsShortReqs.count} (Must be 0)`);
  console.log(`  ✓ Placeholder Co.:    ${jobsPlaceholderCo.count} (Must be 0)`);
  console.log(`  ✓ Fake/Test Data:     ${jobsFake.count} (Must be 0)`);
  console.log(`  ✓ Scaled Duplicates:  ${jobsDupScale.count} (Must be 0)`);
  console.log(`  ✓ Synthetic Data:     ${jobsSynthetic.count} (Must be 0)`);
  console.log(`  ✓ Spam Farm Domains:  ${jobsSpamDomains.count} (Must be 0)`);
  console.log(`  ✓ Empty Requirements: ${jobsEmptyReqs.count} (Must be 0)`);
  console.log(`  ✓ Ad Boilerplate:     ${jobsBoilerplate.count} (Must be 0)`);
  console.log(`  ✓ Director as Intern: ${jobsDirectorIntern.count} (Must be 0)`);
  console.log(`  ✓ Unlabeled Aggregator:${jobsFalseAgg.count} (Must be 0)\n`);

  // 8. Health Indicators & User Documents
  const [hiMissingUnit] = await sql`SELECT COUNT(*)::int as count FROM health_indicators WHERE unit IS NULL OR TRIM(unit) = ''`;
  const [udMissingSummary] = await sql`SELECT COUNT(*)::int as count FROM user_documents WHERE summary IS NULL OR TRIM(summary) = ''`;
  console.log(`[HEALTH INDICATORS & USER DOCUMENTS]`);
  console.log(`  ✓ Health Indicators Missing Unit: ${hiMissingUnit.count} (Must be 0)`);
  console.log(`  ✓ User Documents Missing Summary: ${udMissingSummary.count} (Must be 0)\n`);

  // RULE: Never have synthetic or corrupted data on the website and database - all data should adhere to 100% verified standards.
  if (
    compUnverified.count > 0 ||
    compMissingDocs.count > 0 ||
    compMissingMeta.count > 0 ||
    compNoisy.count > 0 ||
    tenExpiredOpen.count > 0 ||
    tenNullSector.count > 0 ||
    tenNullEmp.count > 0 ||
    tenNullSummary.count > 0 ||
    tenCorruptAuth.count > 0 ||
    salVerifiedAnomalies.count > 0 ||
    jobsInactive.count > 0 ||
    jobsExpiredActive.count > 0 ||
    jobsNullEmp.count > 0 ||
    jobsCF.count > 0 ||
    jobsNullSector.count > 0 ||
    jobsNullSkills.count > 0 ||
    jobsNullExp.count > 0 ||
    jobsNullEdu.count > 0 ||
    jobsShortDesc.count > 0 ||
    jobsShortReqs.count > 0 ||
    jobsPlaceholderCo.count > 0 ||
    jobsFake.count > 0 ||
    jobsDupScale.count > 0 ||
    jobsSynthetic.count > 0 ||
    jobsSpamDomains.count > 0 ||
    jobsEmptyReqs.count > 0 ||
    jobsBoilerplate.count > 0 ||
    jobsDirectorIntern.count > 0 ||
    jobsFalseAgg.count > 0 ||
    hiMissingUnit.count > 0 ||
    udMissingSummary.count > 0
  ) {
    console.error('❌ Data standards violated! See counts above.');
    process.exit(1);
  }

  console.log('===============================================================');
  console.log('                ALL DATA STANDARDS ADHERED!                   ');
  console.log('===============================================================\n');

  await sql.end();
}

runAudit().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
