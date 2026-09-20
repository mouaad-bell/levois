#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const answers = JSON.parse(
  fs.readFileSync(
    path.resolve('content/answers/ANSWERS_PILOTS_V1.json'),
    'utf8',
  ),
);
const snapshot = JSON.parse(
  fs.readFileSync(
    path.resolve(
      'content/pilots/PILOT_EVIDENCE_SNAPSHOT_V1.json',
    ),
    'utf8',
  ),
);

const evidenceById = new Map(
  snapshot.evidence.map((item) => [item.evidenceId, item]),
);
const failures = [];

function fail(page, message) {
  failures.push(page.answerId + ' : ' + message);
}

function words(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function isoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

for (const page of answers.pages || []) {
  const refs = page.evidenceRefs || [];
  const resolved = refs.map((id) => evidenceById.get(id));

  if (String(page.queryIntent || '').trim().length < 30) {
    fail(page, 'question décisionnelle absente ou trop vague');
  }

  const answerWords = words(page.answerShort);
  if (answerWords < 30 || answerWords > 100) {
    fail(
      page,
      'réponse directe hors plage 30–100 mots (' +
        answerWords +
        ')',
    );
  }

  if (!refs.length || resolved.some((item) => !item)) {
    fail(page, 'preuve absente ou non résolue dans le snapshot');
  }

  if (!String(page.targetScope || '').trim()) {
    fail(page, 'périmètre absent');
  }

  if (words(page.essentialLimit) < 10) {
    fail(page, 'limite essentielle trop courte');
  }

  if (words(page.autonomousAction) < 8) {
    fail(page, 'opération autonome insuffisante');
  }

  for (const evidence of resolved.filter(Boolean)) {
    for (const key of [
      'sourcePublisher',
      'sourceTitle',
      'sourceUrl',
      'timePeriod',
    ]) {
      if (!String(evidence[key] || '').trim()) {
        fail(page, evidence.evidenceId + ' : ' + key + ' absent');
      }
    }
  }

  if (!Array.isArray(page.internalLinksCandidates)) {
    fail(page, 'candidats de maillage interne absents');
  }

  if (!isoDate(page.dateModified)) {
    fail(page, 'date de mise à jour invalide');
  }

  if (
    page.publicationStatus === 'PUBLISHED' &&
    !isoDate(page.datePublished)
  ) {
    fail(page, 'date de publication requise');
  }

  if (
    page.publicationStatus === 'PUBLISHED' &&
    page.ctaStatus !== 'DISABLED_UNTIL_DESTINATION_REVIEWED'
  ) {
    fail(page, 'CTA activé sans contrat de recette distinct');
  }

  console.log(
    'OK   —',
    page.answerId,
    '· contrat Article public V1',
  );
}

if (failures.length) {
  for (const failure of failures) {
    console.error('FAIL —', failure);
  }
  console.error('\n' + failures.length + ' erreur(s).');
  process.exit(1);
}

console.log(
  '\nTous les articles pilotes passent le contrat public V1.',
);

