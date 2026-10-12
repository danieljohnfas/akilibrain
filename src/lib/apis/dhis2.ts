/**
 * DHIS2 Web API Client
 * Interfaces with District Health Information Software 2 instances across East Africa.
 */

export interface Dhis2Config {
  baseUrl: string;
  username?: string;
  password?: string;
  pat?: string; // Personal Access Token
}

export interface Dhis2DataValue {
  dataElement: string;
  period: string;
  orgUnit: string;
  value: string;
  storedBy?: string;
  created?: string;
  lastUpdated?: string;
}

export class Dhis2Client {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: Dhis2Config) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    if (config.pat) {
      this.headers['Authorization'] = `ApiToken ${config.pat}`;
    } else if (config.username && config.password) {
      const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.headers['Authorization'] = `Basic ${auth}`;
    }
  }

  /**
   * Fetch organisation units (districts, regions, health facilities)
   */
  async getOrganisationUnits(level: number = 1, pageSize: number = 50) {
    const url = `${this.baseUrl}/api/organisationUnits.json?level=${level}&pageSize=${pageSize}&fields=id,displayName,level,parent[id,displayName]`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`DHIS2 Error: ${res.status} ${res.statusText}`);
    return res.json();
  }

  /**
   * Fetch aggregated analytics data
   */
  async getAnalytics(dimensions: { dx: string[]; pe: string[]; ou: string[] }) {
    const dx = dimensions.dx.join(';');
    const pe = dimensions.pe.join(';');
    const ou = dimensions.ou.join(';');
    const url = `${this.baseUrl}/api/analytics.json?dimension=dx:${dx}&dimension=pe:${pe}&dimension=ou:${ou}`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`DHIS2 Analytics Error: ${res.status} ${res.statusText}`);
    return res.json();
  }
}