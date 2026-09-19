export type EvidenceFreshness = 'fresh' | 'review_due' | 'stale' | 'unknown';

export type EngineUseClass =
  | 'REUSABLE_IMMEDIATELY'
  | 'HISTORICAL_ONLY'
  | 'REFRESH_REQUIRED'
  | 'VERIFY_PROPERTY'
  | 'VERIFY_PERSON'
  | 'DO_NOT_USE'
  | 'UNKNOWN';

export type PublicationReadiness =
  | 'direct'
  | 'historical_only'
  | 'refresh_required'
  | 'property_check'
  | 'person_check'
  | 'forbidden';

export type LibraryEvidence = {
  evidenceId: string;
  topic: string;
  subtopic: string;
  claim: string;
  value?: string;
  unit?: string;
  population?: string;
  geographicScopeType?: string;
  geographicScopeLabel?: string;
  geographicCode?: string;
  timePeriod?: string;
  sourcePublisher?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceTier?: number;
  status?: string;
  methodology?: string;
  allowedUses?: string;
  forbiddenInferences?: string;
  refreshPolicy?: string;
  nextReviewDate?: string;
  tags?: string;
  decisionUse?: string;
  origin?: string;
  evidenceKind?: string;
  sourceRegistryId?: string;
  engineUseClass: EngineUseClass;
  verificationRequiredForPropertyApplication: boolean;
  verificationRequiredForPersonApplication: boolean;
  verificationRequiredBeforePublication: boolean;
  freshness: EvidenceFreshness;
  publicationReadiness: PublicationReadiness;
  score: number;
};

export type EvidenceLibraryQuery = {
  text: string;
  geographicCodes?: string[];
  geographicLabels?: string[];
  topics?: string[];
  limit?: number;
};

type D1Result<T> = { results?: T[] };

export type EvidenceDb = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T>(): Promise<D1Result<T>>;
      first<T>(): Promise<T | null>;
      run(): Promise<unknown>;
    };
    all<T>(): Promise<D1Result<T>>;
    first<T>(): Promise<T | null>;
    run(): Promise<unknown>;
  };
};

const STOP_WORDS = new Set([
  'avec','dans','pour','plus','moins','quel','quelle','quels','quelles','quoi','comment','est','sont',
  'une','des','les','le','la','un','du','de','et','ou','mais','sur','par','aux','mes','vos','notre',
  'votre','leurs','leur','cela','cette','ces','immobilier','immobiliere','immobiliere','passe','fait'
]);

const GEO_ALIASES: Array<[RegExp, string, string]> = [
  [/\bchartres\b/i, '28085', 'Chartres'],
  [/\bl[eè]ves\b/i, '28209', 'Lèves'],
  [/\bluc[eé]\b/i, '28218', 'Lucé'],
  [/\bmainvilliers\b/i, '28229', 'Mainvilliers'],
  [/\bluisant\b/i, '28220', 'Luisant'],
  [/\ble coudray\b/i, '28110', 'Le Coudray'],
  [/\bchamphol\b/i, '28070', 'Champhol'],
];

const QUERY_EXPANSIONS: Array<[RegExp, string[]]> = [
  [/\b(m2|m²|metres? carres?|surface|espace|place|plan|piece|pieces)\b/i, ['surface','logement','piece','pieces']],
  [/\b(prix|cher|chere|ecart|valeur|vendre|vendu|vente)\b/i, ['prix','valeur','dvf','mutation','vente']],
  [/\b(distance|loin|trajet|mobilite|transport|gare|deplacement)\b/i, ['mobilite','transport','trajet','deplacement']],
  [/\b(dpe|energie|energetique|chauffage|isolation)\b/i, ['dpe','energie','chauffage','isolation']],
  [/\b(risque|inondation|argile|radon|pollution)\b/i, ['risque','georisques','exposition']],
  [/\b(copro|copropriete|charges|syndic)\b/i, ['copropriete','charges','syndic']],
  [/\b(credit|pret|ptz|financement|emprunt)\b/i, ['financement','pret','credit','ptz']],
  [/\b(travaux|renovation|humidite|toiture|ventilation)\b/i, ['travaux','renovation','batiment','pathologie']],
];

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function extractLibraryTokens(text: string) {
  const normalized = normalize(text);
  const base = normalized
    .split(/[^a-z0-9]+/)
    .filter((token) =>
      (token.length >= 3 || /^\d{2,}$/.test(token)) &&
      !STOP_WORDS.has(token),
    );

  const expanded: string[] = [];
  for (const [pattern, tokens] of QUERY_EXPANSIONS) {
    if (pattern.test(text)) expanded.push(...tokens);
  }

  return Array.from(new Set([...base, ...expanded])).slice(0, 14);
}

