# LEVOIS — Roadmap éditoriale depuis V2.1

## Principe

La bibliothèque ne sert pas seulement à répondre à une question après qu’elle a été choisie.

Elle peut aussi produire une **file de sujets documentables**.

La V2.1 contient déjà un fichier de readiness avec 56 questions couvrant notamment prix, statistiques, surfaces, DPE, travaux, financement, fiscalité, copropriété, urbanisme, risques, mobilité, services, environnement et transaction.

Commande :

node scripts/build-evidence-question-map.mjs "C:\chemin\RETRIEVAL_READINESS_TEST_V21.csv"

Sortie :

content/roadmap/EVIDENCE_BACKED_QUESTION_MAP_V1.json

## Ce que cette carte mesure

Elle classe :

- la question ;
- son domaine ;
- la famille éditoriale LEVOIS ;
- la couverture documentaire V2.1 ;
- les evidence_id déjà disponibles ;
- la fraîcheur ;
- le besoin de web identifié pendant le test V2.1 ;
- les formats envisageables ;
- une priorité éditoriale interne A / B / C.

## Ce qu’elle ne mesure PAS

Aucune priorité ne doit être présentée comme :

- un volume de recherche Google ;
- une difficulté SEO ;
- une probabilité de classement ;
- une estimation de trafic ;
- une preuve de demande du marché.

Ces dimensions nécessiteront des données distinctes : Search Console une fois le contenu publié, outils de recherche de mots-clés si on décide de les utiliser, comportement réel du site et retours qualitatifs.

## Utilité

La carte permet de séparer deux questions :

1. **Pouvons-nous produire une réponse sérieuse maintenant ?**
2. **Devons-nous réellement la produire maintenant ?**

La bibliothèque aide surtout à répondre à la première.

La seconde dépend du parcours LEVOIS, des priorités commerciales, de l’intérêt du public et des données d’usage.

## Ordre recommandé

Pour les premiers cycles :

1. privilégier les sujets A qui touchent directement une décision acheteur/vendeur ;
2. transformer un même dossier en article + carrousel seulement lorsque chaque format apporte quelque chose ;
3. publier peu de pages locales mais réellement distinctes ;
4. mesurer ensuite les entrées Google, les lectures, les applications et les suites choisies ;
5. ajuster la roadmap avec les données réelles plutôt qu’avec un calendrier artificiel.

## Boucle future

Evidence readiness
→ Question map
→ sélection humaine
→ Evidence Pack
→ Canon
→ Answers / Carousel
→ publication
→ mesure
→ mise à jour de priorité

La génération de la roadmap reste donc déterministe sur la préparation documentaire, mais la décision de publication reste humaine.
