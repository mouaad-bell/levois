import {
  renderInlineMarkdown,
  type MarkdownBlock,
} from '@/lib/markdown-blocks';

export function AnswerArticleBody({
  blocks,
}: {
  blocks: MarkdownBlock[];
}) {
  return blocks.map((block, index) => {
    const key = 'block-' + index;

    if (block.type === 'rule') return <hr key={key} />;
    if (block.type === 'h1') return null;
    if (block.type === 'h2') {
      return (
        <h2 key={key}>
          {renderInlineMarkdown(block.text)}
        </h2>
      );
    }
    if (block.type === 'h3') {
      return (
        <h3 key={key}>
          {renderInlineMarkdown(block.text)}
        </h3>
      );
    }
    if (block.type === 'quote') {
      return (
        <blockquote key={key}>
          {renderInlineMarkdown(block.text)}
        </blockquote>
      );
    }
    if (block.type === 'list') {
      return (
        <ul key={key}>
          {block.items.map((item, itemIndex) => (
            <li key={key + '-item-' + itemIndex}>
              {renderInlineMarkdown(item)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={key}>
        {renderInlineMarkdown(block.text)}
      </p>
    );
  });
}

