import {
  STUDIO_FAMILIES,
  STUDIO_SCHEMA_VERSION,
  type ArticleMaster,
  type EditorialAngle,
  type EditorialScope,
  type EvidencePack,
  type Storyboard,
  type StudioFamilyId,
  type StudioProject,
} from './studio-schema';

const TERRITORY = 'Chartres et alentours';

function clean(input: string) {
  return input.replace(/\s+/g, ' ').trim();
}

function idFrom(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `LEV-${Math.abs(hash >>> 0).toString(36).toUpperCase()}`;
}

function detectFamily(input: string): StudioFamilyId {
  const q = input.toLowerCase();
  if (/dpe|travaux|diagnostic|isolation|chauffage|toiture|technique/.test(q)) return 'bien_technique';
  if (/crédit|credit|mensual|apport|financ|budget|taux|emprunt/.test(q)) return 'budget_financement';
  if (/prix|valeur|cher|comparables|négoci|negoci|estimation/.test(q)) return 'prix_valeur';
  if (/surface|m²|m2|plan|pièce|piece|circulation|rangement|terrasse/.test(q)) return 'espace_usage';
  if (/quartier|commune|trajet|distance|gare|école|ecole|mobilité|mobilite|loin|proche/.test(q)) return 'lieu_mobilite';
  if (/dvf|marché|marche|vente|volume|tendance|territoire/.test(q)) return 'marche_territoire';
  if (/annonce|compromis|copro|document|offre|mandat|règlement|reglement/.test(q)) return 'verifier_transaction';
  return 'decider_arbitrer';
}

function isDistanceFixture(input: string) {
  const q = input.toLowerCase();
  return /plus loin|éloign|eloign|distance|trajet|zone de recherche/.test(q);
}

function isSurfaceFixture(input: string) {
  const q = input.toLowerCase();
  return /80\s*m|surface|où passe la place|ou passe la place|plan/.test(q);
}

function isPriceFixture(input: string) {
  const q = input.toLowerCase();
  return /25\s*000|25000|écart.*prix|ecart.*prix|trop ch[èe]re|comparables/.test(q);
}

function summarizeEvidence(pack: Omit<EvidencePack, 'summary'>, canPublish: boolean, limitations: string[]): EvidencePack {
  const claims = pack.claims;
  return {
    ...pack,
    summary: {
      verifiedClaims: claims.filter((claim) => claim.status === 'verified').length,
      qualifiedClaims: claims.filter((claim) => claim.status === 'qualified').length,
      insufficientClaims: claims.filter((claim) => claim.status === 'insufficient').length,
      rejectedClaims: claims.filter((claim) => claim.status === 'rejected').length,
      researchConfidence: canPublish ? 'high' : claims.length ? 'medium' : 'low',
      canPublish,
      limitations,
    },
  };
}

