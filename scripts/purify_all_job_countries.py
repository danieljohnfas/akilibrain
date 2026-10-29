import os
import sys
import re
from datetime import datetime
from collections import Counter
from dotenv import dotenv_values
import psycopg
import pycountry

sys.stdout.reconfigure(encoding='utf-8')

config = dotenv_values('akilibrain/.env.local') or dotenv_values('akilibrain/.env')
db_url = config.get('POSTGRES_URL') or config.get('DATABASE_URL') or config.get('SUPABASE_DB_URL')
if not db_url:
    print('ERROR: Database URL not found.')
    sys.exit(1)

# Build comprehensive country dictionary
country_name_map = {}
for c in pycountry.countries:
    country_name_map[c.name.lower()] = c.alpha_2
    if hasattr(c, 'common_name'):
        country_name_map[c.common_name.lower()] = c.alpha_2
    if hasattr(c, 'official_name'):
        country_name_map[c.official_name.lower()] = c.alpha_2

country_name_map.update({
    'usa': 'US', 'united states': 'US', 'united states of america': 'US', 'u.s.': 'US', 'u.s.a.': 'US',
    'uk': 'GB', 'united kingdom': 'GB', 'great britain': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
    'germany': 'DE', 'deutschland': 'DE', 'france': 'FR', 'india': 'IN', 'canada': 'CA',
    'australia': 'AU', 'singapore': 'SG', 'japan': 'JP', 'china': 'CN', 'brazil': 'BR',
    'netherlands': 'NL', 'the netherlands': 'NL', 'ireland': 'IE', 'spain': 'ES', 'italy': 'IT',
    'switzerland': 'CH', 'poland': 'PL', 'sweden': 'SE', 'belgium': 'BE', 'austria': 'AT',
    'mexico': 'MX', 'peru': 'PE', 'colombia': 'CO', 'chile': 'CL', 'argentina': 'AR',
    'philippines': 'PH', 'indonesia': 'ID', 'vietnam': 'VN', 'viet nam': 'VN', 'thailand': 'TH',
    'malaysia': 'MY', 'new zealand': 'NZ', 'south korea': 'KR', 'korea': 'KR', 'israel': 'IL',
    'turkey': 'TR', 'türkiye': 'TR', 'united arab emirates': 'AE', 'uae': 'AE', 'saudi arabia': 'SA',
    'czech republic': 'CZ', 'czechia': 'CZ', 'denmark': 'DK', 'finland': 'FI', 'norway': 'NO',
    'greece': 'GR', 'hungary': 'HU', 'romania': 'RO', 'costa rica': 'CR', 'panama': 'PA',
    'uruguay': 'UY', 'ecuador': 'EC', 'portugal': 'PT', 'hong kong': 'HK', 'taiwan': 'TW',
    'south africa': 'ZA', 'kenya': 'KE', 'tanzania': 'TZ', 'uganda': 'UG', 'rwanda': 'RW',
    'burundi': 'BI', 'ethiopia': 'ET', 'egypt': 'EG', 'nigeria': 'NG', 'ghana': 'GH',
    'morocco': 'MA', 'zambia': 'ZM', 'zimbabwe': 'ZW', 'malawi': 'MW', 'mozambique': 'MZ',
    'namibia': 'NA', 'botswana': 'BW', 'madagascar': 'MG', 'senegal': 'SN', 'sierra leone': 'SL',
    'somalia': 'SO', 'south sudan': 'SS', 'sudan': 'SD', 'togo': 'TG', 'benin': 'BJ',
    'burkina faso': 'BF', 'cameroon': 'CM', 'democratic republic of the congo': 'CD',
    'dr congo': 'CD', 'republic of the congo': 'CG', 'congo': 'CG', 'côte d\'ivoire': 'CI',
    'cote d\'ivoire': 'CI', 'ivory coast': 'CI', 'myanmar': 'MM', 'iceland': 'IS'
})

us_state_names = {
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado',
    'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho',
    'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana',
    'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota',
    'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
    'new hampshire', 'new jersey', 'new mexico', 'new york',
    'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon',
    'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
    'west virginia', 'wisconsin', 'wyoming', 'district of columbia'
}

us_states_codes = {
    'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id',
    'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms',
    'mo', 'mt', 'ne', 'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok',
    'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv',
    'wi', 'wy', 'dc'
}

