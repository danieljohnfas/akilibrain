import { db } from '../../db/client';
import { countries } from '../../db/schema/shared';

export interface CountryResolver {
  resolveCountryId(locationStr: string, fallbackCode?: string): string | null;
  getCountryMap(): Map<string, string>;
}

const CITY_TO_COUNTRY_NAME: Record<string, string> = {
  // Kenya
  'nairobi': 'kenya', 'mombasa': 'kenya', 'kisumu': 'kenya', 'nakuru': 'kenya', 'eldoret': 'kenya',
  'thika': 'kenya', 'kitale': 'kenya', 'malindi': 'kenya', 'garissa': 'kenya', 'kakamega': 'kenya',

  // Uganda
  'kampala': 'uganda', 'entebbe': 'uganda', 'jinja': 'uganda', 'gulu': 'uganda', 'mbarara': 'uganda', 'mbale': 'uganda',

  // Tanzania
  'dar es salaam': 'tanzania', 'dodoma': 'tanzania', 'arusha': 'tanzania', 'mwanza': 'tanzania',
  'zanzibar': 'tanzania', 'morogoro': 'tanzania', 'mbeya': 'tanzania', 'tanga': 'tanzania',

  // Rwanda
  'kigali': 'rwanda', 'butare': 'rwanda', 'gisenyi': 'rwanda', 'musanze': 'rwanda',

  // Nigeria
  'lagos': 'nigeria', 'abuja': 'nigeria', 'port harcourt': 'nigeria', 'ibadan': 'nigeria',
  'kano': 'nigeria', 'benin city': 'nigeria', 'warri': 'nigeria', 'enugu': 'nigeria', 'kaduna': 'nigeria',

  // Ghana
  'accra': 'ghana', 'kumasi': 'ghana', 'tamale': 'ghana', 'sekondi': 'ghana', 'takoradi': 'ghana', 'cape coast': 'ghana',

  // Zambia
  'lusaka': 'zambia', 'ndola': 'zambia', 'kitwe': 'zambia', 'livingstone': 'zambia', 'kabwe': 'zambia', 'chingola': 'zambia',

  // Ethiopia
  'addis ababa': 'ethiopia', 'hawassa': 'ethiopia', 'dire dawa': 'ethiopia', 'mekelle': 'ethiopia', 'gondar': 'ethiopia',

  // DRC
  'kinshasa': 'democratic republic of the congo', 'lubumbashi': 'democratic republic of the congo',
  'goma': 'democratic republic of the congo', 'bukavu': 'democratic republic of the congo',

  // Burundi
  'bujumbura': 'burundi', 'gitega': 'burundi',

  // Somalia
  'mogadishu': 'somalia', 'hargeisa': 'somalia', 'garowe': 'somalia',

  // South Sudan
  'juba': 'south sudan', 'wau': 'south sudan'
};

const ISO_CODE_TO_NAME: Record<string, string> = {
  'KE': 'kenya',
  'UG': 'uganda',
  'TZ': 'tanzania',
  'RW': 'rwanda',
  'GH': 'ghana',
  'NG': 'nigeria',
  'NI': 'nigeria',
  'ZM': 'zambia',
  'ZA': 'zambia', // in database, Zambia is coded as ZA
  'ET': 'ethiopia',
  'BI': 'burundi',
  'SO': 'somalia',
  'SS': 'south sudan',
  'CD': 'democratic republic of the congo'
};

export async function createCountryResolver(): Promise<CountryResolver> {
  const dbCountries = await db.select().from(countries);
  
  const countryNameMap = new Map<string, string>();
  const countryCodeMap = new Map<string, string>();

  for (const c of dbCountries) {
    countryNameMap.set(c.name.toLowerCase(), c.id);
    if (c.code) {
      countryCodeMap.set(c.code.toUpperCase(), c.id);
    }
  }

  return {
    getCountryMap() {
      return countryNameMap;
    },

    resolveCountryId(locationStr: string, fallbackCode?: string): string | null {
      if (!locationStr && !fallbackCode) return null;
      const loc = (locationStr || '').toLowerCase();

      // 1. Direct country name match in location string
      for (const [name, id] of countryNameMap.entries()) {
        if (loc.includes(name)) {
          return id;
        }
      }

      // Check DRC alias
      if (loc.includes('drc') || loc.includes('dr congo')) {
        const drcId = countryNameMap.get('democratic republic of the congo');
        if (drcId) return drcId;
      }

      // 2. City name match in location string
      for (const [city, countryName] of Object.entries(CITY_TO_COUNTRY_NAME)) {
        if (loc.includes(city)) {
          const id = countryNameMap.get(countryName);
          if (id) return id;
        }
      }

      // 3. Fallback ISO code check
      if (fallbackCode) {
        const upperCode = fallbackCode.toUpperCase();
        if (countryCodeMap.has(upperCode)) {
          return countryCodeMap.get(upperCode) || null;
        }
        const mappedName = ISO_CODE_TO_NAME[upperCode];
        if (mappedName && countryNameMap.has(mappedName)) {
          return countryNameMap.get(mappedName) || null;
        }
      }

      return null;
    }
  };
}
