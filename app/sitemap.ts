import type { MetadataRoute } from 'next';

import answers from '@/content/answers/ANSWERS_PILOTS_V1.json';
import { answerCanonicalPath } from '@/lib/answers-content';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

const stableRoutes = [
  '/',
  '/faire-le-point/',
  '/diagnostic/',
  '/methode/',
  '/ressources/',
  '/marche-local/',
  '/mouaad/',
  '/contact/',
  '/carte/',
  '/votre-rue/',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const stableEntries: MetadataRoute.Sitemap = stableRoutes.map(
    (route) => ({ url: new URL(route, site.url).toString() }),
  );
  const publishedAnswers: MetadataRoute.Sitemap = answers.pages
    .filter((page) => page.publicationStatus === 'PUBLISHED')
    .map((page) => ({
      url: new URL(
        answerCanonicalPath(page.slug),
        site.url,
      ).toString(),
      lastModified: page.dateModified,
    }));

  return [...stableEntries, ...publishedAnswers];
}
