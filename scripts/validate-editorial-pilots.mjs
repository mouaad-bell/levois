#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || 'content/pilots');
const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith('.json'))
  .sort();

const requiredModes = ['direct', 'scene', 'comparison'];
const requiredStoryFunctions = [
  'situation',
  'initial_reading',
  'friction',
  'demonstration',
  'rereading',
  'practical_take',
];

let failures = 0;

function fail(file, message) {
  failures += 1;
  console.error('FAIL', file, '—', message);
}

function ok(file, message) {
  console.log('OK  ', file, '—', message);
}

for (const file of files) {
  const fullPath = path.join(root, file);
  const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));

  if (data.canonVersion !== 'CONTENT_EXPERIENCE_V1_2026-09-19') {
    fail(file, 'canonVersion incorrecte');
    continue;
  }

  const frame = data.decisionFrame || {};
  for (const key of [
    'person',
    'decision',
    'spontaneousReading',
    'pressureTest',
    'authorizedConclusion',
    'finalOperation',
  ]) {
    if (!String(frame[key] || '').trim()) {
      fail(file, 'decisionFrame.' + key + ' manquant');
    }
  }

  const hooks = data.hookCandidates || [];
  if (hooks.length !== 3) {
    fail(file, 'exactement trois hooks requis');
  }

  const modes = new Set(hooks.map((hook) => hook.mode));
  for (const mode of requiredModes) {
    if (!modes.has(mode)) fail(file, 'hook mode manquant: ' + mode);
  }

  const selected = hooks.find(
    (hook) => hook.mode === data.selectedHookMode,
  );
  if (!selected) {
    fail(file, 'selectedHookMode ne correspond à aucun hook');
  }

  for (const hook of hooks) {
    if (!String(hook.text || '').trim()) fail(file, 'hook vide');
    if (!String(hook.explicitPromise || '').trim()) {
      fail(file, 'promesse explicite absente pour ' + hook.mode);
    }
    if (!String(hook.implicitPromise || '').trim()) {
      fail(file, 'promesse implicite absente pour ' + hook.mode);
    }

    const hasNumber = /\d/.test(String(hook.text || ''));
    const hasEvidence =
      Array.isArray(hook.evidenceRefs) && hook.evidenceRefs.length > 0;
    const declaredCase =
      /cas fictif|cas pédagogique|pedagogique|fictif/i.test(
        JSON.stringify(hook),
      ) ||
      /case_pedagogique|case_fictive/i.test(
        String(data.numericStatus || ''),
      );

    if (hasNumber && !hasEvidence && !declaredCase) {
      fail(
        file,
        'hook chiffré sans evidenceRef ni statut pédagogique: ' +
          hook.text,
      );
    }
  }

  const beats = data.storyBeats || [];
  const functions = new Set(beats.map((beat) => beat.function));
  for (const fn of requiredStoryFunctions) {
    if (!functions.has(fn)) {
      fail(file, 'story beat manquant: ' + fn);
    }
  }

  for (const beat of beats) {
    if (!String(beat.before || '').trim()) {
      fail(file, beat.function + ': before absent');
    }
    if (!String(beat.after || '').trim()) {
      fail(file, beat.function + ': after absent');
    }
    if (
      String(beat.before || '').trim() ===
      String(beat.after || '').trim()
    ) {
      fail(file, beat.function + ': aucune progression before/after');
    }
    if (!String(beat.copy || '').trim()) {
      fail(file, beat.function + ': copy absente');
    }
  }

  if (!String(data.essentialLimit || '').trim()) {
    fail(file, 'limite essentielle absente');
  }

  if (!String(data.autonomousAction || '').trim()) {
    fail(file, 'action autonome absente');
  }

  const raw = JSON.stringify(data);
  const absoluteVetoes = [
    /tout ce que vous savez est faux/i,
    /on vous ment/i,
    /pour connaître la réponse[^.]{0,80}(email|coordonnées|contact)/i,
  ];
  for (const veto of absoluteVetoes) {
    if (veto.test(raw)) fail(file, 'veto absolu détecté: ' + veto);
  }

  ok(file, 'contrat canonique structurel vérifié');
}

if (!files.length) {
  console.error('Aucun pilote JSON trouvé dans', root);
  process.exit(2);
}

if (failures) {
  console.error('\n', failures, 'erreur(s) canonique(s).');
  process.exit(1);
}

console.log('\nTous les pilotes passent les contrôles structurels.');
