export const ARTICLE_PUBLIC_CONTRACT_VERSION =
  'LEVOIS_ARTICLE_PUBLIC_V1' as const;

export type PublicArticleStatus = 'DRAFT' | 'PUBLISHED';

export type PublicArticleInput = {
  answerId: string;
  title: string;
  slug: string;
  queryIntent: string;
  targetScope: string;
  answerShort: string;
  autonomousAction: string;
  essentialLimit: string;
  evidenceRefs: string[];
  internalLinksCandidates: string[];
  lastEvidenceReview: string;
  publicationStatus: PublicArticleStatus;
  datePublished: string;
  dateModified: string;
  ctaStatus: string;
};

export type PublicArticleEvidence = {
  evidenceId: string;
  sourcePublisher: string;
  sourceTitle: string;
  sourceUrl: string;
  geographicScope: string;
  timePeriod: string;
  status: string;
  verificationRequiredBeforePublication: boolean;
};

export type PublicArticleCheck = {
  id:
    | 'single_question'
    | 'answer_first'
    | 'resolved_evidence'
    | 'visible_scope'
    | 'visible_limit'
    | 'autonomous_value'
    | 'source_traceability'
    | 'internal_continuity'
    | 'publication_dates'
    | 'cta_safety';
  status: 'pass' | 'review' | 'block';
  reason: string;
};

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function isoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function reviewPublicArticle(
  page: PublicArticleInput,
  evidence: PublicArticleEvidence[],
) {
  const evidenceById = new Map(
    evidence.map((item) => [item.evidenceId, item]),
  );
  const resolvedEvidence = page.evidenceRefs
    .map((id) => evidenceById.get(id))
    .filter(
      (item): item is PublicArticleEvidence => Boolean(item),
    );
  const answerWords = wordCount(page.answerShort);
  const published = page.publicationStatus === 'PUBLISHED';

  const checks: PublicArticleCheck[] = [
    {
      id: 'single_question',
      status:
        page.queryIntent.trim().length >= 30 ? 'pass' : 'block',
      reason:
        'La page doit partir d’une question décisionnelle explicite, pas d’un thème générique.',
    },
    {
      id: 'answer_first',
      status:
        answerWords >= 30 && answerWords <= 100
          ? 'pass'
          : 'review',
      reason:
        'La réponse directe doit rester autonome et tenir entre 30 et 100 mots.',
    },
    {
      id: 'resolved_evidence',
      status:
        page.evidenceRefs.length > 0 &&
        resolvedEvidence.length === page.evidenceRefs.length
          ? 'pass'
          : 'block',
      reason:
        'Toute preuve citée doit exister dans le snapshot éditorial.',
    },
    {
      id: 'visible_scope',
      status: page.targetScope.trim() ? 'pass' : 'block',
      reason:
        'Le périmètre géographique et temporel doit rester visible.',
    },
    {
      id: 'visible_limit',
      status:
        wordCount(page.essentialLimit) >= 10
          ? 'pass'
          : 'block',
      reason:
        'La limite essentielle doit être compréhensible sans consulter la base.',
    },
    {
      id: 'autonomous_value',
      status:
        wordCount(page.autonomousAction) >= 8
          ? 'pass'
          : 'block',
      reason:
        'Le lecteur doit pouvoir effectuer une première opération sans transmettre ses coordonnées.',
    },
    {
      id: 'source_traceability',
      status: resolvedEvidence.every(
        (item) =>
          item.sourcePublisher.trim() &&
          item.sourceTitle.trim() &&
          item.sourceUrl.trim() &&
          item.timePeriod.trim(),
      )
        ? 'pass'
        : 'block',
      reason:
        'Chaque source doit conserver éditeur, titre, URL ou référence interne et période.',
    },
    {
      id: 'internal_continuity',
      status: page.internalLinksCandidates.length
        ? 'pass'
        : 'review',
      reason:
        'Une page publiable ne doit pas devenir une impasse éditoriale.',
    },
    {
      id: 'publication_dates',
      status:
        isoDate(page.dateModified) &&
        (!published || isoDate(page.datePublished))
          ? 'pass'
          : 'block',
      reason:
        'La mise à jour est toujours datée ; une publication exige aussi une date de publication.',
    },
    {
      id: 'cta_safety',
      status:
        page.ctaStatus ===
        'DISABLED_UNTIL_DESTINATION_REVIEWED'
          ? 'pass'
          : 'review',
      reason:
        'Un CTA ne peut être activé qu’après recette de sa destination.',
    },
  ];

  return {
    contractVersion: ARTICLE_PUBLIC_CONTRACT_VERSION,
    readyForHumanReview: !checks.some(
      (check) => check.status === 'block',
    ),
    publishable:
      published &&
      checks.every((check) => check.status === 'pass'),
    checks,
  };
}

