import Image from 'next/image';
import Link from 'next/link';

const situations = [
  ['Je réfléchis à vendre','Clarifier votre projet avant de parler prix ou mandat.'],
  ['Je prépare la mise en vente','Vérifier que le bien, le message et la cible sont alignés.'],
  ['Mon bien est déjà publié','Lire les premiers signaux sans réagir trop vite.'],
  ['J’ai peu de demandes','Distinguer visibilité, présentation et positionnement.'],
  ['J’ai des visites mais pas d’offre','Comprendre ce que les objections répètent.'],
  ['La vente dure','Éviter que le temps ne travaille contre vous.'],
];

const pillars = [
  ['Comprendre','Le bien, votre projet et vos contraintes.'],
  ['Aligner','Vos objectifs avec la réalité du marché.'],
  ['Positionner','Le prix, le récit et la cible d’acheteurs.'],
  ['Piloter','Les signaux, les visites et les ajustements.'],
  ['Apprendre','Chaque retour devient une décision utile.'],
];

const resources = [
  ['Pourquoi deux maisons proches peuvent se vendre à des prix différents','Comprendre'],
  ['Peu de visites : faut-il changer le prix ou la présentation ?','Piloter'],
  ['Ce qu’une absence d’offre révèle réellement','Apprendre'],
];

