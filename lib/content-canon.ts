export const LEVOIS_CANON_VERSION = 'CONTENT_EXPERIENCE_V1_2026-09-19' as const;

export const LEVOIS_CORE_MISSION =
  'Réduire l’incertitude pour permettre des décisions immobilières comprises et assumées.' as const;

export const LEVOIS_CANONIC_RULES = [
  'Partir d’une décision identifiable, située dans un moment concret.',
  'Faire comprendre le sujet dès la première unité perceptible.',
  'Employer des mots ordinaires, précis et directement interprétables.',
  'Faire reconnaître une situation avant de présenter une expertise.',
  'Ouvrir une question dont la réponse compte pour cette décision.',
  'Limiter la promesse à ce que la démonstration peut tenir.',
  'Donner une première information utile immédiatement après l’accroche.',
  'Faire progresser la compréhension à chaque étape.',
  'Montrer le mécanisme qui relie l’information à sa conséquence.',
  'Distinguer faits, déclarations, hypothèses, inconnues et cas fictifs.',
  'Fermer la question principale avant de proposer un prolongement commercial.',
  'Transmettre une action utile même si le lecteur ne contacte jamais Mouaad.',
] as const;

export const LEVOIS_ABSOLUTE_VETOS = [
  'Fait fabriqué présenté comme réel.',
  'Peur non justifiée par le dossier.',
  'Résolution remplacée par une obligation commerciale.',
] as const;

export type CanonEntryControlId = 'time' | 'sense' | 'mirror' | 'gap';

export const LEVOIS_ENTRY_CONTROLS = {
  time: {
    label: 'Temps',
    test:
      'La première unité perceptible permet-elle de comprendre ce que le contenu va aider à examiner ?',
    correction:
      'Avancer l’objet, la situation ou la première utilité sans supprimer une condition indispensable.',
  },
  sense: {
    label: 'Sens',
    test:
      'La formulation simple conserve-t-elle exactement le degré de certitude et l’opération à accomplir ?',
    correction:
      'Employer un sujet explicite, un verbe concret et une conséquence visible.',
  },
  mirror: {
    label: 'Miroir',
    test:
      'La personne peut-elle se reconnaître dans un moment, une intention, une contrainte et une question ?',
    correction:
      'Remplacer une catégorie vague par une scène décisionnelle concrète.',
  },
  gap: {
    label: 'Écart',
    test:
      'Une première lecture plausible est-elle mise à l’épreuve par une information qui oblige à la préciser ?',
    correction:
      'Créer une question utile sans fabriquer de contradiction ni agrandir la preuve.',
  },
} satisfies Record<
  CanonEntryControlId,
  { label: string; test: string; correction: string }
>;

export type CanonHookFamily =
  | 'situation'
  | 'usage'
  | 'comparison'
  | 'condition'
  | 'calendar'
  | 'scope'
  | 'unknown'
  | 'result';

export const LEVOIS_HOOK_FAMILIES: Record<
  CanonHookFamily,
  { description: string; expectedDelivery: string }
> = {
  situation: {
    description: 'Ouvrir sur un moment concret du parcours et la décision à prendre.',
    expectedDelivery: 'Une manière vérifiable d’examiner la situation.',
  },
  usage: {
    description: 'Montrer un usage qui doit fonctionner, souvent au même moment qu’un autre.',
    expectedDelivery: 'Un conflit d’usage explicite et un test transférable.',
  },
  comparison: {
    description: 'Rendre visibles deux options ou deux avantages qui ne sont pas directement comparables.',
    expectedDelivery: 'Une comparaison située qui revient à l’arbitrage initial.',
  },
  condition: {
    description: 'Transformer une possibilité apparente en conditions à vérifier.',
    expectedDelivery: 'Les conditions pertinentes, connues ou à vérifier.',
  },
  calendar: {
    description: 'Faire apparaître le rôle d’une date, d’un enchaînement ou d’une disponibilité.',
    expectedDelivery: 'Des entrées et sorties datées avec leurs statuts.',
  },
  scope: {
    description: 'Vérifier que deux chiffres ou documents couvrent réellement la même chose.',
    expectedDelivery: 'Une comparaison de périmètre sans omissions masquées.',
  },
  unknown: {
    description: 'Nommer ce qui manque pour comparer ou conclure honnêtement.',
    expectedDelivery: 'Ce qui peut être décidé et ce qui reste suspendu.',
  },
  result: {
    description: 'Distinguer un résultat observé de la cause qu’on lui attribue.',
    expectedDelivery: 'Plusieurs explications possibles et une vérification discriminante.',
  },
};

