# LEVOIS — Retrieval Benchmark V2.1

Date : 19 septembre 2026.

Statut : benchmark d’ingénierie local, avant création de la base D1 distante.

## Corpus testé

- 39 721 preuves actives lues depuis `02_EVIDENCE_LIBRARY_V21.jsonl`.
- 38 931 preuves indexables après exclusion des 790 `DO_NOT_USE`.
- index SQLite FTS5 construit localement avec les mêmes champs que la migration D1 : evidence_id, topic, subtopic, geographic_label, period, claim, decision_use.
- reranking simulé avec les règles actuellement codées dans `lib/evidence-library.ts` : intention, territoire LEVOIS, fraîcheur, tier de source, classe d’usage et diversification.

Ce benchmark ne remplace pas le test live sur Cloudflare D1. Il sert à vérifier que le ranking proposé est cohérent avec le corpus réel avant déploiement.

## Fixture 01 — 80 m². Où passe la place ?

Intention détectée : `surface_usage`.

Premiers résultats utiles observés :

1. `V2-DEF-0029` — définition INSEE de la surface du logement.
2. `DEF-0003` — distinction surface réelle bâtie / surface habitable ou Carrez.
3. `V2-TXL-0038` — règle de surface en colocation, utile comme contexte juridique mais non centrale.
4. `REG-0035` — définition juridique de la surface habitable.
5–10. autres définitions/règles de surface.
12. `METH-0025` — les définitions de surface ne rendent pas les mêmes usages.

Verdict : PASS.

La définition INSEE est première. Les homonymes urbanisme/localisation ne dominent plus la recherche. Le moteur doit encore sélectionner éditorialement seulement les preuves nécessaires : retrouver une règle ne signifie pas qu’elle doit entrer dans le carrousel.

## Fixture 02 — Plus loin. De quoi ?

Intention détectée : `mobility`.

Premier résultat :

- `INSEE-f36f351aab7a2171` — Bassin de vie 2022 de Chartres, ACT T4, 2023.

Les résultats suivants couvrent l’Aire d’attraction, Chartres, Lèves, Lucé, Mainvilliers, Luisant, Champhol, Le Coudray et Chartres Métropole.

Verdict : PASS.

Le retrieval ne se fait plus détourner par la réglementation du bail mobilité. La donnée locale attendue est première. La diversité par périmètre limite la répétition exacte d’une même table, mais le pack éditorial doit encore sélectionner le périmètre réellement utile à la démonstration.

## Fixture 03 — 25 000 € d’écart. Trop chère ?

Intention détectée : `price_value`.

Résultats structurants observés :

1. `METH-0021` — distinction prix affiché / prix vendu.
2. `DEF-0001` — valeur foncière DVF.
3–10. agrégats DVF locaux historiques.
11. `METH-0022` — garde-fou prix au m².
12. `DEF-0002` — définition de la mutation DVF.

Verdict : PASS WITH SELECTION DISCIPLINE.

Les preuves méthodologiques centrales sont toutes présentes dans les 12 premiers résultats. Les agrégats DVF locaux restent volontairement visibles comme contexte potentiel, mais le moteur éditorial doit pouvoir les rejeter si le sujet porte sur la comparabilité plutôt que sur le niveau de prix local.

## Changements validés par ce benchmark

- normalisation de `m²` vers `m2` ;
- suppression des nombres purement pédagogiques du matching lexical ;
- expansion des requêtes après normalisation des accents ;
- intention `surface_usage` reconnue sur le mot « place » ;
- ancrages méthodologiques dédiés surface / mobilité / prix-valeur ;
- bonus explicite aux définitions DVF pertinentes ;
- diversification des résultats ACT par périmètre géographique ;
- index FTS5 séparé du corpus canonique ;
- exclusion des `DO_NOT_USE` de l’index publiable.

## Critère de sortie

Le retrieval local est suffisamment cohérent pour passer au test D1 distant.

Le prochain contrôle obligatoire est `scripts/validate-live-retrieval.mjs` après import V2.1 et déploiement de l’environnement Studio.
