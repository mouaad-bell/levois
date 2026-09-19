# LEVOIS Evidence Cache — V2.1

## Source de vérité

La source active unique est :

`02_EVIDENCE_LIBRARY_V21.jsonl`

Ne jamais concaténer V2 + V2.1.

Les deltas, fichiers V2, audits et fichiers bruts restent des artefacts de traçabilité, pas une seconde source active.

## Taille validée

La V2.1 contient 39 721 preuves actives.

Répartition moteur observée :

- REUSABLE_IMMEDIATELY : 6 709
- HISTORICAL_ONLY : 28 148
- VERIFY_PROPERTY : 3 316
- VERIFY_PERSON : 174
- REFRESH_REQUIRED : 584
- DO_NOT_USE : 790

Les 18 éléments encore en quarantaine ne sont pas présents dans la source active.

## Objectif du cache

Le Studio devient library first :

SUJET
→ bibliothèque LEVOIS
→ filtrage territoire / période / garde-fous
→ preuves directement publiables suffisantes ?
→ oui : pas de web
→ non : web uniquement pour les lacunes réellement nécessaires
→ Evidence Pack
→ vulgarisation
→ article / storyboard
→ Remotion

## Contrat d’usage V2.1

Le moteur respecte `engine_use_class` avant tout autre raccourci.

### REUSABLE_IMMEDIATELY

Peut soutenir une explication dans le périmètre documenté.

### HISTORICAL_ONLY

Réutilisable uniquement avec période/millésime explicite.
Ne doit jamais devenir silencieusement une information actuelle.

### REFRESH_REQUIRED

Doit être revérifié avant assertion actuelle.

### VERIFY_PROPERTY

La connaissance générale peut être utilisée.
Une conclusion sur un bien exige une vérification du bien.

### VERIFY_PERSON

La connaissance générale peut être utilisée.
Une conclusion sur une personne, son financement ou sa fiscalité exige ses paramètres.

### DO_NOT_USE

Jamais récupéré automatiquement comme preuve publiable.

Le moteur conserve également :

- allowed_uses ;
- forbidden_inferences ;
- decision_use ;
- verification_required_before_publication ;
- verification_required_for_property_application ;
- verification_required_for_person_application ;
- freshness ;
- geographic_precision ;
- temporal_precision ;
- source exacte.

## Garde-fous importants

- DVF : n<5 n’est pas un repère public de prix.
- DVF : 5≤n<15 doit être signalé comme fortement fragile.
- DPE : un numéro de diagnostic n’est pas un logement unique.
- DPE : le corpus ne représente pas automatiquement le parc.
- Commune ≠ parcelle.
- Risque communal ≠ exposition du bien.
- Inventaire d’équipement ≠ disponibilité réelle.
- Déclaration Acceslibre ≠ constat physique.
- Valeur censurée `<x` ≠ zéro.
- Règle future ≠ règle actuelle.
- Une preuve locale ≠ estimation d’un bien.

## D1

Créer la base une seule fois :

`npx wrangler d1 create levois-evidence`

Appliquer ensuite :

`npx wrangler d1 execute levois-evidence --remote --file=db/evidence-library-schema.sql`

puis :

`npx wrangler d1 execute levois-evidence --remote --file=db/evidence-library-v21-migration.sql`

Ajouter le binding `LEVOIS_EVIDENCE_DB` uniquement à l’environnement Studio avant le test.

## Import V2.1

Extraire le ZIP V2.1.

Puis :

`node scripts/build-evidence-d1.mjs --input "C:\chemin\LEVOIS_EVIDENCE_LIBRARY_V2_1" --version V21 --database levois-evidence`

Le script détecte directement `02_EVIDENCE_LIBRARY_V21.jsonl`.

Il importe :

- la source active V2.1 ;
- V21_SOURCE_REGISTRY.csv ;
- V21_REFRESH_REGISTRY.csv ;
- V21_EVIDENCE_ALIASES.csv.

