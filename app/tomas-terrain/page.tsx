'use client';

import { useEffect, useMemo, useState } from 'react';

type Property = {
  id: string;
  rank: number;
  title: string;
  price: string;
  surface: string;
  dpe: string;
  seller: string;
  url: string;
  why: string;
  opening: string;
  must: string[];
  critical: string;
  questions: string[];
};

type RecordState = Record<string, any>;

const properties: Property[] = [
  {
    id: 'luce', rank: 1, title: '83 rue René-Langlois — Lucé', price: '158 000 €', surface: '90 m²', dpe: 'E', seller: 'Particulier à confirmer',
    url: 'https://www.leboncoin.fr/ad/ventes_immobilieres/3251631932',
    why: 'Très fort delta économique, 90 m², maison annoncée rénovée.',
    opening: "Je travaille actuellement la recherche d’un acquéreur précis et votre maison a retenu mon attention. Avant d’aller plus loin, je voulais simplement vérifier si vous êtes ouvert à l’intervention d’un professionnel dans ce cadre.",
    must: ['Ouverture à mon intervention', 'Statut de commercialisation', 'Pourquoi 158 k€ / DPE E'],
    critical: 'Comprendre pourquoi une maison annoncée rénovée de 90 m² est à seulement 158 k€.',
    questions: ['Quels travaux ont réellement été refaits et quand ?', 'Pourquoi le DPE reste-t-il en E ?', 'Quel est le système de chauffage ?', 'Les 90 m² incluent-ils la véranda ?', 'La chambre en enfilade est-elle confirmée ?', 'Y a-t-il nuisances, vis-à-vis ou travaux importants à prévoir ?'],
  },
  {
    id: 'mainvilliers', rank: 2, title: '109 rue de la République — Mainvilliers', price: '195 000 €', surface: '87 m²', dpe: 'D', seller: 'Particulier',
    url: 'https://www.leboncoin.fr/ad/ventes_immobilieres/3236058141',
    why: 'Rénovée, grand extérieur, prix sous 200 k€, très proche de la cible Tomas.',
    opening: "J’ai bien vu que vous ne souhaitiez pas être démarché par des agences et je respecte cela. Je suis professionnel, mais je viens uniquement parce que j’accompagne déjà un acquéreur précis auquel votre maison pourrait correspondre. Est-ce que vous acceptez qu’on échange uniquement dans ce cadre ?",
    must: ['Accord malgré la mention sans agence', 'Statut de commercialisation', '87 m² : maison seule ou studio inclus'],
    critical: 'Vérifier si les 87 m² correspondent vraiment à la maison principale ou incluent le studio.',
    questions: ['Les 87 m² comprennent-ils le studio ?', 'Quelle est la surface de la maison principale seule ?', 'Quels travaux ont été réellement réalisés ?', 'Y a-t-il encore des postes techniques à prévoir ?', 'Quelle est la taille de la pièce de vie ?', 'Rue, circulation, vis-à-vis : y a-t-il un point particulier à connaître ?'],
  },
  {
    id: 'hautsmenus', rank: 3, title: '7 chemin des Hauts Menus — Chartres', price: '201 000 €', surface: '93 m²', dpe: 'D', seller: 'Agence — Chantal Dupont Hâche',
    url: 'https://www.seloger.com/annonce/achat/centre-val-de-loire/eure-et-loir-28/chartres-28000/269kbr2aw1kh',
    why: 'Ancien rénové, 93 m², cachet, jardin : très fort match émotionnel.',
    opening: "Bonjour, Mouaad Boullourou, conseiller SAFTI. J’accompagne un acquéreur qualifié sur un projet de retraite autour de Chartres et votre longère ressort particulièrement. Êtes-vous ouverts à une collaboration inter-cabinet si mon acquéreur souhaite visiter ?",
    must: ['Bien disponible', 'Inter-cabinet accepté', 'Défaut principal / travaux restants'],
    critical: 'Valider que le charme ne masque ni défaut technique ni problème d’environnement.',
    questions: ['Qu’est-ce qui a réellement été rénové et quand ?', 'Reste-t-il des travaux, même non urgents ?', 'Quel est le système de chauffage ?', 'Avez-vous le diagnostic complet ?', 'Quel est le principal défaut remonté par les visiteurs ?', 'Avez-vous déjà reçu des offres ?'],
  },
  {
    id: 'muret', rank: 4, title: '52 bis rue Muret — Chartres', price: '≈ 179 000 €', surface: '84–85 m²', dpe: 'D', seller: 'Plusieurs professionnels',
    url: 'https://www.seloger.com/annonces/achat/maison/chartres-28/haute-ville-basse-ville/259736121.htm',
    why: 'Maison de caractère dans Chartres autour de 2 100 €/m².',
    opening: "Bonjour, Mouaad Boullourou, conseiller SAFTI. J’accompagne un acquéreur qualifié auquel cette maison pourrait correspondre. Avant de l’approfondir, je voulais savoir si vous acceptez une collaboration inter-cabinet sur ce mandat.",
    must: ['Collaboration possible', 'Statut du mandat', 'Bruit / stationnement / lumière'],
    critical: 'Stationnement, bruit, lumière et relation à la rue peuvent éliminer le bien.',
    questions: ['Pourquoi le prix est-il autour de 179 k€ ?', 'Quels travaux restent à prévoir ?', 'Quelle est la surface de la pièce de vie ?', 'Quelle solution de stationnement ?', 'Niveau de circulation et vis-à-vis ?', 'Quel frein revient le plus souvent après les visites ?'],
  },
  {
    id: 'jeanrostand', rank: 5, title: '20 rue Jean-Rostand — Chartres', price: '199 000 €', surface: '98 m²', dpe: 'C', seller: 'Professionnel / délégation',
    url: 'https://www.seloger.com/annonces/achat/maison/chartres-28/la-madeleine/275116467.htm',
    why: '98 m², DPE C, aucun travaux annoncé, excellent benchmark rationnel.',
    opening: "Bonjour, Mouaad Boullourou, conseiller SAFTI. J’ai un acquéreur qualifié dont la recherche correspond assez bien à votre maison rue Jean-Rostand. Êtes-vous ouverts à une collaboration inter-cabinet si le bien se confirme pour lui ?",
    must: ['Collaboration possible', 'Aucun travaux : réalité', 'Défaut principal remonté'],
    critical: 'Vérifier si la rationalité économique compense le manque de cachet.',
    questions: ['« Aucun travaux » signifie-t-il vraiment aucun poste à prévoir ?', 'Âge du chauffage, menuiseries, électricité, cuisine ?', 'Surface exacte de la pièce de vie ?', 'DPE C récent ?', 'Quel est le principal défaut du bien ?', 'Quels retours reviennent après visite ?'],
  },
  {
    id: 'coudray', rank: 6, title: '20 rue des Cassoirs — Le Coudray', price: '230 900 €', surface: '90 m²', dpe: 'D', seller: 'Particulier PAP',
    url: 'https://www.pap.fr/annonces/-r464000714',
    why: '90 m², très bon état, immédiatement proche de Chartres.',
    opening: "Bonjour, je préfère être transparent : je suis conseiller immobilier SAFTI. Je ne vous contacte pas pour vous proposer une commercialisation classique, mais parce que j’accompagne déjà un acquéreur précis auquel votre maison pourrait correspondre. Êtes-vous ouvert à cette démarche ?",
    must: ['Ouverture à mon intervention', 'Statut de commercialisation', 'Justification du prix / travaux'],
    critical: 'À 230,9 k€, le bien doit vraiment justifier sa prime par rapport aux autres.',
    questions: ['Maison réellement habitable sans travaux ?', 'Quels travaux importants ont été faits et quand ?', 'Âge chauffage, menuiseries, cuisine, salle de bains ?', '90 m² entièrement habitables ?', 'Vis-à-vis ou nuisance particulière ?', 'Le prix provient-il d’une estimation professionnelle ?'],
  },
  {
    id: 'jouy', rank: 7, title: '20 rue du Colombier — Jouy', price: '220 000 €', surface: '90 m²', dpe: 'D', seller: 'Diffuseur à identifier',
    url: 'https://www.leboncoin.fr/ad/ventes_immobilieres/3249557266',
    why: '90 m², maison récente, aucun travaux annoncé, commune déjà évoquée positivement.',
    opening: "Bonjour, je vous contacte au sujet de la maison rue du Colombier. Avant toute chose, êtes-vous le propriétaire ou le professionnel chargé de sa commercialisation ?",
    must: ['Identifier l’interlocuteur', 'Accès ou inter-cabinet', 'État réel depuis 2008'],
    critical: 'Tester si une maison récente sans travaux peut compenser son goût pour l’ancien.',
    questions: ['Quels postes commencent à dater depuis 2008 ?', 'Quel chauffage et quel âge ?', 'Quelle taille de pièce de vie ?', 'Exposition et vis-à-vis du jardin ?', 'Rue principalement résidentielle ?', 'Quel est le principal frein remonté par les visites ?'],
  },
];

