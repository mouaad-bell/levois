#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const out = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) continue;
    const key = value.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      index += 1;
    } else {
      out[key] = true;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const manifestPath = path.resolve(
  String(
    args.manifest ||
      'content/pilots/CONTENT_DEPENDENCY_MANIFEST_V1.json',
  ),
);
const snapshotPath = path.resolve(
  String(
    args.snapshot ||
      'content/pilots/PILOT_EVIDENCE_SNAPSHOT_V1.json',
  ),
);
const outputDir = path.resolve(
  String(args.output || '.levois-pilot-packages'),
);

const manifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf8'),
);
const snapshot = JSON.parse(
  fs.readFileSync(snapshotPath, 'utf8'),
);

const evidenceById = new Map(
  (snapshot.evidence || []).map((row) => [
    row.evidenceId,
    row,
  ]),
);

fs.rmSync(outputDir, {
  recursive: true,
  force: true,
});
fs.mkdirSync(outputDir, {
  recursive: true,
});

const index = [];

for (const item of manifest.contents || []) {
  const canon = JSON.parse(
    fs.readFileSync(
      path.resolve(item.canonFile),
      'utf8',
    ),
  );
  const render = JSON.parse(
    fs.readFileSync(
      path.resolve(item.renderFile),
      'utf8',
    ),
  );
  const article = fs.readFileSync(
    path.resolve(item.articleFile),
    'utf8',
  );

  const evidence = [];

  for (const evidenceId of item.evidenceRefs || []) {
    const row = evidenceById.get(evidenceId);

    if (!row) {
      throw new Error(
        item.contentId +
          ' : evidence_id absent du snapshot : ' +
          evidenceId,
      );
    }

    evidence.push(row);
  }

  const packageData = {
    packageVersion: 'LEVOIS_PILOT_PACKAGE_V1',
    contentId: item.contentId,
    title: item.title,
    familyId: item.familyId,
    status: item.status,
    canonVersion: manifest.canonVersion,
    evidenceLibraryVersion:
      manifest.evidenceLibraryVersion,
    evidence,
    canon,
    render,
    articleMarkdown: article,
    blockingBeforePublication:
      item.blockingBeforePublication || [],
  };

  const filename =
    item.contentId.toLowerCase() + '.json';

  fs.writeFileSync(
    path.join(outputDir, filename),
    JSON.stringify(packageData, null, 2) + '\n',
  );

  index.push({
    contentId: item.contentId,
    file: filename,
    evidenceRefs: item.evidenceRefs || [],
  });
}

fs.writeFileSync(
  path.join(outputDir, 'index.json'),
  JSON.stringify(
    {
      version: 'LEVOIS_PILOT_PACKAGE_INDEX_V1',
      canonVersion: manifest.canonVersion,
      evidenceLibraryVersion:
        manifest.evidenceLibraryVersion,
      packages: index,
    },
    null,
    2,
  ) + '\n',
);

console.log(
  index.length +
    ' package(s) pilote généré(s) dans ' +
    outputDir,
);
