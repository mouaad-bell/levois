# LEVOIS — Retrieval benchmark V2.1 réel

Date : 19 septembre 2026.

## Corpus réellement testé

Archive fournie : `LEVOIS_EVIDENCE_LIBRARY_V2_1.zip`.

- master : `02_EVIDENCE_LIBRARY_V21.jsonl`
- lignes actives : 39 721
- lignes indexables après exclusion de `DO_NOT_USE` : 38 931

Le benchmark a été rejoué sur le master réel, pas sur une fixture synthétique.

## Objectif

Vérifier que les trois sujets canoniques retrouvent d’abord les preuves utiles au raisonnement, et non des homonymes lexicalement proches.

Le retrieval testé combine :

- FTS5 sur les champs textuels utiles ;
- règles d’intention ;
- garde-fous `engine_use_class` ;
- fraîcheur ;
- niveau de source ;
- bonus territorial LEVOIS ;
- limitation des répétitions provenant d’un même sous-corpus.

## Cas 1 — Surface / usage

Requête : `80 m². Où passe la place ?`

Intention attendue : `surface_usage`.

Résultats utiles retrouvés en tête :

1. `V2-DEF-0029` — définition INSEE de la surface du logement ;
2. `DEF-0003` — surface réelle bâtie DVF ≠ garantie de surface habitable ;
3. `REG-0035` — définition réglementaire de la surface habitable ;
4. `METH-0025` — les notions de surface ne rendent pas les mêmes usages.

Conclusion : le noyau documentaire du pilote 01 est récupérable depuis V2.1 sans recherche web.

Correction apportée pendant le benchmark :

- `m²` et `place` sont désormais reconnus comme signaux de l’intention surface ;
- les nombres présents dans un hook ne deviennent plus des tokens de recherche dominants ;
- les règles de location/urbanisme contenant le mot surface sont plafonnées pour ne pas noyer les définitions utiles.

## Cas 2 — Lieu / mobilité

Requête : `Plus loin. De quoi ?`

Intention attendue : `mobility`.

Premier résultat attendu et retrouvé :

- `INSEE-f36f351aab7a2171` — Bassin de vie 2022 de Chartres, ACT T4, 2023.

Le corpus retrouve également les scopes de comparaison INSEE pertinents : aire d’attraction, communes LEVOIS et Chartres Métropole.

Conclusion : le moteur ne confond plus la question de mobilité quotidienne avec les textes contenant le terme juridique « bail mobilité ».

Correction apportée pendant le benchmark :

- bonus spécifique aux tables ACT ;
- bonus aux scopes BV2022 / AAV2020 ;
- pénalité aux homonymes réglementaires ;
- diversité par périmètre et plafond global des répétitions ACT.

## Cas 3 — Prix / valeur

Requête : `25 000 € d’écart. Trop chère ?`

Intention attendue : `price_value`.

Les quatre preuves méthodologiques du pilote sont retrouvées en tête :

1. `METH-0021` — prix affiché vs prix vendu ;
2. `METH-0022` — garde-fou prix au m² ;
3. `DEF-0001` — valeur foncière DVF ;
4. `DEF-0002` — mutation DVF.

Conclusion : l’écart chiffré pédagogique n’entraîne plus le moteur vers des nombres ou domaines sans rapport.

Correction apportée pendant le benchmark :

- les nombres `25` et `000` sont ignorés comme tokens ;
- l’intention prix repose sur le sens du hook et des ancres méthodologiques ;
- les agrégats DVF ne peuvent plus évincer toutes les définitions/méthodes utiles.

## Interprétation

Ce benchmark ne prouve pas que le retrieval est universellement résolu.

Il établit que les trois fixtures canoniques centrales peuvent maintenant obtenir un Evidence Pack cohérent depuis le corpus V2.1 réel.

Les prochaines validations doivent se faire après import D1 réel et déploiement Studio avec `scripts/validate-live-retrieval.mjs`.

## Critère de suite

On n’ajoute pas d’embeddings tant qu’un jeu de questions réelles plus large ne montre pas une insuffisance reproductible du couple :

`FTS5 + intent anchors + structured guards + deterministic reranking`.
