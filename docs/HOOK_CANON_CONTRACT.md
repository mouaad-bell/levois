# LEVOIS — Hook Canon Contract V1

## Source

Source canonique : **LEVOIS — Contenu et expérience — Document canonique V1 — 19 septembre 2026**.

Le document complet reste le référentiel humain.
`lib/content-canon.ts` en contient la traduction machine exploitable par le Studio.

## Règle centrale

> L’accroche ouvre une question que le contenu traite honnêtement ; la fin donne au lecteur une opération qu’il peut refaire.

Un hook n’est pas une formule de performance. C’est un **contrat vérifiable entre l’ouverture et le corps**.

## Ordre obligatoire de production

Ne pas commencer par chercher une phrase brillante.

1. Identifier la personne concernée.
2. Identifier la décision.
3. Écrire la lecture spontanée.
4. Nommer l’élément qui la met à l’épreuve.
5. Écrire la conclusion réellement autorisée.
6. Écrire l’opération finale que le lecteur peut refaire.
7. Construire la démonstration.
8. Produire seulement ensuite trois ouvertures.

Les trois ouvertures demandées sont :

- une directe ;
- une ancrée dans une scène ;
- une fondée sur une comparaison.

Elles doivent promettre **la même démonstration**.

## Les quatre contrôles d’entrée

### Temps

La première unité perceptible doit permettre de comprendre ce que le contenu va aider à examiner.

### Sens

Une formulation plus simple ne doit jamais augmenter le degré de certitude. Le langage public privilégie un sujet explicite, un verbe concret et une conséquence visible.

### Miroir

Le lecteur se reconnaît dans une situation, pas seulement dans un pronom. Le miroir se construit avec :

- un moment du parcours ;
- une intention ;
- une contrainte ;
- une question.

### Écart

L’écart relie une première lecture plausible à une information qui oblige à la préciser.

Il peut opposer :

- quantité / usage ;
- résultat / cause ;
- montant / date ;
- possibilité / condition ;
- connu / manquant.

Il n’exige aucune contradiction artificielle.

## Familles canoniques V1

| Famille | Fonction | Livraison attendue |
| --- | --- | --- |
| Situation | Entrer par un moment décisionnel | Une manière de recueillir ou examiner l’obstacle |
| Usage | Faire apparaître une coexistence ou un conflit d’usage | Un test transférable |
| Comparaison | Mettre deux options réellement en regard | Une comparaison située et retour à l’arbitrage initial |
| Condition | Passer d’une possibilité à ses conditions | Conditions connues ou à vérifier |
| Calendrier | Faire apparaître l’effet d’une date ou disponibilité | Entrées/sorties datées avec statut |
| Périmètre | Vérifier que deux chiffres/documents couvrent la même chose | Comparaison de périmètre |
| Inconnue | Nommer ce qui manque | Décidable / suspendu |
| Résultat | Séparer un résultat de sa cause supposée | Hypothèses concurrentes + vérification discriminante |

## Promesse explicite et implicite

Le contrôle porte sur les deux.

Exemple interdit sans preuve suffisante :

> Ce détail peut faire échouer votre achat.

Le mot « peut » ne réduit pas suffisamment la promesse implicite de gravité.

La bonne règle est : choisir l’ouverture la plus claire et désirable **sans agrandir la conclusion**.

## Trois vetos absolus

Aucun résultat de performance ne lève ces vetos :

1. fait fabriqué présenté comme réel ;
2. peur non justifiée par le dossier ;
3. résolution remplacée par une obligation commerciale.

## Chiffres et local

Toute ouverture chiffrée doit conserver la provenance et le statut des nombres.

Toute ouverture locale doit reposer sur un ancrage local réel.

Un chiffre historique ne devient pas actuel. Une statistique de commune ne devient pas une caractéristique du bien.

## Curiosité

La réponse n’est pas volontairement retenue.

Une boucle de curiosité n’est acceptable que si :

- la question est identifiable ;
- elle compte pour la décision ;
- sa réponse arrive dès que les éléments permettent de la comprendre.

On peut annoncer très tôt :

> La surface totale ne suffit pas à vérifier cet usage.

La curiosité peut alors porter sur **comment le tester**, pas sur une réponse artificiellement cachée.

## Sortie de génération

Chaque production conserve :

- canonVersion ;
- hookBrief.person ;
- hookBrief.decision ;
- hookBrief.spontaneousReading ;
- hookBrief.pressureTest ;
- hookBrief.authorizedConclusion ;
- hookBrief.finalOperation ;
- trois hookCandidates ;
- leur famille ;
- leur mode directe/scène/comparaison ;
- la promesse explicite ;
- la promesse implicite ;
- les evidenceRefs ;
- les claimRefs ;
- les quatre contrôles d’entrée ;
- le motif de rejet éventuel ;
- le hook finalement retenu.

## Relation aux autres moteurs

### Evidence Library

Détermine ce qui peut être affirmé.

### Hook Canon

Détermine ce qui peut être promis à l’entrée.

### Storytelling Canon

Détermine la progression de compréhension.

### Vulgarisation Engine

Adapte le langage et la densité au support sans changer le sens.

### Renderer

Met en scène une ouverture déjà validée.

Le renderer ne peut jamais « rendre plus fort » un hook en modifiant sa portée.

## Fixtures

Les anciennes formulations :

- 80 m². Où passe la place ?
- Plus loin. De quoi ?
- 25 000 € d’écart. Trop chère ?

restent des **hypothèses de création**.

Elles ne sont plus considérées comme automatiquement validées.

Chaque fixture doit maintenant passer par le contrat canonique complet avant production.