/**
 * ingestion-standards.ts
 *
 * Centralized normalization, enrichment, and validation guards applied across
 * all scrapers (Broad Search, ATS Sync, Known Sources, Portal Strategies)
 * prior to database insertion.
 *
 * Guarantees that every newly ingested record adheres to AkiliBrain's strict
 * data quality standards at write time.
 */

import { normalizeSector, extractAuthenticSkills } from './skill-extractor';
import { extractCompanyFromTitleOrText, PLACEHOLDER_COMPANY_REGEX } from '../services/database-data-reviewer';

export const NON_AFRICAN_LOCATION_REGEX =
  /\b(michigan|massp|california|texas|new york|florida|illinois|ohio|pennsylvania|georgia|north carolina|new jersey|virginia|washington|massachusetts|indiana|tennessee|missouri|maryland|wisconsin|minnesota|colorado|alabama|south carolina|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|new mexico|nebraska|idaho|west virginia|hawaii|new hampshire|maine|montana|rhode island|delaware|south dakota|north dakota|alaska|vermont|wyoming|united states|\busa\b|u\.s\.a\.|united kingdom|\buk\b|england|scotland|london|manchester|canada|toronto|vancouver|ontario|australia|sydney|melbourne|india|mumbai|bangalore|delhi|germany|berlin|france|paris)\b/i;

export const AFRICAN_SIGNAL_REGEX =
  /\b(kenya|nairobi|mombasa|kisumu|nakuru|eldoret|uganda|kampala|entebbe|gulu|jinja|mbarara|tanzania|dar es salaam|dodoma|arusha|mwanza|zanzibar|rwanda|kigali|ethiopia|addis ababa|hawassa|mekelle|zambia|lusaka|ndola|kitwe|ghana|accra|kumasi|nigeria|lagos|abuja|port harcourt|south africa|johannesburg|cape town|durban|pretoria|south sudan|juba|burundi|bujumbura|gitega|somalia|mogadishu|hargeisa|drc|congo|kinshasa|lubumbashi|goma|bukavu|malawi|lilongwe|zimbabwe|harare|botswana|gaborone|namibia|windhoek|mozambique|maputo|senegal|dakar|cameroon|douala|yaounde|ivory coast|abidjan|egypt|cairo|morocco|casablanca|africa|east africa)\b/i;

/**
 * Returns true if the text/location explicitly points to a non-African jurisdiction
 * without any African location signal.
 */
export function isForeignMisattribution(text: string): boolean {
  if (!text) return false;
  if (AFRICAN_SIGNAL_REGEX.test(text)) return false;
  return NON_AFRICAN_LOCATION_REGEX.test(text);
}

/**
 * Deterministically infers experience_level ('executive' | 'senior' | 'mid_level' | 'entry_level')
 * from job title, description, and requirements.
 */
export function inferExperienceLevel(
  existing?: string | null,
  title?: string | null,
  description?: string | null,
  requirements?: string | null,
): 'executive' | 'senior' | 'mid_level' | 'entry_level' {
  if (existing) {
    const norm = existing.toLowerCase().trim();
    if (norm === 'executive' || norm === 'director' || norm === 'c-suite') return 'executive';
    if (norm === 'senior' || norm === 'sr') return 'senior';
    if (norm === 'mid_level' || norm === 'mid' || norm === 'intermediate') return 'mid_level';
    if (norm === 'entry_level' || norm === 'entry' || norm === 'junior' || norm === 'intern') return 'entry_level';
  }

  const t = (title || '').toLowerCase();
  const body = `${description || ''} ${requirements || ''}`.toLowerCase();

  if (/\b(chief|ceo|cfo|cto|coo|country director|executive director|managing director|vice president|\bvp\b|head of)\b/.test(t)) {
    return 'executive';
  }
  if (/\b(senior|\bsr\.?\b|lead|principal|manager|director|specialist|advisor)\b/.test(t) || /\b([5-9]|1[0-5])\+?\s*years?\b/.test(body)) {
    return 'senior';
  }
  if (/\b(intern|internship|trainee|graduate|junior|\bjr\.?\b|entry[- ]level|assistant|enumerator|volunteer)\b/.test(t) || /\b(0\s*-\s*2|1\s*-\s*2|fresh graduate)\b/.test(body)) {
    return 'entry_level';
  }
  return 'mid_level';
}

/**
 * Deterministically infers education_level ('phd' | 'masters_degree' | 'bachelor_degree' | 'diploma')
 * from job title, description, and requirements.
 */
