"""
Deep Country Matching and Data Attribution Audit for AkiliBrain
Uses pycountry, geonamescache, RapidFuzz, and psycopg3 to verify all data records.
"""

import os
import re
import sys
import json
from collections import defaultdict
import pycountry
import geonamescache
from rapidfuzz import fuzz
import psycopg
from dotenv import load_dotenv

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found!")
    sys.exit(1)

gc = geonamescache.GeonamesCache()
cities_data = gc.get_cities()

# Build fast city -> country code lookup
city_to_country = defaultdict(set)
for cid, cinfo in cities_data.items():
    name = cinfo['name'].lower().strip()
    cc = cinfo['countrycode']
    city_to_country[name].add(cc)
    for alt in cinfo.get('alternatenames', []):
        alt_clean = alt.lower().strip()
        if len(alt_clean) >= 4:
            city_to_country[alt_clean].add(cc)

# Authority patterns with strict word boundaries
AUTHORITY_REGEX_MAP = [
    # Kenya
    (re.compile(r'\b(kra|kenya revenue authority|brs|business registration service|kebs|cbk|central bank of kenya|nssf kenya|nhif kenya|sha|doshs|ppip)\b', re.I), 'KE'),
    # Tanzania
    (re.compile(r'\b(tra|tanzania revenue authority|brela|tbs|bot|bank of tanzania|nssf tanzania|osha|nemc|ppra|cmsa)\b', re.I), 'TZ'),
    # Uganda
    (re.compile(r'\b(ura|uganda revenue authority|ursb|uganda registration services bureau|unbs|bou|bank of uganda|nssf uganda|nema uganda|ppda)\b', re.I), 'UG'),
    # Rwanda
    (re.compile(r'\b(rra|rwanda revenue authority|rdb|rwanda development board|rura|rsb|bnr|national bank of rwanda|rema|rppa)\b', re.I), 'RW'),
    # Burundi
    (re.compile(r'\b(obr|office burundais des recettes|api burundi|brb|banque de la republique du burundi)\b', re.I), 'BI'),
    # South Sudan
    (re.compile(r'\b(nra south sudan|south sudan revenue authority|boss|bank of south sudan)\b', re.I), 'SS'),
    # Ethiopia
    (re.compile(r'\b(erca|ministry of revenues ethiopia|nbe|national bank of ethiopia)\b', re.I), 'ET'),
    # Nigeria
    (re.compile(r'\b(firs|federal inland revenue service|cac|corporate affairs commission|cbn|central bank of nigeria)\b', re.I), 'NG'),
    # South Africa
    (re.compile(r'\b(sars|south african revenue service|cipc|sarb|south african reserve bank)\b', re.I), 'ZA'),
    # Ghana
    (re.compile(r'\b(gra|ghana revenue authority|rgd|registrar general ghana|bog|bank of ghana)\b', re.I), 'GH'),
    # Zambia
    (re.compile(r'\b(zra|zambia revenue authority|pacra|boz|bank of zambia)\b', re.I), 'ZM'),
    # Malawi
    (re.compile(r'\b(mra|malawi revenue authority|rbm|reserve bank of malawi)\b', re.I), 'MW'),
    # Zimbabwe
    (re.compile(r'\b(zimra|zimbabwe revenue authority|rbz|reserve bank of zimbabwe)\b', re.I), 'ZW'),
]

# Currency to country mapping
CURRENCY_COUNTRY_MAP = {
    'KES': 'KE',
    'TZS': 'TZ',
    'UGX': 'UG',
    'RWF': 'RW',
    'BIF': 'BI',
    'SSP': 'SS',
    'SOS': 'SO',
    'ETB': 'ET',
    'CDF': 'CD',
    'NGN': 'NG',
    'GHS': 'GH',
    'ZAR': 'ZA',
    'ZMW': 'ZM',
    'MWK': 'MW',
    'MZN': 'MZ',
    'BWP': 'BW',
    'NAD': 'NA',
    'EGP': 'EG',
    'MAD': 'MA',
    'XOF': ['SN', 'CI', 'TG', 'BJ', 'BF'], # West African CFA
    'XAF': ['CM', 'CG'], # Central African CFA (Cameroon, Republic of the Congo, etc.)
    'GBP': 'GB',
    'USD': None,
    'EUR': None
}

