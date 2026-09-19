import type { Metadata } from 'next';
import { RenderGallery } from '@/components/render/RenderGallery';
import type { CarouselRenderPackage } from '@/lib/carousel-render-contract';

import pilot01 from '@/content/pilots/PILOT_01_RENDER_CONTRACT_V1.json';
import pilot02 from '@/content/pilots/PILOT_02_RENDER_CONTRACT_V1.json';
import pilot03 from '@/content/pilots/PILOT_03_RENDER_CONTRACT_V1.json';

export const metadata: Metadata = {
  title: 'LEVOIS Studio — Renderer',
  robots: {
    index: false,
    follow: false,
  },
};

const items = [
  {
    id: 'space',
    label: '01 · Espace / Usage',
    subtitle: 'Deux chambres. Où travaillez-vous quand les deux sont occupées ?',
    packageData: pilot01 as unknown as CarouselRenderPackage,
  },
  {
    id: 'mobility',
    label: '02 · Lieu / Mobilité',
    subtitle: 'Moins chère, plus loin : votre soirée fonctionne-t-elle encore ?',
    packageData: pilot02 as unknown as CarouselRenderPackage,
  },
  {
    id: 'price',
    label: '03 · Prix / Valeur',
    subtitle: '25 000 € d’écart. Trop chère ?',
    packageData: pilot03 as unknown as CarouselRenderPackage,
  },
];

export default function StudioRenderPage() {
  return <RenderGallery items={items} />;
}