export type HookBrief = {
  person: string;
  decision: string;
  spontaneousReading: string;
  pressureTest: string;
  authorizedConclusion: string;
  finalOperation: string;
};

export type HookMode = 'direct' | 'scene' | 'comparison';

export type CanonHookCandidate = {
  mode: HookMode;
  family: CanonHookFamily;
  text: string;
  explicitPromise: string;
  implicitPromise: string;
  evidenceRefs: string[];
  claimRefs: string[];
};

export type StoryFunction =
  | 'situation'
  | 'initial_reading'
  | 'friction'
  | 'demonstration'
  | 'rereading'
  | 'practical_take';

export const LEVOIS_STORY_FUNCTIONS: Record<
  StoryFunction,
  { purpose: string; test: string }
> = {
  situation: {
    purpose: 'Montrer ce que la personne essaie de faire.',
    test: 'L’intention est-elle compréhensible sans connaître tout le dossier ?',
  },
  initial_reading: {
    purpose: 'Donner une raison crédible de préférer une option ou de former une première conclusion.',
    test: 'La lecture initiale est-elle comprise avant d’être interrogée ?',
  },
  friction: {
    purpose: 'Introduire l’information qui manque ou qui résiste.',
    test: 'La friction est-elle concrète et pertinente pour la décision ?',
  },
  demonstration: {
    purpose: 'Montrer comment cette information modifie la lecture.',
    test: 'Le lecteur voit-il pourquoi la conclusion change ?',
  },
  rereading: {
    purpose: 'Revenir au problème de départ avec une formulation plus précise.',
    test: 'Le sujet immobilier initial reste-t-il visible après la démonstration ?',
  },
  practical_take: {
    purpose: 'Donner une question, un test ou un document à examiner.',
    test: 'Le lecteur peut-il refaire l’opération sans contacter LEVOIS ?',
  },
};

export const LEVOIS_PREPUBLICATION_CONTROLS = [
  'subject',
  'understanding',
  'recognition',
  'interest',
  'promise',
  'progression',
  'mechanism',
  'limits',
  'resolution',
  'autonomy',
  'format',
  'continuity',
] as const;


export const LEVOIS_BRAND_COMMITMENTS = {
  expertise: {
    commitment:
      'Aider à voir ce qu’une information change dans un choix immobilier.',
    observable:
      'Une comparaison, une distinction ou un test réutilisable.',
  },
  emotion: {
    commitment: 'Clarté et sentiment de pouvoir avancer.',
    observable:
      'Une prochaine étape proportionnée, sans assurance artificielle.',
  },
  vision: {
    commitment:
      'Une décision gagne à expliciter ses raisons et ses conditions.',
    observable: 'Avantages, concessions et inconnues visibles.',
  },
  proof: {
    commitment: 'Rendre le raisonnement inspectable.',
    observable: 'Sources adaptées, exemples identifiés, corrections assumées.',
  },
  refusal: {
    commitment: 'Ne pas faire choisir sous une pression fabriquée.',
    observable:
      'Pas de faux compte à rebours, de verdict automatique ou de réponse retenue contre un email.',
  },
} as const;

export type CanonFormat = 'carousel' | 'article' | 'site' | 'video';

export const LEVOIS_FORMAT_CONTRACTS: Record<
  CanonFormat,
  { entry: string; progression: string; resolution: string }
> = {
  carousel: {
    entry: 'Couverture lisible et première transition.',
    progression: 'Une avancée utile par slide.',
    resolution: 'Test ou question à refaire.',
  },
  article: {
    entry: 'Titre, introduction et premiers intertitres.',
    progression: 'Réponse puis explication inspectable.',
    resolution: 'Méthode et limites retrouvables.',
  },
  site: {
    entry: 'Premier écran lié à l’intention de visite.',
    progression: 'Comprendre, choisir, obtenir une valeur.',
    resolution: 'Action ou résultat correspondant au bouton.',
  },
  video: {
    entry: 'Première image, texte et premières paroles.',
    progression: 'Une information compréhensible à chaque étape.',
    resolution: 'Réponse audible et action mémorisable.',
  },
};