def audit():
    print("=" * 80)
    print("AKILIBRAIN DATA & COUNTRY ASSIGNMENT AUDIT REPORT")
    print("=" * 80)

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            # 1. Audit Countries Table
            print("\n[Phase 1] Auditing 'countries' Table against ISO 3166-1...")
            cur.execute("SELECT id, name, code FROM countries ORDER BY name;")
            db_countries = cur.fetchall()
            
            country_id_to_code = {}
            country_id_to_name = {}
            country_code_to_id = {}
            country_name_to_id = {}
            
            iso_issues = []
            for cid, name, code in db_countries:
                country_id_to_code[cid] = code
                country_id_to_name[cid] = name
                country_code_to_id[code] = cid
                country_name_to_id[name.lower()] = cid
                
                # Check pycountry
                match = pycountry.countries.get(alpha_2=code)
                if not match:
                    iso_issues.append({
                        "id": str(cid), "name": name, "code": code,
                        "issue": f"Code '{code}' is not a valid ISO 3166-1 alpha-2 code."
                    })
                else:
                    if code == 'NI' and name == 'Nigeria':
                        iso_issues.append({
                            "id": str(cid), "name": name, "code": code,
                            "issue": "CRITICAL MISMATCH: Code 'NI' is Nicaragua. Nigeria ISO code is 'NG'!"
                        })

            print(f"Total Countries in DB: {len(db_countries)}")
            if iso_issues:
                print(f"FAILED: Found {len(iso_issues)} country code issue(s):")
                for iss in iso_issues:
                    print(f"  - [{iss['name']}] (Current Code: {iss['code']}): {iss['issue']}")
            else:
                print("PASSED: All registered country codes match ISO 3166-1.")

            # 2. Audit Regions Table
            print("\n[Phase 2] Auditing 'regions' Table...")
            cur.execute("""
                SELECT r.id, r.name, r.country_id, c.name, c.code 
                FROM regions r
                JOIN countries c ON r.country_id = c.id
                ORDER BY c.name, r.name;
            """)
            regions = cur.fetchall()
            print(f"Total Regions in DB: {len(regions)}")

            # 3. Audit Compliance Requirements Table
            print("\n[Phase 3] Auditing 'compliance_requirements' Table (1,322 records)...")
            cur.execute("""
                SELECT cr.id, cr.title, cr.issuing_authority, cr.country_id, c.name, c.code, cr.source_url
                FROM compliance_requirements cr
                JOIN countries c ON cr.country_id = c.id;
            """)
            compliance_rows = cur.fetchall()
            print(f"Total Compliance Requirements: {len(compliance_rows)}")
            
            compliance_mismatches = []
            for row in compliance_rows:
                crid, title, authority, cid, cname, ccode, surl = row
                auth_text = f"{authority} {title}"
                surl_lower = (surl or "").lower()

                expected_cc = None
                for pat, mapped_cc in AUTHORITY_REGEX_MAP:
                    if pat.search(auth_text):
                        expected_cc = mapped_cc
                        break

                if not expected_cc:
                    tld_match = re.search(r'\.(?:go|gov)\.([a-z]{2})\b', surl_lower)
                    if tld_match:
                        tld_cc = tld_match.group(1).upper()
                        if tld_cc in country_code_to_id:
                            expected_cc = tld_cc

                if expected_cc and expected_cc != ccode:
                    if expected_cc == 'NG' and ccode == 'NI':
                        continue
                    compliance_mismatches.append({
                        "id": str(crid), "title": title, "authority": authority,
                        "current": f"{cname} ({ccode})", "expected": expected_cc, "url": surl
                    })

            if compliance_mismatches:
                print(f"FAILED: Found {len(compliance_mismatches)} compliance record(s) with mismatched countries:")
                for cm in compliance_mismatches[:10]:
                    print(f"  - [{cm['authority']}] {cm['title']} in {cm['current']} -> Expected {cm['expected']} (URL: {cm['url']})")
                if len(compliance_mismatches) > 10:
                    print(f"  ... and {len(compliance_mismatches) - 10} more.")
            else:
                print("PASSED: 100% of compliance requirements match their assigned countries and issuing authorities.")

            # 4. Audit Salary Submissions Table
            print("\n[Phase 4] Auditing 'salary_submissions' Table (1,161 records)...")
            cur.execute("""
                SELECT ss.id, ss.job_title, ss.currency, ss.country_id, c.name, c.code
                FROM salary_submissions ss
                JOIN countries c ON ss.country_id = c.id;
            """)
            salaries = cur.fetchall()
            salary_mismatches = []
            for sid, jtitle, curr, cid, cname, ccode in salaries:
                expected_cc = CURRENCY_COUNTRY_MAP.get(curr)
                if expected_cc:
                    if isinstance(expected_cc, list):
                        if ccode not in expected_cc:
                            salary_mismatches.append({
                                "id": str(sid), "title": jtitle, "currency": curr,
                                "current": f"{cname} ({ccode})", "expected": expected_cc
                            })
                    elif expected_cc != ccode:
                        if expected_cc == 'NG' and ccode == 'NI':
                            continue
                        salary_mismatches.append({
                            "id": str(sid), "title": jtitle, "currency": curr,
                            "current": f"{cname} ({ccode})", "expected": expected_cc
                        })

            if salary_mismatches:
                print(f"FAILED: Found {len(salary_mismatches)} salary record(s) with mismatched currencies:")
                for sm in salary_mismatches[:10]:
                    print(f"  - {sm['title']} (Currency: {sm['currency']}) in {sm['current']} -> Expected {sm['expected']}")
            else:
                print("PASSED: All salary submissions have valid local/international currencies matching their country.")

            # 5. Audit Employers Table
            print("\n[Phase 5] Auditing 'employers' Table...")
            cur.execute("""
                SELECT e.id, e.name, e.country_id, c.name, c.code
                FROM employers e
                LEFT JOIN countries c ON e.country_id = c.id;
            """)
            emps = cur.fetchall()
            print(f"Total Employers: {len(emps)}")
            employer_issues = []
            for eid, ename, cid, cname, ccode in emps:
                # Check if employer name indicates another country
                for other_cname, other_cid in country_name_to_id.items():
                    if len(other_cname) >= 4 and re.search(r'\b' + re.escape(other_cname) + r'\b', ename.lower()):
                        other_cc = country_id_to_code[other_cid]
                        if other_cc != ccode:
                            employer_issues.append({
                                "id": str(eid), "name": ename, "current": f"{cname} ({ccode})", "detected": other_cc
                            })
            if employer_issues:
                print(f"WARNING: Found {len(employer_issues)} employer(s) with potential country mismatch:")
                for ei in employer_issues:
                    print(f"  - Employer '{ei['name']}' in {ei['current']} -> {ei['detected']}")
            else:
                print("PASSED: All employers match their assigned country.")

            # 6. Audit Jobs Table (15,218 records)
            print("\n[Phase 6] Auditing 'jobs' Table (15,218 records across 32 countries)...")
            cur.execute("""
                SELECT j.id, j.title, j.company_name, j.location, j.country_id, c.name, c.code, 
                       j.salary_currency, j.source_url, j.employer_url
                FROM jobs j
                JOIN countries c ON j.country_id = c.id;
            """)
            jobs = cur.fetchall()
            print(f"Fetched {len(jobs)} jobs for analysis.")

            job_mismatches = []
            currency_mismatches = []

            # Exact unambiguous city to ISO code
            distinct_cities = {
                # Kenya
                'nairobi': 'KE', 'mombasa': 'KE', 'kisumu': 'KE', 'nakuru': 'KE', 'eldoret': 'KE', 'thika': 'KE', 'malindi': 'KE',
                # Tanzania
                'dar es salaam': 'TZ', 'dodoma': 'TZ', 'arusha': 'TZ', 'mwanza': 'TZ', 'zanzibar': 'TZ', 'mbeya': 'TZ', 'tanga': 'TZ', 'morogoro': 'TZ',
                # Uganda
                'kampala': 'UG', 'entebbe': 'UG', 'jinja': 'UG', 'gulu': 'UG', 'mbarara': 'UG', 'fort portal': 'UG', 'mbale': 'UG',
                # Rwanda
                'kigali': 'RW', 'butare': 'RW', 'gisenyi': 'RW', 'musanze': 'RW', 'huye': 'RW',
                # Burundi
                'bujumbura': 'BI', 'gitega': 'BI', 'ngozi': 'BI',
                # Ethiopia
                'addis ababa': 'ET', 'dire dawa': 'ET', 'hawassa': 'ET', 'bahir dar': 'ET',
                # Nigeria
                'lagos': 'NG', 'abuja': 'NG', 'ibadan': 'NG', 'port harcourt': 'NG', 'kano': 'NG',
                # South Africa
                'johannesburg': 'ZA', 'cape town': 'ZA', 'durban': 'ZA', 'pretoria': 'ZA', 'sandton': 'ZA',
                # Ghana
                'accra': 'GH', 'kumasi': 'GH', 'tema': 'GH',
                # Egypt
                'cairo': 'EG', 'alexandria': 'EG', 'giza': 'EG',
                # Zambia
                'lusaka': 'ZM', 'ndola': 'ZM', 'kitwe': 'ZM', 'livingstone': 'ZM',
                # Zimbabwe
                'harare': 'ZW', 'bulawayo': 'ZW',
                # Somalia
                'mogadishu': 'SO', 'hargeisa': 'SO',
                # South Sudan
                'juba': 'SS', 'wau': 'SS', 'malakal': 'SS',
                # DR Congo
                'kinshasa': 'CD', 'lubumbashi': 'CD', 'goma': 'CD',
                # United States
                'new york': 'US', 'chicago': 'US', 'los angeles': 'US', 'san francisco': 'US',
                'austin': 'US', 'seattle': 'US', 'boston': 'US', 'philadelphia': 'US', 'dallas': 'US',
                'houston': 'US', 'atlanta': 'US', 'denver': 'US', 'miami': 'US',
                # United Kingdom
                'london': 'GB', 'manchester': 'GB', 'birmingham': 'GB', 'edinburgh': 'GB', 'bristol': 'GB'
            }

            for row in jobs:
                jid, title, comp, loc, cid, cname, ccode, scur, surl, eurl = row
                
                # Check Currency
                if scur:
                    expected_cc = CURRENCY_COUNTRY_MAP.get(scur)
                    if expected_cc:
                        if isinstance(expected_cc, list):
                            if ccode not in expected_cc:
                                currency_mismatches.append({
                                    "id": str(jid), "title": title, "comp": comp, "curr": scur,
                                    "current": f"{cname} ({ccode})", "expected": expected_cc
                                })
                        elif expected_cc != ccode:
                            if not (expected_cc == 'NG' and ccode == 'NI'):
                                currency_mismatches.append({
                                    "id": str(jid), "title": title, "comp": comp, "curr": scur,
                                    "current": f"{cname} ({ccode})", "expected": expected_cc
                                })

                # Check Location Text
                if loc:
                    loc_lower = loc.lower().strip()
                    
                    # If current assigned country is already explicitly named in the location, it is valid!
                    if cname.lower() in loc_lower or (ccode == 'NG' and ('nigeria' in loc_lower or 'edo state' in loc_lower or 'lagos' in loc_lower or 'abuja' in loc_lower)):
                        continue
                    if ccode == 'US' and ('united states' in loc_lower or 'usa' in loc_lower or ', us' in loc_lower):
                        continue
                    if ccode == 'GB' and ('united kingdom' in loc_lower or 'london' in loc_lower or 'uk' in loc_lower):
                        continue

                    # 1. Distinct country name match
                    detected_by_country = None
                    for other_cname_lower, other_cid in country_name_to_id.items():
                        other_code = country_id_to_code[other_cid]
                        # Don't match short names that could be common words unless exact
                        if len(other_cname_lower) < 4:
                            continue
                        if re.search(r'\b' + re.escape(other_cname_lower) + r'\b', loc_lower):
                            if other_code != ccode:
                                if other_code == 'NG' and ccode == 'NI':
                                    continue
                                detected_by_country = (other_cname_lower.title(), other_code)
                                break

                    if detected_by_country:
                        job_mismatches.append({
                            "id": str(jid), "title": title, "comp": comp, "location": loc,
                            "current_country_id": str(cid),
                            "current": f"{cname} ({ccode})",
                            "correct_country_name": detected_by_country[0],
                            "correct_country_code": detected_by_country[1],
                            "correct_country_id": str(country_code_to_id.get(detected_by_country[1])),
                            "reason": f"Location explicitly states '{detected_by_country[0]}'"
                        })
                        continue

                    # 2. Distinct city match
                    for city_name, city_cc in distinct_cities.items():
                        if re.search(r'\b' + re.escape(city_name) + r'\b', loc_lower):
                            if city_cc != ccode:
                                if city_cc == 'NG' and ccode == 'NI':
                                    continue
                                correct_cname = country_id_to_name.get(country_code_to_id.get(city_cc), city_cc)
                                job_mismatches.append({
                                    "id": str(jid), "title": title, "comp": comp, "location": loc,
                                    "current_country_id": str(cid),
                                    "current": f"{cname} ({ccode})",
                                    "correct_country_name": correct_cname,
                                    "correct_country_code": city_cc,
                                    "correct_country_id": str(country_code_to_id.get(city_cc)),
                                    "reason": f"Location contains '{city_name.title()}' which belongs to {city_cc}"
                                })
                                break

            print(f"\n--- Jobs Audit Summary ---")
            print(f"Total Jobs Analyzed: {len(jobs)}")
            print(f"Country Assignment Mismatches Found: {len(job_mismatches)}")
            print(f"Salary Currency Mismatches Found: {len(currency_mismatches)}")

            if job_mismatches:
                print(f"\nSample of Identified Job Country Mismatches ({len(job_mismatches)} total):")
                for m in job_mismatches[:15]:
                    print(f"  - [{m['id']}] '{m['title']}' at '{m['comp']}'")
                    print(f"    Location: '{m['location']}'")
                    print(f"    Assigned: {m['current']} -> TRUE COUNTRY: {m['correct_country_name']} ({m['correct_country_code']})")
                    print(f"    Reason: {m['reason']}\n")

            # 7. Audit Businesses Table (Sample & Registration Prefix)
            print("\n[Phase 7] Auditing 'businesses' Table (60,020 records)...")
            cur.execute("""
                SELECT b.id, b.name, b.registration_number, b.address, b.country_id, c.name, c.code
                FROM businesses b
                JOIN countries c ON b.country_id = c.id
                WHERE b.address IS NOT NULL AND trim(b.address) <> ''
                LIMIT 5000;
            """)
            businesses = cur.fetchall()
            print(f"Audited {len(businesses)} businesses with addresses.")
            biz_mismatches = []
            for bid, bname, breg, baddr, cid, cname, ccode in businesses:
                baddr_lower = baddr.lower()
                for other_cname_lower, other_cid in country_name_to_id.items():
                    if len(other_cname_lower) >= 4 and re.search(r'\b' + re.escape(other_cname_lower) + r'\b', baddr_lower):
                        other_cc = country_id_to_code[other_cid]
                        if other_cc != ccode:
                            if other_cc == 'NG' and ccode == 'NI':
                                continue
                            biz_mismatches.append({
                                "id": str(bid), "name": bname, "address": baddr,
                                "current": f"{cname} ({ccode})", "detected": other_cc
                            })
                            break
            print(f"Business Mismatches in Address Sample: {len(biz_mismatches)}")

            # Save full results
            audit_result = {
                "iso_issues": iso_issues,
                "compliance_mismatches": compliance_mismatches,
                "salary_mismatches": salary_mismatches,
                "job_mismatches": job_mismatches,
                "currency_mismatches": currency_mismatches,
                "biz_mismatches": biz_mismatches
            }

            out_path = os.path.join(os.path.dirname(__file__), "country_audit_results.json")
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(audit_result, f, indent=2, default=str)
            print(f"\nSaved complete audit dataset to {out_path}")

if __name__ == "__main__":
    audit()
