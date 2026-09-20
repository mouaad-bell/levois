# LEVOIS — Point de reprise vérifié — 20 septembre 2026

## Référence

- dépôt : `mouaad-bell/levois`
- branche : `feature/studio-core-v1`
- base inspectée avant reprise : `4fd0c03ecba22736b4041e91951b00b5675c25e1`
- PR : `#2` — brouillon, ouverte, non fusionnée
- CI de la base : `Studio CI` réussie, run `35473642379`

Ce document évite de dépendre de l’historique d’une conversation pour reprendre le chantier.

## État déjà acquis avant cette reprise

Le Studio sait déjà relier :

`Evidence Library V2.1 → Evidence Pack → Canon Contenu V1 → article → storyboard → contrat de rendu → package de publication`

Le socle contient notamment :

- import D1/FTS5 et recherche par intention ;
- exclusion des preuves `DO_NOT_USE` ;
- conservation des statuts, périmètres, périodes, usages permis et inférences interdites ;
- trois pilotes canoniques espace/usage, mobilité et prix/valeur ;
- trois articles Answers internes ;
- traçabilité preuve → contenu et file de revue ;
- cache éditorial, suivi de coût et contrat analytics sans PII ;
- contrôles CI éditoriaux, D1, build et sécurité élevée.

## Travail effectué pendant cette reprise

### Renderer éditorial

Le renderer structurel ne montre plus la même carte-placeholder sombre pour tous les sujets.

Il produit maintenant des compositions programmatiques distinctes :

- plan d’usage et collision d’activités pour espace/usage ;
- territoire, trajet et chronologie pour mobilité ;
- montants, coupure et dossier méthodologique pour prix/valeur.

Les nombres visibles proviennent exclusivement du texte de la slide. Le renderer n’ajoute aucun chiffre immobilier.

La palette est plus lumineuse, tout en conservant une couleur d’accent propre à chaque famille. Les layouts `HERO`, `QUESTION_SHIFT`, `METHOD_STEPS`, `DATA_FIELD`, `COMPARISON_DUAL` et `FINAL_BRIDGE` reçoivent des traitements différents.

### Continuité carrousel → article

Le renderer propose :

- un aperçu slide par slide ;
- une planche de série pour juger la cohérence et la variété ;
- un accès direct à l’article Answers correspondant à chaque pilote.

### Autorité des routes Next.js

Onze doublons `.jsx` obsolètes ont été retirés : ancien layout et anciennes pages publiques en concurrence avec les routes `.tsx`.

Ces fichiers contenaient notamment l’ancienne architecture vendeur-first, Léa et un formulaire `mailto`. Les routes `.tsx` sont conservées comme seule version du dépôt Next.js.

Le build ne signale plus de pages dupliquées.

La dernière présence visible de Léa sur la page d’accueil a également été remplacée par les trois rôles réels : Mouaad, la méthode LEVOIS et le cadre professionnel SAFTI.

### Hygiène du dépôt

Un `.gitignore` protège les dépendances, sorties Next.js, artefacts de validation et fichiers locaux.

## Vérifications exécutées

`npm run check` passe intégralement :

- TypeScript ;
- autorité unique des 18 pages/layouts Next.js ;
- trois pilotes canoniques ;
- trois contrats de rendu ;
- dépendances contenu → preuves ;
- snapshot V2.1 ;
- packages pilotes ;
- Answers ;
- limites d’import ;
- schéma D1/traçabilité/cache ;
- build statique ;
- audit de sécurité au seuil `high`.

Réserve connue : `npm audit` signale une vulnérabilité **modérée** dans `baseline-browser-mapping`. Elle ne fait pas échouer la politique actuelle `high`, mais doit être suivie lors de la prochaine mise à niveau des dépendances.

## Blocage externe constaté

Le tableau de bord Cloudflare a présenté une boucle de vérification anti-bot dans le navigateur distant. Aucun contournement n’a été tenté.

Par conséquent, cette reprise ne certifie pas encore :

- l’existence ou l’état réel de la base D1 `levois-evidence` ;
- le binding `LEVOIS_EVIDENCE_DB` dans `env.studio` ;
- l’import V2.1 en production ;
- le déploiement de `levois-studio` ;
- les trois tests live de retrieval ;
- la chaîne exacte entre le dépôt et le domaine public `levois.fr`.

## Prochaine séquence, dans l’ordre

1. vérifier Cloudflare avec un accès humain normal ;
2. identifier la base D1 et le binding sans créer de doublon ;
3. importer V2.1 puis lancer le health check ;
4. exécuter les trois tests live de retrieval ;
5. déployer le Studio privé et recetter mobile ;
6. confronter le renderer aux vrais PNG 1080 × 1350 ;
7. seulement ensuite décider quels pilotes deviennent publics et quelles routes Answers rejoignent `/ressources/`.

## Interdits maintenus

- aucun merge automatique dans `main` ;
- aucune publication publique automatique ;
- aucune preuve générique transformée en conclusion individuelle ;
- aucun visuel généré présenté comme photographie locale ou preuve d’un bien ;
- aucune activation de CTA avant recette de sa destination ;
- aucune statistique de demande acquéreur inventée.
