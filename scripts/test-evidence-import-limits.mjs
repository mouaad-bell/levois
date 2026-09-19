#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fs.mkdtempSync(
  path.join(os.tmpdir(), 'levois-evidence-import-'),
);
const input = path.join(root, 'input');
const output = path.join(root, 'output');
fs.mkdirSync(input, { recursive: true });

fs.writeFileSync(
  path.join(input, 'V21_ENGINE_CONTRACT.md'),
  '# fixture\n',
);

const hugeValue = {
  geometry: 'X'.repeat(220_000),
  nested: Array.from({ length: 200 }, (_, index) => ({
    index,
    value: 'Y'.repeat(200),
  })),
};

const evidence = {
  evidence_id: 'TEST-LARGE-VALUE',
  topic: 'test',
  subtopic: 'oversized_structured_value',
  claim:
    'La preuve de test conserve son claim mais le cache ne recopie pas une valeur structurée géante.',
  value: hugeValue,
  unit: 'fixture',
  population: 'test',
  geographic_scope_type: 'COUNTRY',
  geographic_scope_label: 'France',
  geographic_code: 'FR',
  time_period: '2026',
  source_publisher: 'LEVOIS test',
  source_title: 'Synthetic fixture',
  source_url: 'https://example.invalid/test',
  source_dataset_id: 'TEST',
  retrieved_at: '2026-09-19',
  source_tier: 1,
  status: 'VERIFIED',
  methodology: 'Fixture technique.',
  allowed_uses: 'Test import.',
  forbidden_inferences: 'Ne pas publier.',
  refresh_policy: 'STATIC',
  next_review_date: '2099-01-01',
  tags: 'test',
  origin: 'TEST',
  evidence_kind: 'fixture',
  source_registry_id: 'SRC-TEST',
  engine_use_class: 'REUSABLE_IMMEDIATELY',
  engine_policy_version: 'V21-2026-09-19',
  verification_required_for_property_application: false,
  verification_required_for_person_application: false,
  verification_required_before_publication: false,
  decision_use: 'Test.',
};

fs.writeFileSync(
  path.join(input, '02_EVIDENCE_LIBRARY_V21.jsonl'),
  JSON.stringify(evidence) + '\n',
);

const run = spawnSync(
  process.execPath,
  [
    path.resolve('scripts/build-evidence-d1.mjs'),
    '--input',
    input,
    '--output',
    output,
    '--version',
    'V21',
    '--maxStatementBytes',
    '80000',
  ],
  {
    encoding: 'utf8',
  },
);

if (run.status !== 0) {
  console.error(run.stdout);
  console.error(run.stderr);
  process.exit(run.status || 1);
}

const sqlFiles = fs
  .readdirSync(output)
  .filter((file) => file.endsWith('.sql'));

if (!sqlFiles.length) {
  throw new Error('Aucun SQL généré.');
}

let maxStatement = 0;
let giantPayloadFound = false;

for (const file of sqlFiles) {
  const sql = fs.readFileSync(path.join(output, file), 'utf8');
  if (sql.includes('X'.repeat(10_000))) {
    giantPayloadFound = true;
  }

  for (const statement of sql.split(';')) {
    maxStatement = Math.max(
      maxStatement,
      Buffer.byteLength(statement, 'utf8'),
    );
  }
}

if (maxStatement > 80_000) {
  throw new Error(
    'Statement au-dessus de la limite de sécurité : ' +
      maxStatement,
  );
}

if (giantPayloadFound) {
  throw new Error(
    'La valeur structurée géante a été recopiée dans le cache SQL.',
  );
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'),
);

if (manifest.evidenceRows !== 1) {
  throw new Error('Le manifest doit compter une preuve.');
}

console.log(
  'Evidence import limit test OK · max statement ' +
    maxStatement +
    ' bytes',
);

fs.rmSync(root, { recursive: true, force: true });
