import { Diagnostic } from '@/components/Diagnostic';
export const metadata = { title: 'Diagnostic de commercialisation' };
export default function Page(){return <main className="page-main"><section className="page-hero container"><p className="eyebrow">Diagnostic initial</p><h1>Identifiez l’écart qui mérite votre attention.</h1><p className="lead">Cinq questions pour situer votre projet dans la méthode LEVOIS. Le résultat est une orientation, pas une estimation officielle.</p></section><section className="container section"><Diagnostic/></section></main>}
