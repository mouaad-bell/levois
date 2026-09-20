# LEVOIS — Politique de production visuelle V1

## But

Le visuel fait partie de la preuve et du récit. Il ne doit jamais transformer une illustration en observation immobilière.

Cette politique s’applique aux carrousels, articles, aperçus sociaux et futures vidéos.

## Quatre modes de production

### 1. Source réelle requise

À utiliser lorsqu’une image peut être comprise comme une observation réelle :

- photographie locale identifiable ;
- photo d’un bien réel ;
- document authentique ;
- plan réel ;
- capture d’une source primaire ;
- élément dont l’état physique constitue une information.

Règle : conserver la provenance, les droits d’usage et la date lorsque pertinente.

Une image générée ne peut jamais remplacer discrètement ce type de preuve.

### 2. Programmatique

Mode préféré pour :

- cartes ;
- trajets ;
- chronologies ;
- comparaisons de montants ;
- distributions ;
- plans schématiques ;
- annotations ;
- relations entre deux faits.

Le visuel est construit à partir des données ou du scénario déclaré. Il ne dépend pas d’une image générée pour être compris.

### 3. Génération explicative autorisée

Une image générée peut être utilisée lorsqu’elle sert uniquement à expliquer :

- une scène fictive ;
- un usage ;
- une situation pédagogique ;
- une ambiance générique non attribuée à un bien ;
- un objet éditorial.

Conditions :

- le visuel ne suggère aucun fait sur un bien réel ;
- le statut fictif/illustratif reste perceptible lorsque cela change l’interprétation ;
- la génération n’ajoute pas une information factuelle absente du dossier ;
- un lecteur ne doit pas pouvoir confondre l’image avec une photo de l’annonce ou du lieu étudié.

### 4. Matière éditoriale

Textures, lumière, papier, formes, volumes abstraits et objets graphiques peuvent servir la composition si aucune donnée ne leur est attribuée.

## Règle photo locale

La DA LEVOIS peut utiliser des photographies locales fortes. Mais une photographie de Chartres, Lèves ou d’un environnement réel doit être réellement sourcée si le contenu laisse entendre qu’elle documente le lieu.

Une photo purement atmosphérique doit rester clairement illustrative.

## Règle carte

Une carte LEVOIS explique une relation spatiale. Elle doit séparer :

- repères réels ;
- données documentées ;
- trajets/simulations ;
- zones pédagogiques.

Un cercle, une zone ou un temps de trajet fictif ne doit pas ressembler à une mesure réelle non effectuée.

## Règle plan

Un plan pédagogique est autorisé s’il est présenté comme tel.

Un plan de bien réel exige une source réelle.

Le renderer ne doit jamais transformer automatiquement un asset `missing` en faux plan réaliste.

## Règle chiffres

Un visuel chiffré doit conserver au moins l’un des deux :

- evidence_id / source documentée ;
- qualification visible CAS FICTIF / CAS PÉDAGOGIQUE / simulation.

Un chiffre décoratif sans statut n’entre pas dans le rendu final.

## Contrat technique

`lib/visual-asset-plan.ts` transforme les besoins du storyboard en tâches classées :

- `real_source_required` ;
- `programmatic` ;
- `generated_explanatory_allowed` ;
- `editorial_texture`.

`reviewCarouselRender()` bloque :

- un asset absent ;
- une fiction non qualifiée ;
- un visuel non documenté autorisé à suggérer un fait de bien ;
- une slide chiffrée sans preuve ni statut suffisamment visible.

## Conséquence

Le moteur d’images n’est pas une étape autonome qui « embellit » les slides.

Il reçoit une tâche issue du storyboard, avec un rôle, une limite et un statut de preuve.

Le visuel sert la compréhension ; il ne crée jamais la vérité du contenu.
