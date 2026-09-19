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
  const family = STUDIO_FAMILIES.lieu_mobilite;

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
          title: 'Dossier complet — Bassin de vie 2022 de Chartres',
          url: 'https://www.insee.fr/fr/statistiques/2011101?geo=BV2022-28085',
          dataPeriod: '2023',
          geographicScope: 'Bassin de vie 2022 de Chartres',
          reliability: 'primary',
        },
      ],
      claims: [
        {
          claimId: 'C007',
          claim: 'En 2023, 73,7 % des actifs de 15 ans ou plus ayant un emploi et résidant dans le Bassin de vie 2022 de Chartres travaillaient dans une commune autre que leur commune de résidence.',
          claimType: 'fact',
          value: 73.7,
          unit: '%',
          population: 'Actifs de 15 ans ou plus ayant un emploi et résidant dans la zone',
          geographicScope: 'Bassin de vie 2022 de Chartres',
          timeScope: '2023',
          sourceRefs: ['S001'],
          evidenceRefs: ['INSEE-f36f351aab7a2171'],
          evidenceUseClass: 'HISTORICAL_ONLY',
          publicationReadiness: 'historical_only',
          verificationRequiredBeforePublication: false,
          evidenceStrength: 'strong',
          status: 'verified',
          allowedUses: ['Décrire en 2023 la part des actifs résidents du Bassin de vie 2022 de Chartres qui travaillent dans une autre commune que leur commune de résidence.'],
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
      centralProof: 'En 2023, 73,7 % des actifs résidents ayant un emploi du Bassin de vie 2022 de Chartres travaillent hors de leur commune de résidence.',
      claimRefs: ['C007'],
      saveValue: 'Une méthode en trois opérations : destinations, fréquence, moment contraint.',
      bridgeQuestion: 'Jusqu’où pouvez-vous réellement vous éloigner compte tenu de votre quotidien ?',
      selected: true,
    },
    {
      angleId: 'B',
      title: 'Votre rayon de recherche vous trompe peut-être',
      promise: 'Montrer pourquoi un cercle autour de Chartres simplifie trop une vie réelle.',
      hook: 'UN CERCLE AUTOUR DE CHARTRES ?',
      centralProof: 'Une adresse n’a de sens qu’en relation avec les destinations réellement fréquentées.',
      saveValue: 'Remplacer le rayon par une carte de contraintes personnelles.',
      bridgeQuestion: 'À quoi ressemblerait votre vraie zone de recherche ?',
    },
    {
      angleId: 'C',
      title: 'Une petite contrainte répétée pèse lourd',
      promise: 'Comparer fréquence et intensité au lieu de juger un trajet isolé.',
      hook: 'UNE PETITE CONTRAINTE. TOUS LES JOURS.',
      centralProof: 'Le cas pédagogique permet de distinguer contrainte répétée et contrainte occasionnelle.',
      saveValue: 'Une règle mentale réutilisable bien au-delà de l’immobilier.',
      bridgeQuestion: 'Quelles contraintes se répètent vraiment dans votre semaine ?',
    },
  ];

  const canon = {
    canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19' as const,
    decisionFrame: {
      person:
        'Une personne compare un logement intéressant mais plus éloigné et doit décider si ce compromis reste acceptable dans son quotidien.',
      decision:
        'Vérifier ce que l’éloignement change réellement avant de l’accepter ou de le rejeter.',
      spontaneousReading:
        'Un logement un peu plus loin paraît être un compromis simple à juger avec une distance ou un temps moyen.',
      pressureTest:
        'Les destinations n’ont ni la même fréquence ni le même niveau de contrainte ; quelques minutes peuvent être faciles à absorber ou franchir une marge horaire.',
      authorizedConclusion:
        'La distance seule ne suffit pas à déterminer si l’éloignement d’un logement est un compromis acceptable ; il faut examiner ce que cette adresse change dans les destinations, fréquences et moments contraints du quotidien.',
      finalOperation:
        'Lister les destinations importantes, leur fréquence et le moment le plus contraint avant de juger la localisation.',
    },
    hookCandidates: [
      {
        mode: 'direct' as const,
        family: 'comparison' as const,
        text: 'PLUS LOIN. DE QUOI ?',
        explicitPromise:
          'Montrer pourquoi la distance seule ne suffit pas à juger une localisation.',
        implicitPromise:
          'Le lecteur repartira avec une méthode pour tester ce que l’adresse change réellement.',
        evidenceStatus: 'non_numeric' as const,
        qualifier: '',
        claimRefs: ['C007'],
        evidenceRefs: ['INSEE-f36f351aab7a2171'],
      },
      {
        mode: 'scene' as const,
        family: 'situation' as const,
        text: 'LE LOGEMENT VOUS PLAÎT. QU’EST-CE QUI CHANGE DANS VOTRE SEMAINE ?',
        explicitPromise:
          'Replacer l’éloignement dans une organisation concrète.',
        implicitPromise:
          'Le lecteur saura identifier le moment qui mérite réellement d’être testé.',
        evidenceStatus: 'non_numeric' as const,
        qualifier: '',
        claimRefs: [],
        evidenceRefs: [],
      },
      {
        mode: 'comparison' as const,
        family: 'comparison' as const,
        text: 'MÊME DISTANCE. MÊME CONTRAINTE ?',
        explicitPromise:
          'Montrer que la même distance peut produire des effets différents selon les usages.',
        implicitPromise:
          'La comparaison reviendra à une méthode concrète plutôt qu’à un verdict général.',
        evidenceStatus: 'non_numeric' as const,
        qualifier: '',
        claimRefs: [],
        evidenceRefs: [],
      },
    ],
    selectedHookMode: 'direct' as const,
    storyBeats: [
      {
        function: 'situation' as const,
        before:
          'Le lecteur sait seulement qu’un logement est plus éloigné.',
        after:
          'Il comprend qu’il doit juger cet éloignement dans une décision réelle.',
        copy:
          'Le logement vous intéresse. Il est plus loin. Reste à savoir ce que cela change pour vous.',
        claimRefs: [],
      },
      {
        function: 'initial_reading' as const,
        before:
          'La distance paraît être la mesure principale.',
        after:
          'Le lecteur voit que cette mesure ne décrit pas encore son organisation.',
        copy:
          'Un rayon ou un nombre de kilomètres aide à chercher, mais ne décrit pas votre semaine.',
        claimRefs: [],
      },
      {
        function: 'friction' as const,
        before:
          'Tous les déplacements semblent avoir le même poids.',
        after:
          'Le lecteur distingue fréquence et moment contraint.',
        copy:
          'Travail, école, gare, proches et activités ne reviennent ni aussi souvent ni avec la même marge.',
        claimRefs: [],
      },
      {
        function: 'demonstration' as const,
        before:
          'Le changement de commune pourrait être confondu avec un trajet long.',
        after:
          'La donnée locale est replacée dans son périmètre exact.',
        copy:
          'En 2023, 73,7 % des actifs résidents ayant un emploi du Bassin de vie 2022 de Chartres travaillaient dans une autre commune ; cela ne donne pas leur durée de trajet.',
        claimRefs: ['C007'],
      },
      {
        function: 'rereading' as const,
        before:
          'Le logement paraît simplement proche ou loin.',
        after:
          'La décision revient à ce que l’adresse change dans l’organisation.',
        copy:
          'Le logement peut très bien convenir. La question devient : quelle organisation cette adresse vous demande-t-elle ?',
        claimRefs: [],
      },
      {
        function: 'practical_take' as const,
        before:
          'Le lecteur comprend l’idée mais ne sait pas encore la tester.',
        after:
          'Il possède une opération autonome.',
        copy:
          'Listez vos destinations importantes, leur fréquence, puis testez le moment le plus contraint.',
        claimRefs: [],
      },
    ],
    essentialLimit:
      'La donnée INSEE est historique et décrit un changement de commune, pas la distance, la durée, le coût ou la difficulté des trajets. Toute application personnelle exige des mesures propres au projet.',
    autonomousAction:
      'Prenez les trois destinations qui structurent le plus votre semaine, notez leur fréquence et testez depuis le logement le moment où votre marge est la plus faible.',
  };

  const articleMaster: ArticleMaster = {
    workingTitle: 'Plus loin. De quoi ?',
    centralQuestion: 'Comment savoir si un logement est réellement trop éloigné de votre quotidien ?',
    centralThesis: 'La distance seule ne suffit pas à déterminer si l’éloignement d’un logement est un compromis acceptable ; il faut examiner ce que cette adresse change dans les destinations, fréquences et moments contraints du quotidien.',
    family: family.id,
    sections: [
      { sectionId: 'SEC01', type: 'question', heading: '“Plus loin” n’est pas encore une mesure utile', body: 'Dire qu’un logement est plus loin ne dit pas ce qui devient réellement plus difficile. Il faut d’abord identifier les lieux auxquels la semaine vous relie.', claimRefs: [] },
      { sectionId: 'SEC02', type: 'intuition', heading: 'L’intuition du rayon', body: 'On dessine souvent un cercle autour d’une ville. Cette simplification est pratique pour chercher, mais elle ne représente pas forcément les contraintes d’une personne.', claimRefs: [] },
      { sectionId: 'SEC03', type: 'proof', heading: 'Un territoire déjà intercommunal', body: 'Dans le Bassin de vie 2022 de Chartres, 73,7 % des actifs de 15 ans ou plus ayant un emploi travaillent dans une autre commune que leur commune de résidence en 2023. Cette donnée décrit un changement de commune, pas la durée, le coût ni la difficulté du trajet.', claimRefs: ['C007'] },
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
      { slideNumber: 3, narrativeRole: 'proof', objective: 'Ancrer le sujet dans une donnée locale réelle.', headline: '73,7 %', body: 'des actifs occupés du bassin de vie de Chartres travaillent dans une autre commune que celle où ils habitent.', claimRefs: ['C007'], layout: 'HERO_NUMBER', readerEffect: 'credibility', sourceLabel: 'INSEE · 2023 · Bassin de vie 2022 de Chartres', assetRequirements: ['Flux territoriaux stylisés'] },
      { slideNumber: 4, narrativeRole: 'explanation', objective: 'Faire comprendre la notion de réseau.', headline: 'VOTRE ADRESSE N’EST QU’UN POINT.', body: 'Travail. École. Gare. Proches. Courses. Activités. Votre quotidien est un réseau.', claimRefs: [], layout: 'MAP_NETWORK', readerEffect: 'understanding', assetRequirements: ['Carte réseau schématique'] },
      { slideNumber: 5, narrativeRole: 'case', objective: 'Montrer que la même adresse produit des décisions différentes.', headline: 'MÊME MAISON. DEUX DÉCISIONS RATIONNELLES.', body: 'Cas pédagogique : les contraintes changent, pas le logement.', claimRefs: [], layout: 'CASE_DUAL', readerEffect: 'identification', sourceLabel: 'CAS PÉDAGOGIQUE', assetRequirements: ['Maison réelle ou illustration non documentaire', 'Deux profils sans portrait humain nécessaire'] },
      { slideNumber: 6, narrativeRole: 'method', objective: 'Donner une méthode mémorisable.', headline: 'NE MESUREZ PAS D’ABORD LES KILOMÈTRES.', body: '1 — Listez les destinations. 2 — Comptez la fréquence. 3 — Testez le moment le plus contraint.', claimRefs: [], layout: 'METHOD_STEPS', readerEffect: 'clarity', assetRequirements: ['Pictogrammes simples ou typographie pure'] },
      { slideNumber: 7, narrativeRole: 'insight', objective: 'Créer une règle mentale sauvegardable.', headline: 'CE N’EST PAS LE MÊME POIDS.', body: '25 min une fois par mois ≠ +10 min deux fois par jour. Une contrainte répétée peut peser davantage.', claimRefs: [], layout: 'COMPARISON_DUAL', readerEffect: 'memorization', sourceLabel: 'CAS PÉDAGOGIQUE', assetRequirements: ['Composition typographique comparative'] },
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
    canon,
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
      'La surface totale et le nombre de pièces ne suffisent pas, à eux seuls, à confirmer que les usages nécessaires peuvent fonctionner en même temps.',
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

function priceFixture(rawInput: string): StudioProject {
  const family = STUDIO_FAMILIES.prix_valeur;

  const scope: EditorialScope = {
    rawTopic: rawInput,
    decisionQuestion:
      'Un écart de prix suffit-il à conclure qu’un bien est trop cher ?',
    audience:
      'Grand public, acheteurs, vendeurs ou personnes qui comparent plusieurs prix immobiliers',
    territory:
      'France ; contexte local uniquement lorsqu’il apporte une comparaison réellement documentée',
    objective:
      'Apprendre à vérifier la comparabilité de deux montants avant d’interpréter leur écart.',
    hypothesesToTest: [
      'Un écart arithmétique suffit à établir qu’un prix est excessif.',
      'Une valeur DVF correspond toujours au prix d’un seul logement.',
      'Un prix au m² médian peut être appliqué mécaniquement à un bien particulier.',
    ],
    mustNotAssume: [
      'Les montants pédagogiques 285 000 €, 310 000 € et +25 000 € décrivent une vente réelle.',
      'Deux biens situés dans la même commune sont automatiquement comparables.',
      'Un comparable constitue une estimation individuelle.',
    ],
  };

  const evidencePack = summarizeEvidence(
    {
      sources: [
        {
          sourceId: 'S001',
          type: 'official_dataset',
          publisher: 'DGFiP',
          title: 'Demandes de valeurs foncières — DVF',
          url: 'https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres',
          dataPeriod: 'méthodologie / définition de la source',
          geographicScope: 'France',
          reliability: 'primary',
        },
        {
          sourceId: 'S002',
          type: 'other',
          publisher: 'LEVOIS',
          title: 'Conventions méthodologiques V2.1 — prix au m²',
          dataPeriod: 'V2.1 · 2026-09-19',
          geographicScope: 'Méthode générale',
          reliability: 'context',
          notes:
            'Méthode interne traçable : METH-0022. Ne remplace pas une source primaire lorsque le contenu porte sur un champ DVF.',
        },
      ],
      claims: [
        {
          claimId: 'C001',
          claim:
            'Le prix affiché est une intention d’offre ; le prix vendu est la valeur enregistrée de la mutation, sous les limites de la source.',
          claimType: 'fact',
          geographicScope: 'Méthode générale',
          timeScope: 'statique / relu 2026-09-19',
          sourceRefs: ['S001'],
          evidenceRefs: ['METH-0021'],
          evidenceUseClass: 'REUSABLE_IMMEDIATELY',
          publicationReadiness: 'direct',
          verificationRequiredBeforePublication: false,
          evidenceStrength: 'strong',
          status: 'verified',
          allowedUses: [
            'Séparer annonces et mutations lors d’une analyse de marché.',
          ],
          forbiddenInferences: [
            'Un prix affiché ne prouve pas qu’un acheteur paiera ce montant.',
            'DVF ne restitue pas toutes les caractéristiques qualitatives.',
          ],
        },
        {
          claimId: 'C002',
          claim:
            'La valeur foncière DVF est le montant de la mutation enregistré ; elle se rapporte à la disposition et peut couvrir plusieurs locaux ou parcelles.',
          claimType: 'fact',
          geographicScope: 'France · source DVF',
          timeScope: 'static/current',
          sourceRefs: ['S001'],
          evidenceRefs: ['DEF-0001'],
          evidenceUseClass: 'REUSABLE_IMMEDIATELY',
          publicationReadiness: 'direct',
          verificationRequiredBeforePublication: false,
          evidenceStrength: 'strong',
          status: 'verified',
          allowedUses: [
            'Préserver le périmètre exact de la valeur foncière avant vulgarisation.',
          ],
          forbiddenInferences: [
            'Ne pas assimiler automatiquement une mutation complexe au prix d’un seul logement.',
          ],
        },
        {
          claimId: 'C003',
          claim:
            'Une mutation est un changement de propriété enregistré ; une mutation DVF peut comporter plusieurs lignes descriptives.',
          claimType: 'fact',
          geographicScope: 'France · source DVF',
          timeScope: 'static/current',
          sourceRefs: ['S001'],
          evidenceRefs: ['DEF-0002'],
          evidenceUseClass: 'REUSABLE_IMMEDIATELY',
          publicationReadiness: 'direct',
          verificationRequiredBeforePublication: false,
          evidenceStrength: 'strong',
          status: 'verified',
          allowedUses: [
            'Expliquer pourquoi plusieurs lignes peuvent appartenir à une seule mutation.',
          ],
          forbiddenInferences: [
            'Une ligne DVF isolée ne doit pas être interprétée sans vérifier la structure de la mutation.',
          ],
        },
        {
          claimId: 'C004',
          claim:
            'Le prix au m² est un rapport entre une valeur de mutation et une surface définie ; sa pertinence dépend du périmètre de la valeur et de la surface.',
          claimType: 'fact',
          geographicScope: 'Méthode générale',
          timeScope: 'V2.1',
          sourceRefs: ['S002'],
          evidenceRefs: ['METH-0022'],
          evidenceUseClass: 'REUSABLE_IMMEDIATELY',
          publicationReadiness: 'direct',
          verificationRequiredBeforePublication: false,
          evidenceStrength: 'medium',
          status: 'verified',
          allowedUses: [
            'Comparer des ventes simples de type et surface similaires en affichant effectif et dispersion lorsque ces données existent.',
          ],
          forbiddenInferences: [
            'Ne pas multiplier mécaniquement un prix au m² médian par la surface d’un bien pour produire une estimation.',
          ],
        },
      ],
      unknowns: [
        {
          unknownId: 'U001',
          question:
            'Quelles caractéristiques matérielles des deux biens sont réellement connues dans une comparaison donnée ?',
          importance: 'medium',
          reason:
            'La méthode peut être expliquée sans connaître un bien particulier, mais une conclusion de prix individuelle exige le dossier réel.',
          blocking: false,
        },
      ],
    },
    true,
    [
      'Les montants 285 000 €, 310 000 € et +25 000 € sont un CAS PÉDAGOGIQUE.',
      'Une valeur DVF peut couvrir plusieurs locaux ou parcelles.',
      'Un comparable et un prix au m² ne constituent pas, à eux seuls, une estimation individuelle.',
    ],
  );

  const angles: EditorialAngle[] = [
    {
      angleId: 'A',
      title: '25 000 € d’écart. Trop chère ?',
      promise:
        'Montrer qu’un écart exact n’est interprétable qu’après contrôle de comparabilité.',
      hook: '25 000 € D’ÉCART. TROP CHÈRE ?',
      centralProof:
        'Le statut et le périmètre d’un prix doivent être établis avant d’interpréter un écart.',
      claimRefs: ['C001', 'C002', 'C003'],
      saveValue:
        'Un ordre de contrôle : objet → statut → périmètre → période → surface → différences → inconnues → écart.',
      bridgeQuestion:
        'Qu’est-ce qui est réellement comparable entre les deux prix que vous regardez ?',
      selected: true,
    },
    {
      angleId: 'B',
      title: 'Deux prix. Même chose ?',
      promise:
        'Faire distinguer prix affiché, prix vendu et valeur de mutation.',
      hook: 'DEUX PRIX. MÊME STATUT ?',
      centralProof:
        'Prix affiché et prix vendu ne décrivent pas le même événement.',
      claimRefs: ['C001'],
      saveValue:
        'Une manière simple de nommer chaque montant avant de le comparer.',
      bridgeQuestion:
        'Quels sont les statuts exacts des montants que vous comparez ?',
    },
    {
      angleId: 'C',
      title: 'Le prix au m² simplifie-t-il trop ?',
      promise:
        'Montrer que le rapport dépend du périmètre de la valeur et de la surface.',
      hook: 'UN PRIX AU M² N’EST PAS ENCORE UNE ESTIMATION.',
      centralProof:
        'Le calcul dépend des concepts utilisés au numérateur et au dénominateur.',
      claimRefs: ['C002', 'C003', 'C004'],
      saveValue:
        'Un garde-fou avant d’appliquer une médiane à un bien.',
      bridgeQuestion:
        'Le prix au m² que vous utilisez décrit-il réellement le même type de mutation et la même notion de surface ?',
    },
  ];

  const canon = {
    canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
    decisionFrame: {
      person:
        'Une personne envisage un prix et le compare à une vente enregistrée qui semble moins chère.',
      decision:
        'Vérifier si l’écart de prix porte sur des biens et des périmètres réellement comparables avant d’en tirer une conclusion.',
      spontaneousReading:
        'Un prix envisagé 25 000 € au-dessus d’une vente enregistrée paraît indiquer que le bien est trop cher.',
      pressureTest:
        'L’écart ne devient interprétable qu’après vérification du statut, du périmètre, de la période, des surfaces et des différences matérielles connues.',
      authorizedConclusion:
        'Un écart de prix, même exact, ne suffit pas à conclure qu’un bien est trop cher si les objets comparés ne sont pas réellement comparables.',
      finalOperation:
        'Nommer ce qui est comparé, vérifier le même périmètre et les différences matérielles, puis seulement examiner ce que l’écart de prix permet de dire.',
    },
    hookCandidates: [
      {
        mode: 'direct' as const,
        family: 'comparison' as const,
        text: '25 000 € D’ÉCART. TROP CHÈRE ?',
        explicitPromise:
          'Tester ce que l’écart permet réellement de conclure.',
        implicitPromise:
          'Le lecteur apprendra à vérifier la comparabilité avant de juger le prix.',
        evidenceStatus: 'pedagogical_scenario' as const,
        qualifier: 'CAS PÉDAGOGIQUE',
        claimRefs: [],
        evidenceRefs: [],
      },
      {
        mode: 'scene' as const,
        family: 'scope' as const,
        text:
          'UNE VENTE À 285 000 €. VOTRE PRIX À 310 000 €. COMPARE-T-ON LA MÊME CHOSE ?',
        explicitPromise:
          'Faire apparaître la question de périmètre derrière les deux montants.',
        implicitPromise:
          'Le contenu détaillera les conditions nécessaires à une comparaison utile.',
        evidenceStatus: 'pedagogical_scenario' as const,
        qualifier: 'CAS PÉDAGOGIQUE',
        claimRefs: [],
        evidenceRefs: [],
      },
      {
        mode: 'comparison' as const,
        family: 'scope' as const,
        text: 'DEUX PRIX. AVANT L’ÉCART, VÉRIFIEZ LE PÉRIMÈTRE.',
        explicitPromise:
          'Montrer que le calcul d’écart vient après la vérification de comparabilité.',
        implicitPromise:
          'Le lecteur repartira avec un ordre de contrôle réutilisable.',
        evidenceStatus: 'non_numeric' as const,
        qualifier: '',
        claimRefs: ['C001', 'C002', 'C003'],
        evidenceRefs: ['METH-0021', 'DEF-0001', 'DEF-0002'],
      },
    ],
    selectedHookMode: 'direct' as const,
    storyBeats: [
      {
        function: 'situation' as const,
        before: 'Le lecteur voit un prix envisagé.',
        after: 'Il le met face à une vente qui paraît comparable.',
        copy:
          'CAS PÉDAGOGIQUE — Vente enregistrée : 285 000 €. Prix envisagé : 310 000 €.',
        claimRefs: [],
      },
      {
        function: 'initial_reading' as const,
        before: 'Les deux nombres sont isolés.',
        after: 'L’écart paraît fournir une conclusion immédiate.',
        copy:
          '+25 000 €. La première lecture est simple : « trop chère ? » — CAS PÉDAGOGIQUE.',
        claimRefs: [],
      },
      {
        function: 'friction' as const,
        before: 'Le calcul semble suffire.',
        after:
          'Le lecteur voit que le statut et le périmètre ne sont pas encore établis.',
        copy:
          'Un prix affiché, une valeur de mutation et un prix envisagé ne doivent pas être traités comme des mesures interchangeables.',
        claimRefs: ['C001', 'C002'],
      },
      {
        function: 'demonstration' as const,
        before: 'L’écart est traité comme une preuve.',
        after:
          'Il devient un résultat conditionnel après contrôle de ce que les deux montants couvrent.',
        copy:
          'Le calcul peut être exact alors que la comparaison reste mal posée.',
        claimRefs: ['C002', 'C003', 'C004'],
      },
      {
        function: 'rereading' as const,
        before: 'Le prix envisagé semble automatiquement excessif.',
        after: 'La conclusion devient suspendue à la comparabilité.',
        copy:
          'La bonne question devient : quelles différences sont documentées, et lesquelles restent inconnues ?',
        claimRefs: [],
      },
      {
        function: 'practical_take' as const,
        before: 'Le lecteur comprend la limite.',
        after: 'Il sait contrôler une comparaison.',
        copy:
          'Objet → statut → périmètre → période → surface → différences → inconnues → écart.',
        claimRefs: ['C001', 'C002', 'C003', 'C004'],
      },
    ],
    essentialLimit:
      'Le prix au m² ou une vente voisine ne constituent pas, à eux seuls, une estimation individuelle. Les montants 285 000 €, 310 000 € et +25 000 € sont pédagogiques dans ce dossier.',
    autonomousAction:
      'Avant de conclure à partir d’un écart, écrivez les deux objets comparés, leur statut, leur date, leur surface, leur type, leur périmètre, les différences matérielles connues et les inconnues.',
  };

  const articleMaster: ArticleMaster = {
    workingTitle:
      '25 000 € d’écart : pourquoi deux prix ne sont pas forcément comparables',
    centralQuestion:
      'Un écart de prix suffit-il à conclure qu’un bien est trop cher ?',
    centralThesis:
      'Un écart de prix, même exact, ne suffit pas à conclure qu’un bien est trop cher si les objets comparés ne sont pas réellement comparables.',
    family: family.id,
    sections: [
      {
        sectionId: 'SEC01',
        type: 'question',
        heading: 'Le calcul est exact. La conclusion ne l’est pas encore.',
        body:
          'CAS PÉDAGOGIQUE : 285 000 € contre 310 000 € donnent bien 25 000 € d’écart. Cette soustraction ne dit pas encore si les deux objets sont comparables.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC02',
        type: 'intuition',
        heading: 'Commencez par nommer le statut de chaque prix',
        body:
          'Un prix affiché est une intention d’offre ; un prix vendu correspond à la valeur enregistrée de la mutation, sous les limites de la source.',
        claimRefs: ['C001'],
      },
      {
        sectionId: 'SEC03',
        type: 'proof',
        heading: 'Une valeur DVF peut couvrir plus qu’un seul logement',
        body:
          'La valeur foncière se rapporte à la mutation, qui peut couvrir plusieurs locaux ou parcelles et comporter plusieurs lignes descriptives.',
        claimRefs: ['C002', 'C003'],
      },
      {
        sectionId: 'SEC04',
        type: 'mechanism',
        heading: 'La comparabilité vient avant l’écart',
        body:
          'Avant d’interpréter la différence, vérifiez type, périmètre, période, notion de surface, différences matérielles connues et inconnues.',
        claimRefs: ['C001', 'C002', 'C003'],
      },
      {
        sectionId: 'SEC05',
        type: 'case',
        heading: 'CAS PÉDAGOGIQUE : 285 000 € / 310 000 €',
        body:
          'Le calcul de +25 000 € est volontairement fictif. Il sert uniquement à montrer qu’un écart ne prend du sens qu’après contrôle de comparabilité.',
        claimRefs: [],
      },
      {
        sectionId: 'SEC06',
        type: 'method',
        heading: 'Comparez dans cet ordre',
        body:
          'Objet → statut → périmètre → période → surface → différences → inconnues → écart.',
        claimRefs: ['C001', 'C002', 'C003', 'C004'],
      },
      {
        sectionId: 'SEC07',
        type: 'limits',
        heading: 'Un comparable n’est pas une estimation',
        body:
          'Un prix au m² ou une vente voisine aide à raisonner mais ne remplace pas l’examen du bien ; DVF ne restitue pas toutes les différences qualitatives.',
        claimRefs: ['C001', 'C004'],
      },
      {
        sectionId: 'SEC08',
        type: 'application',
        heading: 'Prenez deux prix et écrivez d’abord ce qui est comparable',
        body:
          'Avant de calculer l’écart, notez le statut, la date, le périmètre, la surface, les différences connues et les inconnues.',
        claimRefs: [],
      },
    ],
    keyTakeaway:
      'L’écart vient après la comparabilité, pas avant.',
    transferablePrinciple:
      'Un résultat arithmétique n’est interprétable que si les objets comparés sont suffisamment définis et comparables.',
    nextPersonalQuestion:
      'Qu’est-ce qui est réellement comparable entre les deux prix que vous regardez ?',
    recommendedLevoisPath: {
      label: 'Comparer mes scénarios',
      path: '/',
      routeStatus: 'pending',
      reason:
        'La destination publique doit être recettée avant activation ; la méthode autonome reste complète sans CTA.',
    },
  };

  const storyboard: Storyboard = {
    format: 'instagram_carousel_4x5',
    family: family.id,
    accentColor: family.accent,
    slideCount: 8,
    slides: [
      {
        slideNumber: 1,
        narrativeRole: 'hook',
        objective:
          'Faire apparaître l’écart sans le transformer en verdict.',
        headline: '25 000 € D’ÉCART.',
        body: 'Trop chère ?',
        claimRefs: [],
        layout: 'HERO_NUMBER',
        readerEffect: 'stop',
        sourceLabel: 'CAS PÉDAGOGIQUE',
        assetRequirements: [
          'CAS PÉDAGOGIQUE chiffré 285 000 € / 310 000 € / +25 000 €',
        ],
      },
      {
        slideNumber: 2,
        narrativeRole: 'tension',
        objective:
          'Montrer que le calcul est simple mais que son interprétation ne l’est pas encore.',
        headline: '285 000 € / 310 000 €',
        body: '+25 000 €. Le calcul est simple.',
        claimRefs: [],
        layout: 'COMPARISON_DUAL',
        readerEffect: 'curiosity',
        sourceLabel: 'CAS PÉDAGOGIQUE',
        assetRequirements: [
          'Comparaison typographique des deux montants fictifs',
        ],
      },
      {
        slideNumber: 3,
        narrativeRole: 'explanation',
        objective:
          'Faire vérifier ce que les montants désignent réellement.',
        headline: 'MAIS COMPARE-T-ON LA MÊME CHOSE ?',
        body:
          'Statut. Type. Surface. État. Période. Micro-localisation. Terrain. Travaux.',
        claimRefs: ['C001', 'C002', 'C003'],
        layout: 'EDITORIAL_SPLIT',
        readerEffect: 'understanding',
        sourceLabel:
          'CAS PÉDAGOGIQUE pour les montants · DGFiP / DVF pour les définitions',
        assetRequirements: [
          'Document DVF réel ou schéma programmatique des périmètres',
        ],
      },
      {
        slideNumber: 4,
        narrativeRole: 'proof',
        objective:
          'Montrer que la structure d’une mutation compte.',
        headline: 'L’ÉCART EST UN RÉSULTAT.',
        body:
          'Son sens dépend de ce que les deux montants couvrent réellement.',
        claimRefs: ['C001', 'C002', 'C003'],
        layout: 'DATA_FIELD',
        readerEffect: 'credibility',
        sourceLabel: 'DGFiP · DVF · METH-0021 / DEF-0001 / DEF-0002',
        assetRequirements: [
          'Schéma programmatique valeur de mutation → locaux / parcelles',
        ],
      },
      {
        slideNumber: 5,
        narrativeRole: 'insight',
        objective: 'Déplacer la question avant le verdict.',
        headline: 'CHANGEZ DE QUESTION.',
        body:
          'Quelles différences peuvent raisonnablement expliquer l’écart ?',
        claimRefs: [],
        layout: 'QUESTION_SHIFT',
        readerEffect: 'surprise',
        assetRequirements: [
          'Question initiale barrée puis question de comparabilité',
        ],
      },
      {
        slideNumber: 6,
        narrativeRole: 'method',
        objective:
          'Donner un ordre de contrôle réutilisable.',
        headline: 'COMPAREZ DANS CET ORDRE.',
        body:
          'Objet → statut → périmètre → période → surface → différences → inconnues → écart.',
        claimRefs: ['C001', 'C002', 'C003', 'C004'],
        layout: 'METHOD_STEPS',
        readerEffect: 'memorization',
        sourceLabel: 'DGFiP / LEVOIS · méthode V2.1',
        assetRequirements: [
          'Séquence typographique programmatique de contrôle',
        ],
      },
      {
        slideNumber: 7,
        narrativeRole: 'transfer',
        objective:
          'Fermer l’inférence abusive vers une estimation individuelle.',
        headline: 'UN COMPARABLE N’EST PAS UNE ESTIMATION.',
        body:
          'Il aide à raisonner. Il ne remplace pas l’examen du bien.',
        claimRefs: ['C004'],
        layout: 'EDITORIAL_SPLIT',
        readerEffect: 'clarity',
        sourceLabel: 'LEVOIS · METH-0022',
        assetRequirements: [
          'Objet graphique comparatif non attribué à un bien réel',
        ],
      },
      {
        slideNumber: 8,
        narrativeRole: 'exercise',
        objective:
          'Terminer sur une opération autonome.',
        headline: 'PRENEZ DEUX PRIX.',
        body:
          'Écrivez d’abord ce qui est réellement comparable. Ensuite seulement, jugez l’écart.',
        claimRefs: [],
        layout: 'DATA_FIELD',
        readerEffect: 'participation',
        assetRequirements: [
          'Fiche de comparaison programmatique réutilisable',
        ],
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
      inputType:
        rawInput.includes('?') ? 'question' : 'idea',
      rawInput,
    },
    family,
    scope,
    evidencePack,
    angles,
    canon,
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
  if (isPriceFixture(rawInput)) return priceFixture(rawInput);
  return researchRequiredFixture(rawInput, detectFamily(rawInput), 'generic');
}

export const STUDIO_FIXTURES = [
  'Plus loin. De quoi ?',
  '80 m². Où passe la place ?',
  '25 000 € d’écart. Trop chère ?',
] as const;
