import { generateObjectWithFallback } from '../ai/router';
import { z } from 'zod';

export interface PlausibilityResult {
  plausible: boolean;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

const CURRENCY_MONTHLY_BOUNDS: Record<string, [number, number]> = {
  KES: [8_000, 3_500_000],
  UGX: [150_000, 80_000_000],
  TZS: [150_000, 60_000_000],
  RWF: [50_000, 25_000_000],
  ETB: [3_000, 1_500_000],
  ZMW: [1_500, 500_000],
  GHS: [800, 300_000],
  NGN: [50_000, 25_000_000],
  ZAR: [3_500, 600_000],
  BIF: [100_000, 40_000_000],
  CDF: [100_000, 40_000_000],
  SSP: [20_000, 30_000_000],
  SOS: [100_000, 50_000_000],
  USD: [80, 35_000],
  EUR: [80, 35_000],
  GBP: [80, 30_000],
};

const COUNTRY_ALLOWED_CURRENCIES: Record<string, string[]> = {
  kenya: ['KES', 'USD', 'EUR', 'GBP'],
  uganda: ['UGX', 'USD', 'EUR', 'GBP'],
  tanzania: ['TZS', 'USD', 'EUR', 'GBP'],
  rwanda: ['RWF', 'USD', 'EUR', 'GBP'],
  ethiopia: ['ETB', 'USD', 'EUR', 'GBP'],
  zambia: ['ZMW', 'USD', 'EUR', 'GBP'],
  ghana: ['GHS', 'USD', 'EUR', 'GBP'],
  nigeria: ['NGN', 'USD', 'EUR', 'GBP'],
  'south africa': ['ZAR', 'USD', 'EUR', 'GBP'],
  burundi: ['BIF', 'USD', 'EUR', 'GBP'],
  'south sudan': ['SSP', 'USD', 'EUR', 'GBP'],
  somalia: ['SOS', 'USD', 'EUR', 'GBP'],
  'democratic republic of the congo': ['CDF', 'USD', 'EUR', 'GBP'],
};

/**
 * Strategy 1: Deterministic Bounds + AI Plausibility Check
 * Rejects unknown currencies, country-currency mismatches, and numeric outliers
 * deterministically before invoking the AI plausibility verifier.
 */
export async function checkSalaryPlausibility(params: {
  jobTitle: string;
  countryName: string;
  experienceLevel: string;
  employmentType: string;
  currency: string;
  grossMonthlySalary: number;
}): Promise<PlausibilityResult> {
  const { jobTitle, countryName, experienceLevel, employmentType, currency, grossMonthlySalary } = params;
  const upperCurrency = (currency || '').trim().toUpperCase();
  const lowerCountry = (countryName || '').trim().toLowerCase();

  const bounds = CURRENCY_MONTHLY_BOUNDS[upperCurrency];
  if (!bounds) {
    return {
      plausible: false,
      confidence: 'high',
      reason: `Unsupported or unverified currency code: ${upperCurrency}`,
    };
  }

  if (grossMonthlySalary < bounds[0] || grossMonthlySalary > bounds[1]) {
    return {
      plausible: false,
      confidence: 'high',
      reason: `Monthly salary ${upperCurrency} ${grossMonthlySalary.toLocaleString()} is outside realistic bounds [${bounds[0].toLocaleString()} - ${bounds[1].toLocaleString()}]`,
    };
  }

  const allowedForCountry = COUNTRY_ALLOWED_CURRENCIES[lowerCountry];
  if (allowedForCountry && !allowedForCountry.includes(upperCurrency)) {
    return {
      plausible: false,
      confidence: 'high',
      reason: `Currency ${upperCurrency} does not match local or international benchmark currencies for ${countryName}`,
    };
  }

  const prompt = `You are a salary data quality reviewer for East Africa. Assess whether the following salary submission is plausible.

Job Title: ${jobTitle}
Country: ${countryName}
Experience Level: ${experienceLevel}
Employment Type: ${employmentType}
Gross Monthly Salary: ${currency} ${grossMonthlySalary.toLocaleString()}

Rules:
- Compare against known East African salary benchmarks for this role and seniority.
- Flag as implausible only if clearly fraudulent or wildly unrealistic (e.g. entry-level accountant earning USD 50,000/month in Tanzania, or a CEO earning TZS 50,000/month).
- Be conservative: if you're uncertain, lean toward marking it plausible.
- A high confidence plausible rating means you're quite sure this is realistic.
- Return a short, factual reason (1 sentence max).`;

  try {
    const { object } = await generateObjectWithFallback({
      schema: z.object({
        plausible: z.boolean(),
        confidence: z.enum(['high', 'medium', 'low']),
        reason: z.string().max(200),
      }),
      prompt,
    });

    return object;
  } catch (err) {
    // On error, fail open (don't block submission) but don't auto-verify
    console.error('[salary-plausibility] AI check failed:', err);
    return { plausible: false, confidence: 'low', reason: 'AI check unavailable' };
  }
}
