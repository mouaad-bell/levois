import Link from 'next/link';
export const metadata = { title: 'Ressources pour les propriétaires' };
const groups=[
 ['Comprendre',['Pourquoi la valeur ressentie n’est pas toujours la valeur perçue','Ce qu’un acheteur regarde lors de sa première découverte','Pourquoi deux maisons proches peuvent se vendre différemment']],
 ['Aligner',['Prix souhaité, délai et sécurité : les arbitrages à poser','Vendre avant d’acheter ou acheter avant de vendre ?','Comment clarifier ses priorités avant une mise en vente']],
 ['Positionner',['Pourquoi le positionnement ne se limite pas au prix','Comment reconnaître les biens réellement comparables','À quels acheteurs votre maison peut-elle vraiment correspondre ?']],
 ['Piloter',['Peu de visites : prix, présentation ou visibilité ?','Que signifient les premières réactions après publication ?','Pourquoi le temps peut finir par travailler contre le vendeur']],
 ['Apprendre',['Ce qu’une absence d’offre révèle réellement','Comment utiliser les retours de visite sans les subir','Quand faut-il ajuster une stratégie de commercialisation ?']]
];
export default function Page(){return <main className="page-main"><section className="page-hero container"><p className="eyebrow">Bibliothèque pédagogique</p><h1>Des ressources organisées autour de vos décisions.</h1><p className="lead">Pas un fil d’actualité. Une bibliothèque pour comprendre votre situation, préparer une décision et poser de meilleures questions.</p></section><section className="container section resource-groups">{groups.map(([pillar,items])=><section key={pillar as string}><div><p className="eyebrow">{pillar}</p><h2>{pillar}</h2></div><div>{(items as string[]).map((item,i)=><article key={item}><span>{String(i+1).padStart(2,'0')}</span><h3>{item}</h3><p>Une lecture claire et concrète pour relier les réactions du marché à une décision utile.</p><Link href="/contact/">Poser une question sur ce sujet →</Link></article>)}</div></section>)}</section></main>}
