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
