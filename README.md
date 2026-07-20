# LEVOIS — site de production

Projet Next.js statique prêt pour GitHub et Cloudflare Pages.

## Développement

```bash
npm install
npm run dev
```

## Vérification de production

```bash
npm run build
```

Le dossier statique généré est `out/`.

## Cloudflare Pages

- Framework preset : Next.js (Static HTML Export) ou aucun
- Build command : `npm run build`
- Output directory : `out`
- Node.js : 20 ou 22

## Routes prioritaires

- `/` — accueil
- `/carte/` — QR code de la carte de visite
- `/votre-rue/` — QR code de l’encart magazine
- `/diagnostic/`
- `/methode/`
- `/ressources/`
- `/mouaad/`
- `/contact/`

## Avant mise en ligne définitive

Compléter les mentions légales avec les informations réglementaires exactes SAFTI et vérifier le domaine personnalisé `levois.fr` dans Cloudflare Pages.
