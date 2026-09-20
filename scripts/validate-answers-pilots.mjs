#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve(
  process.argv[2] ||
    'content/answers/ANSWERS_PILOTS_V1.json',
);

if (!fs.existsSync(file)) {
  console.error('Index Answers introuvable :', file);
  process.exit(2);
}

const data = JSON.parse(fs.readFileSync(file, 'utf8'));
const failures = [];

function fail(message) {
  failures.push(message);
  console.error('FAIL —', message);
}

if (
  data.canonVersion !==
  'CONTENT_EXPERIENCE_V1_2026-09-19'
) {
  fail('canonVersion incorrecte');
}

if (data.evidenceLibraryVersion !== 'V2.1') {
  fail('evidenceLibraryVersion doit être V2.1');
}

const slugs = new Set();
const ids = new Set();

for (const page of data.pages || []) {
  if (!page.answerId || ids.has(page.answerId)) {
    fail('answerId manquant ou dupliqué : ' + page.answerId);
  }
  ids.add(page.answerId);

  if (
    !page.slug ||
    slugs.has(page.slug) ||
    !/^[a-z0-9-]+$/.test(page.slug)
  ) {
    fail('slug invalide ou dupliqué : ' + page.slug);
  }
  slugs.add(page.slug);

  if (!String(page.title || '').trim()) {
    fail(page.answerId + ' : titre absent');
  }

  const answerWords = String(
    page.answerShort || '',
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (answerWords < 30 || answerWords > 110) {
    fail(
      page.answerId +
        ' : réponse courte hors plage 30–110 mots (' +
        answerWords +
        ')',
    );
  }

  for (const key of [
    'queryIntent',
    'targetScope',
    'authorizedConclusion',
    'autonomousAction',
    'essentialLimit',
  ]) {
    if (!String(page[key] || '').trim()) {
      fail(page.answerId + ' : ' + key + ' absent');
    }
  }

  if (
    !Array.isArray(page.evidenceRefs) ||
    page.evidenceRefs.length === 0
  ) {
    fail(page.answerId + ' : aucune evidenceRef');
  }

  if (
    !page.articleFile ||
    !fs.existsSync(path.resolve(page.articleFile))
  ) {
    fail(
      page.answerId +
        ' : articleFile absent ou introuvable',
    );
  }

  if (
    /chartres|l[eè]ves|luc[eé]|mainvilliers|luisant|coudray|champhol/i.test(
      page.title,
    ) &&
    !/chartres|l[eè]ves|luc[eé]|mainvilliers|luisant|coudray|champhol/i.test(
      page.targetScope,
    )
  ) {
    fail(
      page.answerId +
        ' : titre local sans périmètre local documenté',
    );
  }

  if (
    page.ctaStatus !==
    'DISABLED_UNTIL_DESTINATION_REVIEWED'
  ) {
    fail(
      page.answerId +
        ' : CTA activé avant recette de destination',
    );
  }

  if (!['DRAFT', 'PUBLISHED'].includes(page.publicationStatus)) {
    fail(
      page.answerId +
        ' : publicationStatus doit être DRAFT ou PUBLISHED',
    );
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(page.dateModified || '')) {
    fail(page.answerId + ' : dateModified invalide');
  }

  if (
    page.publicationStatus === 'PUBLISHED' &&
    !/^\d{4}-\d{2}-\d{2}$/.test(page.datePublished || '')
  ) {
    fail(
      page.answerId +
        ' : datePublished requise pour une page publiée',
    );
  }

  console.log(
    'OK   —',
    page.answerId,
    '·',
    page.slug,
  );
}

if (failures.length) {
  console.error(
    '\n' + failures.length + ' erreur(s) Answers.',
  );
  process.exit(1);
}

console.log(
  '\nTous les pilotes Answers passent le contrat V1.',
);
