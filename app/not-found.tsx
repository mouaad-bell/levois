import Link from 'next/link';
export default function NotFound(){return <main className="page-main"><section className="page-hero container"><p className="eyebrow">Erreur 404</p><h1>Cette page n’existe pas.</h1><p className="lead">Revenez à l’accueil pour reprendre votre parcours.</p><Link className="button" href="/">Retour à l’accueil</Link></section></main>}
