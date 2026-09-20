#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';

const root = process.cwd();
const outputRoot = path.resolve(
  process.argv[2] || '.tmp-carousel-exports',
);
const contractFiles = [
  'content/pilots/PILOT_01_RENDER_CONTRACT_V1.json',
  'content/pilots/PILOT_02_RENDER_CONTRACT_V1.json',
  'content/pilots/PILOT_03_RENDER_CONTRACT_V1.json',
];
const answers = JSON.parse(
  fs.readFileSync(
    path.resolve(root, 'content/answers/ANSWERS_PILOTS_V1.json'),
    'utf8',
  ),
);

const answerByCarousel = new Map(
  answers.pages.map((page) => [page.relatedCarousel, page]),
);

const pilotIds = [
  'LEV-PILOT-SPACE-001',
  'LEV-PILOT-MOBILITY-002',
  'LEV-PILOT-PRICE-003',
];

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function wrapText(value, maxUnits) {
  const words = String(value || '').trim().split(/\s+/);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    const units = [...candidate].reduce(
      (sum, char) =>
        sum + (/[MW@€%]/.test(char) ? 1.35 : /[I1 .,:;]/.test(char) ? 0.55 : 1),
      0,
    );

    if (units > maxUnits && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines;
}

function textLines(lines, { x, y, size, lineHeight, weight = 700, fill = '#13232d' }) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, sans-serif" font-size="${size}" font-weight="${weight}" letter-spacing="${size > 60 ? -2.4 : 0}">${lines
    .map(
      (line, index) =>
        `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`,
    )
    .join('')}</text>`;
}

function visibleNumbers(slide) {
  return [
    ...new Set(
      (slide.headline + ' ' + slide.body).match(
        /\d[\d\s]*(?:€|min(?:ute)?s?|h)?/gi,
      ) || [],
    ),
  ]
    .map((value) => value.trim())
    .slice(0, 3);
}

function planVisual(accent) {
  return `<g transform="translate(92 180)">
    <rect width="896" height="388" rx="28" fill="#ffffff" stroke="#13232d" stroke-width="5"/>
    <path d="M310 0V388M620 0V388M0 205H310M620 150H896" stroke="#13232d" stroke-width="5"/>
    <rect x="650" y="184" width="205" height="146" rx="18" fill="${accent}" fill-opacity=".18" stroke="${accent}" stroke-width="5"/>
    <circle cx="752" cy="257" r="50" fill="${accent}"/>
    <path d="M715 257h74M752 220v74" stroke="#fff" stroke-width="9" stroke-linecap="round"/>
    <text x="28" y="45" font-family="Arial" font-size="24" font-weight="800" fill="#13232d">VIVRE</text>
    <text x="338" y="45" font-family="Arial" font-size="24" font-weight="800" fill="#13232d">DORMIR</text>
    <text x="648" y="45" font-family="Arial" font-size="24" font-weight="800" fill="#13232d">TRAVAILLER</text>
  </g>`;
}

function mapVisual(accent) {
  return `<g transform="translate(70 155)">
    <rect width="940" height="430" rx="34" fill="#e9e6de"/>
    <path d="M-30 340C180 280 210 75 430 150S690 410 970 110" fill="none" stroke="#fff" stroke-width="46"/>
    <path d="M-30 340C180 280 210 75 430 150S690 410 970 110" fill="none" stroke="#13232d" stroke-opacity=".18" stroke-width="4" stroke-dasharray="14 14"/>
    <circle cx="145" cy="300" r="26" fill="#13232d"/><circle cx="790" cy="190" r="34" fill="${accent}"/>
    <circle cx="790" cy="190" r="74" fill="none" stroke="${accent}" stroke-width="3" opacity=".42"/>
    <text x="126" y="360" font-family="Arial" font-size="24" font-weight="800" fill="#13232d">DÉPART</text>
    <text x="722" y="275" font-family="Arial" font-size="24" font-weight="800" fill="#13232d">LOGEMENT</text>
  </g>`;
}

function timelineVisual(accent, numbers) {
  const labels = numbers.length ? numbers : ['DÉPART', 'MARGE', 'ARRIVÉE'];
  return `<g transform="translate(95 200)">
    <path d="M55 160H835" stroke="#13232d" stroke-width="10" stroke-linecap="round"/>
    ${labels
      .map((label, index) => {
        const x = 55 + (780 / Math.max(labels.length - 1, 1)) * index;
        return `<circle cx="${x}" cy="160" r="28" fill="${index === labels.length - 1 ? accent : '#13232d'}"/>
          <text x="${x}" y="245" text-anchor="middle" font-family="Arial" font-size="34" font-weight="850" fill="#13232d">${escapeXml(label)}</text>`;
      })
      .join('')}
    <path d="M55 65H835" stroke="${accent}" stroke-width="4" stroke-dasharray="12 13"/>
  </g>`;
}

function dataVisual(accent, numbers, label) {
  const values = numbers.length ? numbers : ['FAIT', 'PÉRIMÈTRE'];
  const valueMarkup =
    values.length >= 3
      ? `<text x="65" y="185" font-family="Arial" font-size="104" font-weight="900" fill="${accent}">${escapeXml(values[0])}</text>
        <text x="520" y="165" font-family="Arial" font-size="52" font-weight="850" fill="#f4f0e7">${escapeXml(values[1])}</text>
        <text x="520" y="265" font-family="Arial" font-size="52" font-weight="850" fill="#f4f0e7">${escapeXml(values[2])}</text>`
      : values
          .map(
            (value, index) =>
              `<text x="${65 + index * 470}" y="${190 + index * 90}" font-family="Arial" font-size="${index ? 62 : 108}" font-weight="900" fill="${index ? '#f4f0e7' : accent}">${escapeXml(value)}</text>`,
          )
          .join('');
  return `<g transform="translate(70 150)">
    <rect width="940" height="445" rx="34" fill="#13232d"/>
    ${valueMarkup}
    <path d="M62 355H878" stroke="${accent}" stroke-width="8"/>
    <text x="65" y="410" font-family="Arial" font-size="22" font-weight="750" fill="#f4f0e7" opacity=".78">${escapeXml(label)}</text>
  </g>`;
}

function neutralVisual(accent) {
  return `<g transform="translate(70 150)">
    <rect width="940" height="430" rx="34" fill="#ece8df"/>
    <circle cx="470" cy="215" r="145" fill="none" stroke="${accent}" stroke-width="34"/>
    <circle cx="470" cy="215" r="62" fill="#13232d"/>
    <path d="M130 215H810" stroke="#13232d" stroke-width="3" opacity=".22"/>
  </g>`;
}

function visualFor(slide, assets, accent) {
  const selected = slide.assetIds
    .map((id) => assets.find((asset) => asset.assetId === id))
    .filter(Boolean);
  const kinds = new Set(selected.map((asset) => asset.kind));
  const numbers = visibleNumbers(slide);
  const label = selected.map((asset) => asset.label).filter(Boolean).join(' · ');

  if (kinds.has('timeline')) return timelineVisual(accent, numbers);
  if (kinds.has('map')) return mapVisual(accent);
  if (kinds.has('plan')) return planVisual(accent);
  if (kinds.has('data') || kinds.has('document')) {
    return dataVisual(accent, numbers, label || 'REPÈRE DOCUMENTAIRE');
  }
  return neutralVisual(accent);
}

function renderSvg({ contract, slide, accent, answer }) {
  let headlineSize = slide.headline.length > 68 ? 64 : slide.headline.length > 44 ? 74 : 86;
  let headlineLines = wrapText(
    slide.headline,
    13.5 * (94 / headlineSize),
  );
  if (headlineLines.length > 3) {
    headlineSize = 60;
    headlineLines = wrapText(slide.headline, 24);
  }
  const headlineY = 720;
  const headlineHeight = (headlineLines.length - 1) * (headlineSize * 0.96);
  const bodyLines = wrapText(slide.body, 39);
  const bodyY = headlineY + headlineHeight + 92;
  const qualifier = slide.essentialQualifier || '';
  const visibleQualifier =
    qualifier.length > 72
      ? qualifier.slice(0, 69).trimEnd() + '…'
      : qualifier;
  const isLast = slide.slideNumber === contract.slides.length;
  const articlePath = answer ? '/ressources/' + answer.slug + '/' : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="#f4f0e7"/>
    <circle cx="990" cy="20" r="250" fill="${accent}" opacity=".10"/>
    <path d="M0 0H18V1350H0Z" fill="${accent}"/>
    <text x="72" y="88" font-family="Arial" font-size="25" font-weight="850" letter-spacing="5" fill="#13232d">LEVOIS / DÉCIDER</text>
    <text x="1004" y="88" text-anchor="end" font-family="Arial" font-size="25" font-weight="850" fill="#13232d">${String(slide.slideNumber).padStart(2, '0')} / ${String(contract.slides.length).padStart(2, '0')}</text>
    ${visualFor(slide, contract.assets, accent)}
    ${visibleQualifier ? `<rect x="72" y="628" width="${Math.min(870, 44 + visibleQualifier.length * 10.5)}" height="46" rx="23" fill="${accent}"/><text x="94" y="658" font-family="Arial" font-size="17" font-weight="850" letter-spacing="1" fill="#fff">${escapeXml(visibleQualifier)}</text>` : ''}
    ${textLines(headlineLines, { x: 72, y: headlineY, size: headlineSize, lineHeight: headlineSize * 0.96, weight: 900 })}
    ${textLines(bodyLines, { x: 74, y: bodyY, size: 38, lineHeight: 50, weight: 520, fill: '#34434c' })}
    ${slide.sourceLabel ? `<text x="74" y="1194" font-family="Arial" font-size="21" font-weight="750" fill="#59656c">${escapeXml(slide.sourceLabel)}</text>` : ''}
    ${isLast && articlePath ? `<text x="74" y="1238" font-family="Arial" font-size="24" font-weight="850" fill="${accent}">LIRE LA RÉPONSE COMPLÈTE</text><text x="74" y="1272" font-family="Arial" font-size="21" font-weight="650" fill="#13232d">levois.fr${escapeXml(articlePath)}</text>` : ''}
    <path d="M72 1298H1008" stroke="#13232d" stroke-opacity=".18"/>
    <text x="72" y="1330" font-family="Arial" font-size="19" font-weight="700" fill="#13232d">COMPRENDRE POUR DÉCIDER</text>
    <circle cx="995" cy="1323" r="9" fill="${accent}"/>
  </svg>`;
}

