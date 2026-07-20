import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { AnalyticsBridge } from '@/components/AnalyticsBridge';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: 'LEVOIS — Comprendre avant de vendre', template: '%s — LEVOIS' },
  description: 'LEVOIS aide les propriétaires du bassin chartrain à comprendre comment le marché perçoit leur bien avant de décider comment le vendre.',
  openGraph: { title: 'LEVOIS', description: 'Comprendre comment le marché perçoit votre bien.', url: site.url, siteName: 'LEVOIS', locale: 'fr_FR', type: 'website' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>
        <AnalyticsBridge />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
