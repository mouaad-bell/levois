import {
  STUDIO_FAMILIES,
  STUDIO_SCHEMA_VERSION,
  type ArticleSectionType,
  type CanonEditorialRecord,
  type EvidencePack,
  type ReaderEffect,
  type SlideLayout,
  type SlideRole,
  type StudioFamilyId,
  type StudioProject,
} from './studio-schema';
import { evaluateHooks } from './hook-engine';

export type EditorialBundle = {
  familyId: StudioFamilyId;
  scope: {
    decisionQuestion: string;
    objective: string;
    hypothesesToTest: string[];
    mustNotAssume: string[];
  };
  evidenceSelection: {
    centralEvidenceRefs: string[];
    contextEvidenceRefs: string[];
    rejectedEvidenceRefs: string[];
    rationale: string;
  };
  angles: Array<{
    angleId: string;
    title: string;
    promise: string;
    hook: string;
    centralProof: string;
    saveValue: string;
    bridgeQuestion: string;
    claimRefs: string[];
    selected: boolean;
  }>;
  canon: CanonEditorialRecord;
  articleMaster: {
    workingTitle: string;
    centralQuestion: string;
    centralThesis: string;
    sections: Array<{
      sectionId: string;
      type: ArticleSectionType;
      heading: string;
      body: string;
      claimRefs: string[];
    }>;
    keyTakeaway: string;
    transferablePrinciple: string;
    nextPersonalQuestion: string;
    ctaLabel: string;
  };
  storyboard: {
    slides: Array<{
      slideNumber: number;
      narrativeRole: SlideRole;
      objective: string;
      headline: string;
      body: string;
      claimRefs: string[];
      layout: SlideLayout;
      readerEffect: ReaderEffect;
      sourceLabel: string;
      assetRequirements: string[];
    }>;
  };
};

export type EditorialApiResponse = {
  bundle: EditorialBundle;
  evidencePack: EvidencePack;
  meta: {
    model: string;
    libraryHits: number;
    directEvidence: number;
    conditionalEvidence: number;
    rejectedEvidence: number;
    requestId: string;
    webUsed: false;
    retrievalIntent?: string;
    inputTokens?: number | null;
    outputTokens?: number | null;
    totalTokens?: number | null;
    traceabilityLogged?: boolean;
    cacheHit?: boolean;
  };
};

function projectId(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 'LEV-LIB-' + Math.abs(hash >>> 0).toString(36).toUpperCase();
}

function cleanRefs(refs: string[], allowed: Set<string>) {
  return refs.filter(
    (ref, index) => allowed.has(ref) && refs.indexOf(ref) === index,
  );
}

