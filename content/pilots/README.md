# LEVOIS — Pilotes éditoriaux canoniques

Ces fichiers servent de jeux de référence pour le moteur éditorial.

## Source de vérité

- Canon : `CONTENT_EXPERIENCE_V1_2026-09-19`
- Evidence Library : V2.1

## Pilotes

### 01 — Espace / Usage

`PILOT_01_ESPACE_USAGE_CANON_V1.json`

Premier pilote complet avec preuve V2.1 directement réutilisable.

Question : comment vérifier si des usages importants peuvent réellement fonctionner ensemble au-delà de la surface totale ?

### 02 — Lieu / Mobilité

`PILOT_02_MOBILITE_CANON_V1.json`

Cas fictif pédagogique issu du canon. Une donnée INSEE Chartres Métropole peut servir de contexte historique, mais ne prouve ni durée ni difficulté de trajet.

### 03 — Prix / Valeur

`PILOT_03_PRIX_VALEUR_CANON_V1.json`

Shell canonique autour de `25 000 € d’écart`. Les montants sont pédagogiques tant qu’ils ne sont pas remplacés par des preuves réelles.

## Règles

Chaque pilote doit contenir :

- une décision ;
- une lecture spontanée ;
- un élément qui la met à l’épreuve ;
- une conclusion autorisée ;
- une opération autonome ;
- trois hooks : direct / scène / comparaison ;
- six story beats canoniques ;
- une limite essentielle ;
- une action autonome.

## Validation

Quand le dépôt est disponible localement :

`node scripts/validate-editorial-pilots.mjs`

Le script vérifie la structure canonique minimale et bloque notamment les hooks chiffrés sans preuve ou statut pédagogique.

## Usage

Les pilotes ne sont pas des templates à recopier.

Ils servent à tester :

- retrieval V2.1 ;
- promesse du hook ;
- progression ;
- vulgarisation ;
- article ;
- storyboard ;
- renderer ;
- continuité vers le site.

Un nouveau sujet peut utiliser une autre structure visuelle ou un autre nombre de slides si le raisonnement le justifie.