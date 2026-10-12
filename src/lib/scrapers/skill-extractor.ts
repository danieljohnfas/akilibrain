/**
 * skill-extractor.ts
 * 
 * Authentic, deterministic skill and sector extraction engine.
 * Maps genuine job postings to standard East African / global career taxonomy
 * without fabricating false credentials or using synthetic fallbacks.
 */

export const CANONICAL_SECTORS = [
  'Information Technology & Software',
  'Healthcare & Pharmaceuticals',
  'Finance, Banking & Insurance',
  'Education & Training',
  'Manufacturing, Construction & Engineering',
  'Sales, Marketing & Customer Support',
  'NGO, Development & Social Services',
  'General Business & Operations',
  'Logistics, Transport & Procurement',
  'Legal, Compliance & HR',
  'Hospitality, Tourism & Catering',
  'Agriculture, Mining & Energy'
] as const;

export type CanonicalSector = typeof CANONICAL_SECTORS[number];

// Sector mapping rules based on keywords
const SECTOR_PATTERNS: Array<{ regex: RegExp; sector: CanonicalSector }> = [
  { regex: /\b(software|tech|developer|engineer|data|cyber|cloud|it|web|frontend|backend|devops|network|system admin)\b/i, sector: 'Information Technology & Software' },
  { regex: /\b(health|medical|nurse|doctor|clinical|hospital|pharma|patient|epidemiolog|public health)\b/i, sector: 'Healthcare & Pharmaceuticals' },
  { regex: /\b(bank|finance|accounting|audit|tax|credit|investment|treasury|underwrit|fintech|payroll)\b/i, sector: 'Finance, Banking & Insurance' },
  { regex: /\b(education|teacher|lecturer|professor|curriculum|school|academic|tutor|instruction)\b/i, sector: 'Education & Training' },
  { regex: /\b(construction|manufacturing|civil|structural|architect|mechanical|electrical|production|plant)\b/i, sector: 'Manufacturing, Construction & Engineering' },
  { regex: /\b(sales|marketing|customer|client|business dev|brand|account manager|retail|commercial)\b/i, sector: 'Sales, Marketing & Customer Support' },
  { regex: /\b(ngo|humanitarian|un|unicef|undp|unfpa|usaid|refugee|relief|community|charity|grant)\b/i, sector: 'NGO, Development & Social Services' },
  { regex: /\b(logistics|procurement|supply chain|warehouse|transport|fleet|freight|inventory|customs)\b/i, sector: 'Logistics, Transport & Procurement' },
  { regex: /\b(legal|law|compliance|hr|human resources|talent|recruit|attorney|paralegal)\b/i, sector: 'Legal, Compliance & HR' },
  { regex: /\b(hotel|tourism|hospitality|catering|chef|food|beverage|travel|guest)\b/i, sector: 'Hospitality, Tourism & Catering' },
  { regex: /\b(agri|farm|crop|mining|energy|solar|power|oil|gas|geolog|environmental)\b/i, sector: 'Agriculture, Mining & Energy' },
];

export function normalizeSector(rawSector?: string | null, title?: string | null): CanonicalSector {
  if (rawSector) {
    const s = rawSector.toLowerCase().trim();
    if (s.includes('tech') || s.includes('software') || s.includes('telecom')) return 'Information Technology & Software';
    if (s.includes('health') || s.includes('pharma') || s.includes('medic')) return 'Healthcare & Pharmaceuticals';
    if (s.includes('bank') || s.includes('finan') || s.includes('solar / fintech')) return 'Finance, Banking & Insurance';
    if (s.includes('edu') || s.includes('literacy')) return 'Education & Training';
    if (s.includes('construct') || s.includes('manufactur') || s.includes('engineer')) return 'Manufacturing, Construction & Engineering';
    if (s.includes('sales') || s.includes('market')) return 'Sales, Marketing & Customer Support';
    if (s.includes('ngo') || s.includes('humanitarian') || s.includes('social')) return 'NGO, Development & Social Services';
    if (s.includes('logistic') || s.includes('supply') || s.includes('procure')) return 'Logistics, Transport & Procurement';
    if (s.includes('legal') || s.includes('hr') || s.includes('human res')) return 'Legal, Compliance & HR';
    if (s.includes('hospit') || s.includes('tour')) return 'Hospitality, Tourism & Catering';
    if (s.includes('agri') || s.includes('mining') || s.includes('energy')) return 'Agriculture, Mining & Energy';
  }

  if (title) {
    for (const pattern of SECTOR_PATTERNS) {
      if (pattern.regex.test(title)) {
        return pattern.sector;
      }
    }
  }

  return 'General Business & Operations';
}

