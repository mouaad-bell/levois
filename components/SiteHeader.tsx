'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const links = [
  ['/faire-le-point/', 'Faire le point'],
  ['/methode/', 'La méthode'],
  ['/ressources/', 'Ressources'],
  ['/marche-local/', 'Marché local'],
  ['/mouaad/', 'Mouaad'],
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link className="wordmark" href="/" onClick={() => setOpen(false)}>LEVOIS</Link>
        <nav id="main-navigation" aria-label="Navigation principale" data-open={open ? 'true' : 'false'}>
          {links.map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>
          ))}
        </nav>
        <Link className="button button-small nav-contact" href="/contact/" data-event="contact_started" data-source="header">Échanger</Link>
        <button
          type="button"
          className="menu-toggle"
          aria-controls="main-navigation"
          aria-expanded={open}
          onClick={() => setOpen(value => !value)}
        >
          <span className="sr-only">{open ? 'Fermer le menu' : 'Ouvrir le menu'}</span>
          <span aria-hidden="true">{open ? 'Fermer' : 'Menu'}</span>
        </button>
      </div>
    </header>
  );
}
