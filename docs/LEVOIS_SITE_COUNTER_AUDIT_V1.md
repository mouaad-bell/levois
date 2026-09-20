# LEVOIS — CONTRE-AUDIT DU SITE V1

Source examinée : dossier LEVOIS_SITE_AUDIT_V1 du 19 septembre 2026.

But : confronter les 39 tickets de l’audit à la stratégie LEVOIS déjà fixée, sans exécuter de changement sur le site public tant que la source Astro déployée n’est pas identifiée.

## Verdict global

L’audit est solide et cohérent avec la trajectoire LEVOIS. Il ne justifie ni une refonte globale ni un changement de framework. Le socle produit doit être conservé.

Contre-audit des 39 tickets :

- 27 tickets validés, dont certains à exécuter plus tard ;
- 8 tickets validés avec modification de portée ou de priorité ;
- 2 tickets à fusionner dans des chantiers plus larges ;
- 2 tickets à différer jusqu’à ce que l’usage réel les justifie ;
- 0 ticket rejeté comme inutile.

Le point principal du contre-audit est l’ordre d’exécution : la future couche éditoriale et l’Evidence Library changent la priorité de plusieurs tickets.

## Règles non négociables

1. Ne pas modifier le site public depuis le dépôt Next.js tant que la chaîne dépôt → commit → build → domaine Astro n’est pas établie.
2. Ne pas reconstruire la direction artistique du site.
3. Ne pas supprimer les limites et inconnues pour raccourcir les résultats.
4. Ne pas demander de coordonnées avant une première valeur utile.
5. Ne jamais présenter LEVOIS comme une agence immobilière distincte.
6. Ne jamais transformer une preuve locale en estimation d’un bien.
7. Ne pas publier directement une sortie du Studio sans validation des preuves.
8. Les futurs articles, carrousels et outils doivent pouvoir remonter à un instantané de preuves.

## Ticket par ticket

