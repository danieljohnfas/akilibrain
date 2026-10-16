import { describe, it, expect } from 'vitest';
import {
  isForeignMisattribution,
  inferExperienceLevel,
  inferEducationLevel,
  stripScraperBoilerplate,
  normalizeJobRecordForIngestion,
  normalizeTenderForIngestion,
  normalizeComplianceForIngestion,
} from '../ingestion-standards';
import { checkSalaryPlausibility } from '../../salaries/verify-plausibility';

describe('Scraping & Data Ingestion Standards (ingestion-standards.ts)', () => {
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

  describe('inferExperienceLevel & inferEducationLevel', () => {
    it('never classifies a Director or Head role as entry_level even if text mentions interns', () => {
      expect(inferExperienceLevel(null, 'Country Director', 'Will oversee staff and interns in Juba')).toBe('executive');
      expect(inferExperienceLevel(null, 'Head of Finance', 'Supervises junior accountants')).toBe('executive');
    });

    it('infers education level accurately from title and text', () => {
      expect(inferEducationLevel(null, 'Public Health Advisor', 'MPH or MSc required')).toBe('masters_degree');
      expect(inferEducationLevel(null, 'Field Technician', 'TVET or Diploma in Electrical Engineering')).toBe('diploma');
      expect(inferEducationLevel(null, 'Software Engineer', 'BSc in Computer Science')).toBe('bachelor_degree');
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
