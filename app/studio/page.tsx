import type { Metadata } from 'next';
import { Studio } from '@/components/Studio';

export const metadata: Metadata = {
  title: 'Studio éditorial',
  robots: { index: false, follow: false },
};

export default function StudioPage() {
  return (
    <main>
      <Studio />
    </main>
  );
}
