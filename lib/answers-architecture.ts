import type { StudioFamilyId } from './studio-schema';

export type AnswersHub = {
  hubId: string;
  label: string;
  path: string;
  familyIds: StudioFamilyId[];
  activationThreshold: number;
  status: 'planned' | 'active';
};

export const ANSWERS_ROOT = '/ressources/' as const;

export const ANSWERS_HUBS: AnswersHub[] = [
  {
    hubId: 'decider',
    label: 'Décider',
    path: '/ressources/decider/',
    familyIds: ['decider_arbitrer'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'prix',
    label: 'Prix et valeur',
    path: '/ressources/prix/',
    familyIds: ['prix_valeur'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'budget',
    label: 'Budget et financement',
    path: '/ressources/budget/',
    familyIds: ['budget_financement'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'espace',
    label: 'Espace et usage',
    path: '/ressources/espace/',
    familyIds: ['espace_usage'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'mobilite',
    label: 'Lieu et mobilité',
    path: '/ressources/mobilite/',
    familyIds: ['lieu_mobilite'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'bien',
    label: 'Bien et technique',
    path: '/ressources/bien/',
    familyIds: ['bien_technique'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'marche',
    label: 'Marché et territoire',
    path: '/ressources/marche/',
    familyIds: ['marche_territoire'],
    activationThreshold: 3,
    status: 'planned',
  },
  {
    hubId: 'transaction',
    label: 'Vérifier et transiger',
    path: '/ressources/transaction/',
    familyIds: ['verifier_transaction'],
    activationThreshold: 3,
    status: 'planned',
  },
];

export const LOCAL_ANSWERS_AREAS = [
  'Chartres',
  'Lèves',
  'Lucé',
  'Mainvilliers',
  'Luisant',
  'Le Coudray',
  'Champhol',
] as const;

export const LOCAL_HUB_ACTIVATION_THRESHOLD = 3;

export function answerCanonicalPath(slug: string) {
  const clean = slug
    .trim()
    .replace(/^\/+|\/+$/g, '');

  return ANSWERS_ROOT + clean + '/';
}

export function hubForFamily(
  familyId: StudioFamilyId,
) {
  return ANSWERS_HUBS.find((hub) =>
    hub.familyIds.includes(familyId),
  );
}

export function shouldActivateHub(
  publishedAnswerCount: number,
  threshold = 3,
) {
  return publishedAnswerCount >= threshold;
}

export type LocalPageEligibility = {
  hasDistinctLocalQuestion: boolean;
  hasLocalEvidence: boolean;
  exactScopeNamed: boolean;
  periodVisibleWhenDated: boolean;
  duplicatesNationalAnswer: boolean;
};

export function localPageEligible(
  eligibility: LocalPageEligibility,
) {
  return (
    eligibility.hasDistinctLocalQuestion &&
    eligibility.hasLocalEvidence &&
    eligibility.exactScopeNamed &&
    eligibility.periodVisibleWhenDated &&
    !eligibility.duplicatesNationalAnswer
  );
}
