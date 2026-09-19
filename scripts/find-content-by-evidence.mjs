#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const evidenceId = String(process.argv[2] || '').trim();
if (!evidenceId) {
  console.error('Usage: node scripts/find-content-by-evidence.mjs <evidence_id>');
  process.exit(2);
}

const manifestPath = path.resolve(
  process.argv[3] || 'content/pilots/CONTENT_DEPENDENCY_MANIFEST_V1.json',
);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const impacted = (manifest.contents || []).filter((item) =>
  (item.evidenceRefs || []).includes(evidenceId),
);

if (!impacted.length) {
  console.log('Aucun contenu déclaré comme dépendant de', evidenceId);
  process.exit(0);
}

console.log('Contenus à revoir pour', evidenceId + ':');
for (const item of impacted) {
  console.log(
    '- ' +
      item.contentId +
      ' · ' +
      item.title +
      ' · ' +
      item.status,
  );
  if (item.canonFile) console.log('  canon:', item.canonFile);
  if (item.renderFile) console.log('  render:', item.renderFile);
  if (item.articleFile) console.log('  article:', item.articleFile);
}
