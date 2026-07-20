import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: { default: 'LEVOIS — Comprendre avant de vendre', template: '%s — LEVOIS' },
  description: "LEVOIS aide les propriétaires du bassin chartrain à comprendre comment le marché perçoit leur bien avant de construire une stratégie de commercialisation.",
  metadataBase: new URL('https://levois.fr')
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
