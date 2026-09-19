export const LEVOIS_CONTENT_CANON = {
  canonId: 'levois-content-experience-v1',
  version: '2026-09-19',
  mission: 'Faire entrer dans une question réelle. Faire avancer la compréhension. Donner une prise sur la décision.',
  brandIntent: 'Comprendre pour décider en immobilier.',
  centralRule: 'L’accroche ouvre une question que le contenu traite honnêtement ; la fin donne au lecteur une opération qu’il peut refaire.',
  publicTone: ['direct', 'concret', 'calme', 'vivant'],
  entranceControls: ['temps', 'sens', 'miroir', 'ecart'] as const,
  hookFamilies: [
    'situation',
    'usage',
    'comparaison',
    'condition',
    'calendrier',
    'perimetre',
    'inconnue',
    'resultat',
  ] as const,
  productionOrder: [
    'choisir_decision',
    'qualifier_preuves',
    'ecrire_resolution',
    'construire_progression',
    'proposer_trois_ouvertures',
    'adapter_support',
    'verifier_promesse',
    'controler_rendu_destination',
  ] as const,
  narrativeFunctions: [
    'situation',
    'lecture_initiale',
    'friction',
    'demonstration',
    'relecture',
    'prise_pratique',
  ] as const,
  preflightControls: [
    'sujet',
    'comprehension',
    'reconnaissance',
    'interet',
    'promesse',
    'progression',
    'mecanisme',
    'limites',
    'resolution',
    'autonomie',
    'format',
    'continuite',
  ] as const,
  absoluteVetos: [
    'fait_fabrique_presente_comme_reel',
    'peur_non_justifiee',
    'resolution_remplacee_par_obligation_commerciale',
  ] as const,
} as const;

export type LevoisEntranceControl = typeof LEVOIS_CONTENT_CANON.entranceControls[number];
export type LevoisHookFamily = typeof LEVOIS_CONTENT_CANON.hookFamilies[number];
export type LevoisNarrativeFunction = typeof LEVOIS_CONTENT_CANON.narrativeFunctions[number];
export type LevoisPreflightControl = typeof LEVOIS_CONTENT_CANON.preflightControls[number];
export type LevoisAbsoluteVeto = typeof LEVOIS_CONTENT_CANON.absoluteVetos[number];

export type LevoisHookBrief = {
  personConcerned: string;
  decision: string;
  spontaneousReading: string;
  stressor: string;
  authorizedConclusion: string;
  finalOperation: string;
};

export type LevoisEntranceDiagnostic = Record<LevoisEntranceControl, {
  pass: boolean;
  reason: string;
}>;

export type LevoisPreflightDiagnostic = Record<LevoisPreflightControl, {
  pass: boolean;
  correction?: string;
}>;

export type LevoisVetoDiagnostic = Record<LevoisAbsoluteVeto, boolean>;
