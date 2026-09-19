import {
  STUDIO_FAMILIES,
  STUDIO_SCHEMA_VERSION,
  type ArticleSectionType,
  type ClaimStatus,
  type ClaimType,
  type ReaderEffect,
  type SlideLayout,
  type SlideRole,
  type SourceReliability,
  type StudioFamilyId,
  type StudioProject,
} from './studio-schema';

export type ResearchBundle = {
  familyId: StudioFamilyId;
  scope: {
    decisionQuestion: string;
    objective: string;
    hypothesesToTest: string[];
    mustNotAssume: string[];
  };
  sources: Array<{
    sourceId: string;
    type: 'official_dataset' | 'official_document' | 'institutional_page' | 'research' | 'press' | 'user_document' | 'other';
    publisher: string;
    title: string;
    url: string;
    dataPeriod: string;
    geographicScope: string;
    reliability: SourceReliability;
  }>;
  claims: Array<{
    claimId: string;
    claim: string;
    claimType: ClaimType;
    value: string;
    unit: string;
    population: string;
    geographicScope: string;
    timeScope: string;
    sourceRefs: string[];
    evidenceRefs: string[];
    evidenceStrength: 'strong' | 'medium' | 'weak' | 'none';
    status: ClaimStatus;
    allowedUses: string[];
    forbiddenInferences: string[];
  }>;
  unknowns: Array<{
    unknownId: string;
    question: string;
    importance: 'high' | 'medium' | 'low';
    reason: string;
    blocking: boolean;
  }>;
  limitations: string[];
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

export type ResearchApiResponse = {
  bundle: ResearchBundle;
  meta: {
    model: string;
    searchedSources: number;
    acceptedSources: number;
    downgradedClaims: number;
    requestId: string;
  };
};

function projectId(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `LEV-WEB-${Math.abs(hash >>> 0).toString(36).toUpperCase()}`;
}

function cleanRefs(refs: string[], allowed: Set<string>) {
  return refs.filter((ref, index) => allowed.has(ref) && refs.indexOf(ref) === index);
}

export function buildStudioProjectFromResearch(input: string, bundle: ResearchBundle): StudioProject {
  const family = STUDIO_FAMILIES[bundle.familyId] ?? STUDIO_FAMILIES.decider_arbitrer;
  const sourceIds = new Set(bundle.sources.map((source) => source.sourceId));

  const claims = bundle.claims.map((claim) => {
    const sourceRefs = cleanRefs(claim.sourceRefs, sourceIds);
    const evidenceRefs = Array.from(new Set(claim.evidenceRefs ?? []));
    const needsSource = claim.claimType === 'fact' || claim.claimType === 'calculation';
    const status: ClaimStatus =
      needsSource && sourceRefs.length === 0 && evidenceRefs.length === 0
        ? 'insufficient'
        : claim.status;
    return {
      ...claim,
      evidenceRefs,
      value: claim.value || undefined,
      unit: claim.unit || undefined,
      population: claim.population || undefined,
      geographicScope: claim.geographicScope || undefined,
      timeScope: claim.timeScope || undefined,
      sourceRefs,
      status,
      evidenceStrength: status === 'insufficient' ? 'none' as const : claim.evidenceStrength,
    };
  });

  const claimIds = new Set(claims.map((claim) => claim.claimId));
  const blockingUnknown = bundle.unknowns.some((unknown) => unknown.blocking && unknown.importance === 'high');
  const verifiedClaims = claims.filter((claim) => claim.status === 'verified').length;
  const qualifiedClaims = claims.filter((claim) => claim.status === 'qualified').length;
  const insufficientClaims = claims.filter((claim) => claim.status === 'insufficient').length;
  const rejectedClaims = claims.filter((claim) => claim.status === 'rejected').length;

  const sections = bundle.articleMaster.sections.map((section) => ({
    ...section,
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

  const selectedAngles = bundle.angles.slice(0, 3).map((angle) => ({
    ...angle,
    claimRefs: cleanRefs(angle.claimRefs ?? [], claimIds),
  }));
  if (selectedAngles.length && !selectedAngles.some((angle) => angle.selected)) {
    selectedAngles[0] = { ...selectedAngles[0], selected: true };
  }

  const statusByClaim = new Map(claims.map((claim) => [claim.claimId, claim.status]));
  const proofRefs = [
    ...sections.filter((section) => section.type === 'proof').flatMap((section) => section.claimRefs),
    ...slides.filter((slide) => slide.narrativeRole === 'proof').flatMap((slide) => slide.claimRefs),
  ];
  const proofSupported =
    proofRefs.length > 0 &&
    proofRefs.every((claimId) => {
      const status = statusByClaim.get(claimId);
      return status === 'verified' || status === 'qualified';
    });
  const selectedAngle = selectedAngles.find((angle) => angle.selected) ?? selectedAngles[0];
  const centralProofSupported =
    Boolean(selectedAngle?.claimRefs.length) &&
    selectedAngle.claimRefs.every((claimId) => {
      const status = statusByClaim.get(claimId);
      return status === 'verified' || status === 'qualified';
    });

  const canPublish =
    !blockingUnknown &&
    verifiedClaims > 0 &&
    bundle.sources.length > 0 &&
    slides.length >= 7 &&
    proofSupported &&
    centralProofSupported;

  return {
    schemaVersion: STUDIO_SCHEMA_VERSION,
    projectId: projectId(input),
    status: canPublish ? 'storyboard_ready' : 'research_required',
    input: {
      inputType: /^https?:\/\//i.test(input.trim()) ? 'url' : input.includes('?') ? 'question' : 'idea',
      rawInput: input.trim(),
    },
    family,
    scope: {
      rawTopic: input.trim(),
      decisionQuestion: bundle.scope.decisionQuestion,
      audience: 'Grand public, avec ou sans projet immobilier immédiat',
      territory: 'Chartres et alentours',
      objective: bundle.scope.objective,
      hypothesesToTest: bundle.scope.hypothesesToTest,
      mustNotAssume: bundle.scope.mustNotAssume,
    },
    evidencePack: {
      sources: bundle.sources,
      claims,
      unknowns: bundle.unknowns,
      summary: {
        verifiedClaims,
        qualifiedClaims,
        insufficientClaims,
        rejectedClaims,
        researchConfidence: canPublish ? 'high' : verifiedClaims + qualifiedClaims > 0 ? 'medium' : 'low',
        canPublish,
        limitations: bundle.limitations,
      },
    },
    angles: selectedAngles,
    articleMaster: {
      workingTitle: bundle.articleMaster.workingTitle,
      centralQuestion: bundle.articleMaster.centralQuestion,
      centralThesis: bundle.articleMaster.centralThesis,
      family: family.id,
      sections,
      keyTakeaway: bundle.articleMaster.keyTakeaway,
      transferablePrinciple: bundle.articleMaster.transferablePrinciple,
      nextPersonalQuestion: bundle.articleMaster.nextPersonalQuestion,
      recommendedLevoisPath: {
        label: bundle.articleMaster.ctaLabel || 'Clarifier mon projet',
        path: '/',
        routeStatus: 'pending',
        reason: 'Le parcours public correspondant sera relié après validation du moteur éditorial.',
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
        factuality: canPublish,
        narrative: slides.length >= 7,
        mobileDensity: slides.every((slide) => slide.headline.length <= 90 && slide.body.length <= 360),
        transferValue: slides.some((slide) => slide.narrativeRole === 'transfer'),
        saveValue: selectedAngles.some((angle) => angle.saveValue.trim().length > 20),
        levoisBridge: slides.at(-1)?.narrativeRole === 'bridge',
      },
    },
    generatedAt: new Date().toISOString(),
  };
}
