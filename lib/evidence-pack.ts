import type {
  EvidencePack,
  StudioClaim,
  StudioSource,
  StudioUnknown,
} from './studio-schema';
import type { LibraryEvidence } from './evidence-library';

function sourceType(hit: LibraryEvidence): StudioSource['type'] {
  const publisher = (hit.sourcePublisher || '').toLowerCase();
  const topic = hit.topic.toLowerCase();

  if (
    publisher.includes('insee') ||
    publisher.includes('dgfip') ||
    publisher.includes('ademe') ||
    topic.includes('dvf') ||
    topic.includes('dpe')
  ) return 'official_dataset';

  if (
    publisher.includes('légifrance') ||
    publisher.includes('legifrance') ||
    publisher.includes('service-public')
  ) return 'official_document';

  if (
    publisher.includes('aqc') ||
    publisher.includes('agence qualité construction') ||
    publisher.includes('anil')
  ) return 'institutional_page';

  return 'other';
}

function reliability(hit: LibraryEvidence): StudioSource['reliability'] {
  if (hit.sourceTier === 1) return 'primary';
  if (hit.sourceTier === 2) return 'secondary';
  return 'context';
}

function sentenceList(value?: string) {
  if (!value) return [];
  return value
    .split(/\s*(?:\n|;|\.\s+(?=[A-ZÀ-ÖØ-Þ]))\s*/)
    .map((item) => item.trim().replace(/\.$/, ''))
    .filter(Boolean);
}

function uniqueBy<T>(items: T[], key: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = key(item);
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

export type DeterministicEvidencePackResult = {
  pack: EvidencePack;
  evidenceIds: string[];
  directEvidenceIds: string[];
  conditionalEvidenceIds: string[];
  excludedEvidenceIds: string[];
};

export function buildEvidencePackFromLibrary(
  hits: LibraryEvidence[],
): DeterministicEvidencePackResult {
  const usable = hits.filter(
    (hit) =>
      hit.publicationReadiness !== 'forbidden' &&
      hit.publicationReadiness !== 'refresh_required',
  );

  const direct = usable.filter(
    (hit) => hit.publicationReadiness === 'direct',
  );
  const conditional = usable.filter(
    (hit) =>
      hit.publicationReadiness === 'historical_only' ||
      hit.publicationReadiness === 'property_check' ||
      hit.publicationReadiness === 'person_check',
  );
  const excluded = hits.filter(
    (hit) =>
      hit.publicationReadiness === 'forbidden' ||
      hit.publicationReadiness === 'refresh_required',
  );

  const sourceCandidates: StudioSource[] = usable
    .filter((hit) => hit.sourceUrl)
    .map((hit, index) => ({
      sourceId: 'L' + String(index + 1).padStart(3, '0'),
      type: sourceType(hit),
      publisher: hit.sourcePublisher || 'Source documentée',
      title: hit.sourceTitle || hit.claim,
      url: hit.sourceUrl,
      dataPeriod: hit.timePeriod,
      geographicScope: hit.geographicScopeLabel,
      reliability: reliability(hit),
      notes:
        'Source issue de LEVOIS Evidence Library V2.1 · ' +
        hit.evidenceId,
    }));

  const sources = uniqueBy(
    sourceCandidates,
    (source) => source.url || source.publisher + source.title,
  ).map((source, index) => ({
    ...source,
    sourceId: 'S' + String(index + 1).padStart(3, '0'),
  }));

  const sourceIdByUrl = new Map(
    sources
      .filter((source) => source.url)
      .map((source) => [source.url!, source.sourceId]),
  );

  const claims: StudioClaim[] = usable.map((hit, index) => {
    const isDirect = hit.publicationReadiness === 'direct';
    const sourceRefs = hit.sourceUrl
      ? [sourceIdByUrl.get(hit.sourceUrl)].filter(
          (value): value is string => Boolean(value),
        )
      : [];

    return {
      claimId: 'C' + String(index + 1).padStart(3, '0'),
      claim: hit.claim,
      claimType: 'fact',
      value: hit.value,
      unit: hit.unit,
      population: hit.population,
      geographicScope: hit.geographicScopeLabel,
      timeScope: hit.timePeriod,
      sourceRefs,
      evidenceRefs: [hit.evidenceId],
      evidenceStrength:
        isDirect && hit.sourceTier === 1
          ? 'strong'
          : hit.sourceTier && hit.sourceTier <= 2
            ? 'medium'
            : 'weak',
      status: isDirect ? 'verified' : 'qualified',
      allowedUses: sentenceList(hit.allowedUses),
      forbiddenInferences: [
        ...sentenceList(hit.forbiddenInferences),
        ...(hit.publicationReadiness === 'historical_only'
          ? [
              'Cette preuve est historique : sa période doit rester explicite et elle ne décrit pas automatiquement la situation actuelle.',
            ]
          : []),
        ...(hit.publicationReadiness === 'property_check'
          ? [
              'Toute conclusion sur un bien particulier exige une vérification du bien.',
            ]
          : []),
        ...(hit.publicationReadiness === 'person_check'
          ? [
              'Toute conclusion sur une personne exige ses paramètres propres.',
            ]
          : []),
      ],
    };
  });

  const unknowns: StudioUnknown[] = [];

  for (const hit of hits) {
    if (hit.publicationReadiness === 'property_check') {
      unknowns.push({
        unknownId: 'U' + String(unknowns.length + 1).padStart(3, '0'),
        question:
          'Quelle est la situation réelle du bien pour ' +
          hit.evidenceId +
          ' ?',
        importance: 'medium',
        reason:
          'La règle générale peut être expliquée, mais l’application au bien doit être vérifiée.',
        blocking: false,
      });
    }

    if (hit.publicationReadiness === 'person_check') {
      unknowns.push({
        unknownId: 'U' + String(unknowns.length + 1).padStart(3, '0'),
        question:
          'Quels paramètres personnels sont nécessaires pour appliquer ' +
          hit.evidenceId +
          ' ?',
        importance: 'medium',
        reason:
          'La connaissance générale ne permet pas une conclusion individuelle.',
        blocking: false,
      });
    }
  }

  const verifiedClaims = claims.filter(
    (claim) => claim.status === 'verified',
  ).length;
  const qualifiedClaims = claims.filter(
    (claim) => claim.status === 'qualified',
  ).length;
  const blockingUnknown = unknowns.some(
    (unknown) => unknown.blocking,
  );

  return {
    pack: {
      sources,
      claims,
      unknowns,
      summary: {
        verifiedClaims,
        qualifiedClaims,
        insufficientClaims: 0,
        rejectedClaims: excluded.length,
        researchConfidence:
          verifiedClaims >= 3 && !blockingUnknown
            ? 'high'
            : claims.length > 0
              ? 'medium'
              : 'low',
        canPublish:
          verifiedClaims > 0 &&
          !blockingUnknown &&
          sources.length > 0,
        limitations: Array.from(
          new Set(
            claims.flatMap((claim) => claim.forbiddenInferences),
          ),
        ).slice(0, 12),
      },
    },
    evidenceIds: usable.map((hit) => hit.evidenceId),
    directEvidenceIds: direct.map((hit) => hit.evidenceId),
    conditionalEvidenceIds: conditional.map(
      (hit) => hit.evidenceId,
    ),
    excludedEvidenceIds: excluded.map(
      (hit) => hit.evidenceId,
    ),
  };
}
