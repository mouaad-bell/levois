# LEVOIS — Pilotes éditoriaux canoniques

Ces fichiers servent de jeux de référence pour le moteur éditorial.

## Sources de vérité

- Canon : CONTENT_EXPERIENCE_V1_2026-09-19
- Evidence Library : V2.1
- Dépendances : CONTENT_DEPENDENCY_MANIFEST_V1.json

## Pilote 01 — Espace / Usage

Fichiers :

- PILOT_01_ESPACE_USAGE_CANON_V1.json
- PILOT_01_RENDER_CONTRACT_V1.json
- ../drafts/01_80M2_USAGE_ARTICLE_V1.md

Question :

Comment vérifier si des usages importants peuvent réellement fonctionner ensemble au-delà de la surface totale ?

Preuves principales :

- V2-DEF-0029
- REG-0035 seulement si la règle juridique est conservée et relue avant publication.

Le contexte DVF local n’est pas nécessaire au carrousel : il ne prouve pas le mécanisme d’usage.

## Pilote 02 — Lieu / Mobilité

Fichiers :

- PILOT_02_MOBILITE_CANON_V1.json
- PILOT_02_RENDER_CONTRACT_V1.json
- ../drafts/02_MOBILITY_ARTICLE_V1.md

Question :

Si un logement est moins cher mais plus éloigné, que faut-il tester avant de considérer l’éloignement comme un compromis acceptable ?

Preuve locale de contexte :

- INSEE-f36f351aab7a2171
- Bassin de vie 2022 de Chartres
- période 2023
- 73,7 % des actifs résidents ayant un emploi travaillent dans une autre commune.

Cette preuve ne mesure ni distance, ni durée, ni coût, ni difficulté de trajet.

Les horaires et temps de trajet du récit sont des CAS FICTIFS.

## Pilote 03 — Prix / Valeur

Fichiers :

- PILOT_03_PRIX_VALEUR_CANON_V1.json
- PILOT_03_RENDER_CONTRACT_V1.json
- ../drafts/03_PRICE_VALUE_ARTICLE_V1.md

Question :

Un écart de prix suffit-il à conclure qu’un bien est trop cher ?

Preuves principales :

- METH-0021 — prix affiché / prix vendu ;
- DEF-0001 — valeur foncière DVF ;
- DEF-0002 — mutation DVF ;
- METH-0022 — garde-fou prix au m².

Les montants 285 000 €, 310 000 € et +25 000 € restent CAS PÉDAGOGIQUE tant qu’ils ne sont pas remplacés par des montants documentés.

## Contrat commun

Chaque pilote doit contenir :

- une décision ;
- une lecture spontanée ;
- un élément qui la met à l’épreuve ;
- une conclusion autorisée ;
- une opération autonome ;
- exactement trois hooks : direct / scène / comparaison ;
- les six fonctions narratives : situation / lecture initiale / friction / démonstration / relecture / prise pratique ;
- une limite essentielle ;
- une action autonome ;
- les evidence_id nécessaires ;
- une qualification visible des cas fictifs et chiffres pédagogiques.

Le nombre de slides n’est pas canonique. Il dépend du raisonnement.

## Validation locale

Quand le dépôt est disponible localement :

- npm run validate:editorial
- npm run validate:render
- npm run validate:dependencies

La commande npm run check exécute ces validations avec le typecheck, les tests d’import, le build et l’audit sécurité.

## Dépendances

CONTENT_DEPENDENCY_MANIFEST_V1.json relie les pilotes aux preuves V2.1.

Une preuve corrigée doit permettre d’identifier les contenus concernés avant republication.

## Usage

Les pilotes ne sont pas des templates à recopier.

Ils testent :

- retrieval V2.1 ;
- sélection de preuves ;
- promesse du hook ;
- progression ;
- vulgarisation ;
- article Answers ;
- storyboard ;
- renderer ;
- continuité vers le site.

Un nouveau sujet peut utiliser une autre composition, un autre nombre de slides ou une autre famille de hook tant que le canon et les preuves restent respectés.
