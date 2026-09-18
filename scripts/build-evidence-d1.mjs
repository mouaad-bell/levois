#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (!item.startsWith('--')) continue;
    const key = item.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const inputDir = path.resolve(String(args.input || 'LEVOIS_EVIDENCE_LIBRARY_V1'));
const outputDir = path.resolve(String(args.output || '.levois-evidence-sql'));
const version = String(args.version || 'V1');
const batchRows = Math.max(25, Math.min(Number(args.batch || 200), 500));

if (!fs.existsSync(inputDir)) {
  console.error('Input directory not found:', inputDir);
  process.exit(1);
}

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

function sqlValue(value) {
  if (value === undefined || value === null || value === '') return 'NULL';
  return "'" + String(value).replaceAll("'", "''").replaceAll('\u0000', '') + "'";
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function readCsv(name) {
  const file = path.join(inputDir, name);
  if (!fs.existsSync(file)) return [];
  const text = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(text);
  const headers = rows.shift() || [];

  return rows
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [header, row[index] || '']),
      ),
    );
}

let sequence = 1;
const commandFiles = [];
let domainRows = 0;
let evidenceRows = 0;
let sourceRows = 0;

function writeBatch(table, columns, rows, prefix) {
  for (let start = 0; start < rows.length; start += batchRows) {
    const slice = rows.slice(start, start + batchRows);
    const values = slice.map(
      (row) =>
        '(' +
        columns.map((column) => sqlValue(row[column])).join(',') +
        ')',
    );

    const sql = [
      'BEGIN TRANSACTION;',
      'INSERT OR REPLACE INTO ' +
        table +
        ' (' +
        columns.join(',') +
        ') VALUES',
      values.join(',\n') + ';',
      'COMMIT;',
      '',
    ].join('\n');

    const filename =
      String(sequence++).padStart(4, '0') + '_' + prefix + '.sql';
    fs.writeFileSync(path.join(outputDir, filename), sql);
    commandFiles.push(filename);
  }
}

const mappings = [
  [
    '01_SOURCE_REGISTRY.csv',
    'evidence_sources',
    [
      'source_id','publisher','title','url','tier','format','coverage',
      'retrieved_at','refresh_policy','next_review_date','notes'
    ],
    'sources',
  ],
  [
    '03_GEO_REFERENCE.csv',
    'geo_reference',
    [
      'geo_id','scope_type','scope_code','scope_label','reference_date',
      'parent_epci_code','department_code','region_code','postal_codes',
      'population_reference','surface_hectares_api','longitude_centre',
      'latitude_centre','zoning_vintage','source_url','source_publisher','notes'
    ],
    'geo',
  ],
  [
    '03B_GEO_MEMBERSHIP.csv',
    'geo_membership',
    [
      'zoning_type','zoning_code','member_commune_code',
      'member_commune_label','source_url'
    ],
    'geo_membership',
  ],
  [
    '04_INSEE_LOCAL.csv',
    'insee_cells',
    [
      'insee_cell_id','topic','subtopic','geo_type','geo_code','geo_label',
      'table_code','table_title','row_label','column_label','value_raw',
      'value_numeric','unit','publication_date','geography_reference_date',
      'source_publisher','source_url','source_note','allowed_uses',
      'forbidden_inferences','refresh_policy','next_review_date'
    ],
    'insee',
  ],
  [
    '05B_DVF_SIMPLE_RESIDENTIAL_TRANSACTIONS.csv',
    'dvf_simple_transactions',
    [
      'id_mutation','date_mutation','year','code_commune','nom_commune',
      'type_local','valeur_fonciere','surface_reelle_bati',
      'nombre_pieces_principales','surface_terrain','prix_m2_bati','surface_band'
    ],
    'dvf_tx',
  ],
  [
    '06_DVF_AGGREGATES.csv',
    'dvf_aggregates',
    [
      'aggregate_id','aggregation_level','code_commune','nom_commune','year',
      'type_local','metric','unit','n_mutations','min','q1','median','q3',
      'max','mean','period_start','period_end','methodology','allowed_uses',
      'forbidden_inferences','source_publisher','source_url','retrieved_at',
      'refresh_policy','next_review_date','surface_band',
      'nombre_pieces_principales'
    ],
    'dvf_agg',
  ],
  [
    '07_DPE_ENERGIE.csv',
    'dpe_records',
    [
      'numero_dpe','date_derniere_modification_dpe','date_etablissement_dpe',
      'date_fin_validite_dpe','modele_dpe','version_dpe',
      'methode_application_dpe','etiquette_dpe','etiquette_ges',
      'type_batiment','annee_construction','surface_habitable_logement',
      'adresse_ban','nom_commune_ban','code_postal_ban',
      'coordonnee_cartographique_x_ban','coordonnee_cartographique_y_ban',
      'conso_5_usages_par_m2_ep','emission_ges_5_usages_par_m2',
      'cout_total_5_usages','qualite_isolation_enveloppe','type_energie_n1',
      'code_commune_levois','nom_commune_levois','source_url'
    ],
    'dpe',
  ],
  [
    '07B_DPE_AGGREGATES.csv',
    'dpe_aggregates',
    [
      'dpe_aggregate_id','aggregation_level','code_commune_levois',
      'nom_commune_levois','etiquette_dpe','dpe_count','unique_dpe_numbers',
      'period_start','period_end','source_publisher','source_url','methodology',
      'allowed_uses','forbidden_inferences','refresh_policy','next_review_date',
      'year','type_batiment'
    ],
    'dpe_agg',
  ],
  [
    '08_RISQUES.csv',
    'risk_evidence',
    [
      'risk_evidence_id','code_commune','nom_commune','dataset','risk_type',
      'record_id','record_count','details_json','source_url','source_publisher',
      'allowed_uses','forbidden_inferences','refresh_policy','next_review_date'
    ],
    'risks',
  ],
  [
    '09_REGLEMENTATION.csv',
    'regulations',
    [
      'regulation_id','domain','subtopic','claim','jurisdiction',
      'effective_period','source_publisher','source_title','source_url',
      'source_status','retrieved_at','status','allowed_uses',
      'forbidden_inferences','refresh_policy','next_review_date','notes'
    ],
    'regulations',
  ],
  [
    '10_METHODOLOGIE.csv',
    'methodology',
    [
      'method_id','concept_key','concept_label','definition','real_estate_use',
      'forbidden_inferences','source_publisher','source_title','source_url',
      'status','refresh_policy','next_review_date','notes'
    ],
    'methodology',
  ],
  [
    '10B_DEFINITIONS_IMMOBILIERES.csv',
    'definitions',
    [
      'definition_id','term_key','term_label','definition','source_publisher',
      'source_title','source_url','allowed_uses','forbidden_inferences',
      'refresh_policy','next_review_date'
    ],
    'definitions',
  ],
  [
    '11_REFRESH_REGISTRY.csv',
    'refresh_registry',
    [
      'asset_id','asset_type','domain','refresh_policy','last_retrieved',
      'next_review_date','trigger','source_url','owner','status'
    ],
    'refresh',
  ],
];

