# LEVOIS Evidence Cache V1

## Objectif

Le Studio doit devenir library first :

SUJET
→ bibliothèque LEVOIS
→ filtrage fraîcheur / territoire / période
→ preuves suffisantes ?
→ oui : aucune recherche web pour les faits déjà couverts
→ non : recherche externe ciblée uniquement sur les trous
→ nouvelles preuves validées
→ ajout à la bibliothèque
→ vulgarisation
→ storyboard
→ Remotion

Cette couche est volontairement séparée du renderer.

## Schéma D1

Le fichier db/evidence-library-schema.sql prépare :

- evidence : preuves atomiques ;
- evidence_sources : registre des sources ;
- geo_reference et geo_membership ;
- insee_cells ;
- dvf_simple_transactions et dvf_aggregates ;
- dpe_records et dpe_aggregates ;
- risk_evidence ;
- regulations ;
- methodology ;
- definitions ;
- refresh_registry ;
- evidence_ingest_runs.

La V2 pourra réutiliser le même mécanisme. Les imports utilisent INSERT OR REPLACE afin qu’un identifiant stable mette à jour une preuve au lieu de la dupliquer.

## Import V1 / V2

Quand un ordinateur est disponible :

1. Extraire le ZIP dans un dossier local.
2. Créer la base D1 une seule fois avec : npx wrangler d1 create levois-evidence
3. Ajouter ensuite le binding LEVOIS_EVIDENCE_DB uniquement à l’environnement studio.
4. Appliquer le schéma avec : npx wrangler d1 execute levois-evidence --remote --file=db/evidence-library-schema.sql
5. Générer les lots SQL avec : node scripts/build-evidence-d1.mjs --input "C:\chemin\LEVOIS_EVIDENCE_LIBRARY_V2" --version V2

Le script écrit les lots dans .levois-evidence-sql/ et crée RUN_ME_AFTER_SCHEMA.txt avec les commandes d’import.

## Recherche locale

lib/evidence-library.ts fournit la première baseline déterministe :

- extraction de mots-clés ;
- reconnaissance des sept communes LEVOIS ;
- filtres topic / sous-topic / géographie ;
- statut de preuve ;
- niveau de source ;
- politique de fraîcheur ;
- date de révision ;
- score de pertinence simple.

V1 n’utilise volontairement aucun embedding. À ce volume, les filtres structurés et une recherche lexicale donnent une baseline mesurable. Le vectoriel ne sera ajouté que si les tests montrent un manque réel.

## Fraîcheur

Le retrieval distingue :

- STATIC : réutilisable ;
- PERIODIC : réutilisable jusqu’à la prochaine revue ;
- DYNAMIC : à revérifier selon sa date ;
- EVENT_DRIVEN : à revérifier lors d’un changement pertinent.

Une donnée historique peut rester dans la bibliothèque sans être utilisée comme état actuel.

## Contrat de vérité

Le moteur doit toujours conserver :

- la source ;
- le périmètre exact ;
- la période ;
- allowed_uses ;
- forbidden_inferences ;
- la politique de fraîcheur.

Une preuve expirée ne doit pas être silencieusement utilisée comme information actuelle.

## Intégration Worker cible

Le Worker recevra un binding optionnel LEVOIS_EVIDENCE_DB.

Le chemin cible est :

1. searchEvidenceLibrary()
2. récupérer les meilleures preuves locales ;
3. identifier les gaps ;
4. décider si le web est réellement nécessaire ;
5. si oui, rechercher seulement les gaps ;
6. persister les nouvelles preuves acceptées ;
7. envoyer ensuite un Evidence Pack court au moteur de vulgarisation.

Tant que le binding D1 n’existe pas, levois-studio doit continuer à fonctionner comme aujourd’hui.

## V2

Quand Astra livre la V2 :

- ne pas refaire le code ;
- importer V2 avec --version V2 ;
- vérifier les nouveaux fichiers / colonnes ;
- compléter les mappings uniquement pour les nouveaux domaines ;
- conserver les mêmes IDs lorsqu’une preuve V1 est simplement enrichie ;
- utiliser le fichier delta V1→V2 pour contrôler la croissance réelle.

## Étape suivante

Après ingestion réelle dans D1 :

- exposer POST /api/studio/library/search ;
- afficher dans le Studio combien de preuves viennent de la bibliothèque ;
- afficher combien nécessitent un rafraîchissement ;
- mesurer le taux de sujets résolus sans web ;
- séparer enfin Research, Vulgarisation et Render.
