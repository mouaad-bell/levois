#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve(
  process.argv[2] ||
    'content/pilots/CONTENT_DEPENDENCY_MANIFEST_V1.json',
);

const manifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf8'),
);

let failures = 0;

function fail(message) {
  failures += 1;
  console.error('FAIL —', message);
}

function ok(message) {
  console.log('OK   —', message);
}

if (
  manifest.version !==
  'CONTENT_DEPENDENCY_MANIFEST_V1'
) {
  fail('version du manifest invalide');
}

if (
  manifest.canonVersion !==
  'CONTENT_EXPERIENCE_V1_2026-09-19'
) {
  fail('canonVersion invalide');
}

if (manifest.evidenceLibraryVersion !== 'V2.1') {
  fail('evidenceLibraryVersion doit être V2.1');
}

const ids = new Set();

for (const item of manifest.contents || []) {
  if (!item.contentId) {
    fail('contentId manquant');
    continue;
  }

  if (ids.has(item.contentId)) {
    fail('contentId dupliqué : ' + item.contentId);
  }
  ids.add(item.contentId);

  for (const key of [
    'canonFile',
    'renderFile',
    'articleFile',
  ]) {
    const file = item[key];
    if (!file || !fs.existsSync(path.resolve(file))) {
      fail(
        item.contentId +
          ' : fichier absent pour ' +
          key +
          ' → ' +
          file,
      );
    }
  }

  if (
    !Array.isArray(item.evidenceRefs) ||
    item.evidenceRefs.length === 0
  ) {
    fail(
      item.contentId +
        ' : aucune evidenceRef déclarée',
    );
  }

  if (
    !Array.isArray(item.blockingBeforePublication)
  ) {
    fail(
      item.contentId +
        ' : blockingBeforePublication absent',
    );
  }

  const canon = JSON.parse(
    fs.readFileSync(
      path.resolve(item.canonFile),
      'utf8',
    ),
  );

  const declared = new Set(item.evidenceRefs);
  const used = new Set();

  for (const evidence of canon.evidence || []) {
    const optional =
      String(evidence.role || '')
        .toLowerCase()
        .includes('optional') ||
      evidence.optionalOnly === true;

    if (evidence.evidenceId && !optional) {
      used.add(evidence.evidenceId);
    }
  }

  for (const hook of canon.hookCandidates || []) {
    for (const ref of hook.evidenceRefs || []) {
      used.add(ref);
    }
  }

  for (const ref of used) {
    if (!declared.has(ref)) {
      fail(
        item.contentId +
          ' : preuve utilisée mais absente du dependency manifest → ' +
          ref,
      );
    }
  }

  const render = JSON.parse(
    fs.readFileSync(
      path.resolve(item.renderFile),
      'utf8',
    ),
  );

  for (const asset of render.assets || []) {
    for (const ref of asset.evidenceRefs || []) {
      if (!declared.has(ref)) {
        fail(
          item.contentId +
            ' : preuve du render absente du dependency manifest → ' +
            ref,
        );
      }
    }
  }

  for (const slide of render.slides || []) {
    for (const ref of slide.evidenceRefs || []) {
      if (!declared.has(ref)) {
        fail(
          item.contentId +
            ' : preuve de slide absente du dependency manifest → ' +
            ref,
        );
      }
    }
  }

  ok(
    item.contentId +
      ' : dépendances déclarées et fichiers présents',
  );
}

if (failures) {
  console.error(
    '\n' +
      failures +
      ' erreur(s) de dépendance éditoriale.',
  );
  process.exit(1);
}

console.log(
  '\nManifest de dépendances éditoriales cohérent.',
);
