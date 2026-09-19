-- LEVOIS Evidence Library V2.1 migration — LEGACY ONLY
-- Use only to upgrade a D1 database created with the pre-V2.1 prototype schema.
-- Fresh databases must use db/evidence-library-schema.sql directly.

ALTER TABLE evidence ADD COLUMN origin TEXT;
ALTER TABLE evidence ADD COLUMN evidence_kind TEXT;
ALTER TABLE evidence ADD COLUMN source_registry_id TEXT;
ALTER TABLE evidence ADD COLUMN source_registry_ids_json TEXT;
ALTER TABLE evidence ADD COLUMN engine_use_class TEXT NOT NULL DEFAULT 'REUSABLE_IMMEDIATELY';
ALTER TABLE evidence ADD COLUMN engine_policy_version TEXT;
ALTER TABLE evidence ADD COLUMN verification_required_for_property_application INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evidence ADD COLUMN verification_required_for_person_application INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evidence ADD COLUMN verification_required_before_publication INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evidence ADD COLUMN reuse_modes_json TEXT;
ALTER TABLE evidence ADD COLUMN future_application_guard TEXT;
ALTER TABLE evidence ADD COLUMN verification_scope_v21 TEXT;
ALTER TABLE evidence ADD COLUMN freshness_json TEXT;
ALTER TABLE evidence ADD COLUMN geographic_precision_json TEXT;
ALTER TABLE evidence ADD COLUMN temporal_precision_json TEXT;
ALTER TABLE evidence ADD COLUMN decision_use TEXT;
ALTER TABLE evidence ADD COLUMN source_exact_url_variants_json TEXT;
ALTER TABLE evidence ADD COLUMN publication_status TEXT;
ALTER TABLE evidence ADD COLUMN n_mutations INTEGER;
ALTER TABLE evidence ADD COLUMN public_price_benchmark_allowed INTEGER;
ALTER TABLE evidence ADD COLUMN search_text TEXT;

CREATE INDEX IF NOT EXISTS idx_evidence_engine_use ON evidence(engine_use_class);
CREATE INDEX IF NOT EXISTS idx_evidence_publish_guard
  ON evidence(verification_required_before_publication, engine_use_class);
CREATE INDEX IF NOT EXISTS idx_evidence_origin ON evidence(origin);

CREATE TABLE IF NOT EXISTS evidence_aliases (
  alias_id TEXT PRIMARY KEY,
  canonical_id TEXT NOT NULL,
  reason TEXT,
  library_version TEXT NOT NULL DEFAULT 'V21'
);

CREATE TABLE IF NOT EXISTS evidence_sources_v21 (
  source_id TEXT PRIMARY KEY,
  publisher TEXT,
  title TEXT,
  url TEXT,
  scope_v21 TEXT,
  evidence_count_v21 INTEGER,
  evidence_rechecked_v21 INTEGER,
  new_evidence_v21 INTEGER,
  next_review_date_v21 TEXT,
  validation_statuses_v21 TEXT,
  v21_archives TEXT,
  verification_notice TEXT
);

CREATE TABLE IF NOT EXISTS evidence_refresh_v21 (
  evidence_id TEXT PRIMARY KEY,
  domain TEXT,
  source_registry_id TEXT,
  status TEXT,
  source_url TEXT,
  source_date TEXT,
  observation_period TEXT,
  retrieved_at TEXT,
  last_reverified_v21 TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  engine_use_class TEXT,
  verification_required_before_publication INTEGER,
  verify_property INTEGER,
  verify_person INTEGER,
  future_only INTEGER,
  verification_scope_v21 TEXT
);

CREATE INDEX IF NOT EXISTS idx_refresh_v21_use
  ON evidence_refresh_v21(engine_use_class, verification_required_before_publication);
CREATE INDEX IF NOT EXISTS idx_refresh_v21_review
  ON evidence_refresh_v21(next_review_date, refresh_policy);


-- FTS5 index used by the Studio retrieval layer.
-- It deliberately excludes large JSON fields and stores only search-relevant text.
CREATE VIRTUAL TABLE IF NOT EXISTS evidence_search USING fts5(
  evidence_id UNINDEXED,
  topic,
  subtopic,
  geographic_label,
  period,
  claim,
  decision_use,
  tokenize='unicode61 remove_diacritics 2'
);
