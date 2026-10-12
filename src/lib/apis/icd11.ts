/**
 * WHO ICD-11 API Client
 * Official WHO International Classification of Diseases (11th Revision) API.
 * Docs: https://icd.who.int/icdapi
 */

export interface Icd11Config {
  clientId?: string;
  clientSecret?: string;
}

export interface Icd11SearchResult {
  title: string;
  stemId: string;
  theCode?: string;
  score?: number;
}

export class Icd11Client {
  private token: string | null = null;
  private tokenExpiry: number = 0;
  private clientId: string;
  private clientSecret: string;

  constructor(config?: Icd11Config) {
    this.clientId = config?.clientId || process.env.ICD11_CLIENT_ID || '';
    this.clientSecret = config?.clientSecret || process.env.ICD11_CLIENT_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('ICD-11 API credentials missing. Set ICD11_CLIENT_ID and ICD11_CLIENT_SECRET.');
    }

    const res = await fetch('https://icdaccessmanagement.who.int/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'icdapi_access',
        grant_type: 'client_credentials',
      }),
    });

    if (!res.ok) throw new Error(`ICD-11 Auth Error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return this.token!;
  }

  /**
   * Search ICD-11 entities by keyword (e.g. "malaria", "tuberculosis", "cholera")
   */
  async search(query: string, release: string = '2024-01'): Promise<Icd11SearchResult[]> {
    const token = await this.getAccessToken();
    const url = `https://id.who.int/icd/release/11/${release}/mms/search?q=${encodeURIComponent(query)}&useFlexisearch=true`;
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'API-Version': 'v2',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) throw new Error(`ICD-11 Search Error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    return (data.destinationEntities || []).map((entity: any) => ({
      title: entity.title,
      stemId: entity.stemId,
      theCode: entity.theCode,
      score: entity.score,
    }));
  }
}