export function inferGeography(text: string) {
  const codes: string[] = [];
  const labels: string[] = [];
  for (const [pattern, code, label] of GEO_ALIASES) {
    if (pattern.test(text)) {
      codes.push(code);
      labels.push(label);
    }
  }
  return { codes, labels };
}

export function evidenceFreshness(
  nextReviewDate?: string,
  refreshPolicy?: string,
  engineUseClass?: EngineUseClass,
  now = new Date(),
): EvidenceFreshness {
  if (engineUseClass === 'REFRESH_REQUIRED') return 'stale';
  if ((refreshPolicy || '').toUpperCase() === 'STATIC') return 'fresh';
  if (!nextReviewDate) return 'unknown';

  const suffix = nextReviewDate.length === 10 ? 'T23:59:59Z' : '';
  const review = new Date(nextReviewDate + suffix);
  if (Number.isNaN(review.getTime())) return 'unknown';

  const deltaDays = (review.getTime() - now.getTime()) / 86_400_000;
  if (deltaDays >= 0) return 'fresh';
  if (deltaDays >= -60) return 'review_due';
  return 'stale';
}

function engineClass(value: unknown): EngineUseClass {
  const normalized = String(value || 'UNKNOWN').toUpperCase();
  if (
    normalized === 'REUSABLE_IMMEDIATELY' ||
    normalized === 'HISTORICAL_ONLY' ||
    normalized === 'REFRESH_REQUIRED' ||
    normalized === 'VERIFY_PROPERTY' ||
    normalized === 'VERIFY_PERSON' ||
    normalized === 'DO_NOT_USE'
  ) return normalized;
  return 'UNKNOWN';
}

function boolValue(value: unknown) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'True';
}

function readiness(
  useClass: EngineUseClass,
  verificationRequiredBeforePublication: boolean,
): PublicationReadiness {
  if (useClass === 'DO_NOT_USE') return 'forbidden';
  if (useClass === 'VERIFY_PROPERTY') return 'property_check';
  if (useClass === 'VERIFY_PERSON') return 'person_check';
  if (useClass === 'HISTORICAL_ONLY') return 'historical_only';
  if (useClass === 'REFRESH_REQUIRED' || verificationRequiredBeforePublication) {
    return 'refresh_required';
  }
  return 'direct';
}