for (const mapping of mappings) {
  const file = mapping[0];
  const table = mapping[1];
  const columns = mapping[2];
  const prefix = mapping[3];
  const rows = readCsv(file);

  if (!rows.length) continue;

  if (table === 'evidence_sources') sourceRows += rows.length;
  else domainRows += rows.length;

  console.log(file + ' -> ' + rows.length + ' rows');
  writeBatch(table, columns, rows, prefix);
}

const evidencePath = path.join(inputDir, '02_EVIDENCE_LIBRARY.jsonl');

if (fs.existsSync(evidencePath)) {
  const stream = fs.createReadStream(evidencePath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const batch = [];

  const columns = [
    'evidence_id','topic','subtopic','claim','value','unit','population',
    'geographic_scope_type','geographic_scope_label','geographic_code',
    'time_period','source_publisher','source_title','source_url',
    'source_dataset_id','retrieved_at','source_tier','status','methodology',
    'allowed_uses','forbidden_inferences','refresh_policy','next_review_date',
    'tags','notes','library_version'
  ];

  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    row.library_version = version;
    batch.push(row);
    evidenceRows += 1;

    if (batch.length >= batchRows) {
      writeBatch(
        'evidence',
        columns,
        batch.splice(0, batch.length),
        'evidence',
      );
    }
  }

  if (batch.length) writeBatch('evidence', columns, batch, 'evidence');
}

const metaSql = [
  'BEGIN TRANSACTION;',
  "INSERT OR REPLACE INTO evidence_library_meta (key,value,updated_at) VALUES " +
    "('library_version'," + sqlValue(version) + ",CURRENT_TIMESTAMP)," +
    "('evidence_rows'," + sqlValue(String(evidenceRows)) + ",CURRENT_TIMESTAMP)," +
    "('domain_rows'," + sqlValue(String(domainRows)) + ",CURRENT_TIMESTAMP)," +
    "('source_rows'," + sqlValue(String(sourceRows)) + ",CURRENT_TIMESTAMP);",
  'COMMIT;',
  '',
].join('\n');

const metaFile = String(sequence++).padStart(4, '0') + '_meta.sql';
fs.writeFileSync(path.join(outputDir, metaFile), metaSql);
commandFiles.push(metaFile);

const manifest = {
  libraryVersion: version,
  createdAt: new Date().toISOString(),
  inputDir,
  outputDir,
  batchRows,
  evidenceRows,
  sourceRows,
  domainRows,
  sqlFiles: commandFiles,
};

fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
);

const commandText =
  commandFiles
    .map(
      (file) =>
        'npx wrangler d1 execute levois-evidence --remote --file="' +
        path.join(outputDir, file) +
        '"',
    )
    .join('\n') + '\n';

fs.writeFileSync(
  path.join(outputDir, 'RUN_ME_AFTER_SCHEMA.txt'),
  commandText,
);

console.log(
  'Generated ' +
    commandFiles.length +
    ' SQL batches. Evidence=' +
    evidenceRows +
    ', domainRows=' +
    domainRows +
    ', sources=' +
    sourceRows,
);