canadian_provinces = {
    'bc': 'CA', 'british columbia': 'CA', 'on': 'CA', 'ontario': 'CA',
    'qc': 'CA', 'quebec': 'CA', 'ab': 'CA', 'alberta': 'CA',
    'mb': 'CA', 'manitoba': 'CA', 'sk': 'CA', 'saskatchewan': 'CA',
    'ns': 'CA', 'nova scotia': 'CA', 'nb': 'CA', 'new brunswick': 'CA',
    'nl': 'CA', 'newfoundland': 'CA'
}

german_states = {
    'bw', 'baden-württemberg', 'baden-wuerttemberg', 'by', 'bayern', 'bavaria',
    'be', 'berlin', 'bb', 'brandenburg', 'hb', 'bremen', 'hh', 'hamburg',
    'he', 'hessen', 'hesse', 'mv', 'mecklenburg-vorpommern',
    'ni', 'niedersachsen', 'lower saxony', 'nw', 'nordrhein-westfalen', 'north rhine-westphalia',
    'rp', 'rheinland-pfalz', 'rhineland-palatinate', 'sl', 'saarland',
    'sn', 'sachsen', 'saxony', 'st', 'sachsen-anhalt', 'saxony-anhalt',
    'sh', 'schleswig-holstein', 'th', 'thüringen', 'thuringia'
}

major_cities = {
    'london': 'GB', 'paris': 'FR', 'berlin': 'DE', 'tokyo': 'JP', 'singapore': 'SG',
    'sydney': 'AU', 'melbourne': 'AU', 'brisbane': 'AU', 'toronto': 'CA', 'vancouver': 'CA',
    'montreal': 'CA', 'ottawa': 'CA', 'calgary': 'CA', 'waterloo': 'CA',
    'amsterdam': 'NL', 'dublin': 'IE', 'madrid': 'ES', 'barcelona': 'ES',
    'milan': 'IT', 'rome': 'IT', 'zurich': 'CH', 'zürich': 'CH', 'geneva': 'CH', 'warsaw': 'PL',
    'krakow': 'PL', 'stockholm': 'SE', 'brussels': 'BE', 'vienna': 'AT', 'munich': 'DE',
    'münchen': 'DE', 'frankfurt': 'DE', 'hamburg': 'DE', 'cologne': 'DE', 'köln': 'DE',
    'stuttgart': 'DE', 'ulm': 'DE', 'renningen': 'DE', 'gerlingen': 'DE', 'salzgitter': 'DE',
    'reutlingen': 'DE', 'ergolding': 'DE', 'leipzig': 'DE', 'dresden': 'DE',
    'nuremberg': 'DE', 'nürnberg': 'DE', 'mannheim': 'DE', 'karlsruhe': 'DE',
    'immenstadt': 'DE', 'biberach': 'DE', 'wernau': 'DE', 'abstatt': 'DE', 'hildesheim': 'DE',
    'san francisco': 'US', 'new york': 'US', 'seattle': 'US', 'austin': 'US',
    'boston': 'US', 'los angeles': 'US', 'chicago': 'US', 'san jose': 'US',
    'san mateo': 'US', 'mountain view': 'US', 'palo alto': 'US', 'sunnyvale': 'US',
    'atlanta': 'US', 'denver': 'US', 'dallas': 'US', 'houston': 'US', 'san diego': 'US',
    'bengaluru': 'IN', 'bangalore': 'IN', 'mumbai': 'IN', 'hyderabad': 'IN',
    'pune': 'IN', 'delhi': 'IN', 'new delhi': 'IN', 'chennai': 'IN', 'noida': 'IN', 'gurugram': 'IN',
    'nairobi': 'KE', 'mombasa': 'KE', 'kisumu': 'KE', 'kitui': 'KE',
    'dar es salaam': 'TZ', 'arusha': 'TZ', 'dodoma': 'TZ', 'mwanza': 'TZ',
    'kampala': 'UG', 'entebbe': 'UG', 'kigali': 'RW', 'bujumbura': 'BI',
    'addis ababa': 'ET', 'cairo': 'EG', 'johannesburg': 'ZA', 'cape town': 'ZA',
    'durban': 'ZA', 'lagos': 'NG', 'abuja': 'NG', 'accra': 'GH', 'casablanca': 'MA',
    'callao': 'PE', 'lima': 'PE', 'sao paulo': 'BR', 'são paulo': 'BR', 'rio de janeiro': 'BR',
    'sao jose dos campos': 'BR', 'são josé dos campos': 'BR',
    'bogota': 'CO', 'bogotá': 'CO', 'santiago': 'CL', 'buenos aires': 'AR',
    'mexico city': 'MX', 'guadalajara': 'MX', 'monterrey': 'MX',
    'manila': 'PH', 'cebu': 'PH', 'bangkok': 'TH', 'kuala lumpur': 'MY',
    'seoul': 'KR', 'taipei': 'TW', 'hong kong': 'HK', 'dubai': 'AE', 'abu dhabi': 'AE',
    'riyadh': 'SA', 'lisbon': 'PT', 'porto': 'PT', 'ho chi minh': 'VN', 'hanoi': 'VN',
    'shanghai': 'CN', 'beijing': 'CN', 'shenzhen': 'CN', 'guangzhou': 'CN',
    'osaka': 'JP', 'copenhagen': 'DK', 'helsinki': 'FI', 'oslo': 'NO', 'prague': 'CZ',
    'budapest': 'HU', 'bucharest': 'RO', 'athens': 'GR', 'tel aviv': 'IL',
    'malmö': 'SE', 'malmo': 'SE', 'reykjavík': 'IS', 'reykjavik': 'IS',
    'goma': 'CD', 'kongo central': 'CD', 'lukula': 'CD', 'zomba': 'MW'
}

