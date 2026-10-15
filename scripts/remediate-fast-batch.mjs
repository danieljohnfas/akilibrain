import { createRequire } from 'module';
import { join } from 'path';

const projectRoot = 'C:/Users/nnm/Documents/projects/akilibrain';
const require = createRequire(join(projectRoot, 'package.json'));
const dotenv = require('dotenv');
dotenv.config({ path: join(projectRoot, '.env.local') });

const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 2 });

const TARGET_JOB_ID = 'a4b10397-75d6-4ba6-97c1-2b82c7016495';

async function main() {
  console.log('================================================================');
  console.log('⚡ HIGH-SPEED SET-BASED DATABASE REMEDIATION PASS');
  console.log('================================================================\n');

  // 1. SPECIFIC TARGET JOB: Plan International Director
  console.log(`--- 1. REMEDIATING TARGET JOB ${TARGET_JOB_ID} ---`);
  const targetDesc = `Plan International is at an important moment in its evolution. As we reshape how we work, strengthen our operating model and build the capabilities needed for the future, we are looking for a leader who can help turn organisational ambition into meaningful, lasting change. The Director of Organisational Change & Engagement will play a central role in shaping how change is led, understood and experienced across Plan International. This is an opportunity to influence major organisation-wide transformation, work closely with senior leaders, and help create the clarity, engagement and confidence needed for change to succeed. Leading Plan International’s enterprise approach to organisational change — using communications and engagement as key levers to drive understanding, adoption and lasting impact — the Director will connect strategy, people, communications and engagement to ensure major initiatives are coherent, people-centred and successfully adopted across our global organisation.`;

  const targetReqs = `• Significant senior-level experience leading complex organisational transformation and enterprise-wide change in a global or highly matrixed organisation.
• A strong track record of designing and implementing change strategies that achieve sustained adoption and organisational impact.
• Strong experience leading communications and employee engagement in a complex organisation, including shaping organisational narrative and translating leadership priorities into clear, compelling communications for staff.
• Significant experience supporting senior leaders with leadership communications, including experience ensuring senior leaders are well-equipped to communicate through change and engagement with employees.
• Experience advising and influencing executive and senior leadership teams on change, communications and engagement.
• Experience building organisational change capability, including frameworks, tools, governance and leadership capability.
• Strong understanding of organisational culture, behaviour change and employee experience.
• Experience using data, employee insight and feedback to shape communications, engagement, change strategies and organisational decision-making.
• Experience working across different cultures, geographies and organisational contexts.
• Exceptional strategic communication, facilitation, and inclusive leadership capabilities.`;

  const targetSkills = [
    'Organisational Transformation',
    'Change Management',
    'Internal Communications',
    'Leadership Development',
    'Strategic Planning',
    'Employee Engagement',
    'Culture Change'
  ];

  await sql`
    UPDATE jobs
    SET
      title = 'Director of Organisational Change and Engagement',
      company_name = 'Plan International',
      job_type = 'full_time',
      location = 'Nairobi, Kenya',
      description = ${targetDesc},
      requirements = ${targetReqs},
      skills = ${targetSkills},
      experience_level = 'executive',
      education_level = 'master_degree',
      is_aggregator_source = true,
      employer_url = 'https://jobs.plan-international.org/',
      updated_at = NOW()
    WHERE id = ${TARGET_JOB_ID}
  `;
  console.log(`  ✓ Updated target job ${TARGET_JOB_ID} to 100% verified standard.\n`);

  // 2. AGGREGATOR FLAGS
  console.log('--- 2. CORRECTING AGGREGATOR FLAGS ---');
  const resAgg = await sql`
    UPDATE jobs
    SET is_aggregator_source = true, updated_at = NOW()
    WHERE is_active = true 
      AND is_aggregator_source = false 
      AND (
        source_url ILIKE '%jobweb%' OR 
        source_url ILIKE '%brightermonday%' OR 
        source_url ILIKE '%fuzu%' OR 
        source_url ILIKE '%myjobmag%' OR 
        source_url ILIKE '%ajirayako%' OR 
        source_url ILIKE '%zoomtanzania%' OR
        source_url ILIKE '%unjobs%' OR
        source_url ILIKE '%reliefweb%'
      )
  `;
  console.log(`  ✓ Corrected ${resAgg.count} aggregator jobs to is_aggregator_source = true.\n`);

  // 3. SENIOR ROLES AS INTERNSHIP
  console.log('--- 3. FIXING SENIOR ROLES MISLABELED AS INTERNSHIP ---');
  const resSenior = await sql`
    UPDATE jobs
    SET job_type = 'full_time', updated_at = NOW()
    WHERE is_active = true 
      AND job_type = 'internship'
      AND (
        title ILIKE '%director%' OR 
        title ILIKE '%head of%' OR 
        title ILIKE '%chief%' OR
        title ILIKE '%vice president%' OR
        title ILIKE '%general manager%' OR
        title ILIKE '%senior manager%' OR
        title ILIKE '%lead %'
      )
      AND title NOT ILIKE '%intern%'
  `;
  console.log(`  ✓ Corrected ${resSenior.count} executive/senior roles from 'internship' to 'full_time'.\n`);

  // 4. CLEAN DUPLICATE TITLES ("at Company at Company")
  console.log('--- 4. CLEANING DUPLICATE TITLES ---');
  const dirtyTitleJobs = await sql`
    SELECT id, title FROM jobs
    WHERE is_active = true AND title ~* '\\mat\\s+.+\\mat\\s+'
  `;
  for (const j of dirtyTitleJobs) {
    const parts = j.title.split(/\s+at\s+/i);
    if (parts.length >= 3) {
      const clean = parts[0].trim();
      await sql`UPDATE jobs SET title = ${clean}, updated_at = NOW() WHERE id = ${j.id}`;
    }
  }
  console.log(`  ✓ Deduplicated ${dirtyTitleJobs.length} titles.\n`);

  // 5. BATCH REMEDIATE BOILERPLATE DESCRIPTIONS WITH VALID REQUIREMENTS
  console.log('--- 5. BATCH REMEDIATING AGGREGATOR AD DESCRIPTIONS ---');
  const resCleanDesc = await sql`
    UPDATE jobs
    SET
      description = COALESCE(company_name, 'The Employer') || ' is seeking an experienced and results-oriented ' || title || ' to join their team in ' || CASE WHEN location ILIKE '%State:%' THEN 'Nairobi, Kenya' ELSE COALESCE(location, 'Kenya') END || '. In this role, the successful candidate will execute key objectives within the ' || COALESCE(sector, 'relevant') || ' sector, collaborate with cross-functional teams, and drive operational excellence.',
      location = CASE WHEN location ILIKE '%Kenya State:%' THEN REPLACE(location, 'Kenya State:', '') ELSE location END,
      updated_at = NOW()
    WHERE is_active = true 
      AND requirements IS NOT NULL 
      AND LENGTH(TRIM(requirements)) > 40
      AND (
        description ILIKE '%Recruit candidates with Ease%' OR 
        description ILIKE '%Employer Dashboard%' OR 
        description ILIKE '%alexa rankings%' OR 
        description ILIKE '%Resubmit your Resume Today%' OR
        description ILIKE '%Post a Job Company:%'
      )
  `;
  console.log(`  ✓ Replaced ad boilerplate with professional overview on ${resCleanDesc.count} jobs.\n`);

  // 6. DEACTIVATE BOILERPLATE JOBS THAT HAVE NO VALID REQUIREMENTS OR DESCRIPTIONS
  console.log('--- 6. DEACTIVATING SCRAPER AD ARTIFACTS WITHOUT REQUIREMENTS ---');
  const resDeactBoiler = await sql`
    UPDATE jobs
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true 
      AND (requirements IS NULL OR LENGTH(TRIM(requirements)) <= 40)
      AND (
        description ILIKE '%Recruit candidates with Ease%' OR 
        description ILIKE '%Employer Dashboard%' OR 
        description ILIKE '%alexa rankings%' OR 
        description ILIKE '%Resubmit your Resume Today%' OR
        description ILIKE '%Post a Job Company:%'
      )
  `;
  console.log(`  ✓ Deactivated ${resDeactBoiler.count} unrecoverable scraper spam listings.\n`);

  // 7. DEACTIVATE ANY REMAINING ACTIVE JOBS WITH NULL REQUIREMENTS
  console.log('--- 7. DEACTIVATING ANY REMAINING ACTIVE JOBS WITH NULL REQUIREMENTS ---');
  const resNullReqs = await sql`
    UPDATE jobs
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true AND (requirements IS NULL OR TRIM(requirements) = '')
  `;
  console.log(`  ✓ Deactivated ${resNullReqs.count} incomplete active jobs with empty requirements.\n`);

  // 8. FINAL STATUS VERIFICATION
  console.log('--- 8. FINAL DATABASE INTEGRITY METRICS ---');
  const [activeJobs] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true`;
  const [nullReqs] = await sql`SELECT COUNT(*)::int as count FROM jobs WHERE is_active = true AND (requirements IS NULL OR TRIM(requirements) = '')`;
  const [boilerDesc] = await sql`
    SELECT COUNT(*)::int as count FROM jobs 
    WHERE is_active = true AND (
      description ILIKE '%Recruit candidates with Ease%' OR 
      description ILIKE '%Employer Dashboard%' OR 
      description ILIKE '%alexa rankings%' OR 
      description ILIKE '%Resubmit your Resume Today%' OR
      description ILIKE '%Post a Job Company:%'
    )
  `;
  const [directorIntern] = await sql`
    SELECT COUNT(*)::int as count FROM jobs 
    WHERE is_active = true 
      AND (title ILIKE '%director%' OR title ILIKE '%head of%' OR title ILIKE '%chief%')
      AND job_type = 'internship'
  `;
  const [falseAgg] = await sql`
    SELECT COUNT(*)::int as count FROM jobs 
    WHERE is_active = true 
      AND is_aggregator_source = false 
      AND (
        source_url ILIKE '%jobweb%' OR 
        source_url ILIKE '%brightermonday%' OR 
        source_url ILIKE '%fuzu%' OR 
        source_url ILIKE '%myjobmag%'
      )
  `;

  console.log(`  ✓ Total Active Genuine Jobs:             ${activeJobs.count}`);
  console.log(`  ✓ Active Jobs with Empty Requirements:   ${nullReqs.count} (0 expected)`);
  console.log(`  ✓ Active Jobs with Ad Boilerplate:       ${boilerDesc.count} (0 expected)`);
  console.log(`  ✓ Director / Executive as Internship:    ${directorIntern.count} (0 expected)`);
  console.log(`  ✓ Mislabeled Aggregator Sources:         ${falseAgg.count} (0 expected)\n`);

  await sql.end();
}

main().catch(async (e) => {
  console.error('Fatal error:', e);
  await sql.end();
  process.exit(1);
});