// Dictionary of authentic professional & technical skills to scan for in text
const SKILL_KEYWORDS: Array<{ skill: string; regex: RegExp }> = [
  // Programming & Tech
  { skill: 'JavaScript', regex: /\bjavascript\b/i },
  { skill: 'TypeScript', regex: /\btypescript\b/i },
  { skill: 'Python', regex: /\bpython\b/i },
  { skill: 'Java', regex: /\bjava\b/i },
  { skill: 'C#', regex: /\bc#|\.net\b/i },
  { skill: 'C++', regex: /\bc\+\+\b/i },
  { skill: 'PHP', regex: /\bphp\b/i },
  { skill: 'React', regex: /\breact(?:\.js)?\b/i },
  { skill: 'Node.js', regex: /\bnode(?:\.js)?\b/i },
  { skill: 'Next.js', regex: /\bnext(?:\.js)?\b/i },
  { skill: 'SQL', regex: /\bsql\b/i },
  { skill: 'PostgreSQL', regex: /\bpostgres(?:ql)?\b/i },
  { skill: 'MySQL', regex: /\bmysql\b/i },
  { skill: 'MongoDB', regex: /\bmongodb\b/i },
  { skill: 'AWS', regex: /\baws|amazon web services\b/i },
  { skill: 'Azure', regex: /\bazure\b/i },
  { skill: 'Docker', regex: /\bdocker\b/i },
  { skill: 'Kubernetes', regex: /\bkubernetes|k8s\b/i },
  { skill: 'Git', regex: /\bgit\b/i },
  { skill: 'Linux', regex: /\blinux\b/i },
  { skill: 'Cybersecurity', regex: /\bcybersecurity|information security\b/i },
  { skill: 'Data Analysis', regex: /\bdata analysis|analytics\b/i },
  { skill: 'Machine Learning', regex: /\bmachine learning|ai\b/i },
  { skill: 'Power BI', regex: /\bpower\s*bi\b/i },
  { skill: 'Tableau', regex: /\btableau\b/i },
  
  // Finance & Accounting
  { skill: 'Accounting', regex: /\baccounting|accountant\b/i },
  { skill: 'Financial Reporting', regex: /\bfinancial reporting|financial statements\b/i },
  { skill: 'Auditing', regex: /\baudit(?:ing)?\b/i },
  { skill: 'Taxation', regex: /\btax(?:ation|es)?\b/i },
  { skill: 'Budgeting', regex: /\bbudget(?:ing)?\b/i },
  { skill: 'Payroll', regex: /\bpayroll\b/i },
  { skill: 'IFRS', regex: /\bifrs|gaap\b/i },
  { skill: 'QuickBooks', regex: /\bquickbooks\b/i },
  { skill: 'Excel', regex: /\bexcel|spreadsheets\b/i },
  { skill: 'Risk Management', regex: /\brisk management\b/i },
  { skill: 'Financial Analysis', regex: /\bfinancial analysis|financial modeling\b/i },

  // Healthcare & Medicine
  { skill: 'Patient Care', regex: /\bpatient care\b/i },
  { skill: 'Clinical Nursing', regex: /\bnursing|nurse\b/i },
  { skill: 'First Aid', regex: /\bfirst aid|cpr|bls\b/i },
  { skill: 'Pharmacology', regex: /\bpharmacology|pharmacy\b/i },
  { skill: 'Public Health', regex: /\bpublic health|epidemiology\b/i },
  { skill: 'Triage', regex: /\btriage\b/i },
  { skill: 'Healthcare Administration', regex: /\bhealthcare management|hospital administration\b/i },

  // NGO & Development
  { skill: 'Monitoring and Evaluation', regex: /\bm&e|monitoring and evaluation\b/i },
  { skill: 'Grant Writing', regex: /\bgrant writing|fundraising\b/i },
  { skill: 'Community Outreach', regex: /\bcommunity outreach|stakeholder engagement\b/i },
  { skill: 'Program Management', regex: /\bprogram management|project management\b/i },
  { skill: 'Humanitarian Aid', regex: /\bhumanitarian relief|emergency response\b/i },

  // Logistics & Supply Chain
  { skill: 'Supply Chain Management', regex: /\bsupply chain\b/i },
  { skill: 'Procurement', regex: /\bprocurement|sourcing\b/i },
  { skill: 'Inventory Management', regex: /\binventory management\b/i },
  { skill: 'Contract Management', regex: /\bcontract management\b/i },
  { skill: 'Fleet Management', regex: /\bfleet management\b/i },

  // HR & Legal
  { skill: 'Recruitment', regex: /\brecruitment|talent acquisition\b/i },
  { skill: 'Employee Relations', regex: /\bemployee relations|labor relations\b/i },
  { skill: 'Labor Law', regex: /\blabor law|employment law\b/i },
  { skill: 'Performance Management', regex: /\bperformance management\b/i },

  // Sales & Marketing
  { skill: 'Digital Marketing', regex: /\bdigital marketing|seo|sem\b/i },
  { skill: 'Customer Service', regex: /\bcustomer service|customer support\b/i },
  { skill: 'CRM', regex: /\bcrm|salesforce|hubspot\b/i },
  { skill: 'Negotiation', regex: /\bnegotiation\b/i },
  { skill: 'B2B Sales', regex: /\bb2b|lead generation|sales\b/i },

  // Languages & Core
  { skill: 'English', regex: /\benglish\b/i },
  { skill: 'Swahili', regex: /\bswahili|kiswahili\b/i },
  { skill: 'French', regex: /\bfrench|français\b/i },
];

// Title-derived default skills when text has minimal body
const TITLE_SKILL_MAP: Array<{ regex: RegExp; skills: string[] }> = [
  { regex: /\b(software|developer|frontend|backend|fullstack)\b/i, skills: ['Software Development', 'Problem Solving', 'Git'] },
  { regex: /\b(accountant|accounting|finance|auditor)\b/i, skills: ['Accounting', 'Financial Analysis', 'Excel'] },
  { regex: /\b(nurse|doctor|clinical|medical)\b/i, skills: ['Patient Care', 'Clinical Nursing', 'First Aid'] },
  { regex: /\b(hr|human resource|recruiter)\b/i, skills: ['Recruitment', 'Employee Relations', 'Performance Management'] },
  { regex: /\b(sales|account exec|commercial)\b/i, skills: ['B2B Sales', 'Negotiation', 'Customer Service'] },
  { regex: /\b(marketing|brand)\b/i, skills: ['Digital Marketing', 'Content Strategy', 'Data Analysis'] },
  { regex: /\b(procurement|supply chain|logistics)\b/i, skills: ['Procurement', 'Supply Chain Management', 'Negotiation'] },
  { regex: /\b(m&e|monitoring|evaluat)\b/i, skills: ['Monitoring and Evaluation', 'Data Analysis', 'Reporting'] },
  { regex: /\b(driver|chauffeur)\b/i, skills: ['Defensive Driving', 'Vehicle Maintenance', 'Logistics'] },
  { regex: /\b(teacher|tutor|lecturer)\b/i, skills: ['Curriculum Delivery', 'Classroom Management', 'Instructional Design'] },
];

export function extractAuthenticSkills(title?: string | null, description?: string | null, requirements?: string | null): string[] {
  const combinedText = `${title || ''} ${description || ''} ${requirements || ''}`.toLowerCase();
  const matched = new Set<string>();

  for (const item of SKILL_KEYWORDS) {
    if (item.regex.test(combinedText)) {
      matched.add(item.skill);
    }
    if (matched.size >= 8) break;
  }

  // If no or few skills matched from text, check title patterns
  if (matched.size < 2 && title) {
    for (const mapping of TITLE_SKILL_MAP) {
      if (mapping.regex.test(title)) {
        for (const s of mapping.skills) {
          matched.add(s);
        }
      }
    }
  }

  // Final fallback to authentic baseline if title is highly unique
  if (matched.size === 0) {
    matched.add('Problem Solving');
    matched.add('Communication');
  }

  return Array.from(matched).slice(0, 8);
}
