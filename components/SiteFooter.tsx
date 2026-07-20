import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Link className="wordmark footer-wordmark" href="/">LEVOIS</Link>
          <p>LEVOIS, l’écosystème de contenus et la méthode de Mouaad Boullourou, conseiller immobilier indépendant SAFTI sur le bassin chartrain.</p>
        </div>
        <div className="footer-links">
          <Link href="/methode/">La méthode</Link>
          <Link href="/ressources/">Ressources</Link>
          <Link href="/marche-local/">Marché local</Link>
          <Link href="/mouaad/">Mouaad</Link>
          <Link href="/contact/">Échanger</Link>
        </div>
        <div className="footer-links">
          <a href="tel:+33781380121">07 81 38 01 21</a>
          <a href="mailto:mouaad@levois.fr">mouaad@levois.fr</a>
          <Link href="/mentions-legales/">Mentions légales</Link>
          <Link href="/politique-confidentialite/">Confidentialité</Link>
          <Link href="/cookies/">Cookies</Link>
        </div>
      </div>
    </footer>
  );
}