export function buildStudioProjectFromEditorial(
  input: string,
  evidencePack: EvidencePack,
  bundle: EditorialBundle,
): StudioProject {
  const family =
    STUDIO_FAMILIES[bundle.familyId] ??
    STUDIO_FAMILIES.decider_arbitrer;

  const claimIds = new Set(
    evidencePack.claims.map((claim) => claim.claimId),
  );
  const evidenceIds = new Set(
    evidencePack.claims.flatMap((claim) => claim.evidenceRefs ?? []),
  );

  const sections = bundle.articleMaster.sections
    .slice(0, 8)
    .map((section, index) => ({
      ...section,
      sectionId: 'SEC' + String(index + 1).padStart(2, '0'),
      claimRefs: cleanRefs(section.claimRefs, claimIds),
    }));

  const slides = bundle.storyboard.slides
    .slice(0, 10)
    .map((slide, index) => ({
      ...slide,
      slideNumber: index + 1,
      claimRefs: cleanRefs(slide.claimRefs, claimIds),
      sourceLabel: slide.sourceLabel || undefined,
    }));

  const angles = bundle.angles.slice(0, 3).map((angle) => ({
    ...angle,
    claimRefs: cleanRefs(angle.claimRefs ?? [], claimIds),
  }));

  if (angles.length && !angles.some((angle) => angle.selected)) {
    angles[0] = { ...angles[0], selected: true };
  }

  const canon = {
    ...bundle.canon,
    canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
    hookCandidates: bundle.canon.hookCandidates.map((candidate) => ({
      ...candidate,
      claimRefs: cleanRefs(candidate.claimRefs ?? [], claimIds),
      evidenceRefs: cleanRefs(candidate.evidenceRefs ?? [], evidenceIds),
    })),
    storyBeats: bundle.canon.storyBeats.map((beat) => ({
      ...beat,
      claimRefs: cleanRefs(beat.claimRefs ?? [], claimIds),
    })),
  };

  const selectedAngle =
    angles.find((angle) => angle.selected) ?? angles[0];

  const statusByClaim = new Map(
    evidencePack.claims.map((claim) => [
      claim.claimId,
      claim.status,
    ]),
  );

  const centralProofSupported =
    Boolean(selectedAngle?.claimRefs.length) &&
    selectedAngle.claimRefs.every((claimId) => {
      const status = statusByClaim.get(claimId);
      return status === 'verified' || status === 'qualified';
    });

  const storyFunctions = new Set(
    canon.storyBeats.map((beat) => beat.function),
  );
  const hookModes = new Set(
    canon.hookCandidates.map((candidate) => candidate.mode),
  );

  const hookReview = evaluateHooks({
    brief: canon.decisionFrame,
    candidates: canon.hookCandidates,
    bodyConclusion: bundle.articleMaster.centralThesis,
    bodyFinalOperation: canon.autonomousAction || canon.decisionFrame.finalOperation,
    knownEvidenceIds: evidenceIds,
    knownClaimIds: claimIds,
  });
  const selectedHookValidated = hookReview.accepted.some(
    (entry) => entry.candidate.mode === canon.selectedHookMode,
  );

  const canonComplete =
    canon.decisionFrame.person.trim().length > 0 &&
    canon.decisionFrame.decision.trim().length > 0 &&
    canon.decisionFrame.authorizedConclusion.trim().length > 0 &&
    canon.decisionFrame.finalOperation.trim().length > 0 &&
    canon.hookCandidates.length === 3 &&
    hookModes.has('direct') &&
    hookModes.has('scene') &&
    hookModes.has('comparison') &&
    storyFunctions.has('situation') &&
    storyFunctions.has('initial_reading') &&
    storyFunctions.has('friction') &&
    storyFunctions.has('demonstration') &&
    storyFunctions.has('rereading') &&
    storyFunctions.has('practical_take') &&
    canon.essentialLimit.trim().length > 0 &&
    canon.autonomousAction.trim().length > 0;

  const canPublish =
    evidencePack.summary.canPublish &&
    centralProofSupported &&
    canonComplete &&
    selectedHookValidated &&
    slides.length >= 3;

  return {
    schemaVersion: STUDIO_SCHEMA_VERSION,
    projectId: projectId(input),
    status: canPublish ? 'storyboard_ready' : 'evidence_ready',
    input: {
      inputType: /^https?:\/\//i.test(input.trim())
        ? 'url'
        : input.includes('?')
          ? 'question'
          : 'idea',
      rawInput: input.trim(),
    },
    family,
    scope: {
      rawTopic: input.trim(),
      decisionQuestion: bundle.scope.decisionQuestion,
      audience:
        'Grand public, avec ou sans projet immobilier immédiat',
      territory: 'Chartres et alentours',
      objective: bundle.scope.objective,
      hypothesesToTest: bundle.scope.hypothesesToTest,
      mustNotAssume: bundle.scope.mustNotAssume,
    },
    evidencePack: {
      ...evidencePack,
      summary: {
        ...evidencePack.summary,
        canPublish,
        researchConfidence: canPublish
          ? 'high'
          : evidencePack.summary.researchConfidence,
      },
    },
    angles,
    canon,
    articleMaster: {
      workingTitle: bundle.articleMaster.workingTitle,
      centralQuestion: bundle.articleMaster.centralQuestion,
      centralThesis: bundle.articleMaster.centralThesis,
      family: family.id,
      sections,
      keyTakeaway: bundle.articleMaster.keyTakeaway,
      transferablePrinciple:
        bundle.articleMaster.transferablePrinciple,
      nextPersonalQuestion:
        bundle.articleMaster.nextPersonalQuestion,
      recommendedLevoisPath: {
        label:
          bundle.articleMaster.ctaLabel ||
          'Mettre ma recherche au clair',
        path: '/',
        routeStatus: 'pending',
        reason:
          'La destination publique doit être recettée avant activation du CTA.',
      },
    },
    storyboard: {
      format: 'instagram_carousel_4x5',
      family: family.id,
      accentColor: family.accent,
      slideCount: slides.length,
      slides,
      qualityGate: {
        hook: slides[0]?.narrativeRole === 'hook',
        factuality: evidencePack.summary.canPublish,
        narrative: canonComplete,
        mobileDensity: slides.every(
          (slide) =>
            slide.headline.length <= 110 &&
            slide.body.length <= 420,
        ),
        transferValue:
          canon.autonomousAction.trim().length > 0,
        saveValue: angles.some(
          (angle) => angle.saveValue.trim().length > 0,
        ),
        levoisBridge: slides.some(
          (slide) => slide.narrativeRole === 'bridge',
        ),
        canonPromise: canonComplete && selectedHookValidated,
        resolution:
          canon.decisionFrame.authorizedConclusion.trim().length > 0,
        autonomy: canon.autonomousAction.trim().length > 0,
        limitsVisible: canon.essentialLimit.trim().length > 0,
      },
    },
    generatedAt: new Date().toISOString(),
  };
}
