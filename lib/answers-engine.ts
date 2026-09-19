import type { StudioProject } from './studio-schema';
import { LEVOIS_CANON_VERSION } from './content-canon';

export type AnswerPageType =
  | 'local_answer'
  | 'national_explainer'
  | 'deep_dive';

export type AnswerPageBrief = {
  canonVersion: string;
  pageType: AnswerPageType;
  queryIntent: string;
  targetScope: string;
  decision: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  answerShort: string;
  authorizedConclusion: string;
  autonomousAction: string;
  essentialLimit: string;
  outline: string[];
  claimRefs: string[];
  evidenceRefs: string[];
  freshnessCheck: {
    reusable: string[];
    reviewDue: string[];
    blocking: string[];
  };
  limitations: string[];
  internalLinkCandidates: string[];
  structuredDataPlan: string[];
  nextPersonalQuestion: string;
  ctaLabel?: string;
  derivativeContentOpportunities: string[];
  continuity: {
    destinationExists: boolean;
    promiseMatchesDestination: boolean;
  };
};

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90);
}

function inferPageType(project: StudioProject): AnswerPageType {
  const local =
    /chartres|lèves|leves|lucé|luce|mainvilliers|luisant|coudray|champhol/i.test(
      project.input.rawInput + ' ' + project.scope.territory,
    );
  if (local) return 'local_answer';
  if (project.articleMaster.sections.length >= 8) {
    return 'national_explainer';
  }
  return 'deep_dive';
}

function shortAnswer(project: StudioProject) {
  const conclusion =
    project.canon?.decisionFrame.authorizedConclusion.trim() ||
    project.articleMaster.centralThesis.trim();
  const action =
    project.canon?.autonomousAction.trim() ||
    project.articleMaster.transferablePrinciple.trim();

  if (!action || conclusion.includes(action)) return conclusion;
  return conclusion + ' ' + action;
}

function buildOutline(project: StudioProject) {
  const preferredOrder = [
    'question',
    'intuition',
    'proof',
    'mechanism',
    'case',
    'method',
    'limits',
    'application',
  ];

  return preferredOrder
    .map((type) =>
      project.articleMaster.sections.find((section) => section.type === type),
    )
    .filter(Boolean)
    .map((section) => section!.heading);
}

function classifyClaims(project: StudioProject) {
  const reusable: string[] = [];
  const reviewDue: string[] = [];
  const blocking: string[] = [];

  for (const claim of project.evidencePack.claims) {
    if (
      claim.status === 'rejected' ||
      claim.status === 'insufficient' ||
      claim.publicationReadiness === 'forbidden'
    ) {
      blocking.push(claim.claimId);
      continue;
    }

    if (
      claim.publicationReadiness === 'refresh_required' ||
      claim.verificationRequiredBeforePublication
    ) {
      reviewDue.push(claim.claimId);
      continue;
    }

    if (
      claim.publicationReadiness === 'historical_only' ||
      claim.publicationReadiness === 'property_check' ||
      claim.publicationReadiness === 'person_check'
    ) {
      reviewDue.push(claim.claimId);
      continue;
    }

    if (
      claim.publicationReadiness === 'direct' ||
      claim.evidenceUseClass === 'REUSABLE_IMMEDIATELY'
    ) {
      reusable.push(claim.claimId);
      continue;
    }

    const source = project.evidencePack.sources.find((candidate) =>
      claim.sourceRefs.includes(candidate.sourceId),
    );

    if (
      source?.reliability === 'primary' &&
      claim.status === 'verified'
    ) {
      reusable.push(claim.claimId);
    } else {
      reviewDue.push(claim.claimId);
    }
  }

  return { reusable, reviewDue, blocking };
}

function collectClaimRefs(project: StudioProject) {
  return Array.from(
    new Set(
      project.articleMaster.sections.flatMap((section) => section.claimRefs),
    ),
  );
}

