import {
  LEVOIS_CANON_VERSION,
  hasAbsoluteVeto,
  type CanonHookCandidate,
  type HookBrief,
  type HookMode,
} from './content-canon';

export type HookEvaluation = {
  candidate: CanonHookCandidate;
  accepted: boolean;
  reasons: string[];
  controls: {
    time: boolean;
    sense: boolean;
    mirror: boolean;
    gap: boolean;
  };
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
  accepted: HookEvaluation[];
  rejected: HookEvaluation[];
  selected?: HookEvaluation;
};

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isGenericOpening(text: string) {
  return /^(aujourd'hui|aujourdhui|tout savoir|guide complet|conseils?|immobilier|un sujet important|le saviez-vous)/i.test(
    text.trim(),
  );
}

function refsAreKnown(refs: string[], known: Set<string>) {
  return refs.every((ref) => known.has(ref));
}

function pedagogicalQualifierVisible(candidate: CanonHookCandidate) {
  if (candidate.evidenceStatus !== 'pedagogical_scenario') return true;
  return /cas fictif|simulation|exemple fictif|sc[eè]ne fictive/i.test(
    candidate.qualifier,
  );
}

function candidateControls(
  candidate: CanonHookCandidate,
  brief: HookBrief,
) {
  const text = candidate.text.trim();

  return {
    time:
      Boolean(text) &&
      !isGenericOpening(text) &&
      wordCount(text) <= 24,
    sense:
      Boolean(candidate.explicitPromise.trim()) &&
      Boolean(candidate.implicitPromise.trim()) &&
      !/garanti|certain à 100|forc[eé]ment/i.test(text),
    mirror:
      Boolean(brief.person.trim()) &&
      Boolean(brief.decision.trim()) &&
      Boolean(brief.pressureTest.trim()),
    gap:
      Boolean(brief.spontaneousReading.trim()) &&
      Boolean(brief.pressureTest.trim()) &&
      Boolean(brief.authorizedConclusion.trim()),
  };
}

function candidateReasons(
  candidate: CanonHookCandidate,
  input: HookEngineInput,
) {
  const reasons: string[] = [];
  const controls = candidateControls(candidate, input.brief);
  const text = candidate.text.trim();

  if (!text) reasons.push('Accroche vide.');

  if (!controls.time) {
    reasons.push(
      'Temps : le sujet ou l’utilité ne sont pas assez repérables dans la première unité.',
    );
  }
  if (!controls.sense) {
    reasons.push(
      'Sens : la formulation ou ses promesses risquent d’agrandir la conclusion.',
    );
  }
  if (!controls.mirror) {
    reasons.push(
      'Miroir : la fiche ne décrit pas assez clairement la personne, la décision et la contrainte.',
    );
  }
  if (!controls.gap) {
    reasons.push(
      'Écart : la lecture initiale, l’élément de friction ou la conclusion autorisée manquent.',
    );
  }

  if (!candidate.explicitPromise.trim()) {
    reasons.push('Promesse explicite absente.');
  }
  if (!candidate.implicitPromise.trim()) {
    reasons.push('Promesse implicite non examinée.');
  }

  if (!refsAreKnown(candidate.claimRefs, input.knownClaimIds)) {
    reasons.push('Une claimRef du hook ne correspond pas au dossier de preuves.');
  }
  if (!refsAreKnown(candidate.evidenceRefs, input.knownEvidenceIds)) {
    reasons.push('Une evidenceRef du hook ne correspond pas au dossier de preuves.');
  }

  if (/\d/.test(text)) {
    if (candidate.evidenceStatus === 'non_numeric') {
      reasons.push('Accroche chiffrée marquée non_numeric.');
    }
    if (
      candidate.evidenceStatus === 'sourced' &&
      candidate.claimRefs.length === 0 &&
      candidate.evidenceRefs.length === 0
    ) {
      reasons.push('Accroche chiffrée sourcée sans référence de preuve.');
    }
    if (!pedagogicalQualifierVisible(candidate)) {
      reasons.push(
        'Accroche chiffrée pédagogique sans qualification visible de type CAS FICTIF / simulation.',
      );
    }
  }

  const conclusion = normalize(input.bodyConclusion);
  const authorized = normalize(input.brief.authorizedConclusion);
  if (!conclusion || !authorized || conclusion !== authorized) {
    reasons.push(
      'La conclusion du corps ne correspond pas exactement à la conclusion autorisée de la fiche.',
    );
  }

  if (!input.bodyFinalOperation.trim()) {
    reasons.push('Aucune opération finale autonome n’est définie.');
  }

  const veto = hasAbsoluteVeto(
    [
      candidate.text,
      candidate.explicitPromise,
      candidate.implicitPromise,
      input.bodyConclusion,
      input.bodyFinalOperation,
    ].join(' '),
  );

  if (veto.fabricatedFact) {
    reasons.push('Veto absolu : fait fabriqué ou certitude disproportionnée.');
  }
  if (veto.unjustifiedFear) {
    reasons.push('Veto absolu : peur non justifiée par le dossier.');
  }
  if (veto.forcedCommercialResolution) {
    reasons.push(
      'Veto absolu : résolution remplacée par une obligation commerciale.',
    );
  }

  return { reasons, controls };
}

export function evaluateHooks(input: HookEngineInput): HookEngineResult {
  const evaluations = input.candidates.map((candidate) => {
    const { reasons, controls } = candidateReasons(candidate, input);
    return {
      candidate,
      accepted: reasons.length === 0,
      reasons,
      controls,
    };
  });

  const accepted = evaluations.filter((evaluation) => evaluation.accepted);
  const rejected = evaluations.filter((evaluation) => !evaluation.accepted);

  return {
    canonVersion: LEVOIS_CANON_VERSION,
    accepted,
    rejected,
    selected: accepted[0],
  };
}

export function hasThreeCanonicalOpenings(
  candidates: CanonHookCandidate[],
) {
  const modes = new Set<HookMode>(
    candidates.map((candidate) => candidate.mode),
  );

  return (
    candidates.length === 3 &&
    modes.has('direct') &&
    modes.has('scene') &&
    modes.has('comparison')
  );
}
