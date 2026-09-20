import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import answers from '@/content/answers/ANSWERS_PILOTS_V1.json';
import evidenceSnapshot from '@/content/pilots/PILOT_EVIDENCE_SNAPSHOT_V1.json';
import {
  reviewPublicArticle,
  type PublicArticleEvidence,
  type PublicArticleInput,
} from '@/lib/article-public-contract';
import {
  parseSimpleMarkdown,
  renderInlineMarkdown,
} from '@/lib/markdown-blocks';
import { STUDIO_FAMILIES } from '@/lib/studio-schema';

import styles from './answerPreview.module.css';

type AnswerPilot = (typeof answers.pages)[number];

function pageBySlug(slug: string) {
  return answers.pages.find(
    (page) => page.slug === slug,
  ) as AnswerPilot | undefined;
}

function markdownFor(page: AnswerPilot) {
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

export function generateStaticParams() {
  return answers.pages.map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = pageBySlug(slug);

  if (!page) {
    return {
      title: 'Ressource introuvable — LEVOIS Studio',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: page.title + ' — Aperçu LEVOIS',
    description: page.answerShort,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function AnswerPreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = pageBySlug(slug);

  if (!page) notFound();

  const markdown = markdownFor(page);
  const blocks = parseSimpleMarkdown(markdown);
  const family =
    STUDIO_FAMILIES[
      page.familyId as keyof typeof STUDIO_FAMILIES
    ];
  const publicReview = reviewPublicArticle(
    page as PublicArticleInput,
    evidenceSnapshot.evidence as PublicArticleEvidence[],
  );

  return (
    <main
      className={styles.shell}
      style={
        {
          '--answer-accent':
            family?.accent ?? '#00D9F5',
        } as React.CSSProperties
      }
    >
      <div className={styles.topbar}>
        <a href="/studio/">LEVOIS / STUDIO</a>
        <a href="/studio/render/">
          Aperçu carrousels
        </a>
      </div>

      <article className={styles.article}>
        <header className={styles.hero}>
          <p className={styles.kicker}>
            APERÇU ANSWERS · NON PUBLIÉ
          </p>
          <h1>{page.title}</h1>
          <p className={styles.answerShort}>
            {page.answerShort}
          </p>

          <div className={styles.meta}>
            <span>{family?.label}</span>
            <span>
              Preuves : {page.evidenceRefs.length}
            </span>
            <span>
              Revue : {page.lastEvidenceReview}
            </span>
          </div>
        </header>

        <section className={styles.contractReview}>
          <div>
            <p className={styles.kicker}>
              CONTRAT ARTICLE PUBLIC V1
            </p>
            <h2>
              {publicReview.readyForHumanReview
                ? 'Prêt pour revue humaine'
                : 'Blocage avant revue humaine'}
            </h2>
          </div>
          <ul>
            {publicReview.checks.map((check) => (
              <li key={check.id} data-status={check.status}>
                <strong>{check.status}</strong>
                <span>{check.reason}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className={styles.limit}>
          <strong>Limite essentielle</strong>
          <p>{page.essentialLimit}</p>
        </aside>

        <div className={styles.body}>
          {blocks.map((block, index) => {
            if (block.type === 'rule') {
              return (
                <hr key={'block-' + index} />
              );
            }

            if (block.type === 'h1') {
              // The canonical preview already has its own
              // page title. Keep Markdown H1 as metadata,
              // not as a second visual H1.
              return null;
            }

            if (block.type === 'h2') {
              return (
                <h2 key={'block-' + index}>
                  {renderInlineMarkdown(
                    block.text,
                  )}
                </h2>
              );
            }

            if (block.type === 'h3') {
              return (
                <h3 key={'block-' + index}>
                  {renderInlineMarkdown(
                    block.text,
                  )}
                </h3>
              );
            }

            if (block.type === 'quote') {
              return (
                <blockquote
                  key={'block-' + index}
                >
                  {renderInlineMarkdown(
                    block.text,
                  )}
                </blockquote>
              );
            }

            if (block.type === 'list') {
              return (
                <ul key={'block-' + index}>
                  {block.items.map(
                    (item, itemIndex) => (
                      <li
                        key={
                          'item-' +
                          index +
                          '-' +
                          itemIndex
                        }
                      >
                        {renderInlineMarkdown(
                          item,
                        )}
                      </li>
                    ),
                  )}
                </ul>
              );
            }

            return (
              <p key={'block-' + index}>
                {renderInlineMarkdown(
                  block.text,
                )}
              </p>
            );
          })}
        </div>

        <footer className={styles.footer}>
          <div>
            <strong>Opération autonome</strong>
            <p>{page.autonomousAction}</p>
          </div>
          <div>
            <strong>Evidence IDs</strong>
            <p>{page.evidenceRefs.join(' · ')}</p>
          </div>
          <small>
            Cette page est un aperçu interne du
            Studio. Aucun CTA public n’est activé.
          </small>
        </footer>
      </article>
    </main>
  );
}
