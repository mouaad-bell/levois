import {
  LEVOIS_CANON_VERSION,
  LEVOIS_ENTRY_CONTROLS,
  LEVOIS_HOOK_FAMILIES,
  type CanonHookCandidate,
  type CanonHookFamily,
  type HookBrief,
} from './content-canon';

export type HookEvaluation = {
  candidate: CanonHookCandidate;
  accepted: boolean;
  controlResults: {
    time: boolean;
    sense: boolean;
    mirror: boolean;
    gap: boolean;
  };
  promiseHeld: boolean;
  evidenceTraceable: boolean;
  reasons: string[];
};

export type HookEngineInput = {
  brief: HookBrief;
  candidates: CanonHookCandidate[];
  bodyConclusion: string;
  bodyFinalOperation: string;
  knownEvidenceIds: Set<string>;
  knownClaimIds: Set<string>;
};

export type HookEngineResult = {
  canonVersion: typeof LEVOIS_CANON_VERSION;
  brief: HookBrief;
  evaluations: HookEvaluation[];
  accepted: HookEvaluation[];
  rejected: HookEvaluation[];
  selected?: HookEvaluation;
};

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function sharesMeaning(a: string, b: string) {
  const tokens = (value: string) =>
    new Set(
      normalize(value)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 3),
    );
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return false;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / Math.min(left.size, right.size) >= 0.3;
}

function hasSituation(candidate: CanonHookCandidate, brief: HookBrief) {
  const combined = normalize(candidate.text + ' ' + candidate.explicitPromise);
  const anchors = [
    brief.person,
    brief.decision,
    brief.spontaneousReading,
    brief.pressureTest,
  ]
    .map(normalize)
    .flatMap((text) => text.split(/[^a-z0-9]+/))
    .filter((token) => token.length > 4);
  return anchors.some((token) => combined.includes(token));
}

function isPlainEnough(text: string) {
  const jargon = [
    'optimisation',
    'pertinence',
    'sécurisation',
    'compatibilité des temporalités',
    'arbitrage multidimensionnel',
    'rationalisation',
    'stratégie patrimoniale',
  ];
  return !jargon.some((term) => normalize(text).includes(normalize(term)));
}

function hasUsefulGap(candidate: CanonHookCandidate, brief: HookBrief) {
  return (
    sharesMeaning(candidate.text, brief.spontaneousReading) ||
    sharesMeaning(candidate.text, brief.pressureTest) ||
    sharesMeaning(candidate.implicitPromise, brief.pressureTest) ||
    candidate.text.includes('?')
  );
}

function promiseHeld(
  candidate: CanonHookCandidate,
  bodyConclusion: string,
  bodyFinalOperation: string,
) {
  const promised = candidate.explicitPromise + ' ' + candidate.implicitPromise;
  return (
    sharesMeaning(promised, bodyConclusion) ||
    sharesMeaning(promised, bodyFinalOperation) ||
    sharesMeaning(candidate.text, bodyConclusion)
  );
}

function evidenceTraceable(candidate: CanonHookCandidate, input: HookEngineInput) {
  const numericOrLocal = /\d|chartres|lèves|leves|lucé|luce|mainvilliers|luisant|coudray|champhol/i.test(
    candidate.text,
  );

  const evidenceOk = candidate.evidenceRefs.every((ref) =>
    input.knownEvidenceIds.has(ref),
  );
  const claimsOk = candidate.claimRefs.every((ref) =>
    input.knownClaimIds.has(ref),
  );

  if (!evidenceOk || !claimsOk) return false;
  if (numericOrLocal && candidate.evidenceRefs.length === 0 && candidate.claimRefs.length === 0) {
    return false;
  }
  return true;
}

function candidateModesComplete(candidates: CanonHookCandidate[]) {
  const modes = new Set(candidates.map((candidate) => candidate.mode));
  return modes.has('direct') && modes.has('scene') && modes.has('comparison');
}

export function evaluateHooks(input: HookEngineInput): HookEngineResult {
  const reasonsForBatch: string[] = [];
  if (input.candidates.length !== 3) {
    reasonsForBatch.push('Le canon demande exactement trois ouvertures candidates.');
  }
  if (!candidateModesComplete(input.candidates)) {
    reasonsForBatch.push('Les trois ouvertures doivent couvrir directe, scène et comparaison.');
  }

  const evaluations = input.candidates.map((candidate) => {
    const reasons = [...reasonsForBatch];

    const controlResults = {
      time:
        candidate.text.trim().length > 0 &&
        (candidate.text.trim().length <= 120 || candidate.mode === 'scene'),
      sense:
        isPlainEnough(candidate.text) &&
        isPlainEnough(candidate.explicitPromise),
      mirror:
        candidate.mode === 'direct'
          ? Boolean(input.brief.decision.trim())
          : hasSituation(candidate, input.brief),
      gap:
        hasUsefulGap(candidate, input.brief),
    };

    for (const [controlId, ok] of Object.entries(controlResults)) {
      if (!ok) {
        const rule =
          LEVOIS_ENTRY_CONTROLS[
            controlId as keyof typeof LEVOIS_ENTRY_CONTROLS
          ];
        reasons.push(rule.label + ' : ' + rule.correction);
      }
    }

    if (!LEVOIS_HOOK_FAMILIES[candidate.family]) {
      reasons.push('Famille de hook hors canon V1.');
    }

    const held = promiseHeld(
      candidate,
      input.bodyConclusion,
      input.bodyFinalOperation,
    );
    if (!held) {
      reasons.push(
        'Promesse non tenue : l’ouverture suggère davantage que la conclusion ou l’opération finale.',
      );
    }

    const traceable = evidenceTraceable(candidate, input);
    if (!traceable) {
      reasons.push(
        'Traçabilité insuffisante pour une ouverture chiffrée, locale ou factuelle.',
      );
    }

    const exaggeratedFear =
      /vous allez perdre|catastrophe|pi[eè]ge|fait échouer votre achat|danger immédiat/i.test(
        candidate.text,
      );
    if (exaggeratedFear) {
      reasons.push(
        'Veto canonique : peur amplifiée ou conséquence grave non démontrée.',
      );
    }

    const fakeOpposition =
      /tout ce que vous savez est faux|on vous ment|personne ne vous dit/i.test(
        candidate.text,
      );
    if (fakeOpposition) {
      reasons.push(
        'Écart artificiel : la contradiction n’est pas nécessaire à la démonstration.',
      );
    }

    const allControls = Object.values(controlResults).every(Boolean);

    return {
      candidate,
      accepted:
        reasons.length === 0 &&
        allControls &&
        held &&
        traceable,
      controlResults,
      promiseHeld: held,
      evidenceTraceable: traceable,
      reasons,
    };
  });

  const accepted = evaluations.filter((evaluation) => evaluation.accepted);
  const rejected = evaluations.filter((evaluation) => !evaluation.accepted);

  return {
    canonVersion: LEVOIS_CANON_VERSION,
    brief: input.brief,
    evaluations,
    accepted,
    rejected,
    selected: accepted[0],
  };
}

export function hookFamilyDelivery(family: CanonHookFamily) {
  return LEVOIS_HOOK_FAMILIES[family].expectedDelivery;
}
