# LEVOIS — Hook Canon Contract V1

## Statut

CANON INTÉGRÉ — 19 septembre 2026.

Source canonique : **LEVOIS — Contenu et expérience, Document canonique V1**.

Le moteur de hooks n’utilise plus de doctrine générique comme source de vérité.

## Règle centrale

L’accroche ouvre une question que le contenu traite honnêtement ; la fin donne au lecteur une opération qu’il peut refaire.

Le hook est donc un contrat vérifiable, pas une phrase brillante séparée du dossier.

## Ordre obligatoire de conception

Avant de chercher une formule, le dossier doit préciser :

1. la personne concernée ;
2. la décision ;
3. la lecture spontanée ;
4. l’élément qui la met à l’épreuve ;
5. la conclusion autorisée ;
6. l’opération finale.

Ensuite seulement :

- écrire la résolution ;
- construire la démonstration ;
- proposer trois ouvertures ;
- contrôler leur promesse.

## Trois ouvertures requises

Pour chaque dossier, le moteur propose :

- une ouverture **directe** ;
- une ouverture **ancrée dans une scène** ;
- une ouverture **fondée sur une comparaison**.

Le système ne choisit pas automatiquement la plus spectaculaire.
Il choisit celle qui rend la promesse la plus claire et la plus désirable **sans l’agrandir**.

## Les quatre contrôles d’entrée

### Temps

La valeur doit être repérable sans attendre.

### Sens

La phrase simple doit conserver l’idée exacte.

### Miroir

La personne reconnaît une situation concrète : moment, intention, contrainte et question.

### Écart

Une lecture plausible rencontre une information qui oblige à la préciser.

Ces quatre contrôles sont des diagnostics. Ils ne forment pas une formule imposée.

## Familles canoniques

Le moteur reconnaît huit familles :

- situation ;
- usage ;
- comparaison ;
- condition ;
- calendrier ;
- périmètre ;
- inconnue ;
- résultat.

Une famille est choisie selon la preuve disponible et la décision, jamais seulement pour varier le style.

## Promesse explicite et implicite

Chaque accroche conserve :

- ce qu’elle affirme explicitement ;
- ce qu’elle suggère implicitement.

Une formulation prudente grammaticalement peut tout de même suggérer un risque excessif.
Le contrôle porte sur les deux niveaux.

## Vetos absolus

Une ouverture ou un contenu est non publiable sous cette forme si l’un de ces points est vrai :

1. fait fabriqué présenté comme réel ;
2. peur non justifiée par le dossier ;
3. résolution remplacée par une obligation commerciale.

Aucune performance d’audience ne lève ces vetos.

## Continuité avec le récit

Le hook ne peut pas être validé seul.

Il doit être relié à :

- la situation ;
- la lecture initiale ;
- la friction ;
- la démonstration ;
- la relecture ;
- la prise pratique.

Le lecteur doit recevoir une première utilité rapidement après l’entrée.

## Cas fictifs

Un cas fictif peut servir à expliquer une possibilité.

Il doit rester explicitement fictif.
Sa force narrative n’augmente pas sa force de preuve.

## Chiffres et local

Une accroche chiffrée conserve l’origine et le statut des nombres.

Une accroche locale repose sur un ancrage local réel.

Une donnée historique ne devient pas actuelle par son usage dans un hook.

## Traçabilité

Chaque génération conserve :

- canon_id
- canon_version
- fiche de hook
- trois ouvertures candidates
- famille
- promesse explicite
- promesse implicite
- diagnostic Temps / Sens / Miroir / Écart
- vetos
- hook retenu
- motifs de rejet

## Source code

- lib/content-canon.ts
- lib/hook-engine.ts

Les anciennes fixtures restent des cas de test. Elles doivent désormais passer ce contrat au lieu de servir de doctrine implicite.
