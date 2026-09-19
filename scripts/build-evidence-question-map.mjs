#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }

  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function rowsFromCsv(file) {
  const rows = parseCsv(
    fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''),
  );
  const headers = rows.shift() || [];

  return rows
    .filter((row) => row.some((cell) => cell !== ''))
    .map((row) =>
      Object.fromEntries(
        headers.map((header, index) => [
          header,
          row[index] ?? '',
        ]),
      ),
    );
}

const input = path.resolve(
  process.argv[2] ||
    'RETRIEVAL_READINESS_TEST_V21.csv',
);
const output = path.resolve(
  process.argv[3] ||
    'content/roadmap/EVIDENCE_BACKED_QUESTION_MAP_V1.json',
);

if (!fs.existsSync(input)) {
  console.error(
    'Fichier de readiness V2.1 introuvable :',
    input,
  );
  process.exit(2);
}

const familyByDomain = {
  prix: 'prix_valeur',
  statistique: 'decider_arbitrer',
  surfaces: 'espace_usage',
  DPE: 'bien_technique',
  location: 'verifier_transaction',
  transaction: 'verifier_transaction',
  travaux: 'bien_technique',
  renovation: 'bien_technique',
  batiment: 'bien_technique',
  construction: 'bien_technique',
  chauffage: 'bien_technique',
  financement: 'budget_financement',
  fiscalite: 'budget_financement',
  copropriete: 'verifier_transaction',
  urbanisme: 'verifier_transaction',
  risques: 'bien_technique',
  mobilite: 'lieu_mobilite',
  localisation: 'lieu_mobilite',
  accessibilite: 'lieu_mobilite',
  services: 'lieu_mobilite',
  environnement: 'marche_territoire',
  eau: 'bien_technique',
  connectivite: 'lieu_mobilite',
  bruit: 'lieu_mobilite',
  methodologie: 'decider_arbitrer',
};

const priorityADomains = new Set([
  'prix',
  'statistique',
  'surfaces',
  'DPE',
  'transaction',
  'financement',
  'copropriete',
  'mobilite',
  'risques',
]);

const priorityBDomains = new Set([
  'location',
  'travaux',
  'renovation',
  'batiment',
  'construction',
  'chauffage',
  'fiscalite',
  'urbanisme',
  'localisation',
  'environnement',
  'eau',
  'connectivite',
  'bruit',
]);

function priority(row) {
  if (
    row.couverture === 'LACUNE' ||
    row.couverture.includes('NON_RESOLU')
  ) {
    return 'C';
  }

  if (priorityADomains.has(row.domaine)) {
    return 'A';
  }

  if (priorityBDomains.has(row.domaine)) {
    return 'B';
  }

  return 'B';
}

function freshness(row) {
  if (
    row.couverture.startsWith(
      'COUVERT_HISTORIQUE',
    ) ||
    row.couverture.startsWith(
      'COUVERT_HORAIRE',
    ) ||
    row.couverture.startsWith(
      'COUVERT_INVENTAIRE',
    )
  ) {
    return 'dated_context';
  }

  if (
    row.couverture === 'LACUNE' ||
    row.couverture.includes('NON_RESOLU')
  ) {
    return 'case_or_gap';
  }

  return 'general_reusable';
}

function isLocalQuestion(question) {
  return /chartres|champhol|l[eè]ves|luc[eé]|mainvilliers|luisant|coudray|adresse|parcelle|près du logement/i.test(
    question,
  );
}

function formats(row) {
  const carouselDomains = new Set([
    'statistique',
    'surfaces',
    'DPE',
    'travaux',
    'renovation',
    'financement',
    'copropriete',
    'urbanisme',
    'risques',
    'mobilite',
    'transaction',
    'prix',
  ]);

  const result = ['answer_article'];

  if (carouselDomains.has(row.domaine)) {
    result.push('carousel_candidate');
  }

  if (isLocalQuestion(row.question)) {
    result.push('local_answer_candidate');
  }

  return result;
}

const rows = rowsFromCsv(input);

const questions = rows.map((row, index) => ({
  questionId:
    'Q' + String(index + 1).padStart(3, '0'),
  question: row.question,
  domain: row.domaine,
  familyId:
    familyByDomain[row.domaine] ??
    'decider_arbitrer',
  priority: priority(row),
  coverage: row.couverture,
  freshnessClass: freshness(row),
  webNeededByV21Test:
    String(row.web_needed).toLowerCase() === 'true',
  evidenceRefs: row.evidence_ids
    ? row.evidence_ids.split('|').filter(Boolean)
    : [],
  recommendedFormats: formats(row),
  reason: row.reason,
}));

const result = {
  version: 'EVIDENCE_BACKED_QUESTION_MAP_V1',
  source: path.basename(input),
  evidenceLibraryVersion: 'V2.1',
  generatedFromQuestions: questions.length,
  important:
    'Cette carte classe la préparation documentaire et l’utilité éditoriale. Elle ne prétend pas mesurer le volume de recherche Google, la concurrence SEO ni garantir un classement.',
  priorityMeaning: {
    A: 'Candidat éditorial fort pour les premiers cycles.',
    B: 'Candidat utile ou plus spécialisé.',
    C: 'Cas individuel, lacune ou vérification externe/actuelle nécessaire.',
  },
  questions,
};

fs.mkdirSync(path.dirname(output), {
  recursive: true,
});
fs.writeFileSync(
  output,
  JSON.stringify(result, null, 2) + '\n',
);

console.log(
  'Question map générée : ' +
    questions.length +
    ' questions → ' +
    output,
);
