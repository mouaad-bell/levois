# LEVOIS Evidence Library V2.1 — Acceptance

Date de contrôle : 19 septembre 2026.

## Verdict

ACCEPTED_WITH_DOCUMENTED_LIMITATIONS

La bibliothèque V2.1 peut devenir la source documentaire active du Studio, sous réserve du respect strict de son contrat moteur.

## Contrôles indépendants effectués avant intégration

Sur l’archive livrée :

- 2 023 fichiers présents dans le ZIP ;
- 39 721 lignes lues dans `02_EVIDENCE_LIBRARY_V21.jsonl` ;
- 39 721 `evidence_id` distincts ;
- aucun doublon d’identifiant détecté dans la source active ;
- 18 éléments de quarantaine lus séparément ;
- aucun des 18 identifiants de quarantaine présent dans la source active ;
- les hash SHA-256 de cinq artefacts critiques ont été recalculés et concordent avec `V21_FILE_MANIFEST_SHA256.csv` :
  - `02_EVIDENCE_LIBRARY_V21.jsonl`
  - `V21_AUDIT_FINAL.md`
  - `V21_ENGINE_CONTRACT.md`
  - `V21_GAPS_REMAINING.md`
  - `RETRIEVAL_READINESS_TEST_V21.csv`

Ces contrôles ne remplacent pas la validation complète déjà documentée dans la livraison.

## Répartition des classes moteur

| Classe | Nombre |
|---|---:|
| REUSABLE_IMMEDIATELY | 6 709 |
| HISTORICAL_ONLY | 28 148 |
| VERIFY_PROPERTY | 3 316 |
| VERIFY_PERSON | 174 |
| REFRESH_REQUIRED | 584 |
| DO_NOT_USE | 790 |
| Total | 39 721 |

## Source tiers

| Tier | Nombre |
|---|---:|
| 1 | 38 349 |
| 2 | 1 367 |
| 3 | 5 |

La prédominance de sources tier 1 est favorable, mais le niveau de source ne neutralise jamais les restrictions d’usage de la preuve.

## Provenance

| Origine | Nombre |
|---|---:|
| V1 | 19 678 |
| V2_NEW | 18 346 |
| V1_REPAIRED | 1 608 |
| V21_NEW | 89 |

## Points confirmés

### DVF

La V2.1 documente la révalidation des fichiers départementaux 28 pour 2021–2025, l’exclusion d’une mutation commerciale/multicommunale qui avait contaminé la cohorte stricte, et la correction des résultats dépendants.

### DPE

La V2.1 distingue correctement diagnostic et logement, conserve le caractère non représentatif du corpus et documente l’ajout de numéros de DPE supplémentaires sans les compter artificiellement comme autant de nouvelles connaissances.

### Quarantaine

Les 18 éléments restants sont des cohortes DVF vides et ne sont pas réintroduits comme observations nulles.

### Publication

790 preuves DO_NOT_USE sont conservées pour audit mais doivent rester hors récupération automatique publiable.

### Récupération

La livraison fournit un index lexical de 38 931 entrées, cohérent avec l’exclusion des 790 DO_NOT_USE.

## Conséquence pour le Studio

Le modèle ne doit plus raisonner à partir du seul `status`.

La variable principale d’usage devient `engine_use_class`, complétée par :

- `verification_required_before_publication`
- `verification_required_for_property_application`
- `verification_required_for_person_application`
- `allowed_uses`
- `forbidden_inferences`
- `freshness`
- `geographic_precision`
- `temporal_precision`

## Décision d’architecture

La base D1 doit ingérer uniquement la source active V2.1 comme bibliothèque canonique.

Les fichiers V2, deltas et datasets bruts restent disponibles pour audit et calcul spécialisé, mais ne sont pas concaténés au corpus actif.

## Limites conservées

L’acceptation ne signifie pas :

- que toutes les règles juridiques sont éternellement actuelles ;
- que toutes les données historiques décrivent 2026 ;
- qu’une donnée communale décrit une parcelle ;
- qu’un DPE décrit le parc complet ;
- qu’un équipement recensé est disponible ;
- qu’une preuve générique permet une conclusion personnelle ;
- qu’un modèle peut publier sans relire les restrictions associées.

## Conclusion

La V2.1 est suffisamment structurée pour passer de « dossier documentaire » à « infrastructure de preuve ».

Le prochain test pertinent n’est plus une collecte massive.

C’est :

`sujet → retrieval V2.1 → Evidence Pack → vulgarisation → contenu → traçabilité`.
