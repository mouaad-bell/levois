import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import answers from '@/content/answers/ANSWERS_PILOTS_V1.json';
import { AnswerArticleBody } from '@/components/AnswerArticleBody';
import { AnswerShareActions } from '@/components/AnswerShareActions';
import {
  answerBySlug,
  answerCanonicalPath,
  answerEvidence,
  answerMarkdown,
  publicAnswerBlocks,
} from '@/lib/answers-content';
import { buildAnswerStructuredData } from '@/lib/answers-structured-data';
import { site } from '@/lib/site';
import { STUDIO_FAMILIES } from '@/lib/studio-schema';

import styles from './resourceArticle.module.css';

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return answers.pages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = answerBySlug(slug);

  if (!page) return {};

  const canonicalPath = answerCanonicalPath(page.slug);
  const canonicalUrl = new URL(canonicalPath, site.url).toString();
  const published = page.publicationStatus === 'PUBLISHED';
  const imageUrl = new URL(
    canonicalPath + 'opengraph-image',
    site.url,
  ).toString();

  return {
    title: page.title,
    description: page.answerShort,
    alternates: { canonical: canonicalUrl },
    authors: [{ name: site.owner, url: site.url + '/mouaad/' }],
    robots: { index: published, follow: true },
    openGraph: {
      type: 'article',
      locale: 'fr_FR',
      siteName: site.name,
      url: canonicalUrl,
      title: page.title,
      description: page.answerShort,
      publishedTime: page.datePublished || undefined,
      modifiedTime: page.dateModified,
      authors: [site.owner],
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.answerShort,
      images: [imageUrl],
    },
  };
}

export default async function ResourceArticlePage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const page = answerBySlug(slug);
  if (!page) notFound();

  const family =
    STUDIO_FAMILIES[
      page.familyId as keyof typeof STUDIO_FAMILIES
    ];
  const canonicalPath = answerCanonicalPath(page.slug);
  const canonicalUrl = new URL(canonicalPath, site.url).toString();
  const evidence = answerEvidence(page);
  const blocks = publicAnswerBlocks(answerMarkdown(page));
  const structuredBrief = {
    title: page.title,
    metaDescription: page.answerShort,
  };
  const structuredData = buildAnswerStructuredData(
    structuredBrief,
    {
      siteUrl: site.url,
      route: canonicalPath,
      datePublished: page.datePublished || undefined,
      dateModified: page.dateModified,
      citationUrls: evidence
        .map((item) => item.sourceUrl)
        .filter((url) => url.startsWith('http')),
    },
  );
  const modifiedDate = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(page.dateModified + 'T00:00:00Z'));

  return (
    <main
      className={styles.shell}
      style={
        {
          '--answer-accent': family?.accent ?? '#00D9F5',
        } as React.CSSProperties
      }
    >
      <article className={styles.article}>
        <nav className={styles.breadcrumb} aria-label="Fil d’Ariane">
          <Link href="/ressources/">Ressources</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{family?.label}</span>
        </nav>

        <header className={styles.hero}>
          <p className={styles.kicker}>LEVOIS ANSWERS</p>
          <h1>{page.title}</h1>
          <p className={styles.answerShort}>{page.answerShort}</p>
          <div className={styles.meta}>
            <span>Par {site.owner}</span>
            <span>Mis à jour le {modifiedDate}</span>
            <span>{family?.label}</span>
          </div>
        </header>

        {page.publicationStatus !== 'PUBLISHED' && (
          <p className={styles.reviewNotice}>
            Version préparatoire — partage et référencement prêts,
            indexation suspendue jusqu’à validation éditoriale.
          </p>
        )}

        <aside className={styles.limit}>
          <strong>Limite essentielle</strong>
          <p>{page.essentialLimit}</p>
        </aside>

        <div className={styles.body}>
          <AnswerArticleBody blocks={blocks} />
        </div>

        <section className={styles.method}>
          <p className={styles.sectionLabel}>À faire soi-même</p>
          <h2>Appliquer la réponse à votre situation</h2>
          <p>{page.autonomousAction}</p>
        </section>

        <section className={styles.sources} aria-labelledby="sources-title">
          <p className={styles.sectionLabel}>Traçabilité</p>
          <h2 id="sources-title">Sources utilisées</h2>
          <p>
            Périmètre : {page.targetScope} Vérification des preuves :{' '}
            {page.lastEvidenceReview}.
          </p>
          <ol>
            {evidence.map((item) => (
              <li key={item.evidenceId} id={'source-' + item.evidenceId}>
                <strong>{item.sourcePublisher}</strong>
                <span>{item.sourceTitle}</span>
                <small>
                  {item.evidenceId} · {item.timePeriod}
                </small>
                {item.sourceUrl.startsWith('http') ? (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Consulter la source originale
                  </a>
                ) : (
                  <span>Convention méthodologique LEVOIS</span>
                )}
              </li>
            ))}
          </ol>
        </section>

        <AnswerShareActions
          title={page.title}
          description={page.answerShort}
          canonicalUrl={canonicalUrl}
          author={site.owner}
          modifiedDate={modifiedDate}
        />
      </article>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            structuredData.article,
            structuredData.breadcrumb,
            structuredData.person,
          ]).replace(/</g, '\\u003c'),
        }}
      />
    </main>
  );
}
