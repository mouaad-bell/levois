import type { StudioProject } from './studio-schema';

export type AnswerPageType = 'local_answer' | 'national_explainer' | 'deep_dive';

export type AnswerPageBrief = {
  pageType: AnswerPageType;
  queryIntent: string;
  targetScope: string;
  title: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  answerShort: string;
  outline: string[];
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
  ctaLabel: string;
  derivativeContentOpportunities: string[];
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
  const local = /chartres|lèves|leves|lucé|luce|mainvilliers|luisant|coudray|champhol/i.test(
    project.input.rawInput + ' ' + project.scope.territory,
  );
  if (local) return 'local_answer';
  if (project.articleMaster.sections.length >= 8) return 'national_explainer';
  return 'deep_dive';
}

function shortAnswer(project: StudioProject) {
  const thesis = project.articleMaster.centralThesis.trim();
  const takeaway = project.articleMaster.keyTakeaway.trim();
  if (thesis === takeaway) return thesis;
  return thesis + ' ' + takeaway;
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

function classifyFreshness(project: StudioProject) {
  const reusable: string[] = [];
  const reviewDue: string[] = [];
  const blocking: string[] = [];

  for (const claim of project.evidencePack.claims) {
    if (claim.status === 'rejected' || claim.status === 'insufficient') {
      blocking.push(claim.claimId);
      continue;
    }

    const source = project.evidencePack.sources.find((candidate) =>
      claim.sourceRefs.includes(candidate.sourceId),
    );

    if (
      source?.reliability === 'primary' &&
      claim.status === 'verified'
    ) reusable.push(claim.claimId);
    else reviewDue.push(claim.claimId);
  }

  return { reusable, reviewDue, blocking };
}

export function buildAnswerPageBrief(project: StudioProject): AnswerPageBrief {
  const pageType = inferPageType(project);
  const title = project.articleMaster.workingTitle;
  const scope =
    project.scope.territory || project.evidencePack.claims[0]?.geographicScope || 'France';

  const evidenceRefs = Array.from(
    new Set(
      project.articleMaster.sections.flatMap((section) => section.claimRefs),
    ),
  );

  const limitations = Array.from(
    new Set([
      ...project.evidencePack.summary.limitations,
      ...project.evidencePack.unknowns.map((unknown) => unknown.reason),
    ]),
  );

  const internalLinkCandidates = [
    '/ressources/',
    project.articleMaster.recommendedLevoisPath.path,
  ].filter((value, index, all) => value && all.indexOf(value) === index);

  return {
    pageType,
    queryIntent: project.scope.decisionQuestion,
    targetScope: scope,
    title,
    slug: slugify(title),
    metaTitle: (title + ' — LEVOIS').slice(0, 60),
    metaDescription: project.articleMaster.keyTakeaway.slice(0, 155),
    answerShort: shortAnswer(project),
    outline: buildOutline(project),
    evidenceRefs,
    freshnessCheck: classifyFreshness(project),
    limitations,
    internalLinkCandidates,
    structuredDataPlan: ['Article', 'BreadcrumbList', 'Organization'],
    nextPersonalQuestion: project.articleMaster.nextPersonalQuestion,
    ctaLabel: project.articleMaster.recommendedLevoisPath.label,
    derivativeContentOpportunities: [
      'carrousel',
      'LinkedIn',
      'Facebook',
      'Pinterest',
      'vidéo courte',
    ],
  };
}

export function answerPageReady(brief: AnswerPageBrief) {
  return (
    brief.title.length >= 8 &&
    brief.answerShort.length >= 60 &&
    brief.evidenceRefs.length > 0 &&
    brief.freshnessCheck.blocking.length === 0 &&
    brief.limitations.length > 0 &&
    brief.nextPersonalQuestion.length > 12
  );
}
