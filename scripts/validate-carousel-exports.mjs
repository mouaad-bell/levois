#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const output = path.resolve('.tmp-carousel-exports-ci');
const result = spawnSync(
  process.execPath,
  ['scripts/export-carousel-pngs.mjs', output],
  { stdio: 'inherit' },
);

if (result.status !== 0) process.exit(result.status || 1);

const manifest = JSON.parse(
  fs.readFileSync(path.join(output, 'manifest.json'), 'utf8'),
);
const failures = [];

if (manifest.pilots.length !== 3) {
  failures.push('trois pilotes attendus');
}

for (const pilot of manifest.pilots) {
  if (!pilot.articlePath) {
    failures.push(pilot.pilotId + ' : article lié absent');
  }
  if (pilot.files.length !== pilot.slideCount) {
    failures.push(pilot.pilotId + ' : nombre de fichiers incohérent');
  }
  for (const file of pilot.files) {
    if (file.width !== 1080 || file.height !== 1350) {
      failures.push(
        pilot.pilotId +
          ' slide ' +
          file.slideNumber +
          ' : dimensions invalides',
      );
    }
  }
}

fs.rmSync(output, { recursive: true, force: true });

if (failures.length) {
  for (const failure of failures) console.error('FAIL —', failure);
  process.exit(1);
}

console.log('Exports carrousels valides · 1080 × 1350 · articles liés.');

