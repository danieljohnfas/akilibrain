/**
 * Cloudflare D1 Cold Tier Client
 * Resolves historical/expired vacancies and tenders from D1 at zero egress cost.
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '9213ae688946caea617ba6fd5e4fbc5c';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '1e0d9072-50da-4bfb-bbba-9c8596a69b88';

async function queryD1<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!CLOUDFLARE_API_TOKEN) {
    return [];
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql, params }),
      next: { revalidate: 3600 }, // Cache D1 responses for 1 hour
    });

    if (!res.ok) {
      console.warn(`[d1-archive] HTTP ${res.status} querying D1`);
      return [];
    }

    const json = await res.json();
    if (!json.success || !json.result?.[0]?.results) {
      return [];
    }

    return json.result[0].results as T[];
  } catch (err: any) {
    console.error('[d1-archive] Error querying D1:', err?.message || err);
    return [];
  }
}

export interface ArchivedJobResult {
  job: {
    id: string;
    title: string;
    companyName: string | null;
    description: string | null;
    requirements: string | null;
    location: string | null;
    countryId: string | null;
    jobType: string;
    sourceUrl: string | null;
    postedDate: Date | null;
    deadline: Date | null;
    isActive: boolean;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryCurrency: string | null;
    employerUrl: string | null;
    sector: string | null;
    profession: string | null;
    experienceLevel: string | null;
    educationLevel: string | null;
    skills: string[];
    isAggregatorSource?: boolean | null;
  };
  country: string | null;
  countryCode: string | null;
  region: string | null;
  isArchived: true;
}

export async function getArchivedJob(id: string): Promise<ArchivedJobResult | null> {
  const rows = await queryD1(
    'SELECT * FROM archived_jobs WHERE id = ? LIMIT 1',
    [id]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  let parsedSkills: string[] = [];
  if (row.skills) {
    try {
      parsedSkills = typeof row.skills === 'string' && row.skills.startsWith('[')
        ? JSON.parse(row.skills)
        : [row.skills];
    } catch {
      parsedSkills = [row.skills];
    }
  }

  return {
    job: {
      id: row.id,
      title: row.title,
      companyName: row.company_name || null,
      description: row.description || null,
      requirements: row.requirements || null,
      location: row.location || null,
      countryId: row.country_id || null,
      jobType: row.job_type || 'full_time',
      sourceUrl: row.source_url || null,
      postedDate: row.posted_date ? new Date(row.posted_date) : null,
      deadline: row.deadline ? new Date(row.deadline) : null,
      isActive: false,
      isArchived: true,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.archived_at ? new Date(row.archived_at) : new Date(),
      salaryMin: row.salary_min != null ? Number(row.salary_min) : null,
      salaryMax: row.salary_max != null ? Number(row.salary_max) : null,
      salaryCurrency: row.salary_currency || null,
      employerUrl: row.employer_url || null,
      sector: row.sector || null,
      profession: row.profession || null,
      experienceLevel: row.experience_level || null,
      educationLevel: row.education_level || null,
      skills: parsedSkills,
      isAggregatorSource: false,
    },
    country: row.country_name || null,
    countryCode: null,
    region: row.region_name || null,
    isArchived: true,
  };
}

export interface ArchivedTenderResult {
  tender: {
    id: string;
    referenceNo: string | null;
    title: string;
    description: string | null;
    contractingAuthority: string | null;
    countryId: string | null;
    sectorId: string | null;
    category: any;
    status: any;
    budget: number | null;
    currency: string | null;
    publishedAt: Date | null;
    deadline: Date | null;
    sourceUrl: string | null;
    documentUrl: string | null;
    extractedText: string | null;
    employerUrl: string | null;
    aiSummary: string | null;
    createdAt: Date;
    updatedAt: Date;
    isArchived: boolean;
  };
  country: string | null;
  sector: string | null;
  isArchived: true;
}

export async function getArchivedTender(id: string): Promise<ArchivedTenderResult | null> {
  const rows = await queryD1(
    'SELECT * FROM archived_tenders WHERE id = ? LIMIT 1',
    [id]
  );

  if (!rows || rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    tender: {
      id: row.id,
      referenceNo: row.reference_no || null,
      title: row.title,
      description: row.description || null,
      contractingAuthority: row.contracting_authority || null,
      countryId: row.country_id || null,
      sectorId: null,
      category: row.category || 'other',
      status: 'closed',
      budget: row.budget != null ? Number(row.budget) : null,
      currency: row.currency || null,
      publishedAt: row.published_at ? new Date(row.published_at) : null,
      deadline: row.deadline ? new Date(row.deadline) : null,
      sourceUrl: row.source_url || null,
      documentUrl: row.document_url || null,
      extractedText: row.extracted_text || null,
      employerUrl: row.employer_url || null,
      aiSummary: row.ai_summary || null,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.archived_at ? new Date(row.archived_at) : new Date(),
      isArchived: true,
    },
    country: row.country_name || null,
    sector: row.sector_name || null,
    isArchived: true,
  };
}
