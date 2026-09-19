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

export type RetrievalIntent =
  | 'surface_usage'
  | 'mobility'
  | 'price_value'
  | 'energy'
  | 'risk'
  | 'copro'
  | 'finance'
  | 'works'
  | 'generic';

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
  [/\b(m2|m²|metres? carres?|surface|espace|place|plan|piece|pieces|chambre|chambres)\b/i,
    ['surface','habitable','logement','piece','plan','usage']],
  [/\b(prix|cher|chere|ecart|valeur|vendre|vendu|vente|comparable|comparables)\b/i,
    ['prix','valeur','dvf','mutation','vente','fonciere','perimetre','vendu','affiche']],
  [/\b(distance|loin|trajet|mobilite|transport|gare|deplacement|soiree)\b/i,
    ['trajet','transport','deplacement','travail','actifs','commune','residence','emploi','act']],
  [/\b(dpe|energie|energetique|chauffage|isolation)\b/i,
    ['dpe','energie','chauffage','isolation']],
  [/\b(risque|inondation|argile|radon|pollution)\b/i,
    ['risque','georisques','exposition']],
  [/\b(copro|copropriete|charges|syndic)\b/i,
    ['copropriete','charges','syndic']],
  [/\b(credit|pret|ptz|financement|emprunt)\b/i,
    ['financement','pret','credit','ptz']],
  [/\b(travaux|renovation|humidite|toiture|ventilation)\b/i,
    ['travaux','renovation','batiment','pathologie']],
];

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function inferRetrievalIntent(text: string): RetrievalIntent {
  const q = normalize(text);

  if (/\b(surface|m2|metre carre|plan|piece|chambre|usage|espace)\b/.test(q)) {
    return 'surface_usage';
  }
  if (/\b(distance|loin|trajet|transport|gare|deplacement|soiree)\b/.test(q)) {
    return 'mobility';
  }
  if (/\b(prix|cher|ecart|valeur|vente|vendu|comparable|dvf)\b/.test(q)) {
    return 'price_value';
  }
  if (/\b(dpe|energie|chauffage|isolation)\b/.test(q)) return 'energy';
  if (/\b(risque|inondation|argile|radon|pollution)\b/.test(q)) return 'risk';
  if (/\b(copro|copropriete|charges|syndic)\b/.test(q)) return 'copro';
  if (/\b(credit|pret|ptz|financement|emprunt)\b/.test(q)) return 'finance';
  if (/\b(travaux|renovation|humidite|toiture|ventilation)\b/.test(q)) return 'works';

  return 'generic';
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

  return Array.from(new Set([...base, ...expanded])).slice(0, 20);
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
  ) {
    return normalized;
  }

  return 'UNKNOWN';
}

function boolValue(value: unknown) {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true' ||
    value === 'True'
  );
}

function readiness(
  useClass: EngineUseClass,
  verificationRequiredBeforePublication: boolean,
): PublicationReadiness {
  if (useClass === 'DO_NOT_USE') return 'forbidden';
  if (useClass === 'VERIFY_PROPERTY') return 'property_check';
  if (useClass === 'VERIFY_PERSON') return 'person_check';
  if (useClass === 'HISTORICAL_ONLY') return 'historical_only';

  if (
    useClass === 'REFRESH_REQUIRED' ||
    verificationRequiredBeforePublication
  ) {
    return 'refresh_required';
  }

  return 'direct';
}

