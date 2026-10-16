import { db } from '../../db/client';
import { countries } from '../../db/schema/shared';
import { isForeignMisattribution } from '../ingestion-standards';

export interface CountryResolver {
  resolveCountryId(locationStr: string, fallbackCode?: string): string | null;
  resolveLocationAndCountry(locationStr: string, fallbackCode?: string): { countryId: string | null; location: string };
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

  // Nigeria (cities and states)
  'lagos': 'nigeria', 'abuja': 'nigeria', 'port harcourt': 'nigeria', 'ibadan': 'nigeria',
  'kano': 'nigeria', 'benin city': 'nigeria', 'warri': 'nigeria', 'enugu': 'nigeria', 'kaduna': 'nigeria',
  'ebonyi': 'nigeria', 'kebbi': 'nigeria', 'borno': 'nigeria', 'katsina': 'nigeria', 'gombe': 'nigeria',
  'adamawa': 'nigeria', 'taraba': 'nigeria', 'bauchi': 'nigeria', 'delta state': 'nigeria', 'plateau': 'nigeria',
  'abia': 'nigeria', 'edo state': 'nigeria', 'kogi': 'nigeria',

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
  'juba': 'south sudan', 'wau': 'south sudan', 'malakal': 'south sudan', 'bentiu': 'south sudan', 'maban': 'south sudan',

  // Cameroon
  'douala': 'cameroon', 'yaounde': 'cameroon', 'bafoussam': 'cameroon', 'garoua': 'cameroon', 'bamenda': 'cameroon',
  'bankim': 'cameroon', 'obala': 'cameroon',

  // Benin
  'cotonou': 'benin', 'porto-novo': 'benin', 'parakou': 'benin', 'kilibo': 'benin', 'kouande': 'benin',
  'tchatchou': 'benin', 'tanguieta': 'benin', 'savalou': 'benin', 'atlantique': 'benin',

  // Togo
  'lome': 'togo', 'lomé': 'togo', 'sokode': 'togo', 'kara': 'togo',

  // Mozambique
  'maputo': 'mozambique', 'matola': 'mozambique', 'beira': 'mozambique', 'nampula': 'mozambique',

  // Madagascar
  'antananarivo': 'madagascar', 'toamasina': 'madagascar', 'analamanga': 'madagascar',

  // South Africa
  'johannesburg': 'south africa', 'cape town': 'south africa', 'durban': 'south africa', 'pretoria': 'south africa',
  'soweto': 'south africa', 'sandton': 'south africa', 'midrand': 'south africa', 'thokoza': 'south africa',
  'free state': 'south africa', 'north west': 'south africa', 'mpumalanga': 'south africa',

  // Malawi
  'lilongwe': 'malawi', 'blantyre': 'malawi', 'mzuzu': 'malawi', 'zomba': 'malawi',

  // Sierra Leone
  'freetown': 'sierra leone',

  // Senegal
  'dakar': 'senegal',

  // Côte d'Ivoire
  'abidjan': "côte d'ivoire", 'yamoussoukro': "côte d'ivoire",

  // India
  'mumbai': 'india', 'new delhi': 'india', 'delhi': 'india', 'bangalore': 'india', 'bengaluru': 'india',
  'gurugram': 'india', 'noida': 'india', 'hyderabad': 'india', 'pune': 'india', 'balangir': 'india', 'panvel': 'india',

  // United States
  'lansing': 'united states', 'detroit': 'united states', 'new york': 'united states', 'san francisco': 'united states',

  // United Kingdom
  'london': 'united kingdom', 'manchester': 'united kingdom',

  // Myanmar
  'yangon': 'myanmar', 'mandalay': 'myanmar',

  // Philippines
  'manila': 'philippines', 'cebu': 'philippines',
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
  'ZA': 'south africa',
  'ET': 'ethiopia',
  'BI': 'burundi',
  'SO': 'somalia',
  'SS': 'south sudan',
  'CD': 'democratic republic of the congo',
  'CM': 'cameroon',
  'BJ': 'benin',
  'TG': 'togo',
  'MZ': 'mozambique',
  'MG': 'madagascar',
  'MW': 'malawi',
  'SL': 'sierra leone',
  'SN': 'senegal',
  'CI': "côte d'ivoire",
  'ZW': 'zimbabwe',
  'BW': 'botswana',
  'NA': 'namibia',
  'EG': 'egypt',
  'MA': 'morocco',
  'IN': 'india',
  'US': 'united states',
  'GB': 'united kingdom',
  'MM': 'myanmar',
  'PH': 'philippines',
};

export async function createCountryResolver(): Promise<CountryResolver> {
  const dbCountries = await db.select().from(countries);
  
  const countryNameMap = new Map<string, string>();
  const countryCodeMap = new Map<string, string>();
  const idToCountryObj = new Map<string, { id: string; name: string; code: string }>();

  for (const c of dbCountries) {
    countryNameMap.set(c.name.toLowerCase(), c.id);
    idToCountryObj.set(c.id, c);
    if (c.code) {
      countryCodeMap.set(c.code.toUpperCase(), c.id);
    }
  }

  function resolveId(locationStr: string, fallbackCode?: string): string | null {
    if (!locationStr && !fallbackCode) return null;
    const loc = (locationStr || '').toLowerCase();

    // Skip USIU false positive (United States International University in Kenya)
    if (loc.includes('usiu') || loc.includes('united states international university')) {
      return countryNameMap.get('kenya') || null;
    }

    // 1. Direct country name match in location string
    for (const [name, id] of countryNameMap.entries()) {
      if (loc.includes(name)) {
        return id;
      }
    }

    // Check aliases
    if (loc.includes('drc') || loc.includes('dr congo')) {
      const drcId = countryNameMap.get('democratic republic of the congo');
      if (drcId) return drcId;
    }
    if (loc.includes('benin republic')) {
      const beninId = countryNameMap.get('benin');
      if (beninId) return beninId;
    }
    if (loc.includes('ivory coast')) {
      const ciId = countryNameMap.get("côte d'ivoire");
      if (ciId) return ciId;
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

  return {
    getCountryMap() {
      return countryNameMap;
    },

    resolveCountryId(locationStr: string, fallbackCode?: string): string | null {
      return resolveId(locationStr, fallbackCode);
    },

    resolveLocationAndCountry(locationStr: string, fallbackCode?: string): { countryId: string | null; location: string } {
      const countryId = resolveId(locationStr, fallbackCode);
      const countryObj = countryId ? idToCountryObj.get(countryId) : null;
      const countryName = countryObj ? countryObj.name : 'East Africa';

      let formattedLocation = (locationStr || '').trim();
      if (!formattedLocation || formattedLocation.toLowerCase() === 'remote' || formattedLocation.toLowerCase() === 'hybrid') {
        formattedLocation = countryName;
      } else if (!formattedLocation.toLowerCase().includes(countryName.toLowerCase())) {
        formattedLocation = `${formattedLocation}, ${countryName}`;
      }

      return {
        countryId,
        location: formattedLocation,
      };
    }
  };
}