export const LEVOIS_PREPUBLICATION_QUESTIONS = {
  subject: {
    question: 'Sait-on ce qui sera examiné dès l’entrée ?',
    correction: 'Avancer l’objet et la situation.',
  },
  understanding: {
    question: 'La phrase peut-elle être reformulée simplement ?',
    correction: 'Réduire le jargon et les ambiguïtés.',
  },
  recognition: {
    question: 'Qui décide quoi, à quel moment ?',
    correction: 'Remplacer le thème par une scène.',
  },
  interest: {
    question: 'Quelle réponse utile donne envie de poursuivre ?',
    correction: 'Préciser l’enjeu ou le test promis.',
  },
  promise: {
    question: 'Le corps répond-il à ce que l’entrée suggère ?',
    correction: 'Réduire le hook ou compléter la preuve.',
  },
  progression: {
    question: 'Chaque bloc apporte-t-il un changement ?',
    correction: 'Fusionner ou supprimer les répétitions.',
  },
  mechanism: {
    question: 'Comprend-on pourquoi l’information compte ?',
    correction: 'Montrer la relation ou le contre-exemple.',
  },
  limits: {
    question: 'Les qualifications essentielles sont-elles visibles ?',
    correction: 'Les rapprocher de l’affirmation.',
  },
  resolution: {
    question: 'La question principale est-elle traitée ?',
    correction: 'Écrire la réponse autorisée.',
  },
  autonomy: {
    question: 'Peut-on utiliser la méthode sans contacter LEVOIS ?',
    correction: 'Ajouter une opération interprétable.',
  },
  format: {
    question: 'Le support permet-il de lire ou entendre le propos ?',
    correction: 'Réduire la densité ou changer de format.',
  },
  continuity: {
    question: 'Le bouton ou la proposition finale tient-il sa promesse ?',
    correction: 'Aligner le libellé et l’action réelle.',
  },
} as const;

export const LEVOIS_PRODUCTION_ORDER = [
  'Choisir la décision.',
  'Qualifier les preuves.',
  'Écrire la résolution.',
  'Construire la progression.',
  'Proposer trois ouvertures.',
  'Adapter au support.',
  'Vérifier la promesse.',
  'Contrôler le rendu et la destination.',
] as const;

export const LEVOIS_MEASUREMENT_DIMENSIONS = {
  entry: 'Entrée dans le contenu.',
  progression: 'Progression jusqu’à la réponse.',
  utility: 'Utilité obtenue et prochaine action comprise.',
} as const;

export const LEVOIS_CONVERSION_RULES = [
  'La première conversion recherchée est une progression de compréhension.',
  'Un échange avec Mouaad vient après une valeur déjà reçue.',
  'Un seul appel principal suffit généralement à orienter l’action.',
  'Le libellé d’un CTA doit désigner une action réellement disponible.',
  'La résolution n’est jamais retenue pour obtenir des coordonnées.',
] as const;

export type CanonProductionRecord = {
  canonVersion: typeof LEVOIS_CANON_VERSION;
  audience: string;
  decision: string;
  angle: string;
  mechanism: string;
  hookBrief: HookBrief;
  hookCandidates: CanonHookCandidate[];
  authorizedConclusion: string;
  essentialLimit: string;
  autonomousAction: string;
  destination?: {
    label: string;
    path: string;
    exists: boolean;
  };
  evidenceRefs: string[];
  claimRefs: string[];
};

export function hasAbsoluteVeto(text: string) {
  const normalized = text.toLowerCase();
  return {
    fabricatedFact:
      /garanti|certain à 100|forcément|preuve que/i.test(normalized) &&
      /hypothèse|cas fictif|simulation|selon/i.test(normalized) === false,
    unjustifiedFear:
      /catastrophe|danger immédiat|fait échouer|vous allez perdre|piège absolu/i.test(normalized),
    forcedCommercialResolution:
      /pour connaître la réponse.*contact|réponse.*uniquement.*email|donnez.*coordonnées.*réponse/i.test(normalized),
  };
}

export function canonReady(record: CanonProductionRecord) {
  const veto = hasAbsoluteVeto(
    [
      record.hookCandidates.map((candidate) => candidate.text).join(' '),
      record.authorizedConclusion,
      record.autonomousAction,
      record.destination?.label ?? '',
    ].join(' '),
  );

  return (
    Boolean(record.decision.trim()) &&
    Boolean(record.mechanism.trim()) &&
    Boolean(record.hookBrief.authorizedConclusion.trim()) &&
    Boolean(record.hookBrief.finalOperation.trim()) &&
    record.hookCandidates.length === 3 &&
    record.hookCandidates.some((candidate) => candidate.mode === 'direct') &&
    record.hookCandidates.some((candidate) => candidate.mode === 'scene') &&
    record.hookCandidates.some((candidate) => candidate.mode === 'comparison') &&
    !veto.fabricatedFact &&
    !veto.unjustifiedFear &&
    !veto.forcedCommercialResolution
  );
}
