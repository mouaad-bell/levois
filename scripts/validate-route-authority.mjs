#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.resolve(process.argv[2] || 'app');
const routeFiles = new Map();
const routePattern = /^(page|layout)\.(js|jsx|ts|tsx)$/;

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      visit(absolute);
      continue;
    }

    const match = entry.name.match(routePattern);
    if (!match) continue;

    const key = path
      .relative(appRoot, path.join(directory, match[1]))
      .replaceAll(path.sep, '/');
    const files = routeFiles.get(key) ?? [];
    files.push(path.relative(process.cwd(), absolute));
    routeFiles.set(key, files);
  }
}

visit(appRoot);

const duplicates = [...routeFiles.entries()].filter(
  ([, files]) => files.length > 1,
);

if (duplicates.length) {
  console.error('Routes Next.js concurrentes détectées :');
  for (const [route, files] of duplicates) {
    console.error('- ' + route + ' : ' + files.join(', '));
  }
  process.exit(1);
}

console.log(
  'Autorité des routes OK · ' +
    routeFiles.size +
    ' page(s)/layout(s) sans doublon.',
);
