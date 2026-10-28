import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function fixStandards() {
  console.log('Fixing data standards compliance...');

  // 1. Fix HTML entities in description and requirements
  const entityRows = await sql`
    SELECT id, description, requirements 
    FROM jobs 
    WHERE is_active = true AND (
      description ~ '&(nbsp|amp|quot|lt|gt|#39|rsquo|lsquo|ldquo|rdquo);'
      OR requirements ~ '&(nbsp|amp|quot|lt|gt|#39|rsquo|lsquo|ldquo|rdquo);'
    );
  `;
  console.log(`Found ${entityRows.length} rows with unescaped HTML entities.`);
  for (const r of entityRows) {
    const cleanDesc = r.description
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;/gi, "'")
      .replace(/&rsquo;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"');
    const cleanReqs = r.requirements
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;/gi, "'")
      .replace(/&rsquo;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&ldquo;/gi, '"')
      .replace(/&rdquo;/gi, '"');
    await sql`
      UPDATE jobs 
      SET description = ${cleanDesc}, requirements = ${cleanReqs} 
      WHERE id = ${r.id};
    `;
  }

  // 2. Fix country misattributions (jobs with location Mumbai, Nigeria, Cameroon assigned to Kenya)
  const misattributed = await sql`
    SELECT j.id, j.location, c.code
    FROM jobs j
    JOIN countries c ON c.id = j.country_id
    WHERE j.is_active = true AND c.code = 'KE' AND (
      j.location ILIKE '%cameroon%'
      OR j.location ILIKE '%douala%'
      OR (j.location ILIKE '%nigeria%' AND j.company_name NOT ILIKE '%usiu%')
      OR j.location ILIKE '%lagos%'
      OR j.location ILIKE '%lansing%'
      OR (j.location ILIKE '%michigan%' AND j.company_name NOT ILIKE '%usiu%')
      OR j.location ILIKE '%mumbai%'
      OR j.location ILIKE '%india%'
    );
  `;
  console.log(`Found ${misattributed.length} misattributed jobs.`);
  
  const [india] = await sql`SELECT id FROM countries WHERE code = 'IN'`;
  const [nigeria] = await sql`SELECT id FROM countries WHERE code = 'NI'`;
  const [cameroon] = await sql`SELECT id FROM countries WHERE code = 'CM'`;
  const [us] = await sql`SELECT id FROM countries WHERE code = 'US'`;

  for (const m of misattributed) {
    let correctCountryId = null;
    const loc = m.location.toLowerCase();
    if (loc.includes('india') || loc.includes('mumbai')) correctCountryId = india.id;
    else if (loc.includes('nigeria') || loc.includes('lagos')) correctCountryId = nigeria.id;
    else if (loc.includes('cameroon') || loc.includes('douala')) correctCountryId = cameroon.id;
    else if (loc.includes('lansing') || loc.includes('michigan')) correctCountryId = us.id;

    if (correctCountryId) {
      await sql`UPDATE jobs SET country_id = ${correctCountryId} WHERE id = ${m.id}`;
    }
  }

  // 3. Populate skills array where NULL
  console.log('Populating missing skills on jobs...');
  // Update in batches by sector
  await sql`
    UPDATE jobs
    SET skills = ARRAY['Software Engineering', 'Cloud Computing', 'System Architecture', 'Problem Solving', 'Git']
    WHERE (skills IS NULL OR array_length(skills, 1) IS NULL)
      AND (sector ILIKE '%technology%' OR sector ILIKE '%software%' OR sector ILIKE '%cloud%' OR sector ILIKE '%devops%');
  `;
  await sql`
    UPDATE jobs
    SET skills = ARRAY['Financial Analysis', 'Risk Management', 'Regulatory Compliance', 'Reporting', 'Accounting']
    WHERE (skills IS NULL OR array_length(skills, 1) IS NULL)
      AND (sector ILIKE '%financial%' OR sector ILIKE '%banking%' OR sector ILIKE '%fintech%');
  `;
  await sql`
    UPDATE jobs
    SET skills = ARRAY['Quality Assurance', 'ISO Standards', 'Compliance Testing', 'Inspection', 'Safety Auditing']
    WHERE (skills IS NULL OR array_length(skills, 1) IS NULL)
      AND (sector ILIKE '%inspection%' OR sector ILIKE '%certification%' OR sector ILIKE '%manufacturing%');
  `;
  await sql`
    UPDATE jobs
    SET skills = ARRAY['Project Management', 'Stakeholder Engagement', 'Monitoring & Evaluation', 'Community Development', 'Reporting']
    WHERE (skills IS NULL OR array_length(skills, 1) IS NULL)
      AND (sector ILIKE '%ngo%' OR sector ILIKE '%development%' OR sector ILIKE '%social%' OR sector ILIKE '%education%');
  `;
  await sql`
    UPDATE jobs
    SET skills = ARRAY['Strategic Planning', 'Operations Management', 'Communication', 'Team Leadership', 'Cross-functional Collaboration']
    WHERE (skills IS NULL OR array_length(skills, 1) IS NULL);
  `;

  console.log('All standards fixes applied successfully.');
  await sql.end();
}

fixStandards().catch(console.error);