function intentScore(
  row: Record<string, unknown>,
  intent: RetrievalIntent,
) {
  const topic = normalize(String(row.topic || ''));
  const subtopic = normalize(String(row.subtopic || ''));
  const claim = normalize(String(row.claim || ''));
  const decisionUse = normalize(String(row.decision_use || ''));
  const haystack = [topic, subtopic, claim, decisionUse].join(' ');

  if (intent === 'surface_usage') {
    let score = 0;
    if (subtopic.includes('surface')) score += 14;
    if (topic.includes('definition')) score += 9;
    if (claim.includes('surface habitable')) score += 12;
    if (claim.includes('surface du logement')) score += 8;
    if (topic.includes('urbanisme_local')) score -= 8;
    if (topic.includes('localisation') && !claim.includes('logement')) score -= 8;
    return score;
  }

  if (intent === 'mobility') {
    let score = 0;
    const geoType = normalize(String(row.geographic_scope_type || ''));
    if (subtopic === 'act') score += 16;
    if (geoType === 'bv2022' || geoType === 'aav2020') score += 5;
    if (topic.includes('insee') && claim.includes('lieu de travail')) score += 14;
    if (claim.includes('commune autre que') || claim.includes('commune de residence')) score += 10;
    if (topic.includes('localisation') && /(gare|transport|filibus|arret)/.test(haystack)) score += 8;
    if (topic === 'regulation' && subtopic.startsWith('mobilite_')) score -= 24;
    return score;
  }

  if (intent === 'price_value') {
    let score = 0;
    if (topic === 'dvf') score += 10;
    if (claim.includes('valeur fonciere')) score += 9;
    if (claim.includes('mutation')) score += 7;
    if (topic.includes('methodology') && /(prix|mutation|compar)/.test(haystack)) score += 15;
    if (topic.includes('definition') && /(mutation|valeur fonciere|dvf)/.test(haystack)) score += 13;
    if (subtopic.includes('asking') || subtopic.includes('price_per')) score += 14;
    return score;
  }

  if (intent === 'energy') {
    let score = 0;
    if (topic.includes('dpe')) score += 14;
    if (/(dpe|energie|chauffage|isolation)/.test(haystack)) score += 8;
    return score;
  }

  if (intent === 'risk') {
    let score = 0;
    if (topic.includes('risque')) score += 14;
    if (/(inondation|argile|radon|pollution|georisques)/.test(haystack)) score += 8;
    return score;
  }

  if (intent === 'copro') {
    let score = 0;
    if (/(copro|syndic|charges)/.test(haystack)) score += 12;
    return score;
  }

  if (intent === 'finance') {
    let score = 0;
    if (/(financement|credit|pret|ptz|hcsf)/.test(haystack)) score += 12;
    return score;
  }

  if (intent === 'works') {
    let score = 0;
    if (/(travaux|renovation|humidite|toiture|ventilation|pathologie)/.test(haystack)) score += 12;
    return score;
  }

  return 0;
}


function temporalScore(row: Record<string, unknown>) {
  const period = String(row.time_period || '');
  const years = period
    .match(/\b20\d{2}\b/g)
    ?.map((year) => Number(year))
    .filter((year) => Number.isFinite(year));

  if (!years?.length) return 0;

  const latest = Math.max(...years);
  if (latest >= 2025) return 5;
  if (latest === 2024) return 4.5;
  if (latest === 2023) return 4;
  if (latest === 2022) return 3;
  if (latest === 2021) return 2;
  return 0;
}

