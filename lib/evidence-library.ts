export type EvidenceFreshness = 'fresh' | 'review_due' | 'stale' | 'unknown';

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
  freshness: EvidenceFreshness;
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
  'votre','leurs','leur','cela','cette','ces','immobilier','immobiliere','immobiliere'
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

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function extractLibraryTokens(text: string) {
  return Array.from(
    new Set(
      normalize(text)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
    ),
  ).slice(0, 8);
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
  now = new Date(),
): EvidenceFreshness {
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

function scoreRow(
  row: Record<string, unknown>,
  tokens: string[],
  geoCodes: string[],
  geoLabels: string[],
) {
  const haystack = normalize([
    row.topic,
    row.subtopic,
    row.claim,
    row.tags,
    row.allowed_uses,
    row.geographic_scope_label,
  ].filter(Boolean).join(' '));

  let score = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) score += 3;
    if (normalize(String(row.topic || '')).includes(token)) score += 2;
    if (normalize(String(row.subtopic || '')).includes(token)) score += 1;
  }

  if (row.geographic_code && geoCodes.includes(String(row.geographic_code))) score += 7;
  if (
    row.geographic_scope_label &&
    geoLabels.some((label) =>
      normalize(String(row.geographic_scope_label)).includes(normalize(label)),
    )
  ) score += 4;

  if (String(row.status || '').toUpperCase() === 'VERIFIED') score += 3;

  const tier = Number(row.source_tier || 99);
  if (tier === 1) score += 3;
  else if (tier === 2) score += 1;

  const freshness = evidenceFreshness(
    row.next_review_date ? String(row.next_review_date) : undefined,
    row.refresh_policy ? String(row.refresh_policy) : undefined,
  );
  if (freshness === 'fresh') score += 2;
  if (freshness === 'stale') score -= 5;

  return score;
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

  const where: string[] = [
    "UPPER(COALESCE(status,'')) IN ('VERIFIED','QUALIFIED','CURRENT','ACTIVE')",
  ];
  const params: unknown[] = [];

  if (tokens.length) {
    const textClauses: string[] = [];
    for (const token of tokens) {
      const like = '%' + token + '%';
      textClauses.push(
        "(LOWER(claim) LIKE ? OR LOWER(topic) LIKE ? OR LOWER(COALESCE(subtopic,'')) LIKE ? OR LOWER(COALESCE(tags,'')) LIKE ? OR LOWER(COALESCE(allowed_uses,'')) LIKE ?)",
      );
      params.push(like, like, like, like, like);
    }
    where.push('(' + textClauses.join(' OR ') + ')');
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
    'allowed_uses, forbidden_inferences, refresh_policy, next_review_date, tags ' +
    'FROM evidence WHERE ' +
    where.join(' AND ') +
    ' LIMIT 180';

  const raw = await db.prepare(sql).bind(...params).all<Record<string, unknown>>();
  const rows = raw.results || [];

  return rows
    .map((row) => {
      const freshness = evidenceFreshness(
        row.next_review_date ? String(row.next_review_date) : undefined,
        row.refresh_policy ? String(row.refresh_policy) : undefined,
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
          row.geographic_scope_type == null
            ? undefined
            : String(row.geographic_scope_type),
        geographicScopeLabel:
          row.geographic_scope_label == null
            ? undefined
            : String(row.geographic_scope_label),
        geographicCode:
          row.geographic_code == null ? undefined : String(row.geographic_code),
        timePeriod: row.time_period == null ? undefined : String(row.time_period),
        sourcePublisher:
          row.source_publisher == null ? undefined : String(row.source_publisher),
        sourceTitle:
          row.source_title == null ? undefined : String(row.source_title),
        sourceUrl: row.source_url == null ? undefined : String(row.source_url),
        sourceTier:
          row.source_tier == null ? undefined : Number(row.source_tier),
        status: row.status == null ? undefined : String(row.status),
        methodology:
          row.methodology == null ? undefined : String(row.methodology),
        allowedUses:
          row.allowed_uses == null ? undefined : String(row.allowed_uses),
        forbiddenInferences:
          row.forbidden_inferences == null
            ? undefined
            : String(row.forbidden_inferences),
        refreshPolicy:
          row.refresh_policy == null ? undefined : String(row.refresh_policy),
        nextReviewDate:
          row.next_review_date == null ? undefined : String(row.next_review_date),
        tags: row.tags == null ? undefined : String(row.tags),
        freshness,
        score: scoreRow(row, tokens, geoCodes, geoLabels),
      };
    })
    .filter((row) => row.score > 0 && row.freshness !== 'stale')
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function libraryCoverageSummary(hits: LibraryEvidence[]) {
  const fresh = hits.filter((hit) => hit.freshness === 'fresh').length;
  const primary = hits.filter((hit) => hit.sourceTier === 1).length;
  const uniqueTopics = new Set(hits.map((hit) => hit.topic)).size;

  return {
    hits: hits.length,
    fresh,
    primary,
    uniqueTopics,
    candidateForWebSkip:
      hits.length >= 6 && fresh >= 4 && primary >= 2,
  };
}
