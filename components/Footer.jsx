import Link from 'next/link';
export default function Footer(){return <footer className="footer"><div className="container footer-grid">
  <div><div className="wordmark footer-mark">LEVOIS</div><p>La marque éditoriale, la méthode et l’écosystème numérique de Mouaad Boullourou.</p><p className="small">Mouaad Boullourou — Conseiller immobilier indépendant SAFTI.</p></div>
  <div><span className="eyebrow light">CONTACT</span><a href="tel:+33781380121">07 81 38 01 21</a><a href="mailto:mouaad@levois.fr">mouaad@levois.fr</a><p>Lèves · Chartres · bassin chartrain</p></div>
  <div><span className="eyebrow light">ACCÈS</span><Link href="/carte">Carte de visite</Link><Link href="/votre-rue">Ventes dans votre rue</Link><Link href="/mentions-legales">Mentions légales</Link><Link href="/politique-confidentialite">Confidentialité</Link></div>
</div></footer>}
