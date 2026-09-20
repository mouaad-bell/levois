# LEVOIS — Contrat Article public V1

## Fonction

Ce contrat transforme une ressource éditoriale en page publique utile,
traçable, partageable et citable. Il complète le Canon Contenu V1 et
l'Evidence Library V2.1 ; il ne remplace ni l'un ni l'autre.

La chaîne de décision est :

`question vécue → preuve adaptée → réponse directe → raisonnement → limite → opération autonome → continuité`

## Conditions obligatoires

1. Une page répond à une question décisionnelle principale.
2. La réponse directe tient entre 30 et 100 mots et reste utile seule.
3. Toute conclusion factuelle renvoie à une preuve résolue dans le snapshot.
4. Le périmètre, la période et la date de vérification restent visibles.
5. La limite essentielle est lisible sans accès à la base interne.
6. Une opération autonome précède toute demande de coordonnées.
7. Les sources conservent éditeur, titre, référence, période et URL quand elle existe.
8. Une page ne devient pas une impasse : elle possède au moins un candidat de maillage pertinent.
9. L'URL canonique reste stable. Une migration exige une redirection permanente documentée.
10. Une page `PUBLISHED` exige une date de publication valide et une validation humaine.

## Architecture SEO, GEO et diffusion

- Les pages sont organisées par question, situation et décision, pas par date.
- Un nom de commune n'est autorisé dans le titre ou le slug que si la page apporte une preuve ou une application locale propre.
- Les pages locales clonées, les variations géographiques artificielles et les promesses statistiques non vérifiées sont interdites.
- Les données structurées prioritaires sont `Article`, `BreadcrumbList`, `Person` et `WebSite`.
- `FAQPage` n'est utilisé que si les questions et réponses sont réellement visibles.
- LEVOIS n'est pas déclaré comme agence immobilière indépendante.
- Chaque article possède une image sociale, une canonical, une citation copiable et un lien HTML copiable.

## Politique des sources

Le carnet SEO/local/inbound sert à identifier des questions, formats,
territoires, partenaires et opportunités de citation. Il ne constitue pas une
preuve automatique.

Les prix instantanés, prévisions, délais moyens, statistiques marketing et
effets supposés d'un aménagement restent en quarantaine tant que leur source,
leur méthode, leur date et leur périmètre n'ont pas été vérifiés. Une opinion
d'agence reste attribuée comme opinion ; elle n'est pas transformée en fait de
marché.

## Backlinks utiles

Le link earning repose d'abord sur une raison réelle de citer LEVOIS :

- tableau ou série locale reproductible ;
- méthode publique et stable ;
- baromètre daté ;
- définition prudente ;
- carte ou analyse locale originale ;
- fichier téléchargeable avec périmètre et limites.

Les boutons de partage facilitent la circulation. Ils ne remplacent pas la
valeur éditoriale qui motive un lien externe.

## Publication

Les statuts autorisés sont `DRAFT` et `PUBLISHED`. Le statut `DRAFT` impose
`noindex` et exclut la page du sitemap et de l'index Ressources. Le passage à
`PUBLISHED` n'est jamais automatique.