function collectEvidenceRefs(project: StudioProject, claimRefs: string[]) {
  const wanted = new Set(claimRefs);
  return Array.from(
    new Set(
      project.evidencePack.claims
        .filter((claim) => wanted.has(claim.claimId))
        .flatMap((claim) => claim.evidenceRefs ?? []),
    ),
  );
}

function destinationPromiseMatches(project: StudioProject) {
  const path = project.articleMaster.recommendedLevoisPath;
  if (path.routeStatus === 'live') return true;

  // Pending routes may be described, but cannot promise an action that does not exist.
  return !/envoyer|recevoir|comparaison automatique|calculer automatiquement|prendre rendez-vous/i.test(
    path.label,
  );
}

export function buildAnswerPageBrief(
  project: StudioProject,
): AnswerPageBrief {
  const pageType = inferPageType(project);
  const title = project.articleMaster.workingTitle;
  const scope =
    project.scope.territory ||
    project.evidencePack.claims[0]?.geographicScope ||
    'France';

  const claimRefs = collectClaimRefs(project);
  const evidenceRefs = collectEvidenceRefs(project, claimRefs);

  const limitations = Array.from(
    new Set([
      ...(project.canon?.essentialLimit
        ? [project.canon.essentialLimit]
        : []),
      ...project.evidencePack.summary.limitations,
      ...project.evidencePack.unknowns.map((unknown) => unknown.reason),
    ]),
  );

  const internalLinkCandidates = [
    '/ressources/',
    project.articleMaster.recommendedLevoisPath.path,
  ].filter(
    (value, index, all) =>
      value && all.indexOf(value) === index,
  );

  const destinationExists =
    project.articleMaster.recommendedLevoisPath.routeStatus === 'live';

  return {
    canonVersion: project.canon?.canonVersion ?? 'missing',
    pageType,
    queryIntent: project.scope.decisionQuestion,
    targetScope: scope,
    decision:
      project.canon?.decisionFrame.decision ??
      project.scope.decisionQuestion,
    title,
    slug: slugify(title),
    metaTitle: (title + ' — LEVOIS').slice(0, 60),
    metaDescription:
      (
        project.canon?.decisionFrame.authorizedConclusion ||
        project.articleMaster.keyTakeaway
      ).slice(0, 155),
    answerShort: shortAnswer(project),
    authorizedConclusion:
      project.canon?.decisionFrame.authorizedConclusion ??
      project.articleMaster.centralThesis,
    autonomousAction:
      project.canon?.autonomousAction ??
      project.articleMaster.transferablePrinciple,
    essentialLimit:
      project.canon?.essentialLimit ??
      project.evidencePack.summary.limitations[0] ??
      '',
    outline: buildOutline(project),
    claimRefs,
    evidenceRefs,
    freshnessCheck: classifyClaims(project),
    limitations,
    internalLinkCandidates,
    structuredDataPlan: [
      'Article',
      'BreadcrumbList',
      'Person',
      'WebSite',
    ],
    nextPersonalQuestion:
      project.articleMaster.nextPersonalQuestion,
    ctaLabel:
      project.articleMaster.recommendedLevoisPath.routeStatus === 'live'
        ? project.articleMaster.recommendedLevoisPath.label
        : undefined,
    derivativeContentOpportunities: [
      'carrousel',
      'LinkedIn',
      'Facebook',
      'Pinterest',
      'vidéo courte',
    ],
    continuity: {
      destinationExists,
      promiseMatchesDestination:
        destinationPromiseMatches(project),
    },
  };
}

export function answerPageReady(brief: AnswerPageBrief) {
  return (
    brief.canonVersion === LEVOIS_CANON_VERSION &&
    brief.title.length >= 8 &&
    brief.answerShort.length >= 50 &&
    brief.authorizedConclusion.length >= 20 &&
    brief.autonomousAction.length >= 15 &&
    brief.claimRefs.length > 0 &&
    brief.freshnessCheck.blocking.length === 0 &&
    brief.limitations.length > 0 &&
    brief.essentialLimit.length > 0 &&
    brief.continuity.promiseMatchesDestination
  );
}