function distanceFixture(rawInput: string): StudioProject {
  const family = STUDIO_FAMILIES.decider_arbitrer;

  const scope: EditorialScope = {
    rawTopic: rawInput,
    decisionQuestion: 'Comment déterminer si l’éloignement d’un logement constitue réellement un compromis acceptable ?',
    audience: 'Grand public, avec ou sans projet immobilier immédiat',
    territory: TERRITORY,
    objective: 'Apprendre à évaluer une localisation à partir du quotidien réel plutôt qu’à partir d’une distance abstraite.',
    hypothesesToTest: [
      'Plus loin signifie nécessairement moins pratique.',
      'La distance kilométrique suffit à définir une bonne zone de recherche.',
    ],
    mustNotAssume: [
      'S’éloigner permet forcément d’acheter moins cher.',
      'Les trajets hors commune sont nécessairement longs.',
      'Une localisation est objectivement bonne ou mauvaise.',
    ],
  };

  const evidencePack = summarizeEvidence(
    {
      sources: [
        {
          sourceId: 'S001',
          type: 'official_dataset',
          publisher: 'INSEE',
          title: 'Dossier complet — Bassin de vie de Chartres',
          url: 'https://www.insee.fr/fr/statistiques/2011101?geo=BV2022-28085',
          dataPeriod: '2023',
          geographicScope: 'Bassin de vie de Chartres',
          reliability: 'primary',
        },
      ],
      claims: [
        {
          claimId: 'C007',
          claim: '73,7 % des actifs occupés du bassin de vie de Chartres travaillent dans une autre commune que leur commune de résidence.',
          claimType: 'fact',
          value: 73.7,
          unit: '%',
          population: 'Actifs occupés',
          geographicScope: 'Bassin de vie de Chartres',
          timeScope: '2023',
          sourceRefs: ['S001'],
          evidenceStrength: 'strong',
          status: 'verified',
          allowedUses: ['Les déplacements intercommunaux concernent une majorité des actifs occupés du bassin de vie de Chartres.'],
          forbiddenInferences: [
            'Les actifs ont de longs trajets.',
            'Les habitants passent énormément de temps en voiture.',
            'Le fait de travailler hors commune rend une localisation mauvaise.',
          ],
        },
      ],
      unknowns: [
        {
          unknownId: 'U001',
          question: 'Quelle est la durée moyenne réelle des trajets domicile-travail dans le périmètre étudié ?',
          importance: 'medium',
          reason: 'La donnée utilisée décrit le changement de commune, pas la durée du déplacement.',
          blocking: false,
        },
      ],
    },
    true,
    ['La donnée INSEE ne mesure pas la durée des trajets ni leur pénibilité.'],
  );

  const angles: EditorialAngle[] = [
    {
      angleId: 'A',
      title: 'Plus loin. De quoi ?',
      promise: 'Transformer la notion vague de distance en réseau de contraintes réelles.',
      hook: 'PLUS LOIN. DE QUOI ?',
      centralProof: '73,7 % des actifs occupés du bassin de vie de Chartres travaillent hors de leur commune de résidence.',
      saveValue: 'Une méthode en trois opérations : destinations, fréquence, moment contraint.',
      bridgeQuestion: 'Jusqu’où pouvez-vous réellement vous éloigner compte tenu de votre quotidien ?',
      selected: true,
    },
    {
      angleId: 'B',
      title: 'Votre rayon de recherche vous trompe peut-être',
      promise: 'Montrer pourquoi un cercle autour de Chartres simplifie trop une vie réelle.',
      hook: '10 KM AUTOUR DE CHARTRES ?',
      centralProof: 'Une adresse n’a de sens qu’en relation avec les destinations réellement fréquentées.',
      saveValue: 'Remplacer le rayon par une carte de contraintes personnelles.',
      bridgeQuestion: 'À quoi ressemblerait votre vraie zone de recherche ?',
    },
    {
      angleId: 'C',
      title: 'Une petite contrainte répétée pèse lourd',
      promise: 'Comparer fréquence et intensité au lieu de juger un trajet isolé.',
      hook: '+10 MIN. DEUX FOIS PAR JOUR.',
      centralProof: 'Le cas pédagogique permet de distinguer contrainte répétée et contrainte occasionnelle.',
      saveValue: 'Une règle mentale réutilisable bien au-delà de l’immobilier.',
      bridgeQuestion: 'Quelles contraintes se répètent vraiment dans votre semaine ?',
    },
  ];

  const articleMaster: ArticleMaster = {
    workingTitle: 'Plus loin. De quoi ?',
    centralQuestion: 'Comment savoir si un logement est réellement trop éloigné de votre quotidien ?',
    centralThesis: 'Une localisation doit être évaluée par rapport aux destinations, fréquences et contraintes du quotidien plutôt qu’à partir d’une distance abstraite.',
    family: family.id,
    sections: [
      { sectionId: 'SEC01', type: 'question', heading: '“Plus loin” n’est pas encore une mesure utile', body: 'Dire qu’un logement est plus loin ne dit pas ce qui devient réellement plus difficile. Il faut d’abord identifier les lieux auxquels la semaine vous relie.', claimRefs: [] },
      { sectionId: 'SEC02', type: 'intuition', heading: 'L’intuition du rayon', body: 'On dessine souvent un cercle autour d’une ville. Cette simplification est pratique pour chercher, mais elle ne représente pas forcément les contraintes d’une personne.', claimRefs: [] },
      { sectionId: 'SEC03', type: 'proof', heading: 'Un territoire déjà intercommunal', body: 'Dans le bassin de vie de Chartres, 73,7 % des actifs occupés travaillent dans une autre commune que leur commune de résidence en 2023. Cela montre que le passage d’une commune à l’autre fait partie du quotidien d’une majorité d’actifs, sans renseigner sur la durée de leurs trajets.', claimRefs: ['C007'] },
      { sectionId: 'SEC04', type: 'mechanism', heading: 'Votre adresse est un point. Votre quotidien est un réseau.', body: 'Travail, école, gare, proches, courses et activités n’ont ni la même fréquence ni le même niveau de contrainte. La localisation pertinente dépend de ce réseau.', claimRefs: [] },
      { sectionId: 'SEC05', type: 'case', heading: 'Même maison, deux décisions rationnelles', body: 'Cas pédagogique : une personne se déplace chaque jour pour le travail et l’école, une autre télétravaille quatre jours par semaine. Le logement est identique ; l’effet de sa localisation ne l’est pas.', claimRefs: [] },
      { sectionId: 'SEC06', type: 'method', heading: 'Trois opérations suffisent', body: 'Listez les destinations importantes. Comptez leur fréquence. Testez le moment où votre journée est la plus contrainte. Ensuite seulement, jugez la localisation.', claimRefs: [] },
      { sectionId: 'SEC07', type: 'limits', heading: 'Ce que cette méthode ne remplace pas', body: 'Elle ne remplace ni une mesure réelle des trajets, ni l’examen du budget, du bien, de l’environnement ou des préférences personnelles. Elle évite seulement de traiter la distance comme une donnée absolue.', claimRefs: ['C007'] },
      { sectionId: 'SEC08', type: 'application', heading: 'La bonne question devient personnelle', body: 'Au lieu de demander “combien de kilomètres puis-je accepter ?”, demandez “qu’est-ce que cette adresse change dans ma semaine ?”.', claimRefs: [] },
    ],
    keyTakeaway: 'Ne mesurez pas seulement la distance. Mesurez ce qu’elle change dans votre semaine.',
    transferablePrinciple: 'Pour comparer deux options, pondérez les contraintes par leur fréquence et leur importance réelle plutôt que par leur visibilité immédiate.',
    nextPersonalQuestion: 'Jusqu’où puis-je réellement m’éloigner compte tenu des endroits auxquels mon quotidien me relie ?',
    recommendedLevoisPath: {
      label: 'Mettre ma recherche au clair',
      path: '/',
      routeStatus: 'pending',
      reason: 'Le parcours acheteur dédié devra reprendre les contraintes et arbitrages révélés par le carrousel.',
    },
  };

  const storyboard: Storyboard = {
    format: 'instagram_carousel_4x5',
    family: family.id,
    accentColor: family.accent,
    slideCount: 10,
    slides: [
      { slideNumber: 1, narrativeRole: 'hook', objective: 'Stopper le scroll avec une question incomplète.', headline: 'PLUS LOIN. DE QUOI ?', body: 'Avant de chercher “plus près”, encore faut-il savoir de quoi.', claimRefs: [], layout: 'HERO_MAP', readerEffect: 'stop', assetRequirements: ['Photographie locale lumineuse', 'Carte simplifiée de Chartres et alentours'] },
      { slideNumber: 2, narrativeRole: 'tension', objective: 'Casser l’idée que la distance suffit.', headline: 'LOIN ≠ DISTANCE', body: 'Deux logements séparés de quelques kilomètres peuvent bouleverser votre quotidien… ou presque ne rien changer.', claimRefs: [], layout: 'EDITORIAL_SPLIT', readerEffect: 'curiosity', assetRequirements: ['Deux scènes locales contrastées'] },
      { slideNumber: 3, narrativeRole: 'proof', objective: 'Ancrer le sujet dans une donnée locale réelle.', headline: '73,7 %', body: 'des actifs occupés du bassin de vie de Chartres travaillent dans une autre commune que celle où ils habitent.', claimRefs: ['C007'], layout: 'HERO_NUMBER', readerEffect: 'credibility', sourceLabel: 'INSEE · RP2023 · Bassin de vie de Chartres', assetRequirements: ['Flux territoriaux stylisés'] },
      { slideNumber: 4, narrativeRole: 'explanation', objective: 'Faire comprendre la notion de réseau.', headline: 'VOTRE ADRESSE N’EST QU’UN POINT.', body: 'Travail. École. Gare. Proches. Courses. Activités. Votre quotidien est un réseau.', claimRefs: [], layout: 'MAP_NETWORK', readerEffect: 'understanding', assetRequirements: ['Carte réseau schématique'] },
      { slideNumber: 5, narrativeRole: 'case', objective: 'Montrer que la même adresse produit des décisions différentes.', headline: 'MÊME MAISON. DEUX DÉCISIONS RATIONNELLES.', body: 'Cas pédagogique : les contraintes changent, pas le logement.', claimRefs: [], layout: 'CASE_DUAL', readerEffect: 'identification', assetRequirements: ['Maison réelle ou illustration non documentaire', 'Deux profils sans portrait humain nécessaire'] },
      { slideNumber: 6, narrativeRole: 'method', objective: 'Donner une méthode mémorisable.', headline: 'NE MESUREZ PAS D’ABORD LES KILOMÈTRES.', body: '1 — Listez les destinations. 2 — Comptez la fréquence. 3 — Testez le moment le plus contraint.', claimRefs: [], layout: 'METHOD_STEPS', readerEffect: 'clarity', assetRequirements: ['Pictogrammes simples ou typographie pure'] },
      { slideNumber: 7, narrativeRole: 'insight', objective: 'Créer une règle mentale sauvegardable.', headline: 'CE N’EST PAS LE MÊME POIDS.', body: '25 min une fois par mois ≠ +10 min deux fois par jour. Une contrainte répétée peut peser davantage.', claimRefs: [], layout: 'COMPARISON_DUAL', readerEffect: 'memorization', assetRequirements: ['Composition typographique comparative'] },
      { slideNumber: 8, narrativeRole: 'transfer', objective: 'Faire dépasser le cas immobilier.', headline: 'CHANGEZ DE QUESTION.', body: 'Ne demandez plus seulement “quelle distance ?”. Demandez “qu’est-ce que cette adresse change dans ma semaine ?”.', claimRefs: [], layout: 'QUESTION_SHIFT', readerEffect: 'surprise', assetRequirements: ['Question barrée / question révélée'] },
      { slideNumber: 9, narrativeRole: 'exercise', objective: 'Faire appliquer la méthode immédiatement.', headline: 'À VOUS.', body: 'Prenez les 3 endroits où vous allez le plus souvent. Où ? Combien de fois ? Quand est-ce le plus contraignant ?', claimRefs: [], layout: 'DATA_FIELD', readerEffect: 'participation', assetRequirements: ['Carte ou fiche à compléter'] },
      { slideNumber: 10, narrativeRole: 'bridge', objective: 'Créer un pont naturel vers LEVOIS.', headline: 'VOTRE BONNE ZONE N’EST PEUT-ÊTRE PAS UN CERCLE.', body: 'Mettez votre recherche au clair à partir de votre quotidien, de vos priorités et de vos arbitrages.', claimRefs: [], layout: 'FINAL_BRIDGE', readerEffect: 'action', assetRequirements: ['Carte de zone irrégulière', 'CTA LEVOIS'] },
    ],
    qualityGate: {
      hook: true,
      factuality: true,
      narrative: true,
      mobileDensity: true,
      transferValue: true,
      saveValue: true,
      levoisBridge: true,
    },
  };

  return {
    schemaVersion: STUDIO_SCHEMA_VERSION,
    projectId: idFrom(rawInput),
    status: 'storyboard_ready',
    input: { inputType: rawInput.includes('?') ? 'question' : 'idea', rawInput },
    family,
    scope,
    evidencePack,
    angles,
    articleMaster,
    storyboard,
    generatedAt: new Date().toISOString(),
  };
}

