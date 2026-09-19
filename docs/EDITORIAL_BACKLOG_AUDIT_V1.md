# LEVOIS — Audit du backlog éditorial V1

Date : 19 septembre 2026.

## Source

Le backlog `content/roadmap/EDITORIAL_BACKLOG_V1.json` a été vérifié contre le master réel :

`02_EVIDENCE_LIBRARY_V21.jsonl`

provenant de l’archive `LEVOIS_EVIDENCE_LIBRARY_V2_1.zip` fournie dans le projet.

## Contrôle effectué

- 15 questions retenues après les trois pilotes canoniques ;
- 41 `evidence_id` distincts référencés ;
- 41/41 retrouvés dans le master V2.1 ;
- 0 identifiant manquant ;
- les identifiants utilisés dans le backlog correspondent aux lignes du `RETRIEVAL_READINESS_TEST_V21.csv` pour les mêmes questions ;
- les questions placées au parking restent explicitement distinguées des sujets documentables sans vérification individuelle.

## Interprétation

Ce contrôle valide la **préparation documentaire** du backlog.

Il ne valide pas :

- un volume de recherche Google ;
- une difficulté SEO ;
- une prévision de trafic ;
- l’ordre exact de publication futur ;
- la fraîcheur éternelle des règles juridiques ou données datées.

Avant publication, le moteur continue d’appliquer :

- `engine_use_class` ;
- `verification_required_before_publication` ;
- la date/période ;
- le périmètre géographique ;
- `allowed_uses` ;
- `forbidden_inferences` ;
- le canon Contenu & Expérience V1.

## Décision

Le backlog peut servir de roadmap interne de contenus **evidence-ready**.

La priorisation finale reste humaine et doit ensuite être corrigée par les données réelles d’usage : Search Console, parcours du site, sauvegardes/partages, demandes de relecture et conversations.