| Ticket | Verdict | Décision LEVOIS |
|---|---|---|
| B01 | VALIDER — immédiat | Le risque GET conditionnel doit être fermé dès que la vraie source est disponible. Aucun correctif cosmétique : endpoint POST réel ou impossibilité d’envoyer sans JS. |
| B02 | VALIDER — BLOQUEUR OPÉRATIONNEL | Avant toute modification du site : identifier le dépôt Astro autoritatif, le commit, le build Cloudflare et le rollback. Ce ticket devient la porte d’entrée de tout travail sur la production. |
| B03 | VALIDER | Chartres doit afficher Chartres. Utiliser un identifiant géographique stable et séparer recherche libre, commune résolue et rayon autour d’une adresse. |
| B04 | VALIDER | L’absence de contact ne doit jamais être expliquée causalement par les seules vues. Observation, hypothèse et test doivent être distincts. |
| B05 | VALIDER | Rapprocher Mouaad, SAFTI et le territoire du premier écran, sans transformer le hero en carte de visite. La marque LEVOIS reste l’expérience ; Mouaad en est l’incarnation. |
| B06 | VALIDER | Les trois entrées achat / vente / transition restent, mais le clic doit annoncer la valeur obtenue. Pas de promesse de durée fictive. |
| B07 | VALIDER — CHANTIER CENTRAL | La synthèse courte doit devenir la première couche : priorité → ce qui change la décision → prochaine vérification. Les preuves, limites et réponses complètes restent accessibles dessous. |
| B08 | VALIDER | Les statuts déclaration / donnée / hypothèse / inconnu / à vérifier doivent devenir explicites. C’est cohérent avec l’Evidence Library. |
| B09 | VALIDER | Réserver “Lire” à une restitution réelle. Utiliser “Continuer” lorsqu’une nouvelle question suit. |
| B10 | MODIFIER | Ne pas imposer partout “section X sur Y” si le parcours est adaptatif. Montrer plutôt le thème courant, le niveau d’approfondissement et le fait qu’une synthèse est déjà disponible. Le visiteur ne doit pas se sentir obligé d’aller au bout. |
| B11 | VALIDER — IMPORTANT POUR SOCIAL | Une personne qui arrive depuis un contenu “extérieur” doit d’abord appliquer cette question à son usage. Le budget vient ensuite comme contrainte complémentaire, pas comme rupture immédiate. |
| B12 | VALIDER | Sur une arrivée Google froide, la réponse doit précéder les actions de reprise ou d’application. |
| B13 | MODIFIER | Valider trois pilotes, mais ne pas faire du troisième un article générique “prix au m²”. Pilotes proposés : 1) “80 m². Où passe la place ?” ; 2) “Plus loin. De quoi ?” ; 3) “25 000 € d’écart. Trop chère ?”. Ils couvrent espace, mobilité et prix/valeur avec une vraie logique de décision. |
| B14 | VALIDER | Le gabarit Answers devient obligatoire : réponse courte, auteur, date de vérification, preuves, limites, exemple, application, suite. |
| B15 | MODIFIER | Définir maintenant le contrat analytics minimal, mais ne pas bloquer les premiers pilotes sur une instrumentation exhaustive. Mesurer seulement les micro-conversions utiles et sans données personnelles. |
| B16 | VALIDER | Les durées de conservation doivent correspondre aux traitements réels. La note de chantier publique doit disparaître une fois le fonctionnement vérifié. |
| B17 | VALIDER | La relecture humaine doit porter sur un point précis. Ne pas promettre une réponse immédiate ni un conseil illimité. Prévoir un état d’indisponibilité. |
| B18 | VALIDER | Recette mobile réelle obligatoire avant mise en production des changements de lecture : iOS Safari + Android Chrome, clavier, zoom, résultats longs et 360/390/430 px. |
| B19 | MODIFIER | Minimiser le contact, mais garder le contexte nécessaire. Première prise de contact : email + message ; prénom facultatif ; sujet déduit du contexte ou optionnel. Ne pas appliquer automatiquement cette règle aux formulaires nécessitant une identité plus tard. |
| B20 | VALIDER | Les suites éditoriales doivent dépendre du stade réel. Aucun guide de “lancement” proposé à quelqu’un qui a choisi d’attendre. |
| B21 | VALIDER — DONNÉE CRITIQUE | Commune, rayon, période, effectif et méthode doivent accompagner chaque indicateur. La tendance n’est ni un prix du bien ni une prévision. |
| B22 | FUSIONNER DANS B07 | C’est le même problème de hiérarchie de restitution appliqué à Votre rue. Ne pas créer un chantier parallèle. |
| B23 | VALIDER | Corriger les microtextes trop petits et faire une vraie passe accessibilité. Ne pas déclarer une conformité globale sans audit dédié. |
| B24 | VALIDER | Vérifier HTTP, robots, sitemap, redirections et HTML initial dans le bon environnement. Ne corriger que les écarts réellement mesurés. |
| B25 | MODIFIER | Article + BreadcrumbList oui. Pour l’identité, éviter de faire de LEVOIS une “agence” autonome via le JSON-LD. Préférer une identité Person/Mouaad cohérente avec son statut et son lien SAFTI, plus WebSite/Article selon la page. |
| B26 | MODIFIER | Valider l’objectif, mais produire les aperçus OG depuis la même logique visuelle que les carrousels/renderer plutôt que créer un deuxième système d’images. Priorité P3 conservée. |
| B27 | MODIFIER | Chartres et Lèves peuvent être pilotes, mais une page locale n’existe que si elle répond à une question propre avec données, limites et application. La simple disponibilité de données ne suffit pas. Les cinq autres communes viennent ensuite selon demande et valeur distincte. |
| B28 | VALIDER | Conserver /ressources/ comme collection canonique. Organiser progressivement par question, thème et lieu. Ne pas créer /answers/ en doublon ni des hubs vides. |
| B29 | VALIDER — FONDATION ÉDITORIALE | Le contrat preuve → affirmation → réponse → revue doit être construit avant l’industrialisation du blog. C’est le pont entre V2.1, Studio, Answers et les carrousels. |
| B30 | VALIDER — PLUS TARD | Le comparateur A/B est probablement le meilleur prochain module acheteur, mais seulement après le premier cycle éditorial et après observation de l’usage. Aucun score universel. |
| B31 | DIFFÉRER | La grille vendre / attendre / garder est cohérente mais ne mérite pas un nouveau chantier avant que les parcours actuels et le contenu d’acquisition soient stabilisés. |
| B32 | DIFFÉRER | Le journal d’annonce est utile, mais l’usage doit d’abord montrer qu’il existe une demande régulière. Conserver le concept, ne pas le construire maintenant. |
| B33 | VALIDER — PLUS TARD | La chronologie transition doit être simplifiée, mais elle peut attendre le chantier de restitution global B07. Pas de dates inventées ni d’addition de coûts incompatibles. |
| B34 | MODIFIER | Tester et sécuriser l’export/reprise existant. Ne pas investir immédiatement dans un nouveau système de fichier tant que l’usage réel de “garder/reprendre” n’est pas mesuré. |
| B35 | FUSIONNER DANS B13 | L’exemple visuel est une exigence de chaque pilote Answers/carrousel, pas un chantier séparé. Photo ou schéma uniquement s’il aide à comprendre ; jamais une photo générique présentée comme preuve locale. |
| B36 | VALIDER — À REMONTER PLUS TÔT | Dès que B01/B02/B16 sont possibles, recetter les envois, erreurs, doubles clics, droits d’accès et absence de cache public. À faire avant d’amplifier le trafic. |
| B37 | VALIDER | Une correction doit s’ouvrir directement au bon endroit et ne jamais modifier silencieusement un critère. Les recherches multi-communes doivent demander un choix explicite. |
| B38 | VALIDER | Mesurer d’abord performance et Core Web Vitals sur les routes clés. Aucune migration de framework sans goulot mesuré. |
| B39 | VALIDER — ÉLEVER EN P1 | La cohérence preuve → article → carrousel → outil devient centrale dès le lancement du moteur éditorial. Une preuve corrigée doit pouvoir identifier les contenus dépendants. Automatiser le repérage, pas la publication. |