company_hq_map = {
    'cloudflare': 'US',
    'databricks': 'US',
    'datadog': 'US',
    'stripe': 'US',
    'anthropic': 'US',
    'mongodb': 'US',
    'elastic': 'US',
    'okta': 'US',
    'toast': 'US',
    'roblox': 'US',
    'brex': 'US',
    'gitlab': 'US',
    'affirm': 'US',
    'coinbase': 'US',
    'airbnb': 'US',
    'riot games': 'US',
    'lyft': 'US',
    'reddit': 'US',
    'givedirectly': 'US',
    'adyen': 'NL',
    'deliveroo': 'GB',
    'canonical': 'GB',
    'sun king': 'KE',
    'sgs': 'CH',
    'bosch group': 'DE'
}

def resolve_location(loc_str, company_name=None):
    if not loc_str:
        return None
    loc = loc_str.strip()
    loc_l = loc.lower()
    comp_l = (company_name or '').lower()

    # Canonical remote / office rules
    if 'canonical' in comp_l:
        if 'taiwan' in loc_l or 'taipei' in loc_l:
            return 'TW'
        return 'GB'

    # Canadian cities with "CA" as country abbreviation
    canadian_cities = ['toronto', 'vancouver', 'montreal', 'ottawa', 'calgary', 'edmonton', 'waterloo']
    if any(city in loc_l for city in canadian_cities):
        return 'CA'

    # Common US metro abbreviations
    if any(k in loc_l for k in ['nyc', 'sf', 'bay area', 'silicon valley', 'usca']):
        return 'US'

    # Switzerland
    if 'zürich' in loc_l or 'zurich' in loc_l or 'geneva' in loc_l or 'genève' in loc_l:
        return 'CH'

    # Remote USA / Canada / UK
    if any(k in loc_l for k in ['remote - usa', 'remote usa', 'remote us', 'us remote', 'remote - united states', 'remote united states', 'remote, us', 'remote - us', 'us-remote', 'remote (u.s.)', 'us - remote']) or loc in ('US', 'MX'):
        return 'MX' if loc == 'MX' else 'US'
    if any(k in loc_l for k in ['remote canada', 'canada remote', 'remote - canada']):
        return 'CA'
    if any(k in loc_l for k in ['remote uk', 'uk remote', 'remote - uk', 'remote - united kingdom']):
        return 'GB'

    # US Capitol / region strings
    if any(k in loc_l for k in ['washington, d.c.', 'washington d.c.', 'maryland; virginia']):
        return 'US'

    # Split by separators
    parts = [p.strip() for p in re.split(r'[,|/•-]', loc) if p.strip()]

    # Check for Germany specifically if German state or city is mentioned
    if 'germany' in loc_l or 'deutschland' in loc_l:
        return 'DE'
    for p in parts:
        pl = p.lower()
        if pl in german_states and ('bosch' in comp_l or any(c in loc_l for c in ['ulm', 'renningen', 'gerlingen', 'salzgitter', 'stuttgart', 'ergolding'])):
            return 'DE'

    # Check for Canadian province
    for p in parts:
        pl = p.lower()
        if pl in canadian_provinces:
            return 'CA'

    # Check for direct country match in parts from right to left
    for p in reversed(parts):
        pl = p.lower()
        if pl in country_name_map and pl not in us_state_names and pl not in us_states_codes:
            return country_name_map[pl]

    # Check for cities
    for city, code in major_cities.items():
        if re.search(r'\b' + re.escape(city) + r'\b', loc_l):
            return code

    # Check for US state name or 2-letter state code
    for p in parts:
        pl = p.lower()
        if pl in us_state_names:
            return 'US'
        if pl in us_states_codes and len(pl) == 2:
            return 'US'

    # Substring search for country names
    for cname, code in country_name_map.items():
        if cname not in us_state_names and cname not in us_states_codes:
            if re.search(r'\b' + re.escape(cname) + r'\b', loc_l):
                return code

    # If location is generic ('hybrid', 'remote', 'distributed', 'multiple locations')
    # Fallback to company headquarters
    if any(g in loc_l for g in ['hybrid', 'remote', 'distributed', 'multiple locations', 'n/a', 'in-office', 'deliveroo']):
        for comp, code in company_hq_map.items():
            if comp in comp_l:
                return code

    return None

