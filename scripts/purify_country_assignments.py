"""
Country Assignment Purification Script for AkiliBrain
Resolves country mismatches across countries, compliance, salaries, and jobs tables.
"""

import os
import sys
import re
import json
import psycopg
from dotenv import load_dotenv

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found!")
    sys.exit(1)

def run_purification(dry_run=True):
    mode_str = "DRY RUN (Preview Only)" if dry_run else "LIVE EXECUTION (Applying Changes)"
    print("=" * 80)
    print(f"AKILIBRAIN DATA & COUNTRY PURIFICATION: {mode_str}")
    print("=" * 80)

    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            # -------------------------------------------------------------
            # STEP 1: Fix Nigeria Country Code
            # -------------------------------------------------------------
            print("\n[Step 1] Verifying & Correcting Nigeria ISO Code...")
            cur.execute("SELECT id, name, code FROM countries WHERE name = 'Nigeria';")
            nigeria = cur.fetchone()
            if nigeria and nigeria[2] == 'NI':
                print(f"  -> Fixing Nigeria ISO code from 'NI' to 'NG' (ID: {nigeria[0]})")
                if not dry_run:
                    cur.execute("UPDATE countries SET code = 'NG' WHERE id = %s;", (nigeria[0],))
            else:
                print("  -> Nigeria already has code 'NG' or not found.")

            # -------------------------------------------------------------
            # STEP 2: Ensure Missing Benchmark Countries Exist
            # -------------------------------------------------------------
            print("\n[Step 2] Ensuring Sovereign Countries for Benchmark Datasets...")
            countries_to_ensure = [
                ('Republic of the Congo', 'CG'),
                ('Burkina Faso', 'BF')
            ]
            for cname, ccode in countries_to_ensure:
                cur.execute("SELECT id FROM countries WHERE code = %s;", (ccode,))
                row = cur.fetchone()
                if not row:
                    print(f"  -> Adding country '{cname}' ({ccode})")
                    if not dry_run:
                        cur.execute("INSERT INTO countries (id, name, code) VALUES (gen_random_uuid(), %s, %s);", (cname, ccode))
                else:
                    print(f"  -> Country '{cname}' ({ccode}) already exists (ID: {row[0]})")

            # Refresh country mappings
            cur.execute("SELECT id, code, name FROM countries;")
            all_countries = cur.fetchall()
            code_to_id = {c[1]: c[0] for c in all_countries}
            id_to_code = {c[0]: c[1] for c in all_countries}
            id_to_name = {c[0]: c[2] for c in all_countries}

            # In dry-run mode, provide mock IDs for countries to be added
            if dry_run:
                for cname, ccode in countries_to_ensure:
                    if ccode not in code_to_id:
                        mock_id = f"mock-id-{ccode}"
                        code_to_id[ccode] = mock_id
                        id_to_code[mock_id] = ccode
                        id_to_name[mock_id] = cname

            # -------------------------------------------------------------
            # STEP 3: Purify Salary Submissions Country Assignments
            # -------------------------------------------------------------
            print("\n[Step 3] Reassigning Mismatched Salary Submissions...")
            # A. Country Benchmark Names in Title
            title_country_rules = [
                (re.compile(r'\bBotswana\b', re.I), 'BW'),
                (re.compile(r'\bBurundi\b', re.I), 'BI'),
                (re.compile(r'\bBenin\b', re.I), 'BJ'),
                (re.compile(r'\bBurkina Faso\b', re.I), 'BF'),
            ]
            
            cur.execute("SELECT id, job_title, currency, country_id FROM salary_submissions;")
            all_salaries = cur.fetchall()
            salary_updates = []
            
            for sid, jtitle, curr, cid in all_salaries:
                ccode = id_to_code.get(cid)
                target_code = None

                # Rule 1: Title explicitly names country
                for pat, expected_cc in title_country_rules:
                    if pat.search(jtitle):
                        target_code = expected_cc
                        break
                
                # Rule 2: Currency-specific misplaced rows in Ethiopia
                if not target_code and ccode == 'ET':
                    if curr == 'KES': target_code = 'KE'
                    elif curr == 'TZS': target_code = 'TZ'
                    elif curr == 'UGX': target_code = 'UG'
                    elif curr == 'RWF': target_code = 'RW'
                    elif curr == 'ZAR': target_code = 'ZA'
                    elif curr == 'EGP': target_code = 'EG'

                # Rule 3: Paylab CG rows in DRC
                if not target_code and ccode == 'CD' and curr == 'XAF':
                    target_code = 'CG'

                if target_code and target_code != ccode:
                    target_id = code_to_id.get(target_code)
                    if target_id:
                        salary_updates.append((sid, jtitle, curr, ccode, target_code, target_id))

            print(f"  -> Found {len(salary_updates)} salary submissions to reassign:")
            for s in salary_updates[:10]:
                print(f"     * [{s[0]}] '{s[1]}' ({s[2]}) from {s[3]} -> {s[4]}")
            if len(salary_updates) > 10:
                print(f"     ... and {len(salary_updates) - 10} more.")

            if not dry_run and salary_updates:
                for s in salary_updates:
                    cur.execute("UPDATE salary_submissions SET country_id = %s WHERE id = %s;", (s[5], s[0]))
                print(f"  -> Successfully updated {len(salary_updates)} salary submissions.")

            # -------------------------------------------------------------
            # STEP 4: Purify Compliance Requirements Issuing Authorities
            # -------------------------------------------------------------
            print("\n[Step 4] Reassigning Mismatched Compliance Issuing Authorities...")
            canonical_authorities = {
                'KE': 'Kenya National Regulatory & Licensing Authority (KRA / BRS)',
                'UG': 'Uganda Registration & Regulatory Authority (URSB / URA)',
                'RW': 'Rwanda Development Board (RDB) & Regulatory Authority',
                'ET': 'Ethiopian Ministry of Trade & Regional Integration',
                'SS': 'Ministry of Justice and Constitutional Affairs (South Sudan)',
                'SO': 'Ministry of Commerce and Industry (Somalia)',
                'BI': 'Agence de Développement du Burundi (ADB / OBR)',
                'CD': "Guichet Unique de Création d'Entreprise (GUCE / DGI DRC)"
            }

            cur.execute("""
                SELECT cr.id, cr.title, cr.issuing_authority, cr.country_id, c.code, cr.source_url
                FROM compliance_requirements cr
                JOIN countries c ON cr.country_id = c.id
                WHERE (c.code != 'TZ' AND cr.issuing_authority ILIKE '%Tanzania Revenue Authority%')
                   OR (c.code != 'UG' AND cr.issuing_authority ILIKE '%Uganda Revenue Authority%')
                   OR (c.code != 'RW' AND cr.issuing_authority ILIKE '%Rwanda Revenue Authority%')
                   OR (c.code != 'BI' AND cr.issuing_authority ILIKE '%Office Burundais des Recettes%');
            """)
            mismatched_compliance = cur.fetchall()
            print(f"  -> Found {len(mismatched_compliance)} compliance records with alien authorities:")
            compliance_updates = []
            for crid, title, auth, cid, ccode, surl in mismatched_compliance:
                new_auth = canonical_authorities.get(ccode)
                # Specialized checks
                surl_lower = (surl or "").lower()
                title_lower = title.lower()
                if ccode == 'KE':
                    if 'brs.go.ke' in surl_lower or 'business' in title_lower or 'company' in title_lower:
                        new_auth = 'Business Registration Service (BRS)'
                    elif 'kra.go.ke' in surl_lower or 'tax' in title_lower:
                        new_auth = 'Kenya Revenue Authority (KRA)'
                elif ccode == 'UG':
                    if 'ursb.go.ug' in surl_lower or 'registration' in title_lower:
                        new_auth = 'Uganda Registration Services Bureau (URSB)'
                    elif 'ura.go.ug' in surl_lower or 'tax' in title_lower:
                        new_auth = 'Uganda Revenue Authority (URA)'
                elif ccode == 'RW':
                    if 'rdb.rw' in surl_lower:
                        new_auth = 'Rwanda Development Board (RDB)'
                    elif 'rra.gov.rw' in surl_lower:
                        new_auth = 'Rwanda Revenue Authority (RRA)'

                if new_auth:
                    compliance_updates.append((crid, title, auth, new_auth, ccode))

            for cu in compliance_updates[:10]:
                print(f"     * [{cu[4]}] '{cu[1][:50]}' | Old: '{cu[2]}' -> New: '{cu[3]}'")
            if len(compliance_updates) > 10:
                print(f"     ... and {len(compliance_updates) - 10} more.")

            if not dry_run and compliance_updates:
                for cu in compliance_updates:
                    cur.execute("UPDATE compliance_requirements SET issuing_authority = %s WHERE id = %s;", (cu[3], cu[0]))
                print(f"  -> Successfully updated {len(compliance_updates)} compliance issuing authorities.")

            # -------------------------------------------------------------
            # STEP 5: Realign Mismatched Jobs to True Sovereign Countries
            # -------------------------------------------------------------
            print("\n[Step 5] Reassigning Mismatched Jobs to True Sovereign Countries...")
            cur.execute("""
                SELECT j.id, j.title, j.company_name, j.location, j.country_id, c.code, c.name
                FROM jobs j
                JOIN countries c ON j.country_id = c.id;
            """)
            all_jobs = cur.fetchall()

            # High confidence US location patterns
            us_city_state_patterns = [
                re.compile(r'\b(Denver,\s*CO|Denver,\s*Colorado|Denver)\b', re.I),
                re.compile(r'\b(New York City|New York,\s*NY)\b', re.I),
                re.compile(r'\b(Houston,\s*TX|Houston,\s*Texas)\b', re.I),
                re.compile(r'\b(Atlanta,\s*GA|Atlanta,\s*Georgia|Atlanta)\b', re.I),
                re.compile(r'\b(Austin,\s*TX|Austin,\s*Texas)\b', re.I),
                re.compile(r'\b(Dallas,\s*TX|Dallas\s*-\s*Ft\.\s*Worth|Dallas)\b', re.I),
                re.compile(r'\b(Scottsdale,\s*AZ|Scottsdale,\s*Arizona)\b', re.I),
                re.compile(r'\b(Westlake,\s*TX|Menlo Park,\s*CA|San Francisco,\s*CA)\b', re.I),
                re.compile(r'\b(Philadelphia,\s*PA|Philadelphia,\s*Pennsylvania|Philadelphia|Chicago,\s*IL|Seattle,\s*WA)\b', re.I),
                re.compile(r'\b(Miami,\s*FL|Miami)\b', re.I),
                re.compile(r'\bRemote-Friendly,\s*United States\b', re.I),
                re.compile(r'\bRemote,\s*United States\b', re.I),
            ]

            job_updates = []
            for jid, title, comp, loc, cid, ccode, cname in all_jobs:
                if not loc:
                    continue
                loc_clean = loc.strip()
                loc_lower = loc_clean.lower()
                
                target_code = None
                reason = ""

                # Rule 1: Clear US job wrongly placed in Africa/UK
                if ccode != 'US':
                    # Ensure it's not a multi-country listing that includes Africa
                    has_african_country = any(k in loc_lower for k in ['kenya', 'tanzania', 'uganda', 'rwanda', 'nigeria', 'ghana', 'south africa'])
                    if not has_african_country:
                        for pat in us_city_state_patterns:
                            if pat.search(loc_clean):
                                target_code = 'US'
                                reason = f"US Location pattern matched: {loc_clean}"
                                break

                # Rule 1b: Clear UK role wrongly placed in Africa
                if not target_code and ccode != 'GB' and 'united kingdom' in loc_lower:
                    has_other_primary = any(k in loc_lower for k in ['kenya', 'tanzania', 'uganda', 'rwanda', 'nigeria', 'ghana', 'south africa', 'united states'])
                    if not has_other_primary:
                        target_code = 'GB'
                        reason = f"UK Location matched: {loc_clean}"

                # Rule 2: Jumia Senegal jobs
                if not target_code and 'jumia' in comp.lower() and loc_clean == 'Senegal' and ccode != 'SN':
                    target_code = 'SN'
                    reason = "Jumia listing explicitly for Senegal"

                # Rule 3: Jumia Egypt jobs
                if not target_code and 'jumia' in comp.lower() and loc_clean == 'Egypt' and ccode != 'EG':
                    target_code = 'EG'
                    reason = "Jumia listing explicitly for Egypt"

                # Rule 4: Sun King Arusha
                if not target_code and loc_lower == 'arusha' and ccode != 'TZ':
                    target_code = 'TZ'
                    reason = "Arusha is in Tanzania"

                if target_code and target_code != ccode:
                    target_id = code_to_id.get(target_code)
                    if target_id:
                        job_updates.append((jid, title, comp, loc_clean, ccode, target_code, target_id, reason))

            print(f"  -> Found {len(job_updates)} jobs to reassign to their true sovereign countries:")
            for j in job_updates[:15]:
                print(f"     * [{j[0]}] '{j[1]}' at '{j[2]}'")
                print(f"       Location: '{j[3]}' | Current: {j[4]} -> True Country: {j[5]} ({j[7]})")
            if len(job_updates) > 15:
                print(f"     ... and {len(job_updates) - 15} more.")

            if not dry_run and job_updates:
                for j in job_updates:
                    cur.execute("UPDATE jobs SET country_id = %s WHERE id = %s;", (j[6], j[0]))
                print(f"  -> Successfully updated {len(job_updates)} jobs.")

            if not dry_run:
                conn.commit()
                print("\n[SUCCESS] All country assignments and issuing authorities committed to database.")
            else:
                conn.rollback()
                print("\n[DRY RUN COMPLETE] No database changes were committed.")

if __name__ == "__main__":
    dry_run = "--apply" not in sys.argv
    run_purification(dry_run=dry_run)
