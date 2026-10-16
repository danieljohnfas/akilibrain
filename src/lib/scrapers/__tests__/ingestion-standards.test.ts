import { describe, it, expect } from 'vitest';
import {
  isForeignMisattribution,
  inferExperienceLevel,
  inferEducationLevel,
  stripScraperBoilerplate,
  htmlToReadableText,
  cleanJobTitle,
  extractDeadlineFromText,
  normalizeJobRecordForIngestion,
  normalizeTenderForIngestion,
  normalizeComplianceForIngestion,
} from '../ingestion-standards';
import { checkSalaryPlausibility } from '../../salaries/verify-plausibility';

describe('Scraping & Data Ingestion Standards (ingestion-standards.ts)', () => {
  describe('htmlToReadableText', () => {
    it('converts rich text/HTML markup, lists, and comments into clean formatted text', () => {
      const raw = '<div><!--block--><ul><li>Manage solar operations</li><li>Prepare reports</li></ul></div>&nbsp;&amp;&nbsp;<strong>Full-time</strong>';
      const clean = htmlToReadableText(raw);
      expect(clean).toContain('• Manage solar operations');
      expect(clean).toContain('• Prepare reports');
      expect(clean).toContain('& Full-time');
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('&nbsp;');
      expect(clean).not.toContain('<!--');
    });

    it('safely handles unclosed tags and HTML entities', () => {
      const raw = '<a href="https://example.com">Link text</a> &#8211; with dash &amp; quotes &quot;hello&quot; <a href="http';
      const clean = htmlToReadableText(raw);
      expect(clean).not.toContain('<');
      expect(clean).toContain('Link text – with dash & quotes "hello"');
    });
  });

  describe('isForeignMisattribution', () => {
    it('flags US states, European cities, and non-African orgs like Michigan / MASSP', () => {
      expect(isForeignMisattribution('Michigan Association Of Secondary School Principals (massp)')).toBe(true);
      expect(isForeignMisattribution('Lansing, Michigan, United States')).toBe(true);
      expect(isForeignMisattribution('London, United Kingdom')).toBe(true);
    });

    it('allows legitimate East and Sub-Saharan African locations and orgs', () => {
      expect(isForeignMisattribution('Nairobi, Kenya — Safaricom PLC')).toBe(false);
      expect(isForeignMisattribution('Juba, South Sudan — Tearfund')).toBe(false);
      expect(isForeignMisattribution('Kampala, Uganda')).toBe(false);
    });
  });

  describe('cleanJobTitle', () => {
    it('strips leading vacancy counts and redundant trailing company names', () => {
      expect(cleanJobTitle('4 Transport Officer at UDART', 'UDA Rapid Transit Plc (UDART)')).toBe('Transport Officer');
      expect(cleanJobTitle('10 Insurance Officers')).toBe('Insurance Officers');
      expect(cleanJobTitle('Senior Data Analyst at Safaricom PLC', 'Safaricom PLC')).toBe('Senior Data Analyst');
      expect(cleanJobTitle('Accountant Job Vacancies')).toBe('Accountant');
    });
  });

  describe('extractDeadlineFromText', () => {
    it('extracts deterministic deadline dates from narrative text', () => {
      const d1 = extractDeadlineFromText('Deadline for Application: Friday, 16th February, 2026.');
      expect(d1).not.toBeNull();
      expect(d1?.getUTCFullYear()).toBe(2026);
      expect(d1?.getUTCMonth()).toBe(1); // 0-indexed February
      expect(d1?.getUTCDate()).toBe(16);

      const d2 = extractDeadlineFromText('Closing date: 30th September 2026');
      expect(d2?.getUTCDate()).toBe(30);
      expect(d2?.getUTCMonth()).toBe(8); // September

      const d3 = extractDeadlineFromText('Deadline: 15/02/2026');
      expect(d3?.getUTCDate()).toBe(15);
      expect(d3?.getUTCMonth()).toBe(1);

      expect(extractDeadlineFromText('Apply as soon as possible without delay')).toBeNull();
    });
  });

  describe('inferExperienceLevel & inferEducationLevel', () => {
    it('never classifies a Director or Head role as entry_level even if text mentions interns', () => {
      expect(inferExperienceLevel(null, 'Country Director', 'Will oversee staff and interns in Juba')).toBe('executive');
      expect(inferExperienceLevel(null, 'Head of Finance', 'Supervises junior accountants')).toBe('executive');
    });

    it('infers education level accurately from title and text', () => {
      expect(inferEducationLevel(null, 'Public Health Advisor', 'MPH or MSc required')).toBe('masters_degree');
      expect(inferEducationLevel(null, 'Field Technician', 'TVET or Diploma in Electrical Engineering')).toBe('diploma');
      expect(inferEducationLevel(null, 'Software Engineer', 'BSc in Computer Science')).toBe('bachelor_degree');
      expect(stripScraperBoilerplate('Sharing is Caring! Apply at [email protected]')).toBe('Apply at the official application portal');
      expect(stripScraperBoilerplate('ALSO READ | Administration Manager at FINCA Microfinance Bank\nApply now')).toBe('Apply now');
      expect(stripScraperBoilerplate('OTHER JOBS, TANZANIA JOBS, NAFASI ZA AJIRA\nRole overview')).toBe('Role overview');
      expect(stripScraperBoilerplate('Send email to ajirayako@gmail.com for details')).toBe('Send email to for details');
    });
  });

  describe('normalizeJobRecordForIngestion', () => {
    it('replaces placeholder company names and synthesizes >= 100c description and >= 80c requirements', () => {
      const normalized = normalizeJobRecordForIngestion(
        {
          title: 'Senior Accountant at Equity Bank Kenya',
          companyName: 'Anonymous Employer',
          description: 'Posted 2 days ago · Full-time',
          requirements: 'CPA-K',
          location: 'Nairobi',
        },
        'Kenya',
      );

      expect(normalized.companyName).toBe('Equity Bank');
      expect(normalized.description.length).toBeGreaterThanOrEqual(100);
      expect(normalized.requirements.length).toBeGreaterThanOrEqual(80);
      expect(normalized.experienceLevel).toBe('senior');
      expect(normalized.educationLevel).toBe('bachelor_degree');
      expect(normalized.skills.length).toBeGreaterThan(0);
      expect(normalized.deadline.getTime()).toBeGreaterThan(Date.now());
    });

    it('assigns a standardized Hiring Partner label when no company name appears in text', () => {
      const normalized = normalizeJobRecordForIngestion(
        {
          title: 'Logistics Coordinator',
          companyName: 'Company Name',
          description: 'Manage fleet routing and warehouse inventory across regional hubs.',
          requirements: null,
        },
        'Uganda',
      );

      expect(normalized.companyName).toMatch(/Uganda .* Hiring Partner/);
      expect(normalized.description.length).toBeGreaterThanOrEqual(100);
      expect(normalized.requirements.length).toBeGreaterThanOrEqual(80);
    });
  });

  describe('normalizeTenderForIngestion', () => {
    it('replaces corrupt contractingAuthority fragments and generates structured JSON aiSummary', () => {
      const res = normalizeTenderForIngestion(
        {
          title: 'Supply of Solar Cold Chain Equipment for Ministry of Health',
          description: 'Procurement of 50 solar vaccine refrigerators.',
          contractingAuthority: 'the ',
          category: 'goods',
          budget: 150000,
          currency: 'USD',
        },
        'South Sudan',
      );

      expect(res.contractingAuthority).toBe('Ministry of Health');
      expect(res.aiSummary.length).toBeGreaterThan(40);
      const parsed = JSON.parse(res.aiSummary);
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('eligibility');
      expect(parsed).toHaveProperty('requiredDocuments');
    });
  });

  describe('normalizeComplianceForIngestion', () => {
    it('strips [LINK] prefixes, resolves canonical regulatory authority, and populates required fields', () => {
      const res = normalizeComplianceForIngestion(
        {
          title: '[LINK] https://kra.go.ke/vat VAT Monthly Return Filing',
          description: 'Monthly VAT filing obligation before the 20th of the following month.',
          issuingAuthority: 'Regulatory Authority',
        },
        'KE',
      );

      expect(res.title).toBe('VAT Monthly Return Filing');
      expect(res.issuingAuthority).toContain('KRA');
      expect(res.requiredDocuments.length).toBeGreaterThanOrEqual(3);
      expect(res.renewalPeriodDays).toBe(365);
      expect(res.estimatedCost.length).toBeGreaterThan(0);
      expect(res.lastVerifiedAt).toBeInstanceOf(Date);
    });
  });

  describe('checkSalaryPlausibility deterministic pre-validation', () => {
    it('immediately rejects cross-currency submissions (e.g. UGX or TZS in Kenya)', async () => {
      const res = await checkSalaryPlausibility({
        jobTitle: 'Software Engineer',
        countryName: 'Kenya',
        experienceLevel: 'mid',
        employmentType: 'full_time',
        currency: 'UGX',
        grossMonthlySalary: 4500000,
      });
      expect(res.plausible).toBe(false);
      expect(res.confidence).toBe('high');
    });

    it('immediately rejects sub-floor local currency values (e.g. 500 KES monthly)', async () => {
      const res = await checkSalaryPlausibility({
        jobTitle: 'Data Analyst',
        countryName: 'Kenya',
        experienceLevel: 'mid',
        employmentType: 'full_time',
        currency: 'KES',
        grossMonthlySalary: 500,
      });
      expect(res.plausible).toBe(false);
      expect(res.confidence).toBe('high');
    });
  });
});
