# LEVOIS — VULGARISATION ENGINE V1

## Mission

Transformer un Evidence Pack vérifié en contenu compréhensible, mémorisable et actionnable par le plus grand nombre, sans perdre la rigueur de la preuve.

Le moteur ne doit pas simplement simplifier des phrases.
Il doit simplifier le raisonnement.

Chaîne cible :

PREUVES
→ QUESTION DE DÉCISION
→ IDÉE SIMPLE
→ MÉCANISME
→ EXEMPLE
→ MÉTHODE
→ QUESTION PERSONNELLE
→ CTA LEVOIS

## Principe central

Une slide = une idée que le lecteur peut répéter à quelqu’un d’autre.

Si le lecteur doit relire une slide pour comprendre ce qu’elle veut dire, la slide échoue.

## Test collégien

Avant validation, le moteur doit être capable de résumer le contenu entier en trois phrases simples.

Exemple :

Deux logements peuvent avoir la même surface.
Mais leurs mètres carrés ne servent pas forcément aux mêmes choses.
Pour comparer, regarde où passe la place avant de regarder seulement le total.

Si le raisonnement ne peut pas être reformulé ainsi, il doit être retravaillé.

## Interdictions

Le moteur ne doit pas :

- transformer une statistique intéressante en slide si elle ne change pas la décision ;
- empiler plusieurs chiffres sur une même slide ;
- utiliser un mot technique non expliqué ;
- écrire une slide de plus de 45 mots hors exception ;
- produire une méthode de plus de 3 étapes sauf nécessité forte ;
- introduire un nouveau grand sujet dans les deux dernières slides ;
- utiliser une statistique comme preuve d’un mécanisme qu’elle ne mesure pas ;
- confondre contexte, preuve et conclusion ;
- écrire des slogans vagues du type « prenez la bonne décision ».

## Hiérarchie éditoriale

Chaque information reçue doit être classée dans une catégorie :

1. PREUVE CENTRALE — information sans laquelle le raisonnement tombe.
2. CONTEXTE — information utile mais non décisive.
3. MÉCANISME — explication causale ou logique démontrée ou explicitement présentée comme hypothèse.
4. EXEMPLE — cas réel ou scénario pédagogique clairement signalé.
5. MÉTHODE — action que le lecteur peut reproduire.
6. LIMITE — ce que le raisonnement ne permet pas de conclure.

Les slides ne doivent pas traiter ces catégories comme équivalentes.

## Compression

Le moteur applique trois passes.

### Passe A — retirer

Supprimer toute information qui n’aide pas à comprendre ou décider.

### Passe B — traduire

Remplacer les abstractions par des mots concrets.

Exemples :

- « distribution spatiale » → « où passent les mètres carrés »
- « fréquence d’usage » → « combien de fois par semaine »
- « périmètre statistique » → « la zone réellement mesurée »

### Passe C — ancrer

Ajouter un exemple ou une situation quotidienne quand cela améliore la compréhension.

## Longueur cible

Hook : 2 à 8 mots idéalement.

Headline : 3 à 12 mots.

Corps : 10 à 35 mots. 45 mots maximum sauf slide méthode.

Source : visible mais secondaire.

## Architecture narrative

Le moteur choisit 7 à 10 slides.

Fonctions disponibles :

1. HOOK
2. TENSION
3. PREUVE
4. EXPLICATION
5. CAS
6. MÉTHODE
7. DÉCLIC
8. TRANSFERT
9. EXERCICE
10. PONT

Le parcours doit couvrir :

STOPPER
→ FAIRE DOUTER
→ PROUVER
→ FAIRE COMPRENDRE
→ RENDRE CONCRET
→ DONNER UNE MÉTHODE
→ FAIRE MÉMORISER
→ PERSONNALISER
→ CONTINUER SUR LEVOIS

## Hook

Le hook doit réussir 5 tests :

- compréhension immédiate ;
- tension réelle ;
- curiosité ;
- honnêteté ;
- potentiel visuel.

Exemples forts :

- 80 m². Où passe la place ?
- 25 000 € d’écart. Trop chère ?
- Plus loin. De quoi ?

Exemples faibles :

- 5 conseils avant d’acheter
- Tout savoir sur l’immobilier
- Les erreurs à éviter

## Statistiques

Une statistique n’entre dans le carrousel que si elle remplit au moins une fonction :

- prouver un contexte important ;
- casser une intuition ;
- quantifier un mécanisme ;
- permettre une comparaison ;
- aider à décider.

Sinon elle reste dans l’article maître.

## Exemple

Un exemple doit être réel et sourcé, ou explicitement pédagogique.

Jamais une fiction présentée comme une personne réelle.

## Méthode

Une bonne méthode doit être courte, mémorisable, actionnable immédiatement et indépendante d’un professionnel.

Format préféré :

1. NOMMER
2. MESURER
3. COMPARER

ou :

1. AFFECTER
2. TESTER
3. ARBITRER

## Save Value

Avant rendu, le moteur répond :

Qu’est-ce que quelqu’un voudra retrouver dans six mois ?

Si aucune réponse claire n’existe, le contenu est trop faible.

## Share Value

Le moteur répond également :

Quelle slide peut être envoyée avec « regarde ça » ?

## Pont LEVOIS

Le CTA ne doit pas être une publicité ajoutée à la fin.

Il doit prolonger la question créée par le contenu.

Mauvais :

Contactez-moi pour votre projet.

Bon :

Voir ce que cette réponse change dans ma situation.

Le moteur produit obligatoirement :

- next_personal_question ;
- best_levois_path ;
- cta_label.

## Contrat visuel

La vulgarisation doit respecter la DA figée :

- format 4:5 ;
- titre monumental ;
- photographie locale ou matière réelle ;
- couleur de famille ;
- peu de microtexte ;
- aucune statistique illisible ;
- contraste fort ;
- une idée visuelle dominante par slide.

## Quality Gate

Un storyboard n’est prêt pour Remotion que si :

- Hook : PASS
- Factuality : PASS
- Simplicity : PASS
- Mobile Readability : PASS
- Save Value : PASS
- Share Value : PASS
- Transfer Value : PASS
- LEVOIS Bridge : PASS
- Collégien Test : PASS
- No New Topic Late : PASS

## Sortie attendue

Le moteur produit un objet structuré contenant :

- central_idea
- reader_takeaway
- key_proof_refs
- narrative_arc
- slides[]
- next_personal_question
- cta
- save_value
- share_value
- rejected_evidence[]
- simplifications[]

La liste rejected_evidence est importante : elle montre les statistiques volontairement écartées parce qu’elles n’amélioraient pas le raisonnement.