const STORAGE_KEY = 'levois_tomas_terrain_v1';

export default function TomasTerrainPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [data, setData] = useState<RecordState>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
  }, [data]);

  const done = useMemo(() => properties.filter(p => data[p.id]?.verdict).length, [data]);
  const property = properties.find(p => p.id === selected);

  const patch = (id: string, key: string, value: any) => {
    setData(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: value } }));
  };

  const s: React.CSSProperties = { maxWidth: 920, margin: '0 auto', padding: 16 };
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #deded8', borderRadius: 18, padding: 16 };
  const input: React.CSSProperties = { width: '100%', fontSize: 16, padding: 11, border: '1px solid #ccc', borderRadius: 11, background: '#fff' };
  const label: React.CSSProperties = { display: 'block', fontSize: 14, margin: '10px 0 5px' };

  if (!property) {
    return <main style={{ background: '#f5f5f2', minHeight: '100vh', color: '#171717' }}>
      <div style={{ ...s, paddingTop: 22 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>LEVOIS — Tournée Tomas</h1>
        <p style={{ color: '#6d6d68', marginTop: 6 }}>Accès d’abord · qualification ensuite · {done} / 7 traités</p>
        <div style={{ height: 8, background: '#e3e2dc', borderRadius: 99, overflow: 'hidden', marginBottom: 18 }}><div style={{ width: `${(done / 7) * 100}%`, height: '100%', background: '#ef6c00' }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12 }}>
          {properties.map(p => <button key={p.id} onClick={() => setSelected(p.id)} style={{ ...card, textAlign: 'left', cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><small>Priorité {p.rank}</small>{data[p.id]?.verdict && <small>{data[p.id].verdict}</small>}</div>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>{p.title}</h2>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}><span>{p.price}</span><span>·</span><span>{p.surface}</span><span>·</span><span>DPE {p.dpe}</span></div>
            <p style={{ color: '#6d6d68' }}>{p.seller}</p><p>{p.why}</p>
          </button>)}
        </div>
      </div>
    </main>;
  }

  const d = data[property.id] || {};
  const accessQuestions = ['Bien toujours disponible ?', 'Interlocuteur identifié ?', 'Ouvert à mon intervention pour un acquéreur précis ?', 'Statut du mandat clarifié ?', 'Si agence : collaboration inter-cabinet possible ?'];

  return <main style={{ background: '#f5f5f2', minHeight: '100vh', color: '#171717' }}>
    <div style={s}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <button onClick={() => setSelected(null)} style={{ padding: '10px 12px', borderRadius: 11, border: '1px solid #ccc', background: '#fff' }}>← Biens</button>
        <a href={property.url} target="_blank" rel="noreferrer" style={{ padding: '10px 12px', borderRadius: 11, background: '#ef6c00', color: '#fff', textDecoration: 'none' }}>Ouvrir l’annonce</a>
      </div>
      <section style={card}>
        <small>Priorité {property.rank}</small><h1 style={{ fontSize: 22 }}>{property.title}</h1>
        <p>{property.price} · {property.surface} · DPE {property.dpe}</p><p style={{ color: '#6d6d68' }}>{property.seller}</p>

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>Avant de parler</h3><div style={{ borderLeft: '4px solid #ef6c00', background: '#faf8f5', padding: 12 }}>{property.opening}</div>
        <p style={{ fontWeight: 600 }}>Les 3 informations indispensables</p><ul>{property.must.map(x => <li key={x}>{x}</li>)}</ul>

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>1 — Interlocuteur</h3>
        <label style={label}>Type</label><select style={input} value={d.contactType || ''} onChange={e => patch(property.id, 'contactType', e.target.value)}><option value="">À déterminer</option><option>Propriétaire</option><option>Agence</option><option>Mandataire</option><option>Autre</option></select>
        <label style={label}>Nom de l’agence / réseau</label><input style={input} value={d.agency || ''} onChange={e => patch(property.id, 'agency', e.target.value)} />
        <label style={label}>Nom du conseiller / interlocuteur</label><input style={input} value={d.contactName || ''} onChange={e => patch(property.id, 'contactName', e.target.value)} />
        <label style={label}>Téléphone</label><input style={input} value={d.phone || ''} onChange={e => patch(property.id, 'phone', e.target.value)} />
        <label style={label}>Email</label><input style={input} value={d.email || ''} onChange={e => patch(property.id, 'email', e.target.value)} />

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>2 — Accès au bien</h3>
        {accessQuestions.map((q, i) => <label key={q} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', margin: '10px 0' }}><input type="checkbox" checked={!!d[`check${i}`]} onChange={e => patch(property.id, `check${i}`, e.target.checked)} style={{ width: 22, height: 22 }} /><span>{q}</span></label>)}
        <label style={label}>Statut commercial</label><select style={input} value={d.mandate || ''} onChange={e => patch(property.id, 'mandate', e.target.value)}><option value="">À déterminer</option><option>Particulier uniquement</option><option>Mandat simple</option><option>Mandat exclusif</option><option>Délégation / inter-cabinet</option><option>À clarifier</option></select>
        <label style={label}>Accès pour Tomas</label><select style={input} value={d.access || ''} onChange={e => patch(property.id, 'access', e.target.value)}><option value="">À déterminer</option><option>Ouvert</option><option>Agence à contacter</option><option>Collaboration possible</option><option>Refus</option><option>Bien indisponible</option></select>
        <div style={{ background: '#fff1e6', borderRadius: 12, padding: 11, marginTop: 10 }}><b>STOP :</b> refus, indisponible ou exclusivité sans collaboration = tu arrêtes ici.</div>

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>3 — Qualification Tomas</h3><p style={{ color: '#6d6d68' }}>À remplir naturellement au fil de l’échange.</p>
        {property.questions.map((q, i) => <div key={q}><label style={label}>{q}</label><input style={input} value={d[`q${i}`] || ''} onChange={e => patch(property.id, `q${i}`, e.target.value)} placeholder="Réponse / note rapide" /></div>)}

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>Point critique</h3><div style={{ background: '#fff1e6', borderRadius: 12, padding: 11 }}>{property.critical}</div>

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>4 — Ressenti terrain</h3>
        <label style={label}>Rue / environnement</label><select style={input} value={d.environment || ''} onChange={e => patch(property.id, 'environment', e.target.value)}><option value="">À noter</option><option>Très bon</option><option>Bon</option><option>Moyen</option><option>Mauvais</option></select>
        <label style={label}>Principal avantage</label><input style={input} value={d.plus || ''} onChange={e => patch(property.id, 'plus', e.target.value)} />
        <label style={label}>Principal risque / défaut</label><input style={input} value={d.risk || ''} onChange={e => patch(property.id, 'risk', e.target.value)} />
        <label style={label}>Notes libres</label><textarea style={{ ...input, minHeight: 90 }} value={d.notes || ''} onChange={e => patch(property.id, 'notes', e.target.value)} />

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>5 — Sortie d’entretien</h3>
        <label style={label}>Ce que j’ai obtenu</label><input style={input} value={d.obtained || ''} onChange={e => patch(property.id, 'obtained', e.target.value)} />
        <label style={label}>Ce que j’ai promis</label><input style={input} value={d.promise || ''} onChange={e => patch(property.id, 'promise', e.target.value)} />
        <label style={label}>Qui rappelle / quand ?</label><input style={input} value={d.follow || ''} onChange={e => patch(property.id, 'follow', e.target.value)} />

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>6 — Débrief dans la voiture</h3>
        <label style={label}>Impression en une phrase</label><input style={input} value={d.oneLine || ''} onChange={e => patch(property.id, 'oneLine', e.target.value)} />
        <label style={label}>Intérêt Tomas</label><select style={input} value={d.tomasInterest || ''} onChange={e => patch(property.id, 'tomasInterest', e.target.value)}><option value="">À noter</option><option>Fort</option><option>Moyen</option><option>Faible</option><option>Nul</option></select>
        <label style={label}>La chose à ne pas oublier</label><input style={input} value={d.remember || ''} onChange={e => patch(property.id, 'remember', e.target.value)} />

        <hr style={{ border: 0, borderTop: '1px solid #deded8', margin: '16px 0' }} />
        <h3>7 — Verdict</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {['À proposer', 'À vérifier', 'Bien test', 'Éliminé'].map(v => <button key={v} onClick={() => patch(property.id, 'verdict', v)} style={{ padding: 12, borderRadius: 11, border: '1px solid #ccc', background: d.verdict === v ? '#ef6c00' : '#fff', color: d.verdict === v ? '#fff' : '#171717' }}>{v}</button>)}
        </div>
        <label style={label}>Prochaine action</label><select style={input} value={d.nextAction || ''} onChange={e => patch(property.id, 'nextAction', e.target.value)}><option value="">À définir</option><option>Aucune</option><option>Rappeler propriétaire</option><option>Contacter agence</option><option>Obtenir diagnostics</option><option>Formaliser intervention</option><option>Préparer visite Tomas</option></select>
      </section>
    </div>
  </main>;
}
