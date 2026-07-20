import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link className="wordmark" href="/">LEVOIS</Link>
        <nav aria-label="Navigation principale">
          <Link href="/faire-le-point/">Faire le point</Link>
          <Link href="/methode/">La méthode</Link>
          <Link href="/ressources/">Ressources</Link>
          <Link href="/marche-local/">Marché local</Link>
          <Link href="/mouaad/">Mouaad</Link>
        </nav>
        <Link className="button button-small" href="/contact/">Échanger</Link>
      </div>
    </header>
  );
}
