# Audit technique LEVOIS.FR

Date : 20 juillet 2026

## Verdict

Le projet corrigé compile, s’exporte en statique et passe un déploiement Wrangler en mode `--dry-run`.

Commandes validées :

```bash
npm ci
npm run typecheck
npm run build
npm audit --audit-level=high
npm run deploy -- --dry-run
```

Résultats :

- TypeScript : OK
- Build Next.js statique : OK
- 16 fichiers HTML générés, dont 14 routes applicatives et les pages d’erreur
- Liens internes : OK
- Assets référencés : OK
- Images avec attribut `alt` : OK
- Audit npm : 0 vulnérabilité connue
- Configuration Wrangler : OK en dry-run

## Corrections appliquées

### Dépendances et installation

- Migration de Next.js 14.2.35 vers Next.js 16.2.10.
- Migration de React 18 vers React 19.2.7.
- Mise à jour de TypeScript et des types React.
- Ajout d’un override PostCSS 8.5.10 pour supprimer l’alerte de sécurité transitive.
- Régénération du lockfile.
- Remplacement de toutes les URL de registre internes par `https://registry.npmjs.org/`.
- Ajout des scripts `typecheck`, `security:audit` et `check`.

### Sécurité

- Durcissement des en-têtes Cloudflare.
- Suppression de `preload` et `includeSubDomains` sur HSTS tant que tous les sous-domaines ne sont pas audités.
- Ajout de COOP, CORP et `X-Permitted-Cross-Domain-Policies`.
- CSP limitée à Formspree pour les connexions externes.
- Formulaire protégé par un champ honeypot `_gotcha`.
- Limites de longueur sur les champs du formulaire.
- Double soumission bloquée pendant l’envoi.
- Messages d’état accessibles via `aria-live`.

### Fonctionnement et accessibilité

- Ajout d’un vrai menu mobile accessible.
- Fermeture au clic et avec la touche Échap.
- Ajout d’états de focus visibles.
- Ajout de `aria-pressed` dans le diagnostic.
- Correction des valeurs CSS `start` / `end` en `flex-start` / `flex-end`.
- Remplacement d’un lien interne HTML par `next/link`.

### Mesure et QR codes

- File d’événements locale prête pour GA4.
- Événements stockés dans `dataLayer` même si GA4 n’est pas encore chargé.
- Délai d’un tick pour fiabiliser le suivi des scans QR au montage de la page.
- Ajout du suivi des appels, emails, débuts de contact, situations choisies et diagnostic.
- Aucune donnée personnelle saisie dans les formulaires n’est envoyée dans les événements Analytics.

### Performance

- `mouaad-lea` : environ 2,7 Mo → environ 93 Ko.
- `lea` : environ 2,8 Mo → environ 80 Ko.
- `mouaad` : environ 244 Ko → environ 67 Ko.
- Conservation de formats WebP adaptés à l’export statique.

### Maintenabilité

- Ajout de `lib/site.ts` pour centraliser les coordonnées, l’URL et l’endpoint Formspree.
- Ajout d’un fichier `.env.example`.
- Suppression du script `next start`, inadapté au mode `output: "export"`.

## Points non bloquants à surveiller

- La CSP conserve `unsafe-inline` pour les scripts et styles générés par l’export Next.js. La retirer nécessiterait une stratégie de nonce ou de hash régénérée à chaque build.
- Les animations `animation-timeline` ne sont pas disponibles sur tous les navigateurs ; le rendu sans animation reste fonctionnel.
- Le site utilise un export statique. Il n’existe donc aucune API serveur propre au projet à protéger.

## Points métier à régler avant une publication définitive

### Bloquants éditoriaux ou réglementaires

1. Ajouter les mentions SAFTI et le numéro RSAC exacts dès qu’ils sont confirmés.
2. Configurer dans Formspree :
   - le domaine autorisé `levois.fr` ;
   - la protection anti-spam souhaitée, idéalement Turnstile, hCaptcha ou reCAPTCHA ;
   - l’adresse de notification `mouaad@levois.fr`.
3. La page `/votre-rue/` ne fournit pas encore les ventes réelles annoncées par l’encart physique. Elle explique actuellement la limite puis invite à contacter Mouaad. Cette différence entre la promesse imprimée et le service rendu doit être corrigée avant une campagne importante.
4. La bibliothèque affiche des sujets, mais pas encore de vraies pages d’articles individuelles. Elle ne doit pas être présentée comme une bibliothèque complète avant leur rédaction.

### À activer plus tard

- Google Analytics 4 et le gestionnaire de consentement.
- Suivi des UTM par campagne.
- Tests Formspree réels depuis le domaine de production.
- Test manuel Safari iOS, Chrome Android, Firefox et Edge.
- Audit Lighthouse après déploiement réel, car les performances réseau et les en-têtes ne peuvent être mesurés complètement hors production.

## Réglages Cloudflare validés

```text
Build command : npm run build
Deploy command : npm run deploy
Root directory : /
Node.js : 22
```

Le fichier `wrangler.jsonc` déploie le dossier `out/` et utilise une vraie page 404.
