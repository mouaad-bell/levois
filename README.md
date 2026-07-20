# LEVOIS — déploiement Cloudflare Workers

Ce projet est un export statique Next.js.

## Commandes Cloudflare

- Build command : `npm run build`
- Deploy command : `npm run deploy`
- Root directory : `/`
- Node.js : 22

Le fichier `wrangler.jsonc` indique explicitement à Cloudflare de publier le dossier statique `out/`. Il évite l’auto-détection Next.js qui cherchait à déployer `.next` comme une application dynamique.

## Routes physiques à conserver

- `/carte/`
- `/votre-rue/`

## Vérification locale

```bash
npm install
npm run build
```
