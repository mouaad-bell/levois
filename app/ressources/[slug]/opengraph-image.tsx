import { ImageResponse } from 'next/og';
import { notFound } from 'next/navigation';

import answers from '@/content/answers/ANSWERS_PILOTS_V1.json';
import { answerBySlug } from '@/lib/answers-content';
import { STUDIO_FAMILIES } from '@/lib/studio-schema';

export const alt = 'LEVOIS — réponse immobilière documentée';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return answers.pages.map((page) => ({ slug: page.slug }));
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = answerBySlug(slug);
  if (!page) notFound();

  const family =
    STUDIO_FAMILIES[
      page.familyId as keyof typeof STUDIO_FAMILIES
    ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          padding: '64px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f4f0e7',
          color: '#13232d',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 5 }}>
            LEVOIS
          </span>
          <span
            style={{
              padding: '11px 18px',
              borderRadius: 999,
              background: family?.accent ?? '#00d9f5',
              fontSize: 18,
              fontWeight: 800,
            }}
          >
            {family?.label ?? 'Réponse documentée'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              maxWidth: 1040,
              fontSize: page.title.length > 72 ? 54 : 64,
              fontWeight: 760,
              letterSpacing: -3.2,
              lineHeight: 1.02,
            }}
          >
            {page.title}
          </div>
          <div style={{ fontSize: 22, color: '#536069' }}>
            Comprendre avant de décider · levois.fr
          </div>
        </div>
        <div
          style={{
            width: 150,
            height: 9,
            borderRadius: 999,
            background: family?.accent ?? '#00d9f5',
          }}
        />
      </div>
    ),
    size,
  );
}