print("Connecting to Supabase PostgreSQL database...")
with psycopg.connect(db_url) as conn:
    conn.autocommit = False
    with conn.cursor() as cur:
        # 1. Fetch current countries
        cur.execute("SELECT id, code, name FROM countries")
        country_code_to_id = {r[1]: r[0] for r in cur.fetchall()}
        country_id_to_code = {r[0]: r[1] for r in country_code_to_id.items()}
        print(f"Current countries in DB: {len(country_code_to_id)}")

        # 2. Fetch all jobs
        cur.execute("SELECT id, title, company_name, location, country_id FROM jobs")
        all_jobs = cur.fetchall()
        print(f"Total jobs to analyze: {len(all_jobs)}")

        # 3. Determine updates & newly required countries
        updates = []
        new_country_codes = set()
        for jid, title, comp, loc, current_cid in all_jobs:
            target_code = resolve_location(loc, comp)
            if not target_code:
                continue  # Retain existing if unresolvable
            
            if target_code not in country_code_to_id:
                new_country_codes.add(target_code)

            current_code = country_id_to_code.get(current_cid)
            if current_code != target_code:
                updates.append((jid, target_code, current_code, title, comp, loc))

        print(f"\nNew countries required to register: {len(new_country_codes)}")
        for code in sorted(new_country_codes):
            c_obj = pycountry.countries.get(alpha_2=code)
            c_name = c_obj.name if c_obj else code
            print(f"  Registering: {code} -> {c_name}")
            cur.execute("""
                INSERT INTO countries (name, code)
                VALUES (%s, %s)
                ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name
                RETURNING id, code
            """, (c_name, code))
            new_id, returned_code = cur.fetchone()
            country_code_to_id[returned_code] = new_id

        print(f"Total registered countries now: {len(country_code_to_id)}")
        print(f"Total jobs requiring country purification: {len(updates):,d}")

        # 4. Perform batch updates
        batch_data = [(country_code_to_id[target_code], jid) for jid, target_code, _, _, _, _ in updates]
        print(f"Applying {len(batch_data):,d} updates to jobs table...")
        
        # Execute batch update
        cur.executemany("""
            UPDATE jobs
            SET country_id = %s, updated_at = NOW()
            WHERE id = %s
        """, batch_data)
        
        conn.commit()
        print("Successfully committed all job country realignments!")

        # 5. Verification on specific job
        user_job_id = 'a1683148-edbb-4b79-9a03-36928cbc9b95'
        cur.execute("""
            SELECT j.id, j.title, j.company_name, j.location, c.code, c.name
            FROM jobs j
            JOIN countries c ON j.country_id = c.id
            WHERE j.id = %s
        """, (user_job_id,))
        verified_job = cur.fetchone()
        print("\n--- SPECIFIC JOB VERIFICATION ---")
        print(f"Job ID: {verified_job[0]}")
        print(f"Title: {verified_job[1]}")
        print(f"Employer: {verified_job[2]}")
        print(f"Location: {verified_job[3]}")
        print(f"Assigned Country: {verified_job[4]} ({verified_job[5]})")

        # 6. Overall distribution check
        cur.execute("""
            SELECT c.code, c.name, count(j.id)
            FROM countries c
            LEFT JOIN jobs j ON j.country_id = c.id
            GROUP BY c.code, c.name
            HAVING count(j.id) > 0
            ORDER BY count(j.id) DESC
        """)
        top_countries = cur.fetchall()
        print(f"\n--- TOP COUNTRY DISTRIBUTION POST-PURIFICATION ({len(top_countries)} active countries) ---")
        for code, name, count in top_countries[:25]:
            print(f"  {code:3} | {name:28} | {count:5,d} jobs")