## Priorités révisées

### Lot A — Autorité de production et confiance

Ordre :

1. B02 — retrouver la vraie source Astro ;
2. B01 — sécuriser le formulaire ;
3. B03 — cohérence géographique ;
4. B04 — causalité audit annonce ;
5. B08 — statuts des affirmations ;
6. B16 — conservation réelle ;
7. B21 — méthode DVF ;
8. B36 — recette serveur des promesses.

Aucune amplification SEO/social ne doit précéder la fermeture des incohérences de confiance les plus importantes.

### Lot B — Clarté mobile de la valeur

Socle :

B05, B06, B07, B09, B10 modifié, B11, B17, B18, B19 modifié, B20, B23, B37.

Règle de restitution :

1. Votre priorité.
2. Ce qui change la décision.
3. La prochaine vérification.
4. Puis seulement le détail, les preuves, les limites et les corrections.

B22 est absorbé par cette logique.

### Lot C — Moteur éditorial LEVOIS

Ordre recommandé :

1. B29 — contrat de publication depuis l’Evidence Library ;
2. B39 — dépendances et versions des preuves ;
3. B14 — gabarit Answers ;
4. B13 + B35 — trois pilotes avec exemple visuel ;
5. B12 — arrivée Google froide ;
6. B15 — instrumentation minimale ;
7. B24/B25 — couche SEO technique et données structurées ;
8. B26 — aperçus sociaux à partir du renderer ;
9. B28 — taxonomie ;
10. B27 — premiers dossiers locaux lorsque le contenu le justifie.

### Les trois pilotes

#### 1 — Espace / Usage

“80 m². Où passe la place ?”

Objectif : montrer que même surface ne signifie pas même usage.

Application : Affecter → Tester → Arbitrer.

#### 2 — Lieu / Mobilité

“Plus loin. De quoi ?”

Objectif : passer de la distance abstraite aux lieux et moments réellement contraints du quotidien.

Application : destinations → fréquence → moment contraint.

#### 3 — Prix / Valeur

“25 000 € d’écart. Trop chère ?”

Objectif : montrer qu’un écart de prix ne suffit pas à conclure si les biens comparés ne sont pas réellement comparables.

Application : rendre comparables → identifier les différences → voir ce qu’elles changent.

Chaque pilote produit :

- un article Answers ;
- un carrousel ;
- un exemple visuel ;
- une application personnelle légère ;
- un Evidence Snapshot versionné ;
- un CTA contextuel.

## Lot D — Produit après observation

Candidat n°1 : B30 comparateur A/B.

B31 et B32 restent au parking produit jusqu’à signal d’usage réel.

B33 est traité quand la restitution transition est reprise.

B34 est d’abord un chantier de recette, pas une refonte.

## Ajustements de priorité

### Monter

- B02 : blocker opérationnel pour tout changement site.
- B29 : fondation du contenu industrialisé.
- B36 : avant amplification du trafic.
- B39 : de P2 à P1 dès que Answers/Studio entrent en production.

### Descendre ou différer

- B15 : instrumentation exhaustive après définition du contrat minimal.
- B31 : parking.
- B32 : parking.
- B34 : sécuriser/tester avant d’investir.
- B26 : P3, idéalement généré depuis le pipeline visuel.

## Ce qu’on ne fait pas

- pas de refonte visuelle complète ;
- pas de migration de framework décidée par principe ;
- pas de centaines de pages locales automatiques ;
- pas de content farm ;
- pas de scoring universel des biens ;
- pas de contact forcé ;
- pas de publication automatique des sorties Studio ;
- pas de données structurées faisant passer LEVOIS pour une agence autonome ;
- pas de nouvelle fonctionnalité avant de vérifier qu’elle résout un usage réel.

## Décision finale

Le site n’a pas besoin d’être reconstruit.

Il doit devenir la couche d’expérience qui transforme le contenu en décision personnelle :

CONTENU / GOOGLE
→ RÉPONSE UTILE
→ QUESTION PERSONNELLE
→ APPLICATION LEVOIS
→ SYNTHÈSE COURTE
→ PREUVES ET LIMITES
→ RELECTURE HUMAINE CHOISIE

La priorité produit n’est donc pas “faire plus de pages”, mais relier proprement Evidence Library, Answers, carrousels et outils existants.
