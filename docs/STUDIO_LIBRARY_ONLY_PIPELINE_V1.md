# LEVOIS Studio — Pipeline éditorial sans web V1

## But

Utiliser la bibliothèque V2.1 comme capital documentaire pour éviter de relancer une recherche web lorsque le sujet est déjà suffisamment couvert.

## Chemin par défaut

`Sujet`
→ `POST /api/studio/library/search`
→ `Evidence Pack déterministe`
→ `POST /api/studio/editorial`
→ `Canon Contenu V1`
→ `Article + Storyboard`
→ `Contrôle avant diffusion`

Aucun outil web n’est disponible dans `/api/studio/editorial`.

## Ce que le modèle éditorial reçoit

Seulement :

- les sources retenues par D1 ;
- les claims déterministes ;
- les `evidence_id` ;
- `allowed_uses` ;
- `forbidden_inferences` ;
- les inconnues ;
- les limites ;
- le résumé de couverture.

Il ne recrée pas les preuves et ne peut pas ajouter de nouveau fait externe.

## Ce qu’il produit

- famille éditoriale ;
- question de décision ;
- sélection des preuves centrales / contextuelles / écartées ;
- trois angles ;
- fiche canonique de décision ;
- trois hooks ;
- six story beats ;
- article maître ;
- storyboard.

## Quand utiliser le web

`POST /api/studio/research` reste le chemin de fermeture de lacune.

Il est utilisé si :

- aucun noyau de preuves directement utilisable n’existe ;
- une preuve nécessaire est `REFRESH_REQUIRED` ;
- le sujet exige une donnée actuelle absente de V2.1 ;
- le périmètre local disponible ne correspond pas à l’affirmation voulue.

Le web ne doit pas être appelé seulement pour enrichir artificiellement un contenu déjà soutenable.

## Interface Studio

Quatre actions sont distinguées :

1. **Structure seule** — aucune API.
2. **Tester bibliothèque** — D1 uniquement, aucune génération.
3. **Construire depuis V2.1** — D1 + modèle éditorial, sans web.
4. **Compléter par le web** — recherche externe uniquement lorsque nécessaire.

Cette séparation doit rendre visible le coût réel de chaque opération.

## Traçabilité

Chaque claim issu de V2.1 conserve ses `evidenceRefs`.

Chaque contenu doit pouvoir être relié aux preuves dont il dépend.

Objectif futur :

`preuve corrigée` → `contenus dépendants détectés` → `revue ciblée`.

## Publication

Aucun endpoint ne publie automatiquement.

Le statut `storyboard_ready` signifie : dossier suffisamment soutenu pour entrer en production, pas publication autorisée sans recette humaine.

Avant diffusion :

- contrôle canon ;
- fraîcheur des preuves ;
- limite essentielle visible ;
- rendu mobile ;
- destination CTA vérifiée ;
- source de production du site identifiée si le contenu doit y être publié.