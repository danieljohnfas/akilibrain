CREATE TABLE IF NOT EXISTS archived_jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_name TEXT,
  description TEXT,
  requirements TEXT,
  location TEXT,
  country_id TEXT,
  country_name TEXT,
  region_name TEXT,
  job_type TEXT,
  source_url TEXT,
  posted_date TEXT,
  deadline TEXT,
  is_active INTEGER DEFAULT 0,
  created_at TEXT,
  salary_min REAL,
  salary_max REAL,
  salary_currency TEXT,
  employer_url TEXT,
  sector TEXT,
  profession TEXT,
  experience_level TEXT,
  education_level TEXT,
  skills TEXT,
  archived_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_archived_jobs_deadline ON archived_jobs(deadline);
CREATE INDEX IF NOT EXISTS idx_archived_jobs_company ON archived_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_archived_jobs_country ON archived_jobs(country_name);

CREATE TABLE IF NOT EXISTS archived_tenders (
  id TEXT PRIMARY KEY,
  reference_no TEXT,
  title TEXT NOT NULL,
  description TEXT,
  contracting_authority TEXT,
  country_id TEXT,
  country_name TEXT,
  sector_name TEXT,
  category TEXT,
  status TEXT,
  budget REAL,
  currency TEXT,
  published_at TEXT,
  deadline TEXT,
  source_url TEXT,
  document_url TEXT,
  extracted_text TEXT,
  employer_url TEXT,
  ai_summary TEXT,
  created_at TEXT,
  archived_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_archived_tenders_deadline ON archived_tenders(deadline);
CREATE INDEX IF NOT EXISTS idx_archived_tenders_authority ON archived_tenders(contracting_authority);
CREATE INDEX IF NOT EXISTS idx_archived_tenders_country ON archived_tenders(country_name);