Il n’ingère pas les anciens fichiers V2 comme une seconde bibliothèque.

Le script génère les lots SQL dans `.levois-evidence-sql/` ainsi qu’un fichier `RUN_ME_AFTER_SCHEMA.txt`.

### Sécurité d’import D1

D1 limite actuellement chaque instruction SQL à 100 KB. L’importeur V2.1 plafonne donc les instructions générées à 80 KB par défaut et découpe dynamiquement les INSERT au lieu d’utiliser un nombre fixe de lignes.

Les valeurs structurées très volumineuses (par exemple certaines géométries/metadata GPU conservées dans `value`) ne sont pas copiées intégralement dans le cache de retrieval lorsqu’elles dépassent 8 KB. La donnée source reste intacte dans l’archive canonique V2.1 ; D1 conserve la preuve, son claim, sa provenance, ses garde-fous et son lien vers la source.

Le cache D1 n’est donc pas une copie bit-à-bit de l’archive : c’est un index opérationnel de publication.

## Recherche locale

`lib/evidence-library.ts` :

- exclut DO_NOT_USE ;
- applique les classes V2.1 ;
- détecte les sept communes LEVOIS ;
- utilise une recherche lexicale normalisée ;
- pondère le niveau de source ;
- pondère la fraîcheur ;
- distingue preuve directement publiable, historique, à rafraîchir, à vérifier sur le bien et à vérifier sur la personne.

Le moteur ne décide de sauter le web que lorsqu’il dispose d’un noyau suffisant de preuves directement réutilisables et fraîches.

## Traçabilité

Les claims générés depuis la bibliothèque doivent conserver les `evidence_id` exacts dans `evidenceRefs`.

Cela permet ensuite :

preuve corrigée
→ contenus dépendants identifiables
→ revue ciblée
→ pas de republication aveugle.

## Worker

Deux routes sont prévues :

- `POST /api/studio/library/search`
- `POST /api/studio/research`

`/library/search` expose la récupération locale protégée par la clé Studio.

`/research` :

1. interroge D1 ;
2. transmet un Evidence Pack court au modèle ;
3. saute la recherche web si la couverture directement publiable est suffisante ;
4. sinon autorise le web uniquement pour les trous ;
5. conserve les `evidenceRefs`.

Sans binding D1, le Studio garde son comportement actuel de recherche distante.

## Ce qui n’est pas encore fait

- la base D1 n’est pas encore créée sur le compte Cloudflare ;
- la V2.1 n’est donc pas encore chargée dans le Worker déployé ;
- aucun changement n’est appliqué à la production levois.fr ;
- aucune publication automatique n’est autorisée.

## Étape de mise en service

Quand un ordinateur est disponible :

1. créer D1 ;
2. appliquer schéma + migration V2.1 ;
3. lancer l’import ;
4. ajouter le binding Studio ;
5. déployer `levois-studio` ;
6. tester les trois fixtures :
   - 80 m². Où passe la place ?
   - Plus loin. De quoi ?
   - 25 000 € d’écart. Trop chère ?
7. mesurer combien de preuves viennent de la bibliothèque et si le web a été évité ;
8. seulement ensuite brancher le moteur de vulgarisation et le renderer.


## Import Windows simplifié

Une fois la base D1 créée et le binding configuré, l’import V2.1 peut être lancé depuis PowerShell avec :

`powershell -ExecutionPolicy Bypass -File scripts/import-evidence-v21.ps1 -LibraryPath "C:\chemin\LEVOIS_EVIDENCE_LIBRARY_V2_1"`

Le script :

- applique le schéma D1 ;
- applique la migration V2.1 ;
- construit les lots SQL ;
- importe tous les lots ;
- vérifie la version, le nombre de preuves, les classes moteur, le registre de fraîcheur et les alias.

Valeur attendue après import : **39 721 preuves actives**.
