import Link from 'next/link';
import Image from 'next/image';
import Ecart from '../components/Ecart';

export default function Home(){return <>
<section className="hero"><div className="container hero-grid">
  <div className="hero-copy">
    <span className="eyebrow">VENDRE DANS LE BASSIN CHARTRAIN</span>
    <h1>Vous connaissez votre maison.<br/><em>Le marché la découvre autrement.</em></h1>
    <p className="lead">Avant de choisir un prix, de publier une annonce ou d’accepter une offre, il faut comprendre comment les acheteurs vont réellement percevoir votre bien.</p>
    <p>Je vous aide à réduire cet écart pour construire une stratégie de commercialisation claire, cohérente et pilotée.</p>
    <div className="actions"><Link className="button primary" href="/diagnostic">Faire le point sur mon projet</Link><Link className="text-link" href="/methode">Comprendre la méthode</Link></div>
    <p className="reassurance">Un premier regard utile, sans engagement et sans discours commercial.</p>
  </div>
  <div className="hero-visual">
    <div className="portrait-frame"><Image src="/mouaad-portrait.webp" alt="Mouaad Boullourou, conseiller immobilier indépendant SAFTI" fill priority sizes="(max-width: 800px) 100vw, 42vw"/></div>
    <div className="hero-note"><span className="eyebrow">LÉA · PÉDAGOGIE</span><strong>Des explications simples pour avancer à votre rythme.</strong><Link href="/ressources">Découvrir les ressources</Link></div>
  </div>
</div></section>
<section className="section"><div className="container"><div className="section-heading"><span className="eyebrow">LE SYSTÈME DES ÉCARTS</span><h2>Une vente se complique rarement à cause d’un seul détail.</h2><p>Elle se complique lorsque la réalité du bien, les attentes du vendeur et la lecture des acheteurs ne sont plus alignées.</p></div><Ecart/></div></section>
<section className="section sunken"><div className="container"><div className="split"><div><span className="eyebrow">LA MÉTHODE LEVOIS</span><h2>Cinq étapes pour transformer les réactions du marché en décisions utiles.</h2></div><p className="lead-small">Comprendre avant d’agir. Aligner le projet et la réalité. Positionner le bien. Piloter la commercialisation. Apprendre de chaque signal.</p></div><div className="steps">{[['01','Comprendre'],['02','Aligner'],['03','Positionner'],['04','Piloter'],['05','Apprendre']].map(([n,t])=><div className="step" key={t}><span className="mono">{n}</span><h3>{t}</h3></div>)}</div><Link className="text-link" href="/methode">Voir la méthode en détail</Link></div></section>
<section className="section"><div className="container"><div className="split"><div><span className="eyebrow">UNE ÉQUIPE, UN INTERLOCUTEUR</span><h2>La proximité d’un indépendant. La structure d’une équipe complète.</h2></div><p>Vous échangez directement avec Mouaad. Derrière chaque décision, LEVOIS apporte une méthode, des outils et des contenus pédagogiques. Léa prolonge les explications entre deux rendez-vous.</p></div><div className="role-grid"><article><span>M</span><h3>Mouaad</h3><p>L’écoute, le terrain, l’analyse et les décisions prises avec vous.</p></article><article><span>L</span><h3>Léa</h3><p>La continuité pédagogique, les réponses simples et les ressources utiles.</p></article><article><span>LV</span><h3>LEVOIS</h3><p>La méthode, les diagnostics, les repères et le pilotage de la commercialisation.</p></article></div></div></section>
<section className="cta"><div className="container"><span className="eyebrow light">COMMENCER SANS PRESSION</span><h2>Avant de confier votre vente, commencez par comprendre votre situation.</h2><Link className="button accent" href="/diagnostic">Faire le point</Link></div></section>
</>}
