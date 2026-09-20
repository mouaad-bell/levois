import type { EvidenceDb } from './evidence-library';

const CACHE_TTL_DAYS = 30;

function normalizedInput(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function buildEditorialCacheKey(input: {
  rawInput: string;
  model: string;
  canonVersion: string;
  evidenceLibraryVersion: string;
  evidencePack: unknown;
}) {
  const material = JSON.stringify({
    input: normalizedInput(input.rawInput),
    model: input.model,
    canonVersion: input.canonVersion,
    evidenceLibraryVersion: input.evidenceLibraryVersion,
    evidencePack: input.evidencePack,
  });

  return sha256(material);
}

export async function getEditorialCache<T>(
  db: EvidenceDb,
  cacheKey: string,
): Promise<T | null> {
  const row = await db
    .prepare(
      [
        'SELECT bundle_json FROM studio_editorial_cache',
        'WHERE cache_key=? AND expires_at > CURRENT_TIMESTAMP',
      ].join(' '),
    )
    .bind(cacheKey)
    .first<{ bundle_json: string }>();

  if (!row?.bundle_json) return null;

  try {
    return JSON.parse(row.bundle_json) as T;
  } catch {
    return null;
  }
}

export async function putEditorialCache(
  db: EvidenceDb,
  input: {
    cacheKey: string;
    model: string;
    canonVersion: string;
    evidenceLibraryVersion: string;
    bundle: unknown;
  },
) {
  // Opportunistic cleanup keeps the table bounded without a scheduler.
  await db
    .prepare(
      'DELETE FROM studio_editorial_cache WHERE expires_at <= CURRENT_TIMESTAMP',
    )
    .run();

  await db
    .prepare(
      [
        'INSERT OR REPLACE INTO studio_editorial_cache (',
        'cache_key, model, canon_version, evidence_library_version,',
        'bundle_json, created_at, expires_at',
        ') VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP,',
        "datetime('now', '+" + CACHE_TTL_DAYS + " days'))",
      ].join(' '),
    )
    .bind(
      input.cacheKey,
      input.model,
      input.canonVersion,
      input.evidenceLibraryVersion,
      JSON.stringify(input.bundle),
    )
    .run();
}

export async function clearEditorialCache(
  db: EvidenceDb,
) {
  await db
    .prepare('DELETE FROM studio_editorial_cache')
    .run();
}
