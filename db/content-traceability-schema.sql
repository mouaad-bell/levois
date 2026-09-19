-- LEVOIS Content Traceability V1
-- Links published/draft content to canonical Evidence Library identifiers.

CREATE TABLE IF NOT EXISTS content_artifacts (
  artifact_id TEXT PRIMARY KEY,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  route TEXT,
  family_id TEXT,
  canon_version TEXT NOT NULL,
  content_version TEXT NOT NULL,
  status TEXT NOT NULL,
  generated_at TEXT,
  reviewed_at TEXT,
  published_at TEXT,
  content_sha256 TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_content_artifacts_status
  ON content_artifacts(status, artifact_type);

CREATE TABLE IF NOT EXISTS content_evidence_dependencies (
  artifact_id TEXT NOT NULL,
  evidence_id TEXT NOT NULL,
  claim_id TEXT,
  dependency_role TEXT NOT NULL,
  evidence_library_version TEXT NOT NULL,
  evidence_status_snapshot TEXT,
  engine_use_class_snapshot TEXT,
  next_review_date_snapshot TEXT,
  verification_required_before_publication_snapshot INTEGER NOT NULL DEFAULT 0,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (artifact_id, evidence_id, dependency_role),
  FOREIGN KEY (artifact_id) REFERENCES content_artifacts(artifact_id)
);

CREATE INDEX IF NOT EXISTS idx_content_dep_evidence
  ON content_evidence_dependencies(evidence_id, artifact_id);

CREATE TABLE IF NOT EXISTS content_review_queue (
  review_id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  evidence_id TEXT,
  trigger_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN',
  detected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at TEXT,
  resolution TEXT,
  FOREIGN KEY (artifact_id) REFERENCES content_artifacts(artifact_id)
);

CREATE INDEX IF NOT EXISTS idx_content_review_open
  ON content_review_queue(status, severity, detected_at);

CREATE TABLE IF NOT EXISTS content_generation_runs (
  generation_id TEXT PRIMARY KEY,
  artifact_id TEXT,
  input_text TEXT NOT NULL,
  pipeline TEXT NOT NULL,
  canon_version TEXT NOT NULL,
  evidence_library_version TEXT NOT NULL,
  web_used INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  evidence_ids_json TEXT NOT NULL,
  rejected_evidence_ids_json TEXT,
  generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_id TEXT,
  FOREIGN KEY (artifact_id) REFERENCES content_artifacts(artifact_id)
);


-- Short-lived internal cache for deterministic editorial generations.
-- No raw user input is stored here: cache identity is a SHA-256 over
-- normalized input + evidence pack + canon/model versions.
CREATE TABLE IF NOT EXISTS studio_editorial_cache (
  cache_key TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  canon_version TEXT NOT NULL,
  evidence_library_version TEXT NOT NULL,
  bundle_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_studio_editorial_cache_expiry
  ON studio_editorial_cache(expires_at);
