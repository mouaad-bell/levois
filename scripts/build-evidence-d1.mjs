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
const inputDir = path.resolve(String(args.input || 'LEVOIS_EVIDENCE_LIBRARY_V2_1'));
const outputDir = path.resolve(String(args.output || '.levois-evidence-sql'));
const version = String(args.version || 'V21').toUpperCase();
const batchRows = Math.max(25, Math.min(Number(args.batch || 150), 300));

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

function sqlBool(value) {
  if (value === true || value === 'True' || value === 'true' || value === 1 || value === '1') return '1';
  if (value === false || value === 'False' || value === 'false' || value === 0 || value === '0') return '0';
  return 'NULL';
}

function compactJson(value) {
  if (value === undefined || value === null || value === '') return null;
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
      Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])),
    );
}

let sequence = 1;
const commandFiles = [];
let evidenceRows = 0;
let sourceRows = 0;
let refreshRows = 0;
let aliasRows = 0;
const engineClassCounts = {};

function writeBatch(table, columns, rows, prefix, transformValue) {
  for (let start = 0; start < rows.length; start += batchRows) {
    const slice = rows.slice(start, start + batchRows);
    const values = slice.map((row) => {
      const parts = columns.map((column) => {
        const value = transformValue ? transformValue(column, row[column], row) : row[column];
        return sqlValue(value);
      });
      return '(' + parts.join(',') + ')';
    });

    const sql = [
      'BEGIN TRANSACTION;',
      'INSERT OR REPLACE INTO ' + table + ' (' + columns.join(',') + ') VALUES',
      values.join(',\n') + ';',
      'COMMIT;',
      '',
    ].join('\n');

    const filename = String(sequence++).padStart(4, '0') + '_' + prefix + '.sql';
    fs.writeFileSync(path.join(outputDir, filename), sql);
    commandFiles.push(filename);
  }
}

function findEvidenceFile() {
  const candidates = [
    '02_EVIDENCE_LIBRARY_V21.jsonl',
    '02_EVIDENCE_LIBRARY_V2.jsonl',
    '02_EVIDENCE_LIBRARY.jsonl',
  ];
  for (const candidate of candidates) {
    const file = path.join(inputDir, candidate);
    if (fs.existsSync(file)) return file;
  }
  return '';
}

