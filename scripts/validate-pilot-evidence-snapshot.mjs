#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const snapshotPath = path.resolve(
  process.argv[2] ||
    'content/pilots/PILOT_EVIDENCE_SNAPSHOT_V1.json',
);
const manifestPath = path.resolve(
  process.argv[3] ||
    'content/pilots/CONTENT_DEPENDENCY_MANIFEST_V1.json',
);

const snapshot = JSON.parse(
  fs.readFileSync(snapshotPath, 'utf8'),
);
const manifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf8'),
);

const byId = new Map(
  (snapshot.evidence || []).map((row) => [
    row.evidenceId,
    row,
  ]),
);

let failures = 0;

function fail(message) {
  failures += 1;
  console.error('FAIL —', message);
}

for (const item of manifest.contents || []) {
  for (const evidenceId of item.evidenceRefs || []) {
    const evidence = byId.get(evidenceId);

    if (!evidence) {
      fail(
        item.contentId +
          ' : evidence_id absent du snapshot → ' +
          evidenceId,
      );
      continue;
    }

    if (evidence.optionalOnly) {
      fail(
        item.contentId +
          ' : preuve marquée optionalOnly utilisée comme dépendance active → ' +
          evidenceId,
      );
    }

    if (evidence.engineUseClass === 'DO_NOT_USE') {
      fail(
        item.contentId +
          ' : preuve DO_NOT_USE active → ' +
          evidenceId,
      );
    }

    if (
      evidence.engineUseClass === 'REFRESH_REQUIRED'
    ) {
      fail(
        item.contentId +
          ' : preuve REFRESH_REQUIRED active → ' +
          evidenceId,
      );
    }

    if (
      evidence.verificationRequiredBeforePublication
    ) {
      fail(
        item.contentId +
          ' : preuve nécessitant une relecture avant publication déclarée comme dépendance active → ' +
          evidenceId,
      );
    }

    if (
      evidence.engineUseClass === 'HISTORICAL_ONLY' &&
      !String(evidence.timePeriod || '').trim()
    ) {
      fail(
        item.contentId +
          ' : preuve historique sans période explicite → ' +
          evidenceId,
      );
    }
  }

  console.log(
    'OK   —',
    item.contentId,
    '·',
    (item.evidenceRefs || []).length,
    'preuve(s) active(s)',
  );
}

if (failures) {
  console.error(
    '\n' +
      failures +
      ' erreur(s) de snapshot V2.1.',
  );
  process.exit(1);
}

console.log(
  '\nSnapshot V2.1 : toutes les dépendances actives des pilotes sont compatibles avec leur statut moteur.',
);
