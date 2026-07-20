# LEVOIS.FR — Production V1

Site Next.js statique conçu pour GitHub et Cloudflare.

## Fonctions incluses

- Homepage guidée comme un tunnel d’aide à la décision
- Entrées par situation vendeur
- Diagnostic initial interactif sans collecte obligatoire
- Méthode LEVOIS en cinq piliers
- Bibliothèque pédagogique V1
- Marché local
- Présentation de Mouaad, de LEVOIS, de Léa et du cadre SAFTI
- Formulaire Formspree connecté à `https://formspree.io/f/xnjynroj`
- Routes permanentes `/carte/` et `/votre-rue/`
- Événements préparés pour un futur Google Analytics
- Effets progressifs et scroll-driven avec fallback
- En-têtes de sécurité Cloudflare
- Sitemap, robots.txt et métadonnées

## Installation locale

```bash
npm install
npm run dev
```

## Vérification de production

```bash
npm run check
```

Cette commande exécute le contrôle TypeScript, le build et l’audit de sécurité npm.

Le site statique est généré dans `out/`.

## Déploiement Cloudflare Workers & Pages

Configuration recommandée pour le projet actuel :

- Build command : `npm run build`
- Deploy command : `npm run deploy`
- Root directory : `/`
- Node : 22

Le fichier `wrangler.jsonc` publie le dossier `out/`.

Alternative Cloudflare Pages classique :

- Framework preset : Next.js Static HTML Export
- Build command : `npm run build`
- Output directory : `out`
- Pas de commande de déploiement personnalisée

## Formspree

L’endpoint est centralisé dans `lib/site.ts` et peut être remplacé avec `NEXT_PUBLIC_FORMSPREE_ENDPOINT`. Voir `.env.example`.

Vérifier dans Formspree que les notifications arrivent bien sur `mouaad@levois.fr` et que le domaine `levois.fr` est autorisé.

## Analytics

Google Analytics n’est volontairement pas activé dans cette version.

Le composant `AnalyticsBridge` reçoit déjà les événements internes :

- `qr_scan_carte`
- `qr_scan_votre_rue`
- `street_search_started`
- `contact_submitted`

Avant l’activation de GA4, ajouter un gestionnaire de consentement et charger la balise uniquement après accord.

## Points à compléter avant publication définitive

- Mentions réglementaires SAFTI exactes
- Numéro RSAC une fois confirmé
- Liens sociaux actifs et vérifiés
- Données réelles pour la page `/votre-rue/`
- Avis clients uniquement s’ils sont vérifiables

## Effets visuels

Les animations scroll-driven utilisent `animation-timeline: view()` lorsqu’elle est prise en charge. Un rendu statique propre reste disponible sur les navigateurs plus anciens. `prefers-reduced-motion` désactive les animations.


## Audit

Consulter `AUDIT_TECHNIQUE.md` avant le déploiement.