async function importV21() {
  const evidencePath = findEvidenceFile();
  if (!evidencePath) throw new Error('No evidence JSONL found in ' + inputDir);

  const evidenceColumns = [
    'evidence_id','topic','subtopic','claim','value','unit','population',
    'geographic_scope_type','geographic_scope_label','geographic_code',
    'time_period','source_publisher','source_title','source_url',
    'source_dataset_id','retrieved_at','source_tier','status','methodology',
    'allowed_uses','forbidden_inferences','refresh_policy','next_review_date',
    'tags','notes','library_version',
    'origin','evidence_kind','source_registry_id','source_registry_ids_json',
    'engine_use_class','engine_policy_version',
    'verification_required_for_property_application',
    'verification_required_for_person_application',
    'verification_required_before_publication',
    'reuse_modes_json','future_application_guard','verification_scope_v21',
    'freshness_json','geographic_precision_json','temporal_precision_json',
    'decision_use','source_exact_url_variants_json',
    'publication_status','n_mutations','public_price_benchmark_allowed',
    'search_text'
  ];

  const stream = fs.createReadStream(evidencePath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const batch = [];

  for await (const line of lines) {
    if (!line.trim()) continue;
    const raw = JSON.parse(line);

    const row = {
      ...raw,
      library_version: version,
      source_registry_ids_json: compactJson(raw.source_registry_ids),
      reuse_modes_json: compactJson(raw.reuse_modes),
      freshness_json: compactJson(raw.freshness),
      geographic_precision_json: compactJson(raw.geographic_precision),
      temporal_precision_json: compactJson(raw.temporal_precision),
      source_exact_url_variants_json: compactJson(raw.source_exact_url_variants),
      verification_required_for_property_application:
        raw.verification_required_for_property_application ? 1 : 0,
      verification_required_for_person_application:
        raw.verification_required_for_person_application ? 1 : 0,
      verification_required_before_publication:
        raw.verification_required_before_publication ? 1 : 0,
      public_price_benchmark_allowed:
        raw.public_price_benchmark_allowed === undefined || raw.public_price_benchmark_allowed === null
          ? null
          : raw.public_price_benchmark_allowed ? 1 : 0,
      search_text: normalizeSearch([
        raw.topic,
        raw.subtopic,
        raw.claim,
        raw.value,
        raw.unit,
        raw.geographic_scope_label,
        raw.allowed_uses,
        raw.forbidden_inferences,
        raw.decision_use,
        raw.tags,
      ].filter(Boolean).join(' ')),
    };

    const engineClass = raw.engine_use_class || 'UNKNOWN';
    engineClassCounts[engineClass] = (engineClassCounts[engineClass] || 0) + 1;

    batch.push(row);
    evidenceRows += 1;

    if (batch.length >= batchRows) {
      writeBatch('evidence', evidenceColumns, batch.splice(0, batch.length), 'evidence');
    }
  }

  if (batch.length) writeBatch('evidence', evidenceColumns, batch, 'evidence');

  const sources = readCsv('V21_SOURCE_REGISTRY.csv');
  if (sources.length) {
    sourceRows = sources.length;
    writeBatch(
      'evidence_sources_v21',
      [
        'source_id','publisher','title','url','scope_v21','evidence_count_v21',
        'evidence_rechecked_v21','new_evidence_v21','next_review_date_v21',
        'validation_statuses_v21','v21_archives','verification_notice'
      ],
      sources,
      'sources_v21',
    );
  }

  const refresh = readCsv('V21_REFRESH_REGISTRY.csv');
  if (refresh.length) {
    refreshRows = refresh.length;
    writeBatch(
      'evidence_refresh_v21',
      [
        'evidence_id','domain','source_registry_id','status','source_url',
        'source_date','observation_period','retrieved_at','last_reverified_v21',
        'refresh_policy','next_review_date','engine_use_class',
        'verification_required_before_publication','verify_property','verify_person',
        'future_only','verification_scope_v21'
      ],
      refresh,
      'refresh_v21',
      (column, value) => {
        if (['verification_required_before_publication','verify_property','verify_person','future_only'].includes(column)) {
          const parsed = sqlBool(value);
          return parsed === 'NULL' ? null : Number(parsed);
        }
        return value;
      },
    );
  }

  const aliases = readCsv('V21_EVIDENCE_ALIASES.csv');
  if (aliases.length) {
    aliasRows = aliases.length;
    const mapped = aliases.map((row) => ({
      alias_id: row.alias_id,
      canonical_id: row.canonical_id,
      reason: [row.decision, row.reason].filter(Boolean).join(' — '),
      library_version: version,
    }));
    writeBatch(
      'evidence_aliases',
      ['alias_id','canonical_id','reason','library_version'],
      mapped,
      'aliases_v21',
    );
  }
}

async function importLegacy() {
  const evidencePath = findEvidenceFile();
  if (!evidencePath) throw new Error('No evidence JSONL found in ' + inputDir);

  const columns = [
    'evidence_id','topic','subtopic','claim','value','unit','population',
    'geographic_scope_type','geographic_scope_label','geographic_code',
    'time_period','source_publisher','source_title','source_url',
    'source_dataset_id','retrieved_at','source_tier','status','methodology',
    'allowed_uses','forbidden_inferences','refresh_policy','next_review_date',
    'tags','notes','library_version'
  ];

  const stream = fs.createReadStream(evidencePath, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  const batch = [];

  for await (const line of lines) {
    if (!line.trim()) continue;
    const row = JSON.parse(line);
    row.library_version = version;
    batch.push(row);
    evidenceRows += 1;

    if (batch.length >= batchRows) {
      writeBatch('evidence', columns, batch.splice(0, batch.length), 'evidence');
    }
  }

  if (batch.length) writeBatch('evidence', columns, batch, 'evidence');
}

if (version === 'V21' || fs.existsSync(path.join(inputDir, 'V21_ENGINE_CONTRACT.md'))) {
  await importV21();
} else {
  await importLegacy();
}

const metaRows = [
  ['library_version', version],
  ['evidence_rows', String(evidenceRows)],
  ['source_rows', String(sourceRows)],
  ['refresh_rows', String(refreshRows)],
  ['alias_rows', String(aliasRows)],
  ['engine_class_counts', JSON.stringify(engineClassCounts)],
];

const metaSql = [
  'BEGIN TRANSACTION;',
  'INSERT OR REPLACE INTO evidence_library_meta (key,value,updated_at) VALUES',
  metaRows
    .map(([key, value]) => '(' + sqlValue(key) + ',' + sqlValue(value) + ',CURRENT_TIMESTAMP)')
    .join(',\n') + ';',
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
  refreshRows,
  aliasRows,
  engineClassCounts,
  sqlFiles: commandFiles,
};

fs.writeFileSync(
  path.join(outputDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
);

const databaseName = String(args.database || 'levois-evidence');
const commandText =
  commandFiles
    .map(
      (file) =>
        'npx wrangler d1 execute ' +
        databaseName +
        ' --remote --file="' +
        path.join(outputDir, file) +
        '"',
    )
    .join('\n') + '\n';

fs.writeFileSync(path.join(outputDir, 'RUN_ME_AFTER_SCHEMA.txt'), commandText);

console.log(
  'Generated ' +
    commandFiles.length +
    ' SQL batches. Evidence=' +
    evidenceRows +
    ', sources=' +
    sourceRows +
    ', refresh=' +
    refreshRows +
    ', aliases=' +
    aliasRows,
);
console.log('Engine classes:', engineClassCounts);
