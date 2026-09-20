# LEVOIS — Analytics Contract V1

## Objectif

Mesurer si LEVOIS aide réellement une personne à progresser dans sa compréhension et sa décision, sans réduire la réussite à la génération d’un lead.

## Principe

La mesure suit trois niveaux :

1. entrée dans le contenu ;
2. progression jusqu’à la réponse ;
3. action utile réellement choisie.

Une vue ne prouve ni compréhension ni qualité de décision.

## Événements autorisés

- `content_view`
- `content_complete`
- `content_method_applied`
- `content_source_opened`
- `tool_started`
- `tool_completed`
- `result_modified`
- `resource_saved`
- `next_resource_opened`
- `human_review_requested`
- `human_exchange_requested`

Le contrat machine correspondant est `lib/analytics-contract.ts`.

## Données interdites dans l’analytics éditorial

Ne pas envoyer :

- email ;
- téléphone ;
- nom/prénom ;
- adresse exacte ;
- texte libre du formulaire ;
- réponse brute d’un utilisateur ;
- message envoyé à Mouaad ;
- contenu intégral d’une recherche ou d’un dossier personnel.

Les propriétés doivent rester catégorielles ou techniques : `contentId`, `familyId`, `route`, `channel`, `toolId`, `stepId`, `outcome`, versions du canon et de l’Evidence Library.

## Consentement

L’émission d’événements analytics reste conditionnée au consentement analytics du site.

Le fonctionnement d’un outil, l’accès à une réponse ou la prise de contact ne doivent pas dépendre de ce consentement.

## Micro-conversions

Les événements ne sont pas des scores commerciaux.

Exemples :

- finir un article peut être une réussite ;
- modifier une réponse après la restitution peut indiquer que la personne a appris quelque chose ;
- quitter le site après avoir obtenu la méthode peut être une sortie normale ;
- demander une relecture humaine est une suite possible, pas l’unique objectif.

## Lecture éditoriale

Pour chaque contenu, conserver :

- version du hook ;
- version du canon ;
- evidence snapshot ;
- format ;
- canal d’entrée lorsqu’il est disponible ;
- changements entre deux versions.

Une amélioration de rétention accompagnée d’une promesse moins exacte n’est jamais considérée comme une amélioration LEVOIS.

## À ne pas faire

- inventer un seuil universel de bon taux de complétion ;
- déduire l’intention personnelle à partir d’un clic isolé ;
- mélanger données de contact et analytics éditorial ;
- faire du taux de contact le seul indicateur de valeur ;
- envoyer les questions personnelles à un outil analytics.
