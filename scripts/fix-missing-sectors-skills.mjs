import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function fixJobs() {
  console.log('Fixing active jobs with missing sector or skills...');
  
  const jobs = await sql`
    SELECT id, title, description, sector, skills 
    FROM jobs 
    WHERE is_active = true AND (sector IS NULL OR TRIM(sector) = '' OR skills IS NULL OR array_length(skills, 1) IS NULL)
  `;
  
  console.log(`Found ${jobs.length} jobs to fix.`);
  
  for (const job of jobs) {
    const text = `${job.title} ${job.description || ''}`.toLowerCase();
    let sector = job.sector;
    if (!sector || !sector.trim()) {
      if (text.includes('software') || text.includes('developer') || text.includes('engineer') || text.includes('data') || text.includes('tech') || text.includes('it ') || text.includes('network')) {
        sector = 'Technology';
      } else if (text.includes('account') || text.includes('finance') || text.includes('bank') || text.includes('audit')) {
        sector = 'Finance & Banking';
      } else if (text.includes('health') || text.includes('nurse') || text.includes('doctor') || text.includes('medic') || text.includes('clinic')) {
        sector = 'Healthcare';
      } else if (text.includes('teach') || text.includes('school') || text.includes('lecturer') || text.includes('educat')) {
        sector = 'Education';
      } else if (text.includes('farm') || text.includes('agri') || text.includes('crop')) {
        sector = 'Agriculture';
      } else if (text.includes('ngo') || text.includes('un ') || text.includes('humanitarian') || text.includes('community')) {
        sector = 'NGO & Development';
      } else if (text.includes('sales') || text.includes('marketing') || text.includes('business dev')) {
        sector = 'Sales & Marketing';
      } else {
        sector = 'Services';
      }
    }
    
    let skills = job.skills;
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      if (sector === 'Technology') {
        skills = ['Problem Solving', 'Technical Proficiency', 'Software Development'];
      } else if (sector === 'Finance & Banking') {
        skills = ['Financial Analysis', 'Accounting', 'Attention to Detail'];
      } else if (sector === 'Healthcare') {
        skills = ['Patient Care', 'Medical Knowledge', 'Communication'];
      } else if (sector === 'Education') {
        skills = ['Teaching', 'Curriculum Planning', 'Classroom Management'];
      } else if (sector === 'Sales & Marketing') {
        skills = ['Sales Strategy', 'Customer Relations', 'Communication'];
      } else {
        skills = ['Communication', 'Teamwork', 'Organization'];
      }
    }
    
    await sql`UPDATE jobs SET sector = ${sector}, skills = ${skills}, updated_at = NOW() WHERE id = ${job.id}`;
  }
  
  console.log('Successfully fixed all jobs!');
  await sql.end();
}

fixJobs().catch(async (e) => {
  console.error(e);
  await sql.end();
  process.exit(1);
});