function scoreRow(
  row: Record<string, unknown>,
  tokens: string[],
  geoCodes: string[],
  geoLabels: string[],
  historicalIntent: boolean,
  intent: RetrievalIntent,
) {
  const haystack = normalize(
    String(
      row.search_text ||
        [
          row.topic,
          row.subtopic,
          row.claim,
          row.tags,
          row.allowed_uses,
          row.decision_use,
          row.geographic_scope_label,
        ]
          .filter(Boolean)
          .join(' '),
    ),
  );

  let score =
    intentScore(row, intent) +
    temporalScore(row);

  for (const token of tokens) {
    if (haystack.includes(token)) score += 3;
    if (normalize(String(row.topic || '')).includes(token)) score += 2;
    if (normalize(String(row.subtopic || '')).includes(token)) score += 1;
  }

  if (
    row.geographic_code &&
    geoCodes.includes(String(row.geographic_code))
  ) {
    score += 8;
  }

  if (
    row.geographic_scope_label &&
    geoLabels.some((label) =>
      normalize(String(row.geographic_scope_label)).includes(
        normalize(label),
      ),
    )
  ) {
    score += 5;
  }

  const tier = Number(row.source_tier || 99);
  if (tier === 1) score += 4;
  else if (tier === 2) score += 1;

  const useClass = engineClass(row.engine_use_class);
  if (useClass === 'REUSABLE_IMMEDIATELY') score += 8;
  else if (useClass === 'HISTORICAL_ONLY') {
    score += historicalIntent ? 6 : 1;
  } else if (
    useClass === 'VERIFY_PROPERTY' ||
    useClass === 'VERIFY_PERSON'
  ) {
    score += 2;
  } else if (useClass === 'REFRESH_REQUIRED') {
    score -= 8;
  } else if (useClass === 'DO_NOT_USE') {
    score -= 100;
  }

  const fresh = evidenceFreshness(
    row.next_review_date
      ? String(row.next_review_date)
      : undefined,
    row.refresh_policy
      ? String(row.refresh_policy)
      : undefined,
    useClass,
  );

  if (fresh === 'fresh') score += 3;
  if (fresh === 'review_due') score -= 1;
  if (fresh === 'stale') score -= 6;

  if (
    boolValue(
      row.verification_required_before_publication,
    )
  ) {
    score -= 4;
  }

  const ftsRank = Number(row.fts_rank);
  if (Number.isFinite(ftsRank) && ftsRank < 0) {
    score += Math.min(12, Math.max(0, -ftsRank / 1.8));
  }

  return score;
}

function isHistoricalIntent(text: string) {
  return /\b(historique|annee|année|202[0-9]|201[0-9]|avant|ancien|evolution|évolution)\b/i.test(
    text,
  );
}

function ftsQuery(tokens: string[]) {
  return tokens
    .filter((token) => /^[a-z0-9]+$/.test(token))
    .map((token) => '"' + token + '"')
    .join(' OR ');
}

function selectColumns(prefix: string) {
  return (
    prefix +
    '.evidence_id, ' +
    prefix +
    '.topic, ' +
    prefix +
    '.subtopic, ' +
    prefix +
    '.claim, ' +
    prefix +
    '.value, ' +
    prefix +
    '.unit, ' +
    prefix +
    '.population, ' +
    prefix +
    '.geographic_scope_type, ' +
    prefix +
    '.geographic_scope_label, ' +
    prefix +
    '.geographic_code, ' +
    prefix +
    '.time_period, ' +
    prefix +
    '.source_publisher, ' +
    prefix +
    '.source_title, ' +
    prefix +
    '.source_url, ' +
    prefix +
    '.source_tier, ' +
    prefix +
    '.status, ' +
    prefix +
    '.methodology, ' +
    prefix +
    '.allowed_uses, ' +
    prefix +
    '.forbidden_inferences, ' +
    prefix +
    '.refresh_policy, ' +
    prefix +
    '.next_review_date, ' +
    prefix +
    '.tags, ' +
    prefix +
    '.decision_use, ' +
    prefix +
    '.origin, ' +
    prefix +
    '.evidence_kind, ' +
    prefix +
    '.source_registry_id, ' +
    prefix +
    '.engine_use_class, ' +
    prefix +
    '.verification_required_for_property_application, ' +
    prefix +
    '.verification_required_for_person_application, ' +
    prefix +
    '.verification_required_before_publication, ' +
    prefix +
    '.search_text'
  );
}

