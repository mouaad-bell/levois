#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'content/pilots');
const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith('_RENDER_CONTRACT_V1.json'))
  .sort();

let failures = 0;

function fail(file, message) {
  failures += 1;
  console.error('FAIL', file, '—', message);
}

function visibleQualifier(text) {
  return /cas fictif|cas pédagogique|cas pedagogique|simulation|historique|à vérifier|a verifier|schéma d’usage|schema d’usage|illustration pédagogique|illustration pedagogique/i.test(
    text,
  );
}

for (const file of files) {
  const data = JSON.parse(
    fs.readFileSync(path.join(root, file), 'utf8'),
  );

  if (data.renderVersion !== 'CAROUSEL_RENDER_CONTRACT_V1') {
    fail(file, 'renderVersion invalide');
  }

  if (data.width !== 1080 || data.height !== 1350) {
    fail(file, 'format attendu : 1080×1350');
  }

  const assets = new Map(
    (data.assets || []).map((asset) => [
      asset.assetId,
      asset,
    ]),
  );

  for (const slide of data.slides || []) {
    const used = (slide.assetIds || [])
      .map((assetId) => assets.get(assetId))
      .filter(Boolean);

    for (const assetId of slide.assetIds || []) {
      if (!assets.has(assetId)) {
        fail(
          file,
          'slide ' +
            slide.slideNumber +
            ' : asset absent ' +
            assetId,
        );
      }
    }

    if (
      used.some((asset) => asset.status === 'missing')
    ) {
      fail(
        file,
        'slide ' +
          slide.slideNumber +
          ' : asset manquant',
      );
    }

    const fictive = used.some(
      (asset) =>
        asset.status === 'pedagogical_fiction' ||
        asset.status === 'generated_explanatory',
    );

    if (
      fictive &&
      !visibleQualifier(
        [
          slide.headline,
          slide.body,
          slide.sourceLabel,
          slide.essentialQualifier,
          ...used.map((asset) => asset.label),
        ]
          .filter(Boolean)
          .join(' '),
      )
    ) {
      fail(
        file,
        'slide ' +
          slide.slideNumber +
          ' : statut fictif/généré non visible',
      );
    }

    if (
      used.some(
        (asset) =>
          asset.status !== 'real_documented' &&
          asset.canImplyPropertyFact,
      )
    ) {
      fail(
        file,
        'slide ' +
          slide.slideNumber +
          ' : visuel non documenté autorisé à suggérer un fait réel',
      );
    }

    const numeric = /\d/.test(
      String(slide.headline || '') +
        ' ' +
        String(slide.body || ''),
    );

    if (
      numeric &&
      !(slide.evidenceRefs || []).length &&
      !visibleQualifier(
        [
          slide.sourceLabel,
          slide.essentialQualifier,
        ]
          .filter(Boolean)
          .join(' '),
      )
    ) {
      fail(
        file,
        'slide ' +
          slide.slideNumber +
          ' : chiffre sans preuve ni qualificatif',
      );
    }
  }

  console.log('OK  ', file);
}

if (!files.length) {
  console.error('Aucun render contract trouvé.');
  process.exit(2);
}

if (failures) {
  console.error('\n' + failures + ' erreur(s) de rendu.');
  process.exit(1);
}

console.log('\nTous les render contracts passent les contrôles structurels.');
