export type HookFamily =
  | 'contradiction'
  | 'gap'
  | 'question_shift'
  | 'concrete_tension'
  | 'comparison'
  | 'unknown';

export type HookCandidate = {
  text: string;
  family: HookFamily;
  sourceIdea: string;
  claimRefs: string[];
};

export type HookCanonRule = {
  ruleId: string;
  label: string;
  description: string;
  examples?: string[];
  forbiddenPatterns?: string[];
};

export type HookCanon = {
  canonId: string;
  version: string;
  rules: HookCanonRule[];
};

export type HookEvaluation = {
  candidate: HookCandidate;
  accepted: boolean;
  matchedRuleIds: string[];
  reasons: string[];
};

export type HookEngineResult = {
  canonId: string;
  canonVersion: string;
  accepted: HookEvaluation[];
  rejected: HookEvaluation[];
  selected?: HookEvaluation;
};

/**
 * Intentionally deterministic and canon-driven.
 *
 * The semantic rules of a LEVOIS hook are not hard-coded here:
 * they will be supplied by the canonical hook document approved by Mouaad.
 * Until that canon is connected, the engine must not pretend that generic
 * copywriting heuristics are the LEVOIS standard.
 */
export function evaluateHooks(
  candidates: HookCandidate[],
  canon: HookCanon,
): HookEngineResult {
  const evaluations = candidates.map((candidate) => {
    const normalized = candidate.text.trim();
    const reasons: string[] = [];
    const matchedRuleIds: string[] = [];

    if (!normalized) reasons.push('Hook vide.');
    if (normalized.length > 96) reasons.push('Hook trop long pour une lecture mobile immédiate.');
    if (candidate.claimRefs.length === 0 && /\d/.test(normalized)) {
      reasons.push('Hook chiffré sans preuve référencée.');
    }

    for (const rule of canon.rules) {
      const forbidden = rule.forbiddenPatterns ?? [];
      if (forbidden.some((pattern) => new RegExp(pattern, 'i').test(normalized))) {
        reasons.push('Interdit par ' + rule.ruleId + ': ' + rule.label + '.');
      } else {
        matchedRuleIds.push(rule.ruleId);
      }
    }

    return {
      candidate,
      accepted: reasons.length === 0,
      matchedRuleIds,
      reasons,
    };
  });

  const accepted = evaluations.filter((evaluation) => evaluation.accepted);
  const rejected = evaluations.filter((evaluation) => !evaluation.accepted);

  return {
    canonId: canon.canonId,
    canonVersion: canon.version,
    accepted,
    rejected,
    selected: accepted[0],
  };
}
