# LEVOIS Studio — Research V1

## But

Brancher la recherche web réelle au noyau déjà figé :

```
INPUT
→ SCOPE
→ WEB RESEARCH
→ SOURCES OBSERVÉES
→ CLAIMS
→ EVIDENCE PACK
→ 3 ANGLES
→ ARTICLE MASTER
→ STORYBOARD
```

La règle centrale reste : **aucun chiffre réel ne doit entrer dans un carrousel sans preuve traçable**.

## Route

`POST /api/studio/research`

Le site public reste statique. Un Worker Cloudflare ne passe en premier que pour `/api/studio/*`, puis délègue le reste à `env.ASSETS.fetch(request)`.

## Secrets requis

À configurer dans Cloudflare avant d'utiliser la recherche distante :

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put STUDIO_ACCESS_TOKEN
```

Optionnel :

- `STUDIO_RESEARCH_MODEL` — si absent, le Worker utilise `chat-latest`.

Ne jamais placer `OPENAI_API_KEY` dans le navigateur, dans Next.js, dans un fichier `.env` commité ou dans une variable `NEXT_PUBLIC_*`.

## Accès Studio

L'interface `/studio/` peut être chargée sans secret, mais l'endpoint de recherche refuse toute requête sans en-tête :

```
x-studio-key: <STUDIO_ACCESS_TOKEN>
```

La clé saisie dans l'interface est mémorisée uniquement dans `sessionStorage` pour l'onglet courant.

Pour une exposition durable du Studio, ajouter ensuite Cloudflare Access devant `/studio/*`.

## Recherche

Le Worker utilise l'API Responses OpenAI avec :

- outil `web_search` ;
- Structured Outputs `json_schema` ;
- `store: false` ;
- 10 appels outil maximum ;
- 12 000 tokens de sortie maximum ;
- préférence explicite pour les sources primaires/officielles.

Le modèle doit produire :

- une famille éditoriale ;
- un scope ;
- les sources ;
- les claims ;
- les inconnues ;
- les limites ;
- exactement 3 angles ;
- un Article Master ;
- un storyboard de 7 à 10 slides.

## Vérification indépendante du texte généré

Le Worker demande `web_search_call.action.sources` dans la réponse.

Après génération :

1. il extrait les URLs réellement remontées par l'outil de recherche ;
2. il normalise les URLs ;
3. il supprime toute source proposée par le modèle qui n'apparaît pas dans les sources observées ;
4. il réécrit les IDs de sources ;
5. il réécrit les IDs de claims ;
6. tout claim de type `fact` ou `calculation` privé de source après ce filtrage est automatiquement déclassé en `insufficient`.

Le navigateur applique un second garde-fou :

- au moins un claim vérifié ;
- aucune inconnue bloquante ;
- au moins une source retenue ;
- 7 slides minimum ;
- les claims utilisés par les slides/sections de preuve doivent être `verified` ou `qualified`.

Sinon le projet reste `research_required`.

## Important

`verified` signifie ici : **claim relié à une source réellement observée pendant la recherche et accepté par le pipeline**.

Cela ne remplace pas encore une validation humaine finale de chaque valeur sensible avant publication.

## Fixtures

Trois cas restent les tests éditoriaux de référence :

1. `Plus loin. De quoi ?`
2. `80 m². Où passe la place ?`
3. `25 000 € d'écart. Trop chère ?`

Le premier possède aussi une fixture locale déterministe. Les deux autres peuvent être structurés localement mais restent bloqués sans recherche réelle.

## Hors périmètre de cette passe

- D1 / persistance des projets ;
- upload de PDF/CSV ;
- calculs DVF automatisés ;
- Remotion ;
- génération des légendes multicanales ;
- publication automatique ;
- analytics éditoriaux.

Ces briques doivent rester en aval du contrat de vérité.


<!-- preview-trigger: research-v1 -->

<!-- preview-trigger: staging-worker-2 -->
