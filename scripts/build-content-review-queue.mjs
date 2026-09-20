#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readJsonl(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i += 1;
    } else out[key] = true;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const manifestPath = path.resolve(
  String(
    args.manifest ||
      'content/pilots/CONTENT_DEPENDENCY_MANIFEST_V1.json',
  ),
);
const changedPath = args.changed
  ? path.resolve(String(args.changed))
  : '';
const idsArg = String(args.ids || '');

if (!fs.existsSync(manifestPath)) {
  console.error('Manifest introuvable :', manifestPath);
  process.exit(2);
}

const manifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf8'),
);

const changedIds = new Set(
  idsArg
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

for (const row of readJsonl(changedPath)) {
  const id =
    row.evidence_id ||
    row.evidenceId ||
    row.replacement_id ||
    row.canonical_id;
  if (id) changedIds.add(String(id));

  const oldId =
    row.old_evidence_id ||
    row.alias_id ||
    row.previous_id;
  if (oldId) changedIds.add(String(oldId));
}

if (!changedIds.size) {
  console.error(
    'Aucun evidence_id fourni. Utilisez --ids ID1,ID2 ou --changed fichier.jsonl.',
  );
  process.exit(2);
}

const review = [];

for (const item of manifest.contents || []) {
  const dependencies = new Set(item.evidenceRefs || []);
  const matched = [...changedIds].filter((id) =>
    dependencies.has(id),
  );
  if (!matched.length) continue;

  review.push({
    contentId: item.contentId,
    title: item.title,
    status: item.status,
    matchedEvidenceIds: matched,
    canonFile: item.canonFile,
    renderFile: item.renderFile,
    articleFile: item.articleFile,
    action: 'REVIEW_REQUIRED',
  });
}

if (!review.length) {
  console.log(
    'Aucun contenu déclaré comme dépendant des preuves modifiées.',
  );
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      manifestVersion: manifest.version,
      changedEvidenceIds: [...changedIds],
      impactedContents: review,
    },
    null,
    2,
  ),
);
