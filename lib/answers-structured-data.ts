import type { AnswerPageBrief } from './answers-engine';

export type AnswerStructuredDataOptions = {
  siteUrl: string;
  route: string;
  datePublished?: string;
  dateModified?: string;
};

function absoluteUrl(base: string, path: string) {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : '/' + path;
  return cleanBase + cleanPath;
}

export function buildAnswerStructuredData(
  brief: AnswerPageBrief,
  options: AnswerStructuredDataOptions,
) {
  const pageUrl = absoluteUrl(options.siteUrl, options.route);
  const resourcesUrl = absoluteUrl(options.siteUrl, '/ressources/');

  const article: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: brief.title,
    description: brief.metaDescription,
    mainEntityOfPage: pageUrl,
    author: {
      '@type': 'Person',
      name: 'Mouaad Boullourou',
      jobTitle: 'Conseiller immobilier SAFTI',
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'LEVOIS',
      url: options.siteUrl,
    },
  };

  if (options.datePublished) {
    article.datePublished = options.datePublished;
  }
  if (options.dateModified) {
    article.dateModified = options.dateModified;
  }

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Ressources',
        item: resourcesUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: brief.title,
        item: pageUrl,
      },
    ],
  };

  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Mouaad Boullourou',
    jobTitle: 'Conseiller immobilier SAFTI',
    areaServed: [
      'Lèves',
      'Chartres',
      'Lucé',
      'Mainvilliers',
      'Luisant',
      'Le Coudray',
      'Champhol',
    ],
  };

  return {
    article,
    breadcrumb,
    person,
  };
}
