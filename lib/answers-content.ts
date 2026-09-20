import 'server-only';

import fs from 'node:fs';
import path from 'node:path';

import answers from '@/content/answers/ANSWERS_PILOTS_V1.json';
import evidenceSnapshot from '@/content/pilots/PILOT_EVIDENCE_SNAPSHOT_V1.json';
import {
  parseSimpleMarkdown,
  type MarkdownBlock,
} from '@/lib/markdown-blocks';

export type AnswerPilot = (typeof answers.pages)[number];
export type AnswerEvidence =
  (typeof evidenceSnapshot.evidence)[number];

export function answerBySlug(slug: string) {
  return answers.pages.find(
    (page) => page.slug === slug,
  ) as AnswerPilot | undefined;
}

export function answerCanonicalPath(slug: string) {
  return '/ressources/' + slug + '/';
}

export function answerMarkdown(page: AnswerPilot) {
  const absolute = path.resolve(
    process.cwd(),
    page.articleFile,
  );

  if (!fs.existsSync(absolute)) {
    throw new Error(
      'Article source introuvable : ' +
        page.articleFile,
    );
  }

  return fs.readFileSync(absolute, 'utf8');
}

export function answerEvidence(page: AnswerPilot) {
  const wanted = new Set(page.evidenceRefs);

  return evidenceSnapshot.evidence.filter(
    (evidence) => wanted.has(evidence.evidenceId),
  );
}

function headingText(block: MarkdownBlock) {
  if (
    block.type === 'h1' ||
    block.type === 'h2' ||
    block.type === 'h3'
  ) {
    return block.text;
  }

  return '';
}

export function publicAnswerBlocks(
  markdown: string,
): MarkdownBlock[] {
  const blocks = parseSimpleMarkdown(markdown);
  const shortAnswerIndex = blocks.findIndex((block) =>
    /^réponse courte$/i.test(headingText(block)),
  );

  const contentStart = blocks.findIndex(
    (block, index) =>
      index > shortAnswerIndex &&
      block.type === 'h2' &&
      !/^réponse courte$/i.test(block.text),
  );

  const start = contentStart >= 0 ? contentStart : 0;
  const contentEnd = blocks.findIndex(
    (block, index) =>
      index > start &&
      /^(sources? (et statut des preuves|de production)|continuer)$/i.test(
        headingText(block),
      ),
  );

  return blocks.slice(
    start,
    contentEnd >= 0 ? contentEnd : undefined,
  );
}

