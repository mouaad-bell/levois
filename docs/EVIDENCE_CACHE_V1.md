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

Le schéma canonique contient déjà toutes les colonnes et l’index FTS5 V2.1.

N’utiliser `db/evidence-library-v21-migration.sql` que pour une ancienne base prototype, via le switch PowerShell `-LegacySchema`.

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
- utilise directement le schéma canonique V2.1 ;
- construit les lots SQL ;
- importe tous les lots ;
- vérifie la version, le nombre de preuves, les classes moteur, le registre de fraîcheur et les alias.

Valeur attendue après import : **39 721 preuves actives**.


## FTS5

La migration V2.1 crée `evidence_search`, un index FTS5 limité aux champs utiles à la récupération :

- evidence_id ;
- topic ;
- subtopic ;
- geographic_label ;
- period ;
- claim ;
- decision_use.

Les champs JSON lourds ne sont pas dupliqués dans l’index.

L’import exclut `DO_NOT_USE` de l’index FTS. Le moteur récupère ensuite les lignes canoniques dans `evidence` pour appliquer tous les garde-fous.

Le ranking ajoute une couche d’intention afin d’éviter des ambiguïtés lexicales : par exemple, une recherche sur les trajets ne doit pas être dominée par la réglementation du « bail mobilité ».


## Validation live après déploiement

Après import D1 et déploiement de l’environnement Studio :

node scripts/validate-live-retrieval.mjs "https://levois-studio.<workers-domain>" "<STUDIO_ACCESS_TOKEN>"

Le script teste les trois fixtures canoniques contre content/pilots/RETRIEVAL_EXPECTATIONS_V1.json.

Contrôles obligatoires :

- 80 m² → intention surface_usage + V2-DEF-0029 ;
- Plus loin → intention mobility + INSEE-f36f351aab7a2171 ;
- 25 000 € d’écart → intention price_value + METH-0021.

Des preuves méthodologiques supplémentaires sont signalées sans bloquer si leur ordre varie.


## Mise en service complète sur Windows

Quand la base D1 `levois-evidence` a été créée et que son `database_id` est connu :

`powershell -ExecutionPolicy Bypass -File scripts/setup-studio-v21.ps1 -LibraryPath "C:\chemin\LEVOIS_EVIDENCE_LIBRARY_V2_1.zip" -DatabaseId "<DATABASE_ID>"`

Le script :

- accepte directement le ZIP V2.1 ou le dossier déjà extrait ;
- extrait automatiquement le ZIP dans un dossier de travail si nécessaire ;
- ajoute uniquement le binding D1 non secret à `env.studio` ;
- importe V2.1 ;
- applique les tables de traçabilité ;
- lance `npm run check` ;
- déploie `levois-studio` ;
- demande la clé Studio de manière masquée si elle n’est pas déjà dans l’environnement ;
- exécute les trois tests live de retrieval.

Aucune clé OpenAI ni clé Studio n’est écrite dans `wrangler.jsonc`.

Pour une ancienne base prototype pré-V2.1, utiliser d’abord le script d’import avec `-LegacySchema` au lieu du chemin frais.


## Cache éditorial

La construction éditoriale depuis V2.1 possède un cache interne de 30 jours.

La clé de cache est un SHA-256 calculé à partir de :

- l’entrée normalisée ;
- le modèle ;
- la version du canon ;
- la version de la bibliothèque ;
- le contenu exact du Evidence Pack.

Conséquences :

- une preuve modifiée produit une nouvelle clé ;
- un changement de canon produit une nouvelle clé ;
- un changement de modèle produit une nouvelle clé ;
- cliquer sur **Régénérer** ignore volontairement le cache ;
- le cache peut être vidé explicitement depuis l’onglet Revue.

Le cache ne stocke pas le texte brut d’entrée comme colonne d’identification. Le bundle généré reste néanmoins conservé temporairement dans D1 pendant la durée du cache : ne pas utiliser le Studio comme coffre de données personnelles inutiles.

Les logs de génération stockent un hash de l’entrée, pas le texte brut.