async function contactSheet(files, outputFile) {
  const thumbWidth = 216;
  const thumbHeight = 270;
  const gap = 18;
  const columns = Math.min(3, files.length);
  const rows = Math.ceil(files.length / columns);
  const width = columns * thumbWidth + (columns + 1) * gap;
  const height = rows * thumbHeight + (rows + 1) * gap;
  const composites = await Promise.all(
    files.map(async (file, index) => ({
      input: await sharp(file)
        .resize(thumbWidth, thumbHeight)
        .png()
        .toBuffer(),
      left: gap + (index % columns) * (thumbWidth + gap),
      top: gap + Math.floor(index / columns) * (thumbHeight + gap),
    })),
  );

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: '#13232d',
    },
  })
    .composite(composites)
    .png()
    .toFile(outputFile);
}

fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

const manifest = {
  version: 'LEVOIS_CAROUSEL_EXPORT_V1',
  status: 'DRAFT_HUMAN_REVIEW_REQUIRED',
  width: 1080,
  height: 1350,
  pilots: [],
};

for (const [index, relativeFile] of contractFiles.entries()) {
  const contract = JSON.parse(
    fs.readFileSync(path.resolve(root, relativeFile), 'utf8'),
  );
  const pilotId = pilotIds[index];
  const answer = answerByCarousel.get(pilotId);
  const accent = contract.accent || ['#00A7B5', '#2979FF', '#FF4D4D'][index];
  const folderName = answer?.slug || 'pilot-' + (index + 1);
  const pilotOutput = path.join(outputRoot, folderName);
  fs.mkdirSync(pilotOutput, { recursive: true });

  const exported = [];
  const absoluteFiles = [];

  for (const slide of contract.slides) {
    const svg = renderSvg({ contract, slide, accent, answer });
    const fileName = `slide-${String(slide.slideNumber).padStart(2, '0')}.png`;
    const absolute = path.join(pilotOutput, fileName);
    const png = await sharp(Buffer.from(svg))
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toBuffer();
    fs.writeFileSync(absolute, png);
    const metadata = await sharp(png).metadata();
    absoluteFiles.push(absolute);
    exported.push({
      slideNumber: slide.slideNumber,
      file: path.relative(outputRoot, absolute),
      width: metadata.width,
      height: metadata.height,
      bytes: png.length,
      sha256: sha256(png),
    });
  }

  const sheet = path.join(pilotOutput, 'contact-sheet.png');
  await contactSheet(absoluteFiles, sheet);

  manifest.pilots.push({
    pilotId,
    answerId: answer?.answerId,
    articlePath: answer ? '/ressources/' + answer.slug + '/' : null,
    sourceContract: relativeFile,
    slideCount: contract.slides.length,
    contactSheet: path.relative(outputRoot, sheet),
    files: exported,
  });
}

fs.writeFileSync(
  path.join(outputRoot, 'manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);

console.log(
  manifest.pilots
    .map(
      (pilot) =>
        pilot.pilotId +
        ' · ' +
        pilot.slideCount +
        ' PNG · ' +
        pilot.articlePath,
    )
    .join('\n'),
);
console.log('\nExports : ' + outputRoot);
