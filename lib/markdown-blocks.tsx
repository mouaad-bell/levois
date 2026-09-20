import type { ReactNode } from 'react';

export type MarkdownBlock =
  | { type: 'h1' | 'h2' | 'h3'; text: string }
  | { type: 'paragraph' | 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'rule' };

function flushParagraph(
  buffer: string[],
  blocks: MarkdownBlock[],
) {
  const text = buffer.join(' ').trim();
  if (text) blocks.push({ type: 'paragraph', text });
  buffer.length = 0;
}

export function parseSimpleMarkdown(
  markdown: string,
): MarkdownBlock[] {
  const lines = markdown
    .replace(/\r\n/g, '\n')
    .split('\n');

  const blocks: MarkdownBlock[] = [];
  const paragraph: string[] = [];
  let list: string[] = [];

  const flushList = () => {
    if (list.length) {
      blocks.push({ type: 'list', items: list });
      list = [];
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph(paragraph, blocks);
      flushList();
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph(paragraph, blocks);
      flushList();
      blocks.push({ type: 'rule' });
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      flushParagraph(paragraph, blocks);
      flushList();

      const level = heading[1].length;
      blocks.push({
        type:
          level === 1
            ? 'h1'
            : level === 2
              ? 'h2'
              : 'h3',
        text: heading[2],
      });
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph(paragraph, blocks);
      flushList();
      blocks.push({
        type: 'quote',
        text: line.slice(2).trim(),
      });
      continue;
    }

    const listItem = line.match(/^[-*]\s+(.+)$/);
    if (listItem) {
      flushParagraph(paragraph, blocks);
      list.push(listItem[1]);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph(paragraph, blocks);
      list.push(line.replace(/^\d+\.\s+/, ''));
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph(paragraph, blocks);
  flushList();

  return blocks;
}

export function renderInlineMarkdown(
  text: string,
): ReactNode[] {
  const result: ReactNode[] = [];
  const pattern =
    /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (
      token.startsWith('**') &&
      token.endsWith('**')
    ) {
      result.push(
        <strong key={'strong-' + key++}>
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const link = token.match(
        /^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/,
      );
      if (link) {
        result.push(
          <a
            key={'link-' + key++}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
          >
            {link[1]}
          </a>,
        );
      } else {
        result.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}
