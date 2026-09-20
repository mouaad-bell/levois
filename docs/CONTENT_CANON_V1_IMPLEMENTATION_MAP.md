# LEVOIS — Canon V1 → Implémentation

Source canonique : `LEVOIS — Contenu et expérience — Document canonique V1 — 19 septembre 2026`.

Ce fichier ne remplace pas le canon. Il indique où chaque règle est appliquée dans le moteur.

| Section canonique | Traduction machine / contrôle |
| --- | --- |
| 1. Contrat canonique | `lib/content-canon.ts` : mission, 12 règles, 3 vetos |
| 3. Identité reconnaissable | `LEVOIS_BRAND_COMMITMENTS` |
| 4. Choix sujets / angles | `Studio scope` + `decisionFrame` |
| 5. Temps / Sens / Miroir / Écart | `LEVOIS_ENTRY_CONTROLS` + `lib/hook-engine.ts` |
| 6. Hook = contrat | `CanonDecisionFrame`, 3 `hookCandidates`, promesse explicite/implicite |
| 7. Construction ouverture | hooks directe / scène / comparaison ; aucune contradiction forcée |
| 8. Storytelling | 6 `storyBeats` + before/after |
| 9. Scènes / rythme | cas fictif explicite ; contrôle densité mobile |
| 10. Récits étalons | `content/pilots/` |
| 11. Adaptation formats | `LEVOIS_FORMAT_CONTRACTS`, Answers, Storyboard |
| 12. Expérience site | contre-audit site + continuity gate |
| 13. Preuve | Evidence V2.1, `evidenceRefs`, allowed/forbidden |
| 14. Conversion | `LEVOIS_CONVERSION_RULES`, résolution avant CTA |
| 15. Contrôle diffusion | `lib/canon-review.ts` |
| 16. Mesure | `LEVOIS_MEASUREMENT_DIMENSIONS` |
| 17. Production / maintenance | `LEVOIS_PRODUCTION_ORDER`, evidence dependency traceability |

## Hiérarchie des sources

1. Canon Contenu & Expérience V1 : comment concevoir.
2. Evidence Library V2.1 : ce qui peut être affirmé.
3. DA carrousel validée : comment mettre visuellement en scène.
4. Pilotes : jeux de test, jamais lois universelles.
5. Données de performance futures : apprentissage, jamais permission de violer le canon.

## Chaîne cible

`Sujet`
→ `Décision`
→ `Retrieval V2.1`
→ `Evidence Pack déterministe`
→ `Conclusion autorisée`
→ `Progression canonique`
→ `3 hooks`
→ `Article / carrousel / vidéo / site`
→ `Contrôle canon`
→ `Rendu`
→ `Publication humaine`

Le chemin par défaut doit éviter le web lorsque la V2.1 suffit. Le web devient un mécanisme de fermeture de lacune, pas la source de départ.

## Ce qui reste humain avant publication

- validation du hook final lorsque l’enjeu de marque est fort ;
- validation des règles ou données `REFRESH_REQUIRED` ;
- vérification de la destination d’un CTA ;
- recette visuelle mobile ;
- publication.

Le moteur peut automatiser la préparation, la traçabilité et les contrôles. Il ne doit pas transformer un signal d’audience en autorisation de modifier la vérité.