function researchRequiredFixture(rawInput: string, familyId: StudioFamilyId, kind: 'surface' | 'price' | 'generic'): StudioProject {
  const family = STUDIO_FAMILIES[familyId];
  const specific =
    kind === 'surface'
      ? {
          question: 'Pourquoi deux logements affichant la même surface peuvent-ils être très différents à vivre ?',
          objective: 'Distinguer surface annoncée, distribution et usage réel sans inventer de plan ni de métrique.',
          title: '80 m². Où passe la place ?',
          unknown: 'Il faut un plan réel, une source de surface et un cas clairement documenté avant publication.',
          path: 'Un futur outil de clarification des usages et priorités.',
        }
      : kind === 'price'
        ? {
            question: 'Un écart de prix suffit-il à conclure qu’un bien est trop cher ?',
            objective: 'Montrer ce qu’il faut vérifier avant de comparer deux prix.',
            title: '25 000 € d’écart. Trop chère ?',
            unknown: 'Il faut des comparables réels, leur périmètre, leur période et les caractéristiques vérifiables des biens.',
            path: 'Un futur outil de comparaison de scénarios.',
          }
        : {
            question: `Quelle décision se cache derrière : “${rawInput}” ?`,
            objective: 'Transformer l’idée brute en question de décision avant toute affirmation factuelle.',
            title: rawInput,
            unknown: 'Aucune recherche factuelle n’a encore été exécutée dans ce prototype.',
            path: 'Le parcours LEVOIS correspondant sera choisi après clarification du sujet.',
          };

  const scope: EditorialScope = {
    rawTopic: rawInput,
    decisionQuestion: specific.question,
    audience: 'Grand public, avec ou sans projet immobilier immédiat',
    territory: TERRITORY,
    objective: specific.objective,
    hypothesesToTest: ['Identifier l’intuition spontanée du lecteur.', 'Identifier les variables qui pourraient changer la décision.'],
    mustNotAssume: ['Aucun chiffre, prix, trajet, surface ou résultat non relié à une source.', 'Aucune conclusion avant le dossier de preuves.'],
  };

  const evidencePack = summarizeEvidence(
    {
      sources: [],
      claims: [],
      unknowns: [{ unknownId: 'U001', question: specific.unknown, importance: 'high', reason: 'Le moteur de recherche et de preuves n’est pas encore branché à ce prototype statique.', blocking: true }],
    },
    false,
    [specific.unknown],
  );

  const angles: EditorialAngle[] = [
    {
      angleId: 'A',
      title: specific.title,
      promise: 'Partir d’une tension simple et laisser les preuves décider de la conclusion.',
      hook: specific.title.toUpperCase(),
      centralProof: 'À établir dans l’Evidence Pack.',
      saveValue: 'Une méthode de décision à extraire une fois les preuves réunies.',
      bridgeQuestion: 'Qu’est-ce que ce sujet change concrètement dans votre propre projet ?',
      selected: true,
    },
    {
      angleId: 'B',
      title: 'Ce que l’intuition oublie',
      promise: 'Identifier la variable cachée qui pourrait modifier la première impression.',
      hook: 'ET SI LE PROBLÈME ÉTAIT AILLEURS ?',
      centralProof: 'À établir.',
      saveValue: 'Une grille de vérification transposable.',
      bridgeQuestion: 'Quelle information vous manque pour décider ?',
    },
    {
      angleId: 'C',
      title: 'Avant de conclure',
      promise: 'Transformer le sujet en protocole de vérification.',
      hook: 'AVANT DE DÉCIDER, VÉRIFIEZ ÇA.',
      centralProof: 'À établir.',
      saveValue: 'Une séquence de contrôle simple.',
      bridgeQuestion: 'Quelle prochaine vérification réduirait le plus votre incertitude ?',
    },
  ];

  const articleMaster: ArticleMaster = {
    workingTitle: specific.title,
    centralQuestion: specific.question,
    centralThesis: 'Conclusion volontairement non déterminée tant que les preuves ne sont pas réunies.',
    family: family.id,
    sections: [
      { sectionId: 'SEC01', type: 'question', heading: 'Question de décision', body: specific.question, claimRefs: [] },
      { sectionId: 'SEC02', type: 'intuition', heading: 'Intuition à tester', body: 'Le moteur doit formuler l’intuition courante sans l’adopter comme conclusion.', claimRefs: [] },
      { sectionId: 'SEC03', type: 'proof', heading: 'Preuves requises', body: specific.unknown, claimRefs: [] },
      { sectionId: 'SEC04', type: 'mechanism', heading: 'Mécanisme', body: 'À rédiger après validation des claims.', claimRefs: [] },
      { sectionId: 'SEC05', type: 'case', heading: 'Cas concret', body: 'À construire uniquement à partir d’un cas réel ou explicitement pédagogique.', claimRefs: [] },
      { sectionId: 'SEC06', type: 'method', heading: 'Méthode', body: 'À extraire du raisonnement une fois les preuves réunies.', claimRefs: [] },
      { sectionId: 'SEC07', type: 'limits', heading: 'Limites', body: 'La conclusion devra rester proportionnée au niveau de preuve.', claimRefs: [] },
      { sectionId: 'SEC08', type: 'application', heading: 'Application personnelle', body: 'Transformer le résultat en question utile pour le lecteur.', claimRefs: [] },
    ],
    keyTakeaway: 'À établir après recherche.',
    transferablePrinciple: 'Une décision rationnelle sépare ce que l’on sait, ce que l’on suppose et ce qu’il reste à vérifier.',
    nextPersonalQuestion: 'Quelle information vous manque aujourd’hui pour avancer sans décider au hasard ?',
    recommendedLevoisPath: {
      label: 'Clarifier mon projet',
      path: '/',
      routeStatus: 'pending',
      reason: specific.path,
    },
  };

  const storyboard: Storyboard = {
    format: 'instagram_carousel_4x5',
    family: family.id,
    accentColor: family.accent,
    slideCount: 8,
    slides: [
      { slideNumber: 1, narrativeRole: 'hook', objective: 'Créer la tension sans promettre une conclusion non prouvée.', headline: specific.title.toUpperCase(), body: 'La réponse dépend des preuves que l’on peut réellement réunir.', claimRefs: [], layout: 'HERO_PHOTO', readerEffect: 'stop', assetRequirements: ['Visuel local ou matière immobilière vérifiable'] },
      { slideNumber: 2, narrativeRole: 'tension', objective: 'Formuler l’intuition.', headline: 'L’INTUITION EST RAPIDE.', body: 'Mais elle n’est pas encore une démonstration.', claimRefs: [], layout: 'EDITORIAL_SPLIT', readerEffect: 'curiosity', assetRequirements: ['Composition typographique'] },
      { slideNumber: 3, narrativeRole: 'proof', objective: 'Bloquer tant que la preuve manque.', headline: 'CE QU’IL FAUT PROUVER.', body: specific.unknown, claimRefs: [], layout: 'DATA_FIELD', readerEffect: 'credibility', assetRequirements: ['Sources à collecter'] },
      { slideNumber: 4, narrativeRole: 'explanation', objective: 'Expliquer le mécanisme une fois documenté.', headline: 'LE MÉCANISME.', body: 'À générer après validation des claims.', claimRefs: [], layout: 'HERO_NUMBER', readerEffect: 'understanding', assetRequirements: ['Données vérifiées'] },
      { slideNumber: 5, narrativeRole: 'case', objective: 'Rendre concret sans inventer.', headline: 'UN CAS, PAS UNE FICTION DÉGUISÉE.', body: 'Le cas sera réel ou clairement présenté comme pédagogique.', claimRefs: [], layout: 'CASE_DUAL', readerEffect: 'identification', assetRequirements: ['Cas documenté'] },
      { slideNumber: 6, narrativeRole: 'method', objective: 'Donner une méthode sauvegardable.', headline: 'COMMENT RAISONNER ?', body: 'La méthode sera extraite des preuves et du mécanisme.', claimRefs: [], layout: 'METHOD_STEPS', readerEffect: 'memorization', assetRequirements: ['3 étapes maximum'] },
      { slideNumber: 7, narrativeRole: 'transfer', objective: 'Rendre le principe réutilisable.', headline: 'CE QUE VOUS POUVEZ RÉUTILISER.', body: 'Séparer faits, hypothèses et inconnues avant de conclure.', claimRefs: [], layout: 'QUESTION_SHIFT', readerEffect: 'clarity', assetRequirements: ['Typographie'] },
      { slideNumber: 8, narrativeRole: 'bridge', objective: 'Ouvrir vers LEVOIS sans publicité artificielle.', headline: 'ET DANS VOTRE CAS ?', body: 'Clarifier la question personnelle créée par le contenu.', claimRefs: [], layout: 'FINAL_BRIDGE', readerEffect: 'action', assetRequirements: ['CTA LEVOIS'] },
    ],
    qualityGate: {
      hook: true,
      factuality: true,
      narrative: true,
      mobileDensity: true,
      transferValue: true,
      saveValue: true,
      levoisBridge: true,
    },
  };

  return {
    schemaVersion: STUDIO_SCHEMA_VERSION,
    projectId: idFrom(rawInput),
    status: 'research_required',
    input: { inputType: rawInput.includes('?') ? 'question' : 'idea', rawInput },
    family,
    scope,
    evidencePack,
    angles,
    articleMaster,
    storyboard,
    generatedAt: new Date().toISOString(),
  };
}

export function buildStudioProject(input: string): StudioProject {
  const rawInput = clean(input);
  if (!rawInput) throw new Error('Ajoutez une idée, une question ou une matière de départ.');
  if (isDistanceFixture(rawInput)) return distanceFixture(rawInput);
  if (isSurfaceFixture(rawInput)) return researchRequiredFixture(rawInput, 'espace_usage', 'surface');
  if (isPriceFixture(rawInput)) return researchRequiredFixture(rawInput, 'prix_valeur', 'price');
  return researchRequiredFixture(rawInput, detectFamily(rawInput), 'generic');
}

export const STUDIO_FIXTURES = [
  'Plus loin. De quoi ?',
  '80 m². Où passe la place ?',
  '25 000 € d’écart. Trop chère ?',
] as const;
