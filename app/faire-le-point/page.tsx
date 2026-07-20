import Link from 'next/link';
export const metadata = { title: 'Faire le point' };
const entries = [
  ['Je réfléchis à vendre','Clarifier votre projet, vos contraintes et votre calendrier.'],
  ['Je prépare la mise en vente','Vérifier le positionnement avant la première publication.'],
  ['Mon bien est déjà publié','Lire les signaux sans modifier plusieurs choses à la fois.'],
  ['J’ai peu de demandes','Distinguer un problème de visibilité d’un problème de perception.'],
  ['J’ai des visites mais pas d’offre','Comprendre ce que les objections racontent réellement.'],
  ['La vente dure','Reprendre la maîtrise avant que le temps ne fragilise la négociation.'],
  ['Mon compromis a été annulé','Revenir aux faits et sécuriser la prochaine décision.'],
];
export default function Page(){return <main className="page-main"><section className="page-hero container"><p className="eyebrow">Faire le point</p><h1>Où en êtes-vous aujourd’hui ?</h1><p className="lead">Choisissez la situation la plus proche de la vôtre. Vous obtiendrez une première orientation, sans devoir laisser vos coordonnées.</p></section><section className="container section"><div className="entry-grid">{entries.map(([t,p])=><Link href="/diagnostic/" className="entry-card" key={t}><h2>{t}</h2><p>{p}</p><span>Commencer →</span></Link>)}</div></section></main>}
