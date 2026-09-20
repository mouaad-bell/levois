import type { AnswerPageBrief } from './answers-engine';
import type { StudioProject } from './studio-schema';

export type SeoGateCheck = {
  id:
    | 'answer_first'
    | 'evidence'
    | 'distinctive_value'
    | 'local_integrity'
    | 'historical_dates'
    | 'freshness'
    | 'metadata'
    | 'cta_continuity';
  status: 'pass' | 'review' | 'block';
  reason: string;
  correction?: string;
};

export type SeoPublicationGate = {
  version: 'LEVOIS_SEO_GATE_V1';
  ready: boolean;
  checks: SeoGateCheck[];
};

const LOCAL_TERMS =
  /\b(chartres|l[eè]ves|luc[eé]|mainvilliers|luisant|le coudray|champhol)\b/i;

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function pageText(project: StudioProject) {
  return [
    project.articleMaster.workingTitle,
    project.articleMaster.centralThesis,
    ...project.articleMaster.sections.flatMap((section) => [
      section.heading,
      section.body,
    ]),
  ].join(' ');
}

function usedClaims(project: StudioProject) {
  const refs = new Set(
    project.articleMaster.sections.flatMap(
      (section) => section.claimRefs,
    ),
  );

  return project.evidencePack.claims.filter((claim) =>
    refs.has(claim.claimId),
  );
}

export function runSeoPublicationGate(
  project: StudioProject,
  answer: AnswerPageBrief,
): SeoPublicationGate {
  const text = pageText(project);
  const claims = usedClaims(project);

  const localTitle =
    LOCAL_TERMS.test(answer.title) ||
    LOCAL_TERMS.test(answer.slug);

  const localClaims = claims.filter(
    (claim) =>
      LOCAL_TERMS.test(claim.geographicScope || '') ||
      LOCAL_TERMS.test(claim.claim),
  );

  const historicalClaims = claims.filter(
    (claim) =>
      claim.publicationReadiness === 'historical_only' ||
      claim.evidenceUseClass === 'HISTORICAL_ONLY',
  );

  const historicalMissing = historicalClaims.filter(
    (claim) => {
      const period = claim.timeScope?.trim();
      return Boolean(period && !text.includes(period));
    },
  );

  const refreshClaims = claims.filter(
    (claim) =>
      claim.publicationReadiness === 'refresh_required' ||
      claim.verificationRequiredBeforePublication,
  );

  const distinctiveValue =
    Boolean(project.canon?.autonomousAction?.trim()) ||
    project.articleMaster.sections.some(
      (section) => section.type === 'method',
    ) ||
    claims.length >= 2;

  const answerWords = words(answer.answerShort);

  const checks: SeoGateCheck[] = [
    {
      id: 'answer_first',
      status:
        answerWords >= 30 && answerWords <= 130
          ? 'pass'
          : 'review',
      reason:
        'La réponse courte doit être utile sans imposer la lecture de tout l’article.',
      correction:
        answerWords < 30
          ? 'Rendre la réponse courte suffisamment complète.'
          : answerWords > 130
            ? 'Réduire la réponse courte avant le développement.'
            : undefined,
    },
    {
      id: 'evidence',
      status:
        answer.evidenceRefs.length > 0
          ? 'pass'
          : 'block',
      reason:
        'Une ressource Answers doit conserver au moins une preuve ou définition traçable.',
      correction:
        answer.evidenceRefs.length
          ? undefined
          : 'Obtenir une preuve adaptée ou abandonner cette forme d’article.',
    },
    {
      id: 'distinctive_value',
      status: distinctiveValue ? 'pass' : 'block',
      reason:
        'La page doit apporter une méthode, une comparaison, une donnée, une limite ou une opération distincte.',
      correction: distinctiveValue
        ? undefined
        : 'Ajouter une valeur distincte avant d’envisager une page indexable.',
    },
    {
      id: 'local_integrity',
      status:
        !localTitle || localClaims.length > 0
          ? 'pass'
          : 'block',
      reason:
        'Le nom d’une commune ne suffit pas à créer une page locale : une preuve ou une application locale propre est nécessaire.',
      correction:
        localTitle && !localClaims.length
          ? 'Retirer la commune du titre/slug ou ajouter un ancrage local réellement documenté.'
          : undefined,
    },
    {
      id: 'historical_dates',
      status:
        historicalMissing.length === 0
          ? 'pass'
          : 'review',
      reason:
        'Toute preuve historique doit rester explicitement datée dans la copie.',
      correction:
        historicalMissing.length
          ? 'Afficher la période exacte pour : ' +
            historicalMissing
              .map((claim) => claim.claimId)
              .join(', ')
          : undefined,
    },
    {
      id: 'freshness',
      status:
        refreshClaims.length === 0
          ? 'pass'
          : 'block',
      reason:
        'Une preuve marquée à rafraîchir ne soutient pas une page actuelle avant revalidation.',
      correction:
        refreshClaims.length
          ? 'Rafraîchir avant publication : ' +
            refreshClaims
              .map((claim) => claim.claimId)
              .join(', ')
          : undefined,
    },
    {
      id: 'metadata',
      status:
        answer.metaTitle.length >= 20 &&
        answer.metaTitle.length <= 65 &&
        answer.metaDescription.length >= 70 &&
        answer.metaDescription.length <= 170
          ? 'pass'
          : 'review',
      reason:
        'Les métadonnées doivent décrire la réponse sans promesse excessive.',
      correction:
        'Relire meta title et description pour clarté et longueur.',
    },
    {
      id: 'cta_continuity',
      status:
        project.articleMaster.recommendedLevoisPath
          .routeStatus === 'live' ||
        !answer.ctaLabel
          ? 'pass'
          : 'block',
      reason:
        'Une ressource ne doit pas promettre une destination non recettée.',
      correction:
        'Désactiver le CTA ou vérifier la destination publique.',
    },
  ];

  return {
    version: 'LEVOIS_SEO_GATE_V1',
    ready: checks.every((check) => check.status === 'pass'),
    checks,
  };
}