function scoreRow(
  row: Record<string, unknown>,
  tokens: string[],
  geoCodes: string[],
  geoLabels: string[],
  historicalIntent: boolean,
) {
  const haystack = normalize(String(row.search_text || [
    row.topic,
    row.subtopic,
    row.claim,
    row.tags,
    row.allowed_uses,
    row.decision_use,
    row.geographic_scope_label,
  ].filter(Boolean).join(' ')));

  let score = 0;

  for (const token of tokens) {
    if (haystack.includes(token)) score += 3;
    if (normalize(String(row.topic || '')).includes(token)) score += 2;
    if (normalize(String(row.subtopic || '')).includes(token)) score += 1;
  }

  if (row.geographic_code && geoCodes.includes(String(row.geographic_code))) score += 8;
  if (
    row.geographic_scope_label &&
    geoLabels.some((label) =>
      normalize(String(row.geographic_scope_label)).includes(normalize(label)),
    )
  ) score += 5;

  const tier = Number(row.source_tier || 99);
  if (tier === 1) score += 4;
  else if (tier === 2) score += 1;

  const useClass = engineClass(row.engine_use_class);
  if (useClass === 'REUSABLE_IMMEDIATELY') score += 8;
  else if (useClass === 'HISTORICAL_ONLY') score += historicalIntent ? 6 : 1;
  else if (useClass === 'VERIFY_PROPERTY' || useClass === 'VERIFY_PERSON') score += 2;
  else if (useClass === 'REFRESH_REQUIRED') score -= 8;
  else if (useClass === 'DO_NOT_USE') score -= 100;

  const fresh = evidenceFreshness(
    row.next_review_date ? String(row.next_review_date) : undefined,
    row.refresh_policy ? String(row.refresh_policy) : undefined,
    useClass,
  );
  if (fresh === 'fresh') score += 3;
  if (fresh === 'review_due') score -= 1;
  if (fresh === 'stale') score -= 6;

  if (boolValue(row.verification_required_before_publication)) score -= 4;

  return score;
}

function isHistoricalIntent(text: string) {
  return /\b(historique|annee|année|202[0-9]|201[0-9]|avant|ancien|evolution|évolution)\b/i.test(text);
}