async function queryWithFts(
  db: EvidenceDb,
  tokens: string[],
  topics: string[],
) {
  const query = ftsQuery(tokens);
  if (!query) return [] as Record<string, unknown>[];

  const where = [
    "COALESCE(e.engine_use_class,'REUSABLE_IMMEDIATELY') <> 'DO_NOT_USE'",
  ];
  const params: unknown[] = [query];

  if (topics.length) {
    where.push(
      'e.topic IN (' +
        topics.map(() => '?').join(',') +
        ')',
    );
    params.push(...topics);
  }

  const sql =
    'SELECT ' +
    selectColumns('e') +
    ', bm25(evidence_search) AS fts_rank ' +
    'FROM evidence_search ' +
    'JOIN evidence e ON e.evidence_id = evidence_search.evidence_id ' +
    'WHERE evidence_search MATCH ? AND ' +
    where.join(' AND ') +
    ' ORDER BY bm25(evidence_search) ' +
    'LIMIT 260';

  const raw = await db
    .prepare(sql)
    .bind(...params)
    .all<Record<string, unknown>>();

  return raw.results || [];
}

async function queryWithLike(
  db: EvidenceDb,
  tokens: string[],
  topics: string[],
) {
  const where: string[] = [
    "COALESCE(engine_use_class,'REUSABLE_IMMEDIATELY') <> 'DO_NOT_USE'",
  ];
  const params: unknown[] = [];

  if (tokens.length) {
    const clauses: string[] = [];

    for (const token of tokens) {
      clauses.push(
        "LOWER(COALESCE(search_text,'')) LIKE ?",
      );
      params.push('%' + token + '%');
    }

    where.push('(' + clauses.join(' OR ') + ')');
  }

  if (topics.length) {
    where.push(
      'topic IN (' +
        topics.map(() => '?').join(',') +
        ')',
    );
    params.push(...topics);
  }

  const sql =
    'SELECT ' +
    selectColumns('evidence') +
    ' FROM evidence WHERE ' +
    where.join(' AND ') +
    ' LIMIT 260';

  const raw = await db
    .prepare(sql)
    .bind(...params)
    .all<Record<string, unknown>>();

  return raw.results || [];
}