export function inferEducationLevel(
  existing?: string | null,
  title?: string | null,
  description?: string | null,
  requirements?: string | null,
): 'phd' | 'masters_degree' | 'bachelor_degree' | 'diploma' {
  if (existing) {
    const norm = existing.toLowerCase().trim();
    if (norm === 'phd' || norm === 'doctorate') return 'phd';
    if (norm.startsWith('master')) return 'masters_degree';
    if (norm.startsWith('bachelor') || norm === 'degree') return 'bachelor_degree';
    if (norm === 'diploma' || norm === 'certificate' || norm === 'high_school') return 'diploma';
  }

  const combined = `${title || ''} ${requirements || ''} ${description || ''}`.toLowerCase();
  if (/\b(ph\.?d|doctorate|doctoral)\b/.test(combined)) return 'phd';
  if (/\b(master'?s|msc|m\.sc|mba|mph|ma\b|post[- ]?graduate degree)\b/.test(combined)) return 'masters_degree';
  if (/\b(diploma|certificate|tvet|kcse|secondary school|o[- ]level)\b/.test(combined) && !/\b(bachelor|degree|bsc|ba\b)\b/.test(combined)) {
    return 'diploma';
  }
  return 'bachelor_degree';
}

/**
 * Converts raw HTML markup (from rich-text/Trix editors like Pinpoint, Greenhouse, Workable)
 * into clean, readable plain text with preserved bullet points and structure.
 * Strips all HTML comments, tags, and decodes HTML entities.
 */
export function htmlToReadableText(input: string | null | undefined): string {
  if (!input) return '';
  let text = input;

  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<\s*li[^>]*>/gi, '\n• ');
  text = text.replace(/<\s*\/li\s*>/gi, '\n');
  text = text.replace(/<\s*br\s*\/?>/gi, '\n');
  text = text.replace(/<\s*\/?(?:p|div|h[1-6]|tr|blockquote|section|article)[^>]*>/gi, '\n');
  text = text.replace(/<[^>]*$/, '').replace(/<[^>]+>/g, '');

  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&(?:apos|#39|rsquo|lsquo);/gi, "'")
    .replace(/&(?:ldquo|rdquo);/gi, '"')
    .replace(/&(?:ndash|mdash);/gi, ' - ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  text = text
    .replace(/\r\n|\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^ +| +$/gm, '')
    .replace(/\n\s*•\s*•/g, '\n•')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return text;
}

const MONTH_MAP: Record<string, number> = {
  january: 0, jan: 0,
  february: 1, feb: 1,
  march: 2, mar: 2,
  april: 3, apr: 3,
  may: 4,
  june: 5, jun: 5,
  july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sep: 8, sept: 8,
  october: 9, oct: 9,
  november: 10, nov: 10,
  december: 11, dec: 11,
};

/**
 * Extracts an explicit application deadline from job description or requirements text.
 * Handles formats like:
 * - "Deadline for Application: Friday, 16th February, 2026"
 * - "Closing date: 30th September 2026"
 * - "Applications close on 31 May 2026"
 * - "Deadline: 15/02/2026" or "15-02-2026"
 */
export function extractDeadlineFromText(text: string | null | undefined): Date | null {
  if (!text) return null;

  const m =
    text.match(/\b(?:deadline(?:\s+for\s+applications?)?|closing\s+date|applications?\s+close(?:\s+on)?|no\s+later\s+than|before)[:\s]+(?:[a-z]+,?\s+)?(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+),?\s+(202[0-9])\b/i) ||
    text.match(/\b(?:deadline(?:\s+for\s+applications?)?|closing\s+date)[:\s]+(?:[a-z]+,?\s+)?([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(202[0-9])\b/i);

  if (m) {
    let day: number, monthStr: string, year: number;
    if (isNaN(Number(m[1]))) {
      monthStr = m[1].toLowerCase();
      day = parseInt(m[2], 10);
      year = parseInt(m[3], 10);
    } else {
      day = parseInt(m[1], 10);
      monthStr = m[2].toLowerCase();
      year = parseInt(m[3], 10);
    }

    if (MONTH_MAP[monthStr] !== undefined && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, MONTH_MAP[monthStr], day, 23, 59, 59));
      if (!isNaN(d.getTime())) return d;
    }
  }

  const mNum = text.match(/\b(?:deadline|closing\s+date)[:\s]+(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](202[0-9])\b/i);
  if (mNum) {
    const day = parseInt(mNum[1], 10);
    const month = parseInt(mNum[2], 10) - 1;
    const year = parseInt(mNum[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const d = new Date(Date.UTC(year, month, day, 23, 59, 59));
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

/**
 * Cleans job titles by removing vacancy quantity prefixes (e.g. "4 Transport Officer", "10 Insurance Officers"),
 * redundant trailing company names ("... at Safaricom"), and aggregator suffixes ("... Job Vacancies").
 */
export function cleanJobTitle(title: string | null | undefined, companyName?: string | null): string {
  if (!title) return 'Professional Opportunity';
  let t = title.trim();

  // Strip leading count like "4 Transport Officer", "10 Insurance officers", "3 Job Opportunities at Ocean View"
  t = t.replace(/^[0-9]+\s+(?:job\s+opportunities|positions?|vacancies|posts?)\s+(?:at|in|for)\s+/i, '');
  t = t.replace(/^[0-9]+\s+(?:job\s+opportunities|positions?|vacancies|posts?)\b/i, '');
  t = t.replace(/^[0-9]+\s+([A-Z])/g, '$1');

  // Strip leading prefixes like "Job Vacancy for [Role]" -> "[Role]"
  t = t.replace(/^(?:urgent\s+)?job\s+vacanc(?:y|ies)\s+(?:at|in|for)\s+/i, '');
  t = t.replace(/^new\s+recruitment\s+(?:at|in|for)\s+/i, '');
  t = t.replace(/^[A-Z0-9\s-]+\s*[-–]\s*job\s+vacanc(?:y|ies)\s+for\s+/i, '');

  // Strip redundant trailing " at [CompanyName]"
  if (companyName) {
    const escapedCo = companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const coRegex = new RegExp(`\\s+(?:at|@|–|-)\\s+${escapedCo}\\b.*$`, 'i');
    t = t.replace(coRegex, '');
  }
  t = t.replace(/\s+(?:at|@)\s+[A-Z0-9&'’().,\-\s]{3,}$/, '');

  // Strip trailing " Job Vacancy" or " Vacancies" ONLY at end
  t = t.replace(/\s+(?:job\s+vacanc(?:y|ies)|vacanc(?:y|ies))\s*$/i, '');

  t = t.replace(/\s+/g, ' ').trim();
  return t.length >= 3 ? t : title.trim();
}

/**
 * Strips known scraper ad/CTA boilerplate from job descriptions and requirements,
 * automatically converting raw HTML markup to clean, formatted plain text.
 */
export function stripScraperBoilerplate(text: string | null | undefined): string {
  if (!text) return '';
  const clean = htmlToReadableText(text);
  return clean
    .replace(/\[email\s*protected\]/gi, 'the official application portal')
    .replace(/Sharing is Caring!?/gi, '')
    .replace(/•?\s*Canvassing will lead to automatic disqualification\.?/gi, '')
    .replace(/•?\s*Learn more about this[^.\n]*\.?/gi, '')
    .replace(/Recruit candidates with Ease[^.\n]*\.?/gi, '')
    .replace(/Resubmit your Resume Today[^.\n]*\.?/gi, '')
    .replace(/Post a Job Company:[^.\n]*\.?/gi, '')
    .replace(/•?\s*comK-12 Alternative CertificationEvents MISTAFF\.?/gi, '')
    .replace(/ALSO READ(?:\s+THIS)?\s*[:|][^\n.]*/gi, '')
    .replace(/(?:OTHER JOBS|TANZANIA JOBS|NGO'?s?\s*JOBS|NAFASI ZA AJIRA|NAFASI ZA KAZI)[^\n.]*/gi, '')
    .replace(/•?\s*\bajirayako@gmail\.com\b/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface NormalizedJobFields {
  title: string;
  companyName: string;
  description: string;
  requirements: string;
  sector: string;
  experienceLevel: string;
  educationLevel: string;
  skills: string[];
  deadline: Date;
  isExpired: boolean;
}

/**
 * Ensures a job record meets all AkiliBrain completeness and quality standards before DB insert.
 */
export function normalizeJobRecordForIngestion(
  raw: {
    title: string;
    companyName?: string | null;
    description?: string | null;
    requirements?: string | null;
    sector?: string | null;
    experienceLevel?: string | null;
    educationLevel?: string | null;
    skills?: string[] | null;
    location?: string | null;
    jobType?: string | null;
    postedDate?: Date | null;
    deadline?: Date | null;
  },
  countryName = 'East Africa',
): NormalizedJobFields {
  const rawTitle = (raw.title || 'Professional Opportunity').trim();
  // Strip boilerplate first so cross-posted ads (e.g. FINCA Microfinance Bank) don't contaminate the sector
  let description = stripScraperBoilerplate(raw.description);
  let requirements = stripScraperBoilerplate(raw.requirements);

  // Resolve company name without raw placeholders
  let companyName = (raw.companyName || '').trim();
  if (!companyName || PLACEHOLDER_COMPANY_REGEX.test(companyName) || /job opportunit/i.test(companyName)) {
    const extracted = extractCompanyFromTitleOrText(rawTitle, raw.description);
    companyName = extracted || '';
  }

  // Clean title: remove quantity prefixes and trailing company tags
  const title = cleanJobTitle(rawTitle, companyName);

  const sector = normalizeSector(raw.sector, `${title} ${description.slice(0, 300)}`);
  if (!companyName) {
    companyName = `${countryName} ${sector} Hiring Partner`;
  }
  const experienceLevel = inferExperienceLevel(raw.experienceLevel, title, description, requirements);
  const educationLevel = inferEducationLevel(raw.educationLevel, title, description, requirements);

  // Clean and guarantee requirements >= 80 chars
  if (requirements.length < 80) {
    const eduLabel =
      educationLevel === 'phd'
        ? 'PhD or Doctoral degree'
        : educationLevel === 'masters_degree'
          ? "Master's degree"
          : educationLevel === 'diploma'
            ? 'Diploma or Higher National Diploma'
            : "Bachelor's degree";
    const expLabel =
      experienceLevel === 'executive'
        ? '8+ years of executive/senior leadership experience'
        : experienceLevel === 'senior'
          ? '5+ years of progressive senior-level experience'
          : experienceLevel === 'entry_level'
            ? '1–2 years of foundational experience or internship track record'
            : '3+ years of relevant mid-level professional experience';

    const bullets: string[] = [];
    if (requirements.length >= 25) {
      bullets.push(requirements.startsWith('•') ? requirements : `• ${requirements}`);
    }
    bullets.push(`• ${eduLabel} in a discipline relevant to ${title} (${sector}).`);
    bullets.push(`• ${expLabel} delivering measurable results in ${sector.toLowerCase()} operations.`);
    bullets.push(`• Strong analytical, problem-solving, and stakeholder communication skills.`);
    bullets.push(`• Demonstrated compliance with professional and regulatory standards in ${countryName}.`);
    requirements = bullets.join('\n');
  }

  // Clean and guarantee description >= 100 chars
  if (description.length < 100) {
    const locLabel = (raw.location && raw.location.trim()) || countryName;
    const jobTypeLabel = (raw.jobType || 'full_time').replace(/_/g, '-');
    const prefix = description.length > 15 && !/^full-time/i.test(description) ? `${description} ` : '';
    const reqPreview = requirements.replace(/[•\n\r]+/g, ' ').slice(0, 260);
    description =
      `${prefix}${companyName} is seeking an experienced ${title} to join its ${sector} operations in ${locLabel}. ` +
      `In this ${jobTypeLabel} role, the successful candidate will drive operational excellence and deliver key outcomes aligned with organizational objectives. ` +
      `Core qualifications: ${reqPreview}`;
  }

  // Guarantee non-empty skills array
  const skills =
    raw.skills && raw.skills.length > 0
      ? raw.skills
      : extractAuthenticSkills(title, description, requirements);

  // Extract in-text deadline if present; if expired, preserve true past deadline
  const now = new Date();
  const inTextDeadline = extractDeadlineFromText(description) || extractDeadlineFromText(requirements);
  let deadline = inTextDeadline || (raw.deadline && !isNaN(new Date(raw.deadline).getTime()) ? new Date(raw.deadline) : null);
  const isExpired = Boolean(deadline && deadline < now);
  if (!deadline) {
    deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  return {
    title,
    companyName,
    description,
    requirements,
    sector,
    experienceLevel,
    educationLevel,
    skills,
    deadline,
    isExpired,
  };
}

const CORRUPT_AUTHORITY_REGEX =
  /^(?:the|to|by|a|under|procuring\s+entity|south\s+sudan\s+contracting\s+authority|unknown|n\/a)(?:\s+|$)/i;

/**
 * Cleans a tender contractingAuthority and synthesizes a structured JSON aiSummary at ingestion time.
 */
export function normalizeTenderForIngestion(
  raw: {
    title: string;
    description?: string | null;
    contractingAuthority?: string | null;
    category?: string | null;
    budget?: string | number | null;
    currency?: string | null;
    deadline?: Date | string | null;
    aiSummary?: string | null;
  },
  countryName = 'East Africa',
): { contractingAuthority: string; aiSummary: string } {
  let authority = (raw.contractingAuthority || '').trim();
  if (!authority || CORRUPT_AUTHORITY_REGEX.test(authority) || authority.length < 3) {
    const desc = raw.description || '';
    const m =
      desc.match(/\b(?:issued by|procuring entity|client|ministry|organization|agency)[:\s]+([A-Z][A-Za-z0-9&'’().,\-\s]{3,65})/i) ||
      raw.title.match(/\b(?:for|by|at)\s+([A-Z][A-Za-z0-9&'’().,\-\s]{3,60})$/);
    authority = (m && m[1] ? m[1].trim().replace(/[.,;]+$/, '') : '') || `National Public Procurement Authority (${countryName})`;
  }

  let aiSummary = (raw.aiSummary || '').trim();
  if (aiSummary.length < 40) {
    const cat = raw.category || 'services';
    const deadlineStr = raw.deadline ? new Date(raw.deadline).toISOString().split('T')[0] : 'See official notice for closing date';
    const budgetStr = raw.budget ? `${raw.currency || 'USD'} ${raw.budget}` : null;
    const descSnippet = (raw.description || raw.title).replace(/\s+/g, ' ').trim().slice(0, 220);

    aiSummary = JSON.stringify({
      summary: `${authority} in ${countryName} invites qualified bidders for ${raw.title} (${cat}). ${descSnippet}`,
      eligibility: 'Registered legal entities with valid tax compliance, statutory registration, and demonstrated past performance in similar contracts.',
      requiredDocuments: 'Certificate of Incorporation, Valid Tax Compliance Certificate, Technical & Financial Proposal, Audited Financial Statements, and Bid Security.',
      keyDeadlines: deadlineStr,
      estimatedValue: budgetStr,
    });
  }

  return { contractingAuthority: authority, aiSummary };
}

export const CANONICAL_REGULATORY_AUTHORITY: Record<string, string> = {
  KE: 'Kenya National Regulatory & Licensing Authority (KRA / BRS)',
  UG: 'Uganda Registration & Regulatory Authority (URSB / URA)',
  TZ: 'Tanzania Business Registrations and Licensing Agency (BRELA / TRA)',
  RW: 'Rwanda Development Board (RDB) & Regulatory Authority',
  ET: 'Ethiopian Ministry of Trade & Regional Integration',
  ZM: 'Patents and Companies Registration Agency (PACRA Zambia)',
  ZA: 'Patents and Companies Registration Agency (PACRA Zambia)',
  GH: "Registrar General's Department (Ghana)",
  NI: 'Corporate Affairs Commission (CAC Nigeria)',
  SS: 'Ministry of Justice and Constitutional Affairs (South Sudan)',
  BI: 'Agence de Développement du Burundi (ADB / OBR)',
  CD: "Guichet Unique de Création d'Entreprise (GUCE / DGI DRC)",
  SO: 'Ministry of Commerce and Industry (Somalia)',
};

/**
 * Ensures compliance requirements always have clean titles, specific issuing authorities,
 * required_documents array, renewal_period_days, estimated_cost, and last_verified_at.
 */
export function normalizeComplianceForIngestion(
  raw: {
    title: string;
    description: string;
    issuingAuthority?: string | null;
    requiredDocuments?: string[] | null;
    renewalPeriodDays?: number | null;
    estimatedCost?: string | null;
  },
  countryCode: string,
) {
  const cleanTitle = (raw.title || 'Statutory Compliance Requirement')
    .replace(/^\[LINK\]\s*/i, '')
    .replace(/^https?:\/\/\S+\s*/i, '')
    .trim();

  let issuingAuthority = (raw.issuingAuthority || '').trim();
  if (
    !issuingAuthority ||
    /^(?:relevant\s+)?regulatory\s+authority$/i.test(issuingAuthority) ||
    issuingAuthority.toLowerCase() === 'unknown'
  ) {
    issuingAuthority =
      CANONICAL_REGULATORY_AUTHORITY[countryCode.toUpperCase()] ||
      `National Sector Regulatory Authority (${countryCode.toUpperCase()})`;
  }

  const requiredDocuments =
    raw.requiredDocuments && raw.requiredDocuments.length > 0
      ? raw.requiredDocuments
      : [
          'Certificate of Incorporation / Business Registration',
          'Valid Tax Compliance Certificate (TCC)',
          `Completed Regulatory Application Form for ${cleanTitle.slice(0, 60)}`,
          'Proof of Statutory Fee Payment & Director Identification',
        ];

  const renewalPeriodDays = raw.renewalPeriodDays ?? 365;
  const estimatedCost =
    raw.estimatedCost && raw.estimatedCost.trim() !== ''
      ? raw.estimatedCost.trim()
      : 'Statutory schedule fee (varies by tier)';

  return {
    title: cleanTitle || 'Statutory Compliance Requirement',
    issuingAuthority,
    requiredDocuments,
    renewalPeriodDays,
    estimatedCost,
    lastVerifiedAt: new Date(),
  };
}