export async function searchEvidenceLibrary(
  db: EvidenceDb,
  query: EvidenceLibraryQuery,
): Promise<LibraryEvidence[]> {
  const text = query.text.trim();
  const tokens = extractLibraryTokens(text);
  const inferred = inferGeography(text);
  const geoCodes = Array.from(new Set([...(query.geographicCodes || []), ...inferred.codes]));
  const geoLabels = Array.from(new Set([...(query.geographicLabels || []), ...inferred.labels]));
  const topics = query.topics || [];
  const limit = Math.max(1, Math.min(query.limit || 24, 60));
  const historicalIntent = isHistoricalIntent(text);

  const where: string[] = [
    "COALESCE(engine_use_class,'REUSABLE_IMMEDIATELY') <> 'DO_NOT_USE'",
  ];
  const params: unknown[] = [];

  if (tokens.length) {
    const clauses: string[] = [];
    for (const token of tokens) {
      clauses.push("LOWER(COALESCE(search_text,'')) LIKE ?");
      params.push('%' + token + '%');
    }
    where.push('(' + clauses.join(' OR ') + ')');
  }

  if (geoCodes.length) {
    where.push(
      '(geographic_code IN (' +
        geoCodes.map(() => '?').join(',') +
        ") OR geographic_code IS NULL OR geographic_code = '')",
    );
    params.push(...geoCodes);
  }

  if (topics.length) {
    where.push('topic IN (' + topics.map(() => '?').join(',') + ')');
    params.push(...topics);
  }

  const sql =
    'SELECT evidence_id, topic, subtopic, claim, value, unit, population, ' +
    'geographic_scope_type, geographic_scope_label, geographic_code, time_period, ' +
    'source_publisher, source_title, source_url, source_tier, status, methodology, ' +
    'allowed_uses, forbidden_inferences, refresh_policy, next_review_date, tags, ' +
    'decision_use, origin, evidence_kind, source_registry_id, engine_use_class, ' +
    'verification_required_for_property_application, ' +
    'verification_required_for_person_application, ' +
    'verification_required_before_publication, search_text ' +
    'FROM evidence WHERE ' +
    where.join(' AND ') +
    ' LIMIT 240';

  const raw = await db.prepare(sql).bind(...params).all<Record<string, unknown>>();
  const rows = raw.results || [];

  return rows
    .map((row) => {
      const useClass = engineClass(row.engine_use_class);
      const beforePublication = boolValue(row.verification_required_before_publication);
      const fresh = evidenceFreshness(
        row.next_review_date ? String(row.next_review_date) : undefined,
        row.refresh_policy ? String(row.refresh_policy) : undefined,
        useClass,
      );

      return {
        evidenceId: String(row.evidence_id),
        topic: String(row.topic || ''),
        subtopic: String(row.subtopic || ''),
        claim: String(row.claim || ''),
        value: row.value == null ? undefined : String(row.value),
        unit: row.unit == null ? undefined : String(row.unit),
        population: row.population == null ? undefined : String(row.population),
        geographicScopeType:
          row.geographic_scope_type == null ? undefined : String(row.geographic_scope_type),
        geographicScopeLabel:
          row.geographic_scope_label == null ? undefined : String(row.geographic_scope_label),
        geographicCode:
          row.geographic_code == null ? undefined : String(row.geographic_code),
        timePeriod: row.time_period == null ? undefined : String(row.time_period),
        sourcePublisher:
          row.source_publisher == null ? undefined : String(row.source_publisher),
        sourceTitle:
          row.source_title == null ? undefined : String(row.source_title),
        sourceUrl:
          row.source_url == null ? undefined : String(row.source_url),
        sourceTier:
          row.source_tier == null ? undefined : Number(row.source_tier),
        status:
          row.status == null ? undefined : String(row.status),
        methodology:
          row.methodology == null ? undefined : String(row.methodology),
        allowedUses:
          row.allowed_uses == null ? undefined : String(row.allowed_uses),
        forbiddenInferences:
          row.forbidden_inferences == null ? undefined : String(row.forbidden_inferences),
        refreshPolicy:
          row.refresh_policy == null ? undefined : String(row.refresh_policy),
        nextReviewDate:
          row.next_review_date == null ? undefined : String(row.next_review_date),
        tags:
          row.tags == null ? undefined : String(row.tags),
        decisionUse:
          row.decision_use == null ? undefined : String(row.decision_use),
        origin:
          row.origin == null ? undefined : String(row.origin),
        evidenceKind:
          row.evidence_kind == null ? undefined : String(row.evidence_kind),
        sourceRegistryId:
          row.source_registry_id == null ? undefined : String(row.source_registry_id),
        engineUseClass: useClass,
        verificationRequiredForPropertyApplication:
          boolValue(row.verification_required_for_property_application),
        verificationRequiredForPersonApplication:
          boolValue(row.verification_required_for_person_application),
        verificationRequiredBeforePublication: beforePublication,
        freshness: fresh,
        publicationReadiness: readiness(useClass, beforePublication),
        score: scoreRow(row, tokens, geoCodes, geoLabels, historicalIntent),
      };
    })
    .filter((row) => row.score > 0 && row.publicationReadiness !== 'forbidden')
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function libraryCoverageSummary(hits: LibraryEvidence[]) {
  const direct = hits.filter((hit) => hit.publicationReadiness === 'direct');
  const historical = hits.filter((hit) => hit.publicationReadiness === 'historical_only');
  const refreshRequired = hits.filter((hit) => hit.publicationReadiness === 'refresh_required');
  const propertyCheck = hits.filter((hit) => hit.publicationReadiness === 'property_check');
  const personCheck = hits.filter((hit) => hit.publicationReadiness === 'person_check');

  const freshDirect = direct.filter((hit) => hit.freshness === 'fresh').length;
  const primaryDirect = direct.filter((hit) => hit.sourceTier === 1).length;
  const uniqueTopics = new Set(hits.map((hit) => hit.topic)).size;

  return {
    hits: hits.length,
    direct: direct.length,
    historical: historical.length,
    refreshRequired: refreshRequired.length,
    propertyCheck: propertyCheck.length,
    personCheck: personCheck.length,
    freshDirect,
    primaryDirect,
    uniqueTopics,
    candidateForWebSkip:
      direct.length >= 4 &&
      freshDirect >= 3 &&
      primaryDirect >= 2,
  };
}