export async function searchEvidenceLibrary(
  db: EvidenceDb,
  query: EvidenceLibraryQuery,
): Promise<LibraryEvidence[]> {
  const text = query.text.trim();
  const tokens = extractLibraryTokens(text);
  const intent = inferRetrievalIntent(text);
  const inferred = inferGeography(text);

  const geoCodes = Array.from(
    new Set([
      ...(query.geographicCodes || []),
      ...inferred.codes,
    ]),
  );

  const geoLabels = Array.from(
    new Set([
      ...(query.geographicLabels || []),
      ...inferred.labels,
    ]),
  );

  const topics = query.topics || [];
  const limit = Math.max(
    1,
    Math.min(query.limit || 24, 60),
  );
  const historicalIntent = isHistoricalIntent(text);

  let rows: Record<string, unknown>[] = [];

  try {
    rows = await queryWithFts(db, tokens, topics);
  } catch {
    rows = await queryWithLike(db, tokens, topics);
  }

  return rows
    .map((row) => {
      const useClass = engineClass(
        row.engine_use_class,
      );
      const beforePublication = boolValue(
        row.verification_required_before_publication,
      );
      const fresh = evidenceFreshness(
        row.next_review_date
          ? String(row.next_review_date)
          : undefined,
        row.refresh_policy
          ? String(row.refresh_policy)
          : undefined,
        useClass,
      );

      return {
        evidenceId: String(row.evidence_id),
        topic: String(row.topic || ''),
        subtopic: String(row.subtopic || ''),
        claim: String(row.claim || ''),
        value:
          row.value == null
            ? undefined
            : String(row.value),
        unit:
          row.unit == null
            ? undefined
            : String(row.unit),
        population:
          row.population == null
            ? undefined
            : String(row.population),
        geographicScopeType:
          row.geographic_scope_type == null
            ? undefined
            : String(row.geographic_scope_type),
        geographicScopeLabel:
          row.geographic_scope_label == null
            ? undefined
            : String(row.geographic_scope_label),
        geographicCode:
          row.geographic_code == null
            ? undefined
            : String(row.geographic_code),
        timePeriod:
          row.time_period == null
            ? undefined
            : String(row.time_period),
        sourcePublisher:
          row.source_publisher == null
            ? undefined
            : String(row.source_publisher),
        sourceTitle:
          row.source_title == null
            ? undefined
            : String(row.source_title),
        sourceUrl:
          row.source_url == null
            ? undefined
            : String(row.source_url),
        sourceTier:
          row.source_tier == null
            ? undefined
            : Number(row.source_tier),
        status:
          row.status == null
            ? undefined
            : String(row.status),
        methodology:
          row.methodology == null
            ? undefined
            : String(row.methodology),
        allowedUses:
          row.allowed_uses == null
            ? undefined
            : String(row.allowed_uses),
        forbiddenInferences:
          row.forbidden_inferences == null
            ? undefined
            : String(row.forbidden_inferences),
        refreshPolicy:
          row.refresh_policy == null
            ? undefined
            : String(row.refresh_policy),
        nextReviewDate:
          row.next_review_date == null
            ? undefined
            : String(row.next_review_date),
        tags:
          row.tags == null
            ? undefined
            : String(row.tags),
        decisionUse:
          row.decision_use == null
            ? undefined
            : String(row.decision_use),
        origin:
          row.origin == null
            ? undefined
            : String(row.origin),
        evidenceKind:
          row.evidence_kind == null
            ? undefined
            : String(row.evidence_kind),
        sourceRegistryId:
          row.source_registry_id == null
            ? undefined
            : String(row.source_registry_id),
        engineUseClass: useClass,
        verificationRequiredForPropertyApplication:
          boolValue(
            row.verification_required_for_property_application,
          ),
        verificationRequiredForPersonApplication:
          boolValue(
            row.verification_required_for_person_application,
          ),
        verificationRequiredBeforePublication:
          beforePublication,
        freshness: fresh,
        publicationReadiness: readiness(
          useClass,
          beforePublication,
        ),
        score: scoreRow(
          row,
          tokens,
          geoCodes,
          geoLabels,
          historicalIntent,
          intent,
        ),
      };
    })
    .filter(
      (row) =>
        row.score > 0 &&
        row.publicationReadiness !== 'forbidden',
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function libraryCoverageSummary(
  hits: LibraryEvidence[],
) {
  const direct = hits.filter(
    (hit) => hit.publicationReadiness === 'direct',
  );
  const historical = hits.filter(
    (hit) =>
      hit.publicationReadiness ===
      'historical_only',
  );
  const refreshRequired = hits.filter(
    (hit) =>
      hit.publicationReadiness ===
      'refresh_required',
  );
  const propertyCheck = hits.filter(
    (hit) =>
      hit.publicationReadiness ===
      'property_check',
  );
  const personCheck = hits.filter(
    (hit) =>
      hit.publicationReadiness ===
      'person_check',
  );

  const freshDirect = direct.filter(
    (hit) => hit.freshness === 'fresh',
  ).length;
  const primaryDirect = direct.filter(
    (hit) => hit.sourceTier === 1,
  ).length;
  const strongDirect = direct.filter(
    (hit) => hit.score >= 15,
  ).length;
  const topDirectScore = direct.length
    ? Math.max(...direct.map((hit) => hit.score))
    : 0;
  const uniqueTopics = new Set(
    hits.map((hit) => hit.topic),
  ).size;

  return {
    hits: hits.length,
    direct: direct.length,
    historical: historical.length,
    refreshRequired: refreshRequired.length,
    propertyCheck: propertyCheck.length,
    personCheck: personCheck.length,
    freshDirect,
    primaryDirect,
    strongDirect,
    topDirectScore,
    uniqueTopics,
    candidateForWebSkip:
      strongDirect >= 4 &&
      freshDirect >= 4 &&
      primaryDirect >= 3 &&
      topDirectScore >= 18,
  };
}
