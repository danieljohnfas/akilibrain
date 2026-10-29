import os
import sys
import json
import re
from datetime import datetime
from collections import Counter
from dotenv import dotenv_values
import psycopg
import pycountry
import geonamescache

sys.stdout.reconfigure(encoding='utf-8')

config = dotenv_values('akilibrain/.env.local') or dotenv_values('akilibrain/.env')
db_url = config.get('POSTGRES_URL') or config.get('DATABASE_URL') or config.get('SUPABASE_DB_URL')
if not db_url:
    print('ERROR: Database URL not found.')
    sys.exit(1)

gc = geonamescache.GeonamesCache()
cities = gc.get_cities()
countries_data = gc.get_countries()

print('=== AKILIBRAIN COMPREHENSIVE DATA ANOMALY AUDIT ===')

with psycopg.connect(db_url) as conn:
    with conn.cursor() as cur:
        # 1. Get all public tables
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [r[0] for r in cur.fetchall()]
        print('\n--- TABLE SUMMARY ---')
        for t in tables:
            cur.execute(f'SELECT count(*) FROM "{t}"')
            print(f'  {t:30}: {cur.fetchone()[0]:,d} rows')

        # 2. Get registered countries
        cur.execute('SELECT id, code, name FROM countries ORDER BY code')
        countries = {r[1]: {'id': r[0], 'name': r[2]} for r in cur.fetchall()}
        country_id_to_code = {v['id']: k for k, v in countries.items()}
        print(f'\nTotal Registered Countries: {len(countries)}')

        # 3. AUDIT: JOBS
        print('\n--- AUDITING JOBS TABLE ---')
        cur.execute("""
            SELECT id, title, company_name, location, country_id, is_active, 
                   deadline, posted_date, salary_min, salary_max, salary_currency,
                   source_url
            FROM jobs
        """)
        jobs = cur.fetchall()
        print(f'Total jobs: {len(jobs):,d}')

        # Anomaly checks on jobs
        missing_country_id = 0
        deadlines_in_past_but_active = 0
        invalid_salary_range = 0
        now = datetime.now()

        location_mismatches = []
        unassigned_locations = []

        # Build location parsing regex / patterns
        # Standard country names and common aliases
        country_name_map = {}
        for c in pycountry.countries:
            country_name_map[c.name.lower()] = c.alpha_2
            if hasattr(c, 'common_name'):
                country_name_map[c.common_name.lower()] = c.alpha_2
        
        # Specific aliases
        country_name_map.update({
            'usa': 'US',
            'united states': 'US',
            'united states of america': 'US',
            'uk': 'GB',
            'united kingdom': 'GB',
            'great britain': 'GB',
            'england': 'GB',
            'scotland': 'GB',
            'wales': 'GB',
            'germany': 'DE',
            'deutschland': 'DE',
            'france': 'FR',
            'india': 'IN',
            'tanzania': 'TZ',
            'kenya': 'KE',
            'uganda': 'UG',
            'rwanda': 'RW',
            'burundi': 'BI',
            'south africa': 'ZA',
            'nigeria': 'NG',
            'ghana': 'GH',
            'ethiopia': 'ET',
            'egypt': 'EG',
            'morocco': 'MA',
            'canada': 'CA',
            'australia': 'AU',
            'singapore': 'SG',
            'japan': 'JP',
            'china': 'CN',
            'brazil': 'BR',
            'netherlands': 'NL',
            'ireland': 'IE',
            'spain': 'ES',
            'italy': 'IT',
            'switzerland': 'CH',
            'poland': 'PL',
            'sweden': 'SE',
            'belgium': 'BE',
            'austria': 'AT',
            'mexico': 'MX',
            'peru': 'PE',
            'colombia': 'CO',
            'chile': 'CL',
            'argentina': 'AR',
            'philippines': 'PH',
            'indonesia': 'ID',
            'vietnam': 'VN',
            'thailand': 'TH',
            'malaysia': 'MY',
            'new zealand': 'NZ',
            'south korea': 'KR',
            'korea': 'KR',
            'israel': 'IL',
            'turkey': 'TR',
            'türkiye': 'TR',
            'united arab emirates': 'AE',
            'uae': 'AE',
            'saudi arabia': 'SA',
            'democratic republic of the congo': 'CD',
            'dr congo': 'CD',
            'republic of the congo': 'CG',
            'congo': 'CG',
            'ivory coast': 'CI',
            'côte d\'ivoire': 'CI',
            'cote d\'ivoire': 'CI',
            'zambia': 'ZM',
            'zimbabwe': 'ZW',
            'malawi': 'MW',
            'mozambique': 'MZ',
            'namibia': 'NA',
            'botswana': 'BW',
            'madagascar': 'MG',
            'senegal': 'SN',
            'sierra leone': 'SL',
            'somalia': 'SO',
            'south sudan': 'SS',
            'sudan': 'SD',
            'togo': 'TG',
            'benin': 'BJ',
            'burkina faso': 'BF',
            'cameroon': 'CM',
            'myanmar': 'MM',
            'portugal': 'PT',
            'czech republic': 'CZ',
            'czechia': 'CZ',
            'denmark': 'DK',
            'finland': 'FI',
            'norway': 'NO',
            'greece': 'GR',
            'hungary': 'HU',
            'romania': 'RO',
            'costa rica': 'CR',
            'panama': 'PA',
            'uruguay': 'UY',
            'ecuador': 'EC'
        })

        # Remove "georgia" -> "GE" collision when in US context
        # (country Georgia is GE, but Atlanta Georgia is US)
        # We handle US state names explicitly first!
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

        canadian_provinces = {
            'bc': 'CA', 'british columbia': 'CA', 'on': 'CA', 'ontario': 'CA',
            'qc': 'CA', 'quebec': 'CA', 'ab': 'CA', 'alberta': 'CA',
            'mb': 'CA', 'manitoba': 'CA', 'sk': 'CA', 'saskatchewan': 'CA',
            'ns': 'CA', 'nova scotia': 'CA', 'nb': 'CA', 'new brunswick': 'CA',
            'nl': 'CA', 'newfoundland': 'CA'
        }

        # German states
        german_states = {
            'bw': 'DE', 'baden-württemberg': 'DE', 'baden-wuerttemberg': 'DE',
            'by': 'DE', 'bayern': 'DE', 'bavaria': 'DE',
            'be': 'DE', 'berlin': 'DE',
            'bb': 'DE', 'brandenburg': 'DE',
            'hb': 'DE', 'bremen': 'DE',
            'hh': 'DE', 'hamburg': 'DE',
            'he': 'DE', 'hessen': 'DE', 'hesse': 'DE',
            'mv': 'DE', 'mecklenburg-vorpommern': 'DE',
            'ni': 'DE', 'niedersachsen': 'DE', 'lower saxony': 'DE',
            'nw': 'DE', 'nordrhein-westfalen': 'DE', 'north rhine-westphalia': 'DE',
            'rp': 'DE', 'rheinland-pfalz': 'DE', 'rhineland-palatinate': 'DE',
            'sl': 'DE', 'saarland': 'DE',
            'sn': 'DE', 'sachsen': 'DE', 'saxony': 'DE',
            'st': 'DE', 'sachsen-anhalt': 'DE', 'saxony-anhalt': 'DE',
            'sh': 'DE', 'schleswig-holstein': 'DE',
            'th': 'DE', 'thüringen': 'DE', 'thuringia': 'DE'
        }

        # US states
        us_states = {
            'al': 'US', 'ak': 'US', 'az': 'US', 'ar': 'US', 'ca': 'US', 'co': 'US',
            'ct': 'US', 'de': 'US', 'fl': 'US', 'ga': 'US', 'hi': 'US', 'id': 'US',
            'il': 'US', 'in': 'US', 'ia': 'US', 'ks': 'US', 'ky': 'US', 'la': 'US',
            'me': 'US', 'md': 'US', 'ma': 'US', 'mi': 'US', 'mn': 'US', 'ms': 'US',
            'mo': 'US', 'mt': 'US', 'ne': 'US', 'nv': 'US', 'nh': 'US', 'nj': 'US',
            'nm': 'US', 'ny': 'US', 'nc': 'US', 'nd': 'US', 'oh': 'US', 'ok': 'US',
            'or': 'US', 'pa': 'US', 'ri': 'US', 'sc': 'US', 'sd': 'US', 'tn': 'US',
            'tx': 'US', 'ut': 'US', 'vt': 'US', 'va': 'US', 'wa': 'US', 'wv': 'US',
            'wi': 'US', 'wy': 'US', 'dc': 'US'
        }

        # Major international cities
        major_cities = {
            'london': 'GB', 'paris': 'FR', 'berlin': 'DE', 'tokyo': 'JP', 'singapore': 'SG',
            'sydney': 'AU', 'melbourne': 'AU', 'toronto': 'CA', 'vancouver': 'CA',
            'amsterdam': 'NL', 'dublin': 'IE', 'madrid': 'ES', 'barcelona': 'ES',
            'milan': 'IT', 'rome': 'IT', 'zurich': 'CH', 'geneva': 'CH', 'warsaw': 'PL',
            'stockholm': 'SE', 'brussels': 'BE', 'vienna': 'AT', 'munich': 'DE',
            'frankfurt': 'DE', 'hamburg': 'DE', 'cologne': 'DE', 'stuttgart': 'DE',
            'ulm': 'DE', 'renningen': 'DE', 'gerlingen': 'DE', 'salzgitter': 'DE',
            'reutlingen': 'DE', 'ergolding': 'DE', 'leipzig': 'DE', 'dresden': 'DE',
            'nuremberg': 'DE', 'nürnberg': 'DE', 'mannheim': 'DE', 'karlsruhe': 'DE',
            'san francisco': 'US', 'new york': 'US', 'seattle': 'US', 'austin': 'US',
            'boston': 'US', 'los angeles': 'US', 'chicago': 'US', 'san jose': 'US',
            'san mateo': 'US', 'mountain view': 'US', 'palo alto': 'US', 'sunnyvale': 'US',
            'bengaluru': 'IN', 'bangalore': 'IN', 'mumbai': 'IN', 'hyderabad': 'IN',
            'pune': 'IN', 'delhi': 'IN', 'chennai': 'IN', 'noida': 'IN', 'gurugram': 'IN',
            'nairobi': 'KE', 'mombasa': 'KE', 'dar es salaam': 'TZ', 'arusha': 'TZ',
            'dodoma': 'TZ', 'mwanza': 'TZ', 'kampala': 'UG', 'entebbe': 'UG',
            'kigali': 'RW', 'bujumbura': 'BI', 'addis ababa': 'ET', 'cairo': 'EG',
            'johannesburg': 'ZA', 'cape town': 'ZA', 'durban': 'ZA', 'lagos': 'NG',
            'abuja': 'NG', 'accra': 'GH', 'casablanca': 'MA', 'rabat': 'MA',
            'callao': 'PE', 'lima': 'PE', 'sao paulo': 'BR', 'rio de janeiro': 'BR',
            'bogota': 'CO', 'santiago': 'CL', 'buenos aires': 'AR', 'mexico city': 'MX',
            'manila': 'PH', 'cebu': 'PH', 'bangkok': 'TH', 'kuala lumpur': 'MY',
            'seoul': 'KR', 'taipei': 'TW', 'hong kong': 'HK', 'dubai': 'AE'
        }

        def resolve_location_country(loc_str):
            if not loc_str:
                return None
            loc = loc_str.strip()
            loc_l = loc.lower()

            # Remote patterns first
            if 'remote - usa' in loc_l or 'remote us' in loc_l or 'us remote' in loc_l or 'remote - united states' in loc_l:
                return 'US'
            if 'remote canada' in loc_l or 'canada remote' in loc_l:
                return 'CA'
            if 'remote uk' in loc_l or 'uk remote' in loc_l:
                return 'GB'

            # Split by comma or slash or pipe
            parts = [p.strip() for p in re.split(r'[,|/•-]', loc)]
            
            # Check for Canadian provinces
            for p in parts:
                pl = p.lower()
                if pl in canadian_provinces:
                    return 'CA'

            # Check for US state name or 2-letter postal code
            for p in parts:
                pl = p.lower()
                if pl in us_state_names or (pl in us_states and len(pl) == 2):
                    # verify it's not a German state collision like BW or BY
                    if pl not in german_states or 'germany' not in loc_l:
                        return 'US'

            # Check German states if Germany or German city
            if 'germany' in loc_l or 'deutschland' in loc_l:
                return 'DE'
            for p in parts:
                pl = p.lower()
                if pl in german_states and ('germany' in loc_l or any(c in loc_l for c in ['ulm', 'renningen', 'gerlingen', 'salzgitter', 'stuttgart', 'ergolding'])):
                    return 'DE'

            # Check direct country match from right to left (most specific to least)
            for p in reversed(parts):
                pl = p.lower()
                if pl in country_name_map and pl not in us_state_names:
                    return country_name_map[pl]

            # Check for city
            for city, code in major_cities.items():
                if re.search(r'\b' + re.escape(city) + r'\b', loc_l):
                    return code

            # Check entire string for explicit country names (with word boundaries)
            for cname, code in country_name_map.items():
                if cname not in us_state_names and re.search(r'\b' + re.escape(cname) + r'\b', loc_l):
                    return code

            return None

        jobs_by_detected_country = Counter()
        mismatched_jobs = []

        for j in jobs:
            jid, title, comp, loc, cid, is_act, dline, pdate, smin, smax, scur, surl = j
            curr_code = country_id_to_code.get(cid)
            if not curr_code:
                missing_country_id += 1

            # Check past deadline but active
            if dline and is_act:
                try:
                    if isinstance(dline, str):
                        dl_dt = datetime.fromisoformat(dline.replace('Z', '+00:00'))
                    else:
                        dl_dt = dline
                    if dl_dt < now:
                        deadlines_in_past_but_active += 1
                except Exception:
                    pass

            # Check salary min > max
            if smin and smax and float(smin) > float(smax):
                invalid_salary_range += 1

            # Check location match
            detected = resolve_location_country(loc)
            if detected:
                jobs_by_detected_country[detected] += 1
                if curr_code != detected:
                    mismatched_jobs.append({
                        'id': str(jid),
                        'title': title,
                        'company': comp,
                        'location': loc,
                        'current_code': curr_code,
                        'detected_code': detected
                    })
            else:
                unassigned_locations.append(loc)

        print(f'Missing country_id: {missing_country_id}')
        print(f'Deadlines in past but marked active: {deadlines_in_past_but_active}')
        print(f'Invalid salary ranges (min > max): {invalid_salary_range}')
        print(f'Jobs with detected location: {len(jobs) - len(unassigned_locations):,d}')
        print(f'Jobs with undetectable/generic location (e.g. "Remote", "Hybrid"): {len(unassigned_locations):,d}')
        print(f'CRITICAL MISMATCHES (Location Country != Assigned Country): {len(mismatched_jobs):,d}')

        print('\nTop Detected Countries for Jobs:')
        for ccode, count in jobs_by_detected_country.most_common(20):
            in_db = ccode in countries
            print(f'  {ccode:3} (In DB: {str(in_db):5}): {count:5,d} jobs')

        print('\nSample Mismatches:')
        for m in mismatched_jobs[:10]:
            print(f"  [{m['current_code']} -> {m['detected_code']}] {m['company']} - {m['title'][:40]} | Loc: {m['location']}")

        # 4. AUDIT: TENDERS
        print('\n--- AUDITING TENDERS TABLE ---')
        cur.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'tenders'
        """)
        t_cols = [r[0] for r in cur.fetchall()]
        print(f'Tenders columns: {t_cols}')
        cur.execute('SELECT count(*) FROM tenders')
        t_count = cur.fetchone()[0]
        print(f'Total tenders: {t_count:,d}')

        # 5. AUDIT: COMPLIANCE REQUIREMENTS
        print('\n--- AUDITING COMPLIANCE REQUIREMENTS ---')
        cur.execute("""
            SELECT id, title, issuing_authority, country_id
            FROM compliance_requirements
        """)
        comp_reqs = cur.fetchall()
        print(f'Total compliance requirements: {len(comp_reqs):,d}')
        comp_mismatches = []
        for cid, ctitle, auth, ccid in comp_reqs:
            ccode = country_id_to_code.get(ccid)
            if not ccode:
                comp_mismatches.append((cid, ctitle, auth, 'Missing country'))
        print(f'Compliance requirements with invalid country: {len(comp_mismatches)}')

        # 6. AUDIT: SALARY SUBMISSIONS
        print('\n--- AUDITING SALARY SUBMISSIONS ---')
        cur.execute("""
            SELECT id, job_title, gross_monthly_salary, currency, country_id
            FROM salary_submissions
        """)
        sals = cur.fetchall()
        print(f'Total salary submissions: {len(sals):,d}')
        sal_anomalies = []
        for sid, stitle, sbase, scurr, scid in sals:
            scode = country_id_to_code.get(scid)
            if not scode:
                sal_anomalies.append((sid, stitle, sbase, scurr, 'Missing country'))
            elif scurr:
                # Check known currency mismatches
                if scurr == 'TZS' and scode != 'TZ':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'TZS in {scode}'))
                elif scurr == 'KES' and scode != 'KE':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'KES in {scode}'))
                elif scurr == 'UGX' and scode != 'UG':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'UGX in {scode}'))
                elif scurr == 'RWF' and scode != 'RW':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'RWF in {scode}'))
                elif scurr == 'BIF' and scode != 'BI':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'BIF in {scode}'))
                elif scurr == 'NGN' and scode != 'NG':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'NGN in {scode}'))
                elif scurr == 'GHS' and scode != 'GH':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'GHS in {scode}'))
                elif scurr == 'ZAR' and scode != 'ZA':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'ZAR in {scode}'))
                elif scurr == 'EGP' and scode != 'EG':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'EGP in {scode}'))
                elif scurr == 'MAD' and scode != 'MA':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'MAD in {scode}'))
                elif scurr == 'ETB' and scode != 'ET':
                    sal_anomalies.append((sid, stitle, sbase, scurr, f'ETB in {scode}'))
        print(f'Salary submissions with currency/country anomalies: {len(sal_anomalies)}')
        for s in sal_anomalies[:10]:
            print(f'  {s}')

        # 7. AUDIT: HEALTH DATA POINTS
        print('\n--- AUDITING HEALTH DATA POINTS ---')
        cur.execute("""
            SELECT hdp.id, hi.code, hi.name, hdp.value, hi.unit, hdp.country_id, hdp.year
            FROM health_data_points hdp
            JOIN health_indicators hi ON hdp.indicator_id = hi.id
        """)
        health = cur.fetchall()
        print(f'Total health data points: {len(health):,d}')
        health_anomalies = []
        for hid, hcode, hname, hval, hunit, hcid, hyear in health:
            ccode = country_id_to_code.get(hcid)
            if not ccode:
                health_anomalies.append((hid, hname, 'Missing country'))
            if hval is not None:
                if 'rate' in (hunit or '').lower() and (hval < 0 or hval > 1000):
                    health_anomalies.append((hid, hname, f'Extreme value {hval} {hunit}'))
        print(f'Health data anomalies: {len(health_anomalies)}')

        # 8. AUDIT: BUSINESSES
        print('\n--- AUDITING BUSINESSES ---')
        cur.execute("""
            SELECT id, name, country_id, registration_number, status
            FROM businesses
        """)
        businesses = cur.fetchall()
        print(f'Total businesses: {len(businesses):,d}')
        biz_missing_country = sum(1 for b in businesses if b[2] not in country_id_to_code)
        print(f'Businesses missing valid country: {biz_missing_country}')

        # Summary of required remedies
        print('\n=== AUDIT SUMMARY & RECTIFICATION STATUS ===')
        print(f'1. Total jobs audited: {len(jobs):,d}')
        print(f'2. Critical Location Country != Assigned Country mismatches remaining: {len(mismatched_jobs):,d}')
        print(f'3. Compliance requirements with invalid country: {len(comp_mismatches)}')
        print(f'4. Salary submissions with currency/country anomalies: {len(sal_anomalies)}')
        print(f'5. Health data anomalies: {len(health_anomalies)}')
        print(f'6. Businesses missing valid country: {biz_missing_country}')
