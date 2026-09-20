#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const baseUrl = String(process.argv[2] || '').replace(/\/+$/, '');
const token = String(process.argv[3] || '');
const expectationsFile = path.resolve(
  process.argv[4] ||
    'content/pilots/RETRIEVAL_EXPECTATIONS_V1.json',
);

if (!baseUrl || !token) {
  console.error(
    'Usage: node scripts/validate-live-retrieval.mjs <studio-base-url> [studio-access-token] [expectations.json] ou définir STUDIO_BASE_URL / STUDIO_ACCESS_TOKEN.',
  );
  process.exit(2);
}

const expectations = JSON.parse(
  fs.readFileSync(expectationsFile, 'utf8'),
);

let failures = 0;

for (const testCase of expectations.cases || []) {
  const response = await fetch(
    baseUrl + '/api/studio/library/search',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-studio-key': token,
      },
      body: JSON.stringify({
        input: testCase.input,
        limit: testCase.maxResultsToCheck || 24,
      }),
    },
  );

  const payload = await response.json();

  if (!response.ok) {
    console.error(
      'FAIL',
      testCase.caseId,
      'HTTP',
      response.status,
      payload.error || payload,
    );
    failures += 1;
    continue;
  }

  const hits = payload.hits || [];
  const ids = new Set(
    hits.map((hit) => hit.evidenceId),
  );

  const intent =
    payload.coverage?.retrievalIntent || '';

  if (
    testCase.expectedIntent &&
    intent !== testCase.expectedIntent
  ) {
    console.error(
      'FAIL',
      testCase.caseId,
      'intent attendu',
      testCase.expectedIntent,
      'reçu',
      intent,
    );
    failures += 1;
  }

  for (const evidenceId of
    testCase.mustContainEvidenceIds || []) {
    if (!ids.has(evidenceId)) {
      console.error(
        'FAIL',
        testCase.caseId,
        'preuve obligatoire absente :',
        evidenceId,
      );
      failures += 1;
    }
  }

  const optionalFound = (
    testCase.shouldContainEvidenceIds || []
  ).filter((id) => ids.has(id));

  console.log(
    'CASE',
    testCase.caseId,
    '· intent',
    intent,
    '· hits',
    hits.length,
    '· top',
    hits
      .slice(0, 6)
      .map((hit) => hit.evidenceId)
      .join(', '),
    optionalFound.length
      ? '· souhaitées retrouvées ' +
          optionalFound.join(', ')
      : '',
  );
}

if (failures) {
  console.error(
    '\n' + failures + ' erreur(s) de retrieval live.',
  );
  process.exit(1);
}

console.log(
  '\nRetrieval live : toutes les attentes obligatoires passent.',
);
