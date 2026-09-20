# LEVOIS Studio — Contrôle des coûts V1

## Objectif

Réserver les appels coûteux aux moments où ils augmentent réellement la qualité de la décision ou du contenu.

Le Studio distingue maintenant quatre niveaux de coût.

## Niveau 0 — aucun modèle

Opérations :

- recherche D1 / Evidence Library ;
- vérification de fraîcheur ;
- récupération des `evidence_id` ;
- contrôle de classe moteur ;
- validation de dépendances ;
- file de revue ;
- aperçu structurel ;
- roadmap ;
- contrôles déterministes.

Coût modèle : **0 token**.

## Niveau 1 — génération éditoriale depuis V2.1

Endpoint : `/api/studio/editorial`.

Le modèle reçoit seulement un Evidence Pack déjà sélectionné.

Il n’a aucun outil web.

Il produit :

- canon ;
- angles ;
- article maître ;
- storyboard.

Le résultat est mis en cache pendant une durée courte. Une requête identique avec le même Evidence Pack, le même modèle et le même canon peut donc être réutilisée sans nouvelle génération.

Le bouton **Régénérer** ignore volontairement le cache.

## Niveau 2 — fermeture de lacune avec web

Endpoint : `/api/studio/research`.

Le web n’est disponible que lorsque la bibliothèque ne fournit pas un noyau suffisant ou lorsqu’une preuve doit être rafraîchie.

Le modèle commence malgré tout par les preuves V2.1 déjà trouvées.

Il ne doit chercher que les lacunes réellement nécessaires.

## Niveau 3 — humain

Une publication, une conclusion particulière ou une décision commerciale peut encore nécessiter :

- vérification du bien ;
- vérification de la personne ;
- document réel ;
- contexte de terrain ;
- relecture humaine.

Ce niveau ne doit pas être remplacé par une génération supplémentaire lorsque les données nécessaires n’existent pas.

## Cache

La clé de cache dépend de :

- entrée normalisée ;
- modèle ;
- canon ;
- version de la bibliothèque ;
- Evidence Pack exact.

Donc une preuve ou une règle modifiée invalide naturellement le cache correspondant.

Un cache hit est enregistré comme génération à **0 token** dans le journal de coût.

## Mesure

`content_generation_runs` conserve :

- pipeline ;
- présence du web ;
- modèle ;
- input tokens ;
- output tokens ;
- total tokens ;
- evidence IDs ;
- hash de l’entrée, jamais le texte libre brut.

L’onglet **Revue** peut afficher sur 30 jours :

- nombre de générations ;
- total de tokens ;
- nombre de runs zéro token ;
- nombre de runs avec web ;
- consommation par pipeline.

## Règles de coût

1. Tester la bibliothèque avant d’utiliser le web.
2. Ne pas relancer une recherche pour reformuler un contenu déjà sourcé.
3. Les variantes Instagram / Facebook / LinkedIn / Pinterest partent du même dossier de preuve.
4. Les images n’entraînent pas une nouvelle recherche factuelle.
5. Une preuve `VERIFY_PROPERTY` ou `VERIFY_PERSON` ne justifie pas davantage de tokens : elle justifie une vérification du cas.
6. Une donnée dynamique périmée justifie une recherche ciblée, pas une reconstruction complète du dossier.
7. Un contenu déjà généré n’est régénéré que si la preuve, le canon, le modèle ou la décision éditoriale a changé.

## Indicateurs utiles

À suivre après mise en service :

- taux de sujets traités sans web ;
- taux de cache hit ;
- tokens moyens d’une génération éditoriale ;
- tokens moyens d’une recherche avec web ;
- nombre de preuves réutilisées par contenu ;
- nombre de contenus rouvert après changement de preuve.

Ces mesures permettent d’optimiser le coût sans diminuer la discipline de preuve.
