-- LEVOIS Evidence Library V2.1 — canonical D1 schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS evidence_library_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_sources (
  source_id TEXT PRIMARY KEY,
  publisher TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  tier INTEGER,
  format TEXT,
  coverage TEXT,
  retrieved_at TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
  evidence_id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  subtopic TEXT,
  claim TEXT NOT NULL,
  value TEXT,
  unit TEXT,
  population TEXT,
  geographic_scope_type TEXT,
  geographic_scope_label TEXT,
  geographic_code TEXT,
  time_period TEXT,
  source_publisher TEXT,
  source_title TEXT,
  source_url TEXT,
  source_dataset_id TEXT,
  retrieved_at TEXT,
  source_tier INTEGER,
  status TEXT,
  methodology TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  tags TEXT,
  notes TEXT,
  library_version TEXT NOT NULL DEFAULT 'V21',
  origin TEXT,
  evidence_kind TEXT,
  source_registry_id TEXT,
  source_registry_ids_json TEXT,
  engine_use_class TEXT NOT NULL DEFAULT 'REUSABLE_IMMEDIATELY',
  engine_policy_version TEXT,
  verification_required_for_property_application INTEGER NOT NULL DEFAULT 0,
  verification_required_for_person_application INTEGER NOT NULL DEFAULT 0,
  verification_required_before_publication INTEGER NOT NULL DEFAULT 0,
  reuse_modes_json TEXT,
  future_application_guard TEXT,
  verification_scope_v21 TEXT,
  freshness_json TEXT,
  geographic_precision_json TEXT,
  temporal_precision_json TEXT,
  decision_use TEXT,
  source_exact_url_variants_json TEXT,
  publication_status TEXT,
  n_mutations INTEGER,
  public_price_benchmark_allowed INTEGER,
  search_text TEXT,
  ingested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_topic ON evidence(topic, subtopic);
CREATE INDEX IF NOT EXISTS idx_evidence_geo ON evidence(geographic_scope_type, geographic_code);
CREATE INDEX IF NOT EXISTS idx_evidence_geo_label ON evidence(geographic_scope_label);
CREATE INDEX IF NOT EXISTS idx_evidence_time ON evidence(time_period);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_evidence_refresh ON evidence(refresh_policy, next_review_date);
CREATE INDEX IF NOT EXISTS idx_evidence_source_tier ON evidence(source_tier);
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

CREATE TABLE IF NOT EXISTS geo_reference (
  geo_id TEXT PRIMARY KEY,
  scope_type TEXT,
  scope_code TEXT,
  scope_label TEXT,
  reference_date TEXT,
  parent_epci_code TEXT,
  department_code TEXT,
  region_code TEXT,
  postal_codes TEXT,
  population_reference REAL,
  surface_hectares_api REAL,
  longitude_centre REAL,
  latitude_centre REAL,
  zoning_vintage TEXT,
  source_url TEXT,
  source_publisher TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_geo_scope ON geo_reference(scope_type, scope_code);

CREATE TABLE IF NOT EXISTS geo_membership (
  zoning_type TEXT NOT NULL,
  zoning_code TEXT NOT NULL,
  member_commune_code TEXT NOT NULL,
  member_commune_label TEXT,
  source_url TEXT,
  PRIMARY KEY (zoning_type, zoning_code, member_commune_code)
);

CREATE TABLE IF NOT EXISTS insee_cells (
  insee_cell_id TEXT PRIMARY KEY,
  topic TEXT,
  subtopic TEXT,
  geo_type TEXT,
  geo_code TEXT,
  geo_label TEXT,
  table_code TEXT,
  table_title TEXT,
  row_label TEXT,
  column_label TEXT,
  value_raw TEXT,
  value_numeric REAL,
  unit TEXT,
  publication_date TEXT,
  geography_reference_date TEXT,
  source_publisher TEXT,
  source_url TEXT,
  source_note TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  refresh_policy TEXT,
  next_review_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_insee_geo ON insee_cells(geo_type, geo_code);
CREATE INDEX IF NOT EXISTS idx_insee_topic ON insee_cells(topic, subtopic);
CREATE INDEX IF NOT EXISTS idx_insee_table ON insee_cells(table_code);

CREATE TABLE IF NOT EXISTS dvf_simple_transactions (
  id_mutation TEXT PRIMARY KEY,
  date_mutation TEXT,
  year INTEGER,
  code_commune TEXT,
  nom_commune TEXT,
  type_local TEXT,
  valeur_fonciere REAL,
  surface_reelle_bati REAL,
  nombre_pieces_principales REAL,
  surface_terrain REAL,
  prix_m2_bati REAL,
  surface_band TEXT
);
CREATE INDEX IF NOT EXISTS idx_dvf_tx_geo_year ON dvf_simple_transactions(code_commune, year);
CREATE INDEX IF NOT EXISTS idx_dvf_tx_type_surface ON dvf_simple_transactions(type_local, surface_reelle_bati);
CREATE INDEX IF NOT EXISTS idx_dvf_tx_rooms ON dvf_simple_transactions(nombre_pieces_principales);

CREATE TABLE IF NOT EXISTS dvf_aggregates (
  aggregate_id TEXT PRIMARY KEY,
  aggregation_level TEXT,
  code_commune TEXT,
  nom_commune TEXT,
  year INTEGER,
  type_local TEXT,
  metric TEXT,
  unit TEXT,
  n_mutations INTEGER,
  min REAL,
  q1 REAL,
  median REAL,
  q3 REAL,
  max REAL,
  mean REAL,
  period_start TEXT,
  period_end TEXT,
  methodology TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  source_publisher TEXT,
  source_url TEXT,
  retrieved_at TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  surface_band TEXT,
  nombre_pieces_principales REAL
);
CREATE INDEX IF NOT EXISTS idx_dvf_agg_lookup
  ON dvf_aggregates(code_commune, year, type_local, metric, surface_band, nombre_pieces_principales);

CREATE TABLE IF NOT EXISTS dpe_records (
  numero_dpe TEXT PRIMARY KEY,
  date_derniere_modification_dpe TEXT,
  date_etablissement_dpe TEXT,
  date_fin_validite_dpe TEXT,
  modele_dpe TEXT,
  version_dpe TEXT,
  methode_application_dpe TEXT,
  etiquette_dpe TEXT,
  etiquette_ges TEXT,
  type_batiment TEXT,
  annee_construction REAL,
  surface_habitable_logement REAL,
  adresse_ban TEXT,
  nom_commune_ban TEXT,
  code_postal_ban TEXT,
  coordonnee_cartographique_x_ban REAL,
  coordonnee_cartographique_y_ban REAL,
  conso_5_usages_par_m2_ep REAL,
  emission_ges_5_usages_par_m2 REAL,
  cout_total_5_usages REAL,
  qualite_isolation_enveloppe TEXT,
  type_energie_n1 TEXT,
  code_commune_levois TEXT,
  nom_commune_levois TEXT,
  source_url TEXT
);
CREATE INDEX IF NOT EXISTS idx_dpe_geo ON dpe_records(code_commune_levois);
CREATE INDEX IF NOT EXISTS idx_dpe_class ON dpe_records(etiquette_dpe, etiquette_ges);
CREATE INDEX IF NOT EXISTS idx_dpe_type ON dpe_records(type_batiment);

CREATE TABLE IF NOT EXISTS dpe_aggregates (
  dpe_aggregate_id TEXT PRIMARY KEY,
  aggregation_level TEXT,
  code_commune_levois TEXT,
  nom_commune_levois TEXT,
  etiquette_dpe TEXT,
  dpe_count INTEGER,
  unique_dpe_numbers INTEGER,
  period_start TEXT,
  period_end TEXT,
  source_publisher TEXT,
  source_url TEXT,
  methodology TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  year INTEGER,
  type_batiment TEXT
);
CREATE INDEX IF NOT EXISTS idx_dpe_agg_lookup
  ON dpe_aggregates(code_commune_levois, year, type_batiment, etiquette_dpe);

CREATE TABLE IF NOT EXISTS risk_evidence (
  risk_evidence_id TEXT PRIMARY KEY,
  code_commune TEXT,
  nom_commune TEXT,
  dataset TEXT,
  risk_type TEXT,
  record_id TEXT,
  record_count INTEGER,
  details_json TEXT,
  source_url TEXT,
  source_publisher TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  refresh_policy TEXT,
  next_review_date TEXT
);
CREATE INDEX IF NOT EXISTS idx_risk_geo ON risk_evidence(code_commune, risk_type);

CREATE TABLE IF NOT EXISTS regulations (
  regulation_id TEXT PRIMARY KEY,
  domain TEXT,
  subtopic TEXT,
  claim TEXT,
  jurisdiction TEXT,
  effective_period TEXT,
  source_publisher TEXT,
  source_title TEXT,
  source_url TEXT,
  source_status TEXT,
  retrieved_at TEXT,
  status TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_reg_domain ON regulations(domain, subtopic);
CREATE INDEX IF NOT EXISTS idx_reg_refresh ON regulations(refresh_policy, next_review_date);

CREATE TABLE IF NOT EXISTS methodology (
  method_id TEXT PRIMARY KEY,
  concept_key TEXT,
  concept_label TEXT,
  definition TEXT,
  real_estate_use TEXT,
  forbidden_inferences TEXT,
  source_publisher TEXT,
  source_title TEXT,
  source_url TEXT,
  status TEXT,
  refresh_policy TEXT,
  next_review_date TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS definitions (
  definition_id TEXT PRIMARY KEY,
  term_key TEXT,
  term_label TEXT,
  definition TEXT,
  source_publisher TEXT,
  source_title TEXT,
  source_url TEXT,
  allowed_uses TEXT,
  forbidden_inferences TEXT,
  refresh_policy TEXT,
  next_review_date TEXT
);

CREATE TABLE IF NOT EXISTS refresh_registry (
  asset_id TEXT PRIMARY KEY,
  asset_type TEXT,
  domain TEXT,
  refresh_policy TEXT,
  last_retrieved TEXT,
  next_review_date TEXT,
  trigger TEXT,
  source_url TEXT,
  owner TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS evidence_ingest_runs (
  ingest_id TEXT PRIMARY KEY,
  library_version TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  evidence_rows INTEGER NOT NULL DEFAULT 0,
  source_rows INTEGER NOT NULL DEFAULT 0,
  domain_rows INTEGER NOT NULL DEFAULT 0,
  manifest_sha256 TEXT,
  notes TEXT
);
