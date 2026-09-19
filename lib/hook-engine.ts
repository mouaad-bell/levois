import {
  LEVOIS_CONTENT_CANON,
  type LevoisEntranceDiagnostic,
  type LevoisHookBrief,
  type LevoisHookFamily,
  type LevoisVetoDiagnostic,
} from './content-canon-v1';

export type HookOpeningStyle = 'directe' | 'scene' | 'comparaison';

export type HookCandidate = {
  text: string;
  family: LevoisHookFamily;
  openingStyle: HookOpeningStyle;
  sourceIdea: string;
  claimRefs: string[];
  promiseExplicit: string;
  promiseImplicit: string;
  entranceDiagnostic: LevoisEntranceDiagnostic;
  vetoDiagnostic: LevoisVetoDiagnostic;
};

export type HookEvaluation = {
  candidate: HookCandidate;
  accepted: boolean;
  reasons: string[];
};

export type HookEngineInput = {
  brief: LevoisHookBrief;
  candidates: HookCandidate[];
};

export type HookEngineResult = {
  canonId: typeof LEVOIS_CONTENT_CANON.canonId;
  canonVersion: typeof LEVOIS_CONTENT_CANON.version;
  brief: LevoisHookBrief;
  accepted: HookEvaluation[];
  rejected: HookEvaluation[];
  selected?: HookEvaluation;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function candidateReasons(candidate: HookCandidate) {
  const reasons: string[] = [];
  const normalized = candidate.text.trim();

  if (!normalized) reasons.push('Accroche vide.');
  if (wordCount(normalized) > 18) {
    reasons.push('Accroche trop dense pour la première unité perceptible.');
  }

  if (/\d/.test(normalized) && candidate.claimRefs.length === 0) {
    reasons.push('Accroche chiffrée sans preuve référencée.');
  }

  for (const [control, result] of Object.entries(candidate.entranceDiagnostic)) {
    if (!result.pass) reasons.push('Contrôle ' + control + ' non satisfait : ' + result.reason);
  }

  for (const [veto, active] of Object.entries(candidate.vetoDiagnostic)) {
    if (active) reasons.push('Veto canonique actif : ' + veto);
  }

  if (!candidate.promiseExplicit.trim()) {
    reasons.push('Promesse explicite absente.');
  }

  if (!candidate.promiseImplicit.trim()) {
    reasons.push('Promesse implicite non examinée.');
  }

  return reasons;
}

function styleOrder(style: HookOpeningStyle) {
  if (style === 'directe') return 0;
  if (style === 'scene') return 1;
  return 2;
}

/**
 * Canon LEVOIS V1:
 * - la résolution et la conclusion autorisée existent avant le hook ;
 * - trois ouvertures sont proposées : directe, scène, comparaison ;
 * - Temps / Sens / Miroir / Écart sont des contrôles, pas une formule magique ;
 * - les trois vetos absolus rendent une ouverture non publiable ;
 * - le hook choisi doit rendre la promesse claire sans l’agrandir.
 */
export function evaluateHooks(input: HookEngineInput): HookEngineResult {
  const evaluations = input.candidates.map((candidate) => {
    const reasons = candidateReasons(candidate);
    return {
      candidate,
      accepted: reasons.length === 0,
      reasons,
    };
  });

  const accepted = evaluations
    .filter((evaluation) => evaluation.accepted)
    .sort((a, b) => styleOrder(a.candidate.openingStyle) - styleOrder(b.candidate.openingStyle));

  const rejected = evaluations.filter((evaluation) => !evaluation.accepted);

  return {
    canonId: LEVOIS_CONTENT_CANON.canonId,
    canonVersion: LEVOIS_CONTENT_CANON.version,
    brief: input.brief,
    accepted,
    rejected,
    selected: accepted[0],
  };
}

export function hasThreeCanonicalOpenings(candidates: HookCandidate[]) {
  const styles = new Set(candidates.map((candidate) => candidate.openingStyle));
  return styles.has('directe') && styles.has('scene') && styles.has('comparaison');
}
