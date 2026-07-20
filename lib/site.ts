export const site = {
  name: 'LEVOIS',
  url: 'https://levois.fr',
  owner: 'Mouaad Boullourou',
  role: 'Conseiller immobilier indépendant SAFTI',
  email: 'mouaad@levois.fr',
  emailSafti: 'mouaad.boullourou@safti.fr',
  phoneDisplay: '07 81 38 01 21',
  phoneHref: 'tel:+33781380121',
  zone: 'Lèves et bassin chartrain',
  formspreeEndpoint: process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT ?? 'https://formspree.io/f/xnjynroj',
} as const;
