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


function surfaceFixture(rawInput: string): StudioProject {
  const family = STUDIO_FAMILIES.espace_usage;

  const scope: EditorialScope = {
    rawTopic: rawInput,
    decisionQuestion:
      'Comment vérifier si les usages importants peuvent réellement fonctionner ensemble dans un logement, au-delà de sa surface totale ?',
    audience: 'Grand public, acheteurs ou personnes qui comparent des logements',
    territory: 'France, avec application locale possible à Chartres et alentours',
    objective:
      'Passer d’une lecture par quantité de mètres carrés à un test concret des usages simultanés.',
    hypothesesToTest: [
      'Une surface totale jugée suffisante confirme que les usages importants fonctionneront.',
      'Le nombre de pièces suffit à décrire leur disponibilité au moment où elles sont nécessaires.',
    ],
    mustNotAssume: [
      'Un logement de 80 m² est grand ou petit en soi.',
      'Deux logements de même surface offrent les mêmes usages.',
      'Le cas pédagogique décrit la fréquence réelle d’un problème.',
    ],
  };

  const evidencePack = summarizeEvidence(
    {
      sources: [
        {
          sourceId: 'S001',
          type: 'official_document',
          publisher: 'INSEE',
          title: 'Surface du logement — définition',
          url: 'https://www.insee.fr/fr/metadonnees/definition/c2078',
          dataPeriod: 'Définition consultée le 18 septembre 2026',
          geographicScope: 'France — définition statistique',
          reliability: 'primary',
        },
      ],
      claims: [
        {
          claimId: 'C001',
          claim:
            'Dans la définition statistique INSEE, la surface du logement correspond à la surface habitable, inclut notamment circulations et sanitaires et exclut notamment terrasses, caves, parkings et greniers.',
          claimType: 'fact',
          geographicScope: 'France — définition statistique INSEE',
          timeScope: 'Définition consultée le 18 septembre 2026',
          sourceRefs: ['S001'],
          evidenceRefs: ['V2-DEF-0029'],
          evidenceStrength: 'strong',
          status: 'verified',
          allowedUses: [
            'Expliquer ce que recouvre la surface dans les statistiques logement.',
            'Distinguer quantité de surface et organisation des usages.',
          ],
          forbiddenInferences: [
            'Cette définition ne décrit pas la qualité d’un plan.',
            'Elle ne démontre pas qu’un usage précis fonctionne dans un logement donné.',
            'Elle ne constitue pas un mesurage Carrez individuel.',
          ],
        },
      ],
      unknowns: [
        {
          unknownId: 'U001',
          question:
            'Comment les usages se répartissent-ils dans un logement précis ?',
          importance: 'high',
          reason:
            'La réponse nécessite le plan, les dimensions, les accès et les besoins réels de la personne.',
          blocking: false,
        },
      ],
    },
    true,
    [
      'Le conflit chambre d’amis / télétravail est un cas fictif pédagogique.',
      'La surface totale ne permet pas à elle seule de conclure sur l’usage d’un bien particulier.',
    ],
  );

  const angles: EditorialAngle[] = [
    {
      angleId: 'A',
      title: 'Deux chambres. Et quand les deux sont occupées ?',
      promise:
        'Montrer un conflit d’usage concret que la simple liste des pièces ne révèle pas.',
      hook:
        'DEUX CHAMBRES. OÙ TRAVAILLEZ-VOUS QUAND LES DEUX SONT OCCUPÉES ?',
      centralProof:
        'La surface décrit une quantité ; le cas pédagogique montre pourquoi l’usage exige une vérification supplémentaire.',
      saveValue:
        'Une opération réutilisable : activités simultanées → plan → conditions de fonctionnement.',
      bridgeQuestion:
        'Quels usages doivent réellement fonctionner ensemble dans votre recherche ?',
      claimRefs: ['C001'],
      selected: true,
    },
    {
      angleId: 'B',
      title: 'Même surface. Deux usages.',
      promise:
        'Passer du total de mètres carrés à la coexistence des usages.',
      hook: 'MÊME SURFACE. VOS DEUX USAGES TIENNENT-ILS ENSEMBLE ?',
      centralProof:
        'La surface ne décrit pas la disponibilité d’une pièce à un moment précis.',
      saveValue:
        'Une question plus utile que « est-ce assez grand ? ».',
      bridgeQuestion:
        'Quelles activités simultanées devez-vous tester ?',
      claimRefs: ['C001'],
    },
    {
      angleId: 'C',
      title: 'La surface ne suffit pas à vérifier l’usage',
      promise:
        'Donner la conclusion tôt puis enseigner le test.',
      hook: 'LA SURFACE SUFFIT-ELLE À VÉRIFIER VOS USAGES ?',
      centralProof:
        'Une mesure de surface n’est pas une description complète de l’organisation.',
      saveValue:
        'Un test simple à appliquer pendant une visite.',
      bridgeQuestion:
        'Quelle contrainte d’usage reste invisible dans votre liste de critères ?',
      claimRefs: ['C001'],
    },
  ];

  const articleMaster: ArticleMaster = {
    workingTitle:
      '80 m² : ce que la surface ne vous dit pas sur l’usage d’un logement',
    centralQuestion:
      'Deux logements de surface proche peuvent-ils répondre différemment aux mêmes usages ?',
    centralThesis:
      'Oui : la surface totale décrit une quantité, mais elle ne suffit pas à confirmer que les usages nécessaires peuvent fonctionner ensemble au même moment.',
    family: family.id,
    sections: [
      {
        sectionId: 'SEC01',
        type: 'question',
        heading: '80 m² répondent à une question de quantité, pas à toutes vos questions d’usage',
        body:
          'Une surface peut sembler suffisante sur une annonce. La décision devient plus précise lorsqu’on demande ce que les pièces doivent permettre au même moment.',
        claimRefs: ['C001'],
      },
      {
        sectionId: 'SEC02',
        type: 'intuition',
        heading: 'Deux chambres : la liste paraît complète',
        body:
          'Si vous voulez une chambre principale, une chambre d’amis et un bureau dans la seconde pièce, la fiche peut sembler répondre exactement au besoin.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC03',
        type: 'proof',
        heading: 'Ce que la surface mesure réellement',
        body:
          'La définition statistique INSEE décrit la surface habitable et ses inclusions ou exclusions. Elle ne décrit ni votre plan d’usage ni la disponibilité d’une pièce à un moment donné.',
        claimRefs: ['C001'],
      },
      {
        sectionId: 'SEC04',
        type: 'mechanism',
        heading: 'Une pièce peut exister et ne pas être disponible au moment où vous en avez besoin',
        body:
          'Le problème apparaît lorsque deux activités indispensables utilisent le même espace au même moment. La quantité totale de mètres carrés ne suffit pas à résoudre cette concurrence.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC05',
        type: 'case',
        heading: 'Cas fictif : la chambre d’amis est occupée à 9 h',
        body:
          'Votre proche dort encore. Vous devez participer à une réunion confidentielle. Le bureau est dans cette chambre. Le conflit vient de la simultanéité des usages, pas d’un verdict général sur la taille du logement.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC06',
        type: 'method',
        heading: 'Listez, placez, vérifiez',
        body:
          'Listez deux activités qui doivent avoir lieu en même temps. Placez-les sur le plan. Vérifiez les accès, le calme, l’intimité et les adaptations réellement possibles.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC07',
        type: 'limits',
        heading: 'Ce test ne classe pas les logements',
        body:
          'Un autre espace peut résoudre le conflit. Le logement peut donc très bien convenir. Le test sert à vérifier une possibilité avant d’en faire une certitude.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC08',
        type: 'application',
        heading: 'À votre prochaine visite, testez deux usages simultanés',
        body:
          'Choisissez les deux activités les plus importantes qui doivent coexister. Placez-les sur le plan avant de décider que le nombre de pièces ou la surface suffisent.',
        claimRefs: [],
      },
    ],
    keyTakeaway:
      'Une pièce disponible sur le plan n’est pas forcément disponible au moment où vous en avez besoin.',
    transferablePrinciple:
      'Pour vérifier un usage, testez les activités qui doivent fonctionner en même temps plutôt que seulement la quantité totale disponible.',
    nextPersonalQuestion:
      'Quels sont les deux usages qui doivent absolument pouvoir fonctionner ensemble dans votre prochain logement ?',
    recommendedLevoisPath: {
      label: 'Mettre ma recherche au clair',
      path: '/',
      routeStatus: 'pending',
      reason:
        'Le CTA ne doit être activé qu’après vérification que le parcours public reprend réellement les usages et arbitrages du lecteur.',
    },
  };

  const storyboard: Storyboard = {
    format: 'instagram_carousel_4x5',
    family: family.id,
    accentColor: family.accent,
    slideCount: 9,
    slides: [
      {
        slideNumber: 1,
        narrativeRole: 'hook',
        objective: 'Faire reconnaître immédiatement un conflit d’usage.',
        headline: 'DEUX CHAMBRES.',
        body:
          'Où travaillez-vous quand les deux sont occupées ?',
        claimRefs: [],
        layout: 'HERO_PHOTO',
        readerEffect: 'stop',
        assetRequirements: [
          'Plan pédagogique, non attribué à un bien réel',
          'Deux usages visibles dans la même pièce',
        ],
      },
      {
        slideNumber: 2,
        narrativeRole: 'tension',
        objective: 'Comprendre la lecture initiale.',
        headline: 'SUR LE PAPIER, TOUT Y EST.',
        body:
          'Deux chambres. Une surface qui paraît suffisante. Un bureau prévu dans la seconde.',
        claimRefs: [],
        layout: 'EDITORIAL_SPLIT',
        readerEffect: 'identification',
        assetRequirements: ['Liste de critères transformée en plan'],
      },
      {
        slideNumber: 3,
        narrativeRole: 'case',
        objective: 'Faire apparaître la friction.',
        headline: '9 H. LA CHAMBRE EST OCCUPÉE.',
        body:
          'CAS FICTIF — Votre proche dort encore. Vous avez une réunion confidentielle. Le bureau est dans sa chambre.',
        claimRefs: [],
        layout: 'CASE_DUAL',
        readerEffect: 'understanding',
        sourceLabel: 'CAS FICTIF',
        assetRequirements: ['Conflit DORMIR / TRAVAILLER'],
      },
      {
        slideNumber: 4,
        narrativeRole: 'proof',
        objective: 'Distinguer mesure et usage.',
        headline: 'LE TOTAL NE RÉPOND PAS À CETTE QUESTION.',
        body:
          'La surface décrit une quantité. Elle ne vous dit pas, à elle seule, si deux usages nécessaires peuvent fonctionner ensemble.',
        claimRefs: ['C001'],
        layout: 'HERO_NUMBER',
        readerEffect: 'credibility',
        sourceLabel: 'INSEE · définition de la surface du logement · V2-DEF-0029',
        assetRequirements: ['80 m² en retrait, plan au premier plan'],
      },
      {
        slideNumber: 5,
        narrativeRole: 'insight',
        objective: 'Changer la question.',
        headline: 'CHANGEZ DE QUESTION.',
        body:
          'Au lieu de « est-ce assez grand ? », demandez : « quels usages doivent fonctionner en même temps ? »',
        claimRefs: [],
        layout: 'QUESTION_SHIFT',
        readerEffect: 'clarity',
        assetRequirements: ['Question initiale remplacée'],
      },
      {
        slideNumber: 6,
        narrativeRole: 'method',
        objective: 'Donner l’opération autonome.',
        headline: 'LISTEZ. PLACEZ. VÉRIFIEZ.',
        body:
          'Deux activités simultanées. Leur place sur le plan. Puis les conditions qui permettent à chacune de fonctionner.',
        claimRefs: [],
        layout: 'METHOD_STEPS',
        readerEffect: 'memorization',
        assetRequirements: ['Trois gestes sur un même plan'],
      },
      {
        slideNumber: 7,
        narrativeRole: 'transfer',
        objective: 'Relire le logement sans verdict automatique.',
        headline: 'LE LOGEMENT PEUT TRÈS BIEN CONVENIR.',
        body:
          'Le test ne cherche pas un défaut. Il vérifie une possibilité avant d’en faire une certitude.',
        claimRefs: [],
        layout: 'EDITORIAL_SPLIT',
        readerEffect: 'understanding',
        assetRequirements: ['Variante résolue ou statut À VÉRIFIER'],
      },
      {
        slideNumber: 8,
        narrativeRole: 'exercise',
        objective: 'Faire appliquer immédiatement.',
        headline: 'TESTEZ LE PROCHAIN PLAN.',
        body:
          'Choisissez deux usages qui doivent coexister. Placez-les. Vérifiez accès, calme, intimité et adaptation possible.',
        claimRefs: [],
        layout: 'DATA_FIELD',
        readerEffect: 'participation',
        assetRequirements: ['Fiche simple réutilisable'],
      },
      {
        slideNumber: 9,
        narrativeRole: 'bridge',
        objective: 'Proposer une suite seulement après la résolution.',
        headline: 'ET DANS VOTRE RECHERCHE ?',
        body:
          'Si plusieurs critères se gênent entre eux, mettez votre recherche au clair avant de comparer les annonces.',
        claimRefs: [],
        layout: 'FINAL_BRIDGE',
        readerEffect: 'action',
        assetRequirements: ['CTA à activer seulement si la destination réelle est vérifiée'],
      },
    ],
    qualityGate: {
      hook: true,
      factuality: true,
      narrative: true,
      mobileDensity: true,
      transferValue: true,
      saveValue: true,
      levoisBridge: true,
      canonPromise: true,
      resolution: true,
      autonomy: true,
      limitsVisible: true,
    },
  };

  return {
    schemaVersion: STUDIO_SCHEMA_VERSION,
    projectId: idFrom(rawInput),
    status: 'storyboard_ready',
    input: {
      inputType: rawInput.includes('?') ? 'question' : 'idea',
      rawInput,
    },
    family,
    scope,
    evidencePack,
    angles,
    canon: {
      canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
      decisionFrame: {
        person:
          'Une personne compare des logements et veut pouvoir télétravailler tout en accueillant ponctuellement un proche.',
        decision:
          'Vérifier si le logement permet réellement aux usages importants de fonctionner ensemble.',
        spontaneousReading:
          'Deux chambres et environ 80 m² semblent suffire sur la fiche.',
        pressureTest:
          'Quand la chambre d’amis est occupée, le bureau installé dans cette même pièce n’est plus disponible au moment de la réunion.',
        authorizedConclusion:
          'La surface totale et le nombre de pièces ne suffisent pas, à eux seuls, à confirmer que les usages nécessaires peuvent fonctionner en même temps.',
        finalOperation:
          'Lister deux activités simultanées, les placer sur le plan et vérifier ce qui permet à chacune de fonctionner.',
      },
      hookCandidates: [
        {
          mode: 'direct',
          family: 'usage',
          text: 'LA SURFACE SUFFIT-ELLE À VÉRIFIER VOS USAGES ?',
          explicitPromise:
            'Montrer pourquoi la surface seule ne permet pas de confirmer un usage.',
          implicitPromise:
            'Donner une manière concrète de tester le logement.',
          evidenceStatus: 'non_numeric',
          qualifier: '',
          claimRefs: ['C001'],
          evidenceRefs: ['V2-DEF-0029'],
        },
        {
          mode: 'scene',
          family: 'usage',
          text:
            'DEUX CHAMBRES. OÙ TRAVAILLEZ-VOUS QUAND LES DEUX SONT OCCUPÉES ?',
          explicitPromise:
            'Montrer un conflit d’usage concret qui n’apparaît pas dans la simple liste des pièces.',
          implicitPromise:
            'Donner un test réutilisable sur un autre plan.',
          evidenceStatus: 'non_numeric',
          qualifier: '',
          claimRefs: [],
          evidenceRefs: [],
        },
        {
          mode: 'comparison',
          family: 'comparison',
          text: 'MÊME SURFACE. VOS DEUX USAGES TIENNENT-ILS ENSEMBLE ?',
          explicitPromise:
            'Comparer quantité de mètres carrés et fonctionnement réel.',
          implicitPromise:
            'Montrer ce qu’il faut regarder au-delà du total.',
          evidenceStatus: 'non_numeric',
          qualifier: '',
          claimRefs: ['C001'],
          evidenceRefs: ['V2-DEF-0029'],
        },
      ],
      selectedHookMode: 'scene',
      storyBeats: [
        {
          function: 'situation',
          before:
            'Le lecteur sait seulement qu’il compare un logement avec deux chambres.',
          after:
            'Il comprend l’usage recherché : dormir, accueillir et télétravailler.',
          copy:
            'Vous cherchez deux chambres. La seconde doit aussi servir de bureau.',
          claimRefs: [],
        },
        {
          function: 'initial_reading',
          before: 'Les besoins sont encore abstraits.',
          after: 'La fiche paraît répondre à la demande.',
          copy:
            'Sur le papier, tout y est : deux chambres et une surface qui paraît suffisante.',
          claimRefs: [],
        },
        {
          function: 'friction',
          before:
            'Le bureau et la chambre d’amis semblent compatibles.',
          after:
            'Le lecteur voit qu’ils peuvent se gêner au même moment.',
          copy:
            'Cas fictif : votre proche dort encore. À 9 h, vous avez une réunion confidentielle. Le bureau est dans sa chambre.',
          claimRefs: [],
        },
        {
          function: 'demonstration',
          before:
            'Le problème pourrait être interprété comme un simple manque de mètres carrés.',
          after:
            'Le lecteur comprend que le point décisif est la coexistence des usages.',
          copy:
            'La question n’est plus seulement « combien de m² ? ». Elle devient « quels usages doivent fonctionner en même temps, et où ? »',
          claimRefs: ['C001'],
        },
        {
          function: 'rereading',
          before:
            'Le logement semble validé ou rejeté par sa surface.',
          after:
            'La surface redevient un contexte, pas un verdict.',
          copy:
            'Le logement peut très bien convenir. Mais la surface totale ne suffit pas à le confirmer : il faut tester l’organisation.',
          claimRefs: [],
        },
        {
          function: 'practical_take',
          before:
            'Le lecteur comprend le mécanisme sans encore savoir l’appliquer.',
          after:
            'Il possède une opération autonome à refaire sur un plan.',
          copy:
            'Listez deux activités simultanées. Placez-les sur le plan. Vérifiez ce qui permet à chacune de fonctionner.',
          claimRefs: [],
        },
      ],
      essentialLimit:
        'Le conflit présenté est un cas fictif pédagogique. Il montre une possibilité à tester, pas la fréquence de ce problème ni la qualité d’un logement particulier.',
      autonomousAction:
        'Sur le prochain plan, choisissez deux activités qui doivent coexister, placez-les dans les pièces prévues et vérifiez les accès, le calme, l’intimité et les adaptations réellement possibles.',
    },
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
  if (isSurfaceFixture(rawInput)) return surfaceFixture(rawInput);
  if (isPriceFixture(rawInput)) return researchRequiredFixture(rawInput, 'prix_valeur', 'price');
  return researchRequiredFixture(rawInput, detectFamily(rawInput), 'generic');
}

export const STUDIO_FIXTURES = [
  'Plus loin. De quoi ?',
  '80 m². Où passe la place ?',
  '25 000 € d’écart. Trop chère ?',
] as const;
