/**
 * WHO African Region (AFRO) Health Observatory Client
 * Fetches epidemiological indicators and health statistics across the African region.
 */

export interface WhoAfroIndicator {
  code: string;
  name: string;
  category?: string;
}

export interface WhoAfroDataPoint {
  countryCode: string;
  year: number;
  value: number;
  indicatorCode: string;
}

export class WhoAfroClient {
  private ghoBaseUrl = 'https://ghoapi.azureedge.net/api';

  /**
   * Fetch indicators from the WHO Global Health Observatory API (filtered for African Region / countries)
   */
  async getIndicatorData(indicatorCode: string, countryIso3?: string): Promise<WhoAfroDataPoint[]> {
    let url = `${this.ghoBaseUrl}/${indicatorCode}`;
    if (countryIso3) {
      url += `?$filter=SpatialDim eq '${countryIso3}'`;
    }

    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!res.ok) throw new Error(`WHO GHO Error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    return (data.value || []).map((row: any) => ({
      countryCode: row.SpatialDim,
      year: parseInt(row.TimeDim, 10),
      value: parseFloat(row.NumericValue),
      indicatorCode,
    })).filter((pt: WhoAfroDataPoint) => !isNaN(pt.value) && !isNaN(pt.year));
  }
}