export default function HomePage() {
  return (
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">Vendre dans le bassin chartrain</p>
          <h1>Vous connaissez votre maison.<br/><span>Le marché la découvre autrement.</span></h1>
          <p className="lead">Avant de décider comment vendre, il faut comprendre comment votre bien sera perçu, comparé et choisi.</p>
          <div className="button-row"><Link className="button" href="/faire-le-point/">Faire le point</Link><Link className="button button-secondary" href="/methode/">Découvrir la méthode</Link></div>
          <p className="micro">Un premier regard utile, sans discours commercial.</p>
        </div>
        <div className="hero-media">
          <Image src="/images/mouaad-lea.jpg" alt="Mouaad échangeant avec Léa, assistante virtuelle de LEVOIS" width={1536} height={1024} priority />
          <div className="image-note"><strong>Léa, assistante virtuelle</strong><span>Elle explique et oriente. Mouaad analyse, conseille et accompagne.</span></div>
        </div>
      </section>

      <section className="container section situation-section">
        <div className="section-head"><div><p className="eyebrow">Votre point de départ</p><h2>Commencez par votre situation, pas par nos services.</h2></div><p>Chaque problème indique une prochaine décision différente. Choisissez l’entrée qui vous ressemble aujourd’hui.</p></div>
        <div className="situation-grid">
          {situations.map(([title, text], i) => <Link key={title} href="/diagnostic/" className="situation-card"><span>{String(i+1).padStart(2,'0')}</span><h3>{title}</h3><p>{text}</p><b>Commencer →</b></Link>)}
        </div>
      </section>

      <section className="gap-story section">
        <div className="container gap-layout">
          <div className="sticky-copy"><p className="eyebrow">Le Système des Écarts</p><h2>Un bon bien peut être mal compris.</h2><p>La réalité du bien, la perception du vendeur, les attentes des acheteurs et les signaux du marché ne sont pas toujours alignés.</p></div>
          <div className="gap-scenes">
            <article><small>01 · Réalité</small><h3>Ce que le bien est réellement</h3><p>Ses qualités, ses contraintes, son environnement et son état.</p></article>
            <article><small>02 · Perception</small><h3>Ce que vous voyez de l’intérieur</h3><p>Son histoire, les travaux réalisés et ce qu’il représente pour vous.</p></article>
            <article><small>03 · Marché</small><h3>Ce que les acheteurs comprennent</h3><p>Une promesse comparée à d’autres offres, dans un contexte précis.</p></article>
            <article><small>04 · Décision</small><h3>Réduire l’écart avant d’ajuster</h3><p>Comprendre ce qui bloque évite de modifier le prix, le récit ou la présentation au hasard.</p></article>
          </div>
        </div>
      </section>

      <section className="pilot-section section">
        <div className="container">
          <div className="section-head inverse"><div><p className="eyebrow">Vente pilotée</p><h2>Ne pas publier puis attendre.</h2></div><p>Une commercialisation se pilote : on observe, on interprète, puis on ajuste une chose à la fois.</p></div>
          <div className="comparison"><div className="improvised"><span>Vente improvisée</span><strong>Publier</strong><strong>Attendre</strong><strong>Subir</strong><strong>Négocier sous pression</strong></div><div className="piloted"><span>Vente pilotée</span><strong>Comprendre</strong><strong>Positionner</strong><strong>Observer</strong><strong>Décider</strong></div></div>
        </div>
      </section>

      <section className="method-story section" id="methode">
        <div className="container"><div className="section-head"><div><p className="eyebrow">La méthode LEVOIS</p><h2>Cinq repères pour savoir où vous êtes et ce qui vient ensuite.</h2></div><p>Les étapes ne sont pas des cases à cocher. Elles forment une progression qui transforme les réactions du marché en décisions utiles.</p></div></div>
        <div className="method-track">
          {pillars.map(([title,text], i) => <article key={title} className={`pillar p${i+1}`}><div className="pillar-number">{String(i+1).padStart(2,'0')}</div><div><small>Étape {i+1}</small><h3>{title}</h3><p>{text}</p></div></article>)}
        </div>
        <div className="container center"><Link className="button" href="/methode/">Voir la méthode en détail</Link></div>
      </section>

      <section className="container section orientation">
        <div className="orientation-copy"><p className="eyebrow">Première orientation</p><h2>Obtenez une lecture utile de votre situation.</h2><p>Le diagnostic ne donne ni une estimation définitive ni une vérité automatique. Il aide à identifier le pilier où se situe le principal écart et la prochaine étape à envisager.</p><ul><li>5 questions simples</li><li>Une orientation immédiate</li><li>Aucune coordonnée obligatoire</li></ul><Link className="button" href="/diagnostic/">Démarrer le diagnostic</Link></div>
        <div className="orientation-visual" aria-hidden="true"><div className="orbit o1">Comprendre</div><div className="orbit o2">Positionner</div><div className="orbit o3">Piloter</div><div className="core">Votre prochaine décision</div></div>
      </section>

      <section className="container section resources-preview">
        <div className="section-head"><div><p className="eyebrow">Ressources utiles</p><h2>Comprendre avant de prendre rendez-vous.</h2></div><p>Les contenus sont organisés par situation et par décision, pas simplement par date de publication.</p></div>
        <div className="resource-grid">{resources.map(([title,pillar],i)=><Link key={title} href="/ressources/" className="resource-card"><div className={`resource-art art${i+1}`}></div><span>{pillar}</span><h3>{title}</h3><b>Lire la ressource →</b></Link>)}</div>
      </section>

      <section className="team-section section">
        <div className="container"><div className="section-head inverse"><div><p className="eyebrow">Qui accompagne ?</p><h2>Un interlocuteur humain, une méthode structurée, une continuité pédagogique.</h2></div><p>Chaque rôle est clair. LEVOIS explique. Léa transmet. Mouaad analyse et accompagne. SAFTI fournit le cadre professionnel.</p></div>
          <div className="team-grid">
            <article className="team-card photo"><Image src="/images/mouaad.webp" alt="Mouaad Boullourou" width={800} height={800}/><div><small>Mouaad</small><h3>La relation humaine</h3><p>Il écoute, analyse votre situation et engage sa responsabilité professionnelle.</p></div></article>
            <article className="team-card levois"><small>LEVOIS</small><h3>La structure</h3><p>La méthode, les diagnostics, les contenus et les outils qui rendent les décisions plus lisibles.</p><div className="system-motif"></div></article>
            <article className="team-card photo lea"><Image src="/images/lea.png" alt="Léa, assistante virtuelle de LEVOIS" width={1104} height={1472}/><div><small>Léa · assistante virtuelle</small><h3>La continuité pédagogique</h3><p>Elle explique, reformule et vous oriente vers la bonne ressource.</p></div></article>
          </div>
        </div>
      </section>

      <section className="container section final-cta">
        <p className="eyebrow">Commencer simplement</p><h2>Pas besoin d’être prêt à vendre pour commencer à y voir clair.</h2>
        <div className="cta-grid"><Link href="/contact/"><span>01</span><h3>Parler de votre situation</h3><p>Un échange confidentiel avec Mouaad, sans engagement.</p></Link><Link href="/votre-rue/"><span>02</span><h3>Voir ce qui s’est vendu autour de vous</h3><p>Une porte d’entrée locale pour contextualiser votre marché.</p></Link><Link href="/carte/"><span>03</span><h3>Retrouver les coordonnées de Mouaad</h3><p>Téléphone, email et accès direct après une rencontre.</p></Link></div>
      </section>
    </main>
  );
}
