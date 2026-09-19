import type { EvidenceDb } from './evidence-library';
import type { ContentTraceabilityManifest } from './content-traceability';

async function hashInput(value: string) {
  const normalized = value
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  const bytes = new TextEncoder().encode(normalized);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export type GenerationRunRecord = {
  generationId: string;
  artifactId?: string;
  inputText: string;
  pipeline: string;
  canonVersion: string;
  evidenceLibraryVersion: string;
  webUsed: boolean;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  evidenceIds: string[];
  rejectedEvidenceIds?: string[];
  requestId?: string;
};

export async function recordGenerationRun(
  db: EvidenceDb,
  record: GenerationRunRecord,
) {
  const inputHash = await hashInput(record.inputText);
  const sql = [
    'INSERT OR REPLACE INTO content_generation_runs (',
    'generation_id, artifact_id, input_hash, pipeline, canon_version,',
    'evidence_library_version, web_used, model, input_tokens, output_tokens, total_tokens,',
    'evidence_ids_json, rejected_evidence_ids_json, request_id',
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ].join(' ');

  await db
    .prepare(sql)
    .bind(
      record.generationId,
      record.artifactId || null,
      inputHash,
      record.pipeline,
      record.canonVersion,
      record.evidenceLibraryVersion,
      record.webUsed ? 1 : 0,
      record.model || null,
      Number.isFinite(record.inputTokens) ? record.inputTokens : null,
      Number.isFinite(record.outputTokens) ? record.outputTokens : null,
      Number.isFinite(record.totalTokens) ? record.totalTokens : null,
      JSON.stringify(Array.from(new Set(record.evidenceIds))),
      JSON.stringify(Array.from(new Set(record.rejectedEvidenceIds || []))),
      record.requestId || null,
    )
    .run();
}

type EvidenceSnapshot = {
  evidence_id: string;
  status: string | null;
  engine_use_class: string | null;
  next_review_date: string | null;
  verification_required_before_publication: number | null;
};

async function evidenceSnapshots(
  db: EvidenceDb,
  evidenceIds: string[],
) {
  const ids = Array.from(
    new Set(evidenceIds.filter(Boolean)),
  ).slice(0, 200);

  const map = new Map<string, EvidenceSnapshot>();
  if (!ids.length) return map;

  const placeholders = ids.map(() => '?').join(',');
  const rows = await db
    .prepare(
      [
        'SELECT evidence_id, status, engine_use_class, next_review_date,',
        'verification_required_before_publication',
        'FROM evidence WHERE evidence_id IN (' + placeholders + ')',
      ].join(' '),
    )
    .bind(...ids)
    .all<EvidenceSnapshot>();

  for (const row of rows.results || []) {
    map.set(row.evidence_id, row);
  }

  return map;
}

export async function persistTraceabilityManifest(
  db: EvidenceDb,
  manifest: ContentTraceabilityManifest,
  options: {
    status?: string;
    slug?: string;
    route?: string;
    notes?: string;
  } = {},
) {
  const artifactSql = [
    'INSERT OR REPLACE INTO content_artifacts (',
    'artifact_id, artifact_type, title, slug, route, family_id,',
    'canon_version, content_version, status, generated_at, notes',
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ].join(' ');

  await db
    .prepare(artifactSql)
    .bind(
      manifest.artifactId,
      manifest.artifactType,
      manifest.title,
      options.slug || null,
      options.route || null,
      manifest.familyId,
      manifest.canonVersion,
      manifest.contentVersion,
      options.status || 'DRAFT',
      manifest.generatedAt,
      options.notes || null,
    )
    .run();

  await db
    .prepare(
      'DELETE FROM content_evidence_dependencies WHERE artifact_id = ?',
    )
    .bind(manifest.artifactId)
    .run();

  const dependencyIds = Array.from(
    new Set(
      manifest.dependencies.map(
        (dependency) => dependency.evidenceId,
      ),
    ),
  );
  const snapshots = await evidenceSnapshots(
    db,
    dependencyIds,
  );

  const missingIds = dependencyIds.filter(
    (evidenceId) => !snapshots.has(evidenceId),
  );
  if (missingIds.length) {
    throw new Error(
      'Dépendances absentes de la bibliothèque active : ' +
        missingIds.join(', '),
    );
  }

  const forbiddenIds = dependencyIds.filter(
    (evidenceId) =>
      snapshots.get(evidenceId)?.engine_use_class ===
      'DO_NOT_USE',
  );
  if (forbiddenIds.length) {
    throw new Error(
      'Dépendances DO_NOT_USE interdites : ' +
        forbiddenIds.join(', '),
    );
  }

  for (const dependency of manifest.dependencies) {
    const snapshot = snapshots.get(
      dependency.evidenceId,
    );

    const dependencySql = [
      'INSERT OR REPLACE INTO content_evidence_dependencies (',
      'artifact_id, evidence_id, claim_id, dependency_role,',
      'evidence_library_version, evidence_status_snapshot,',
      'engine_use_class_snapshot, next_review_date_snapshot,',
      'verification_required_before_publication_snapshot, recorded_at',
      ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    ].join(' ');

    await db
      .prepare(dependencySql)
      .bind(
        manifest.artifactId,
        dependency.evidenceId,
        dependency.claimId || null,
        dependency.role,
        manifest.evidenceLibraryVersion,
        snapshot?.status || null,
        snapshot?.engine_use_class || null,
        snapshot?.next_review_date || null,
        snapshot?.verification_required_before_publication || 0,
      )
      .run();
  }
}

export async function queueEvidenceReview(
  db: EvidenceDb,
  evidenceId: string,
  reason: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING',
) {
  const rows = await db
    .prepare(
      'SELECT DISTINCT artifact_id FROM content_evidence_dependencies WHERE evidence_id = ?',
    )
    .bind(evidenceId)
    .all<{ artifact_id: string }>();

  const artifacts = rows.results || [];

  for (const artifact of artifacts) {
    const reviewId =
      'REVIEW-' + evidenceId + '-' + artifact.artifact_id;

    await db
      .prepare(
        [
          'INSERT OR IGNORE INTO content_review_queue (',
          'review_id, artifact_id, evidence_id, trigger_type, reason, severity, status',
          ") VALUES (?, ?, ?, 'EVIDENCE_CHANGE', ?, ?, 'OPEN')",
        ].join(' '),
      )
      .bind(
        reviewId,
        artifact.artifact_id,
        evidenceId,
        reason,
        severity,
      )
      .run();
  }

  return artifacts.map((item) => item.artifact_id);
}


export async function findImpactedContent(
  db: EvidenceDb,
  evidenceIds: string[],
) {
  const ids = Array.from(
    new Set(evidenceIds.filter(Boolean)),
  ).slice(0, 100);

  if (!ids.length) return [];

  const placeholders = ids.map(() => '?').join(',');

  const sql =
    'SELECT DISTINCT ' +
    'a.artifact_id, a.artifact_type, a.title, a.status, ' +
    'd.evidence_id, d.dependency_role ' +
    'FROM content_evidence_dependencies d ' +
    'JOIN content_artifacts a ON a.artifact_id = d.artifact_id ' +
    'WHERE d.evidence_id IN (' +
    placeholders +
    ') ' +
    'ORDER BY a.artifact_id, d.evidence_id';

  const rows = await db
    .prepare(sql)
    .bind(...ids)
    .all<{
      artifact_id: string;
      artifact_type: string;
      title: string;
      status: string;
      evidence_id: string;
      dependency_role: string;
    }>();

  return rows.results || [];
}


export async function findStaleContentDependencies(
  db: EvidenceDb,
  limit = 500,
) {
  const safeLimit = Math.max(1, Math.min(limit, 1000));

  const sql = [
    'SELECT',
    'a.artifact_id, a.artifact_type, a.title, a.status AS artifact_status,',
    'd.evidence_id, d.dependency_role,',
    'd.evidence_status_snapshot, e.status AS current_evidence_status,',
    'd.engine_use_class_snapshot, e.engine_use_class AS current_engine_use_class,',
    'd.next_review_date_snapshot, e.next_review_date AS current_next_review_date,',
    'd.verification_required_before_publication_snapshot,',
    'e.verification_required_before_publication AS current_verification_required_before_publication,',
    'CASE WHEN e.evidence_id IS NULL THEN 1 ELSE 0 END AS evidence_missing',
    'FROM content_evidence_dependencies d',
    'JOIN content_artifacts a ON a.artifact_id = d.artifact_id',
    'LEFT JOIN evidence e ON e.evidence_id = d.evidence_id',
    'WHERE',
    'e.evidence_id IS NULL',
    'OR COALESCE(d.evidence_status_snapshot, \'\') <> COALESCE(e.status, \'\')',
    'OR COALESCE(d.engine_use_class_snapshot, \'\') <> COALESCE(e.engine_use_class, \'\')',
    'OR COALESCE(d.next_review_date_snapshot, \'\') <> COALESCE(e.next_review_date, \'\')',
    'OR COALESCE(d.verification_required_before_publication_snapshot, 0)',
    '   <> COALESCE(e.verification_required_before_publication, 0)',
    'ORDER BY a.artifact_id, d.evidence_id',
    'LIMIT ?',
  ].join(' ');

  const rows = await db
    .prepare(sql)
    .bind(safeLimit)
    .all<{
      artifact_id: string;
      artifact_type: string;
      title: string;
      artifact_status: string;
      evidence_id: string;
      dependency_role: string;
      evidence_status_snapshot: string | null;
      current_evidence_status: string | null;
      engine_use_class_snapshot: string | null;
      current_engine_use_class: string | null;
      next_review_date_snapshot: string | null;
      current_next_review_date: string | null;
      verification_required_before_publication_snapshot: number;
      current_verification_required_before_publication: number | null;
      evidence_missing: number;
    }>();

  return rows.results || [];
}


function staleSeverity(row: {
  evidence_missing: number;
  current_engine_use_class: string | null;
  current_verification_required_before_publication: number | null;
}) {
  if (row.evidence_missing) return 'BLOCKING' as const;
  if (row.current_engine_use_class === 'DO_NOT_USE') {
    return 'BLOCKING' as const;
  }
  if (row.current_engine_use_class === 'REFRESH_REQUIRED') {
    return 'HIGH' as const;
  }
  if (row.current_verification_required_before_publication) {
    return 'HIGH' as const;
  }
  return 'MEDIUM' as const;
}

function staleReason(row: {
  evidence_id: string;
  evidence_missing: number;
  evidence_status_snapshot: string | null;
  current_evidence_status: string | null;
  engine_use_class_snapshot: string | null;
  current_engine_use_class: string | null;
  next_review_date_snapshot: string | null;
  current_next_review_date: string | null;
  verification_required_before_publication_snapshot: number;
  current_verification_required_before_publication: number | null;
}) {
  if (row.evidence_missing) {
    return (
      'La preuve ' +
      row.evidence_id +
      ' n’existe plus dans la bibliothèque active.'
    );
  }

  const changes: string[] = [];

  if (
    (row.evidence_status_snapshot || '') !==
    (row.current_evidence_status || '')
  ) {
    changes.push(
      'statut ' +
        (row.evidence_status_snapshot || '∅') +
        ' → ' +
        (row.current_evidence_status || '∅'),
    );
  }

  if (
    (row.engine_use_class_snapshot || '') !==
    (row.current_engine_use_class || '')
  ) {
    changes.push(
      'classe moteur ' +
        (row.engine_use_class_snapshot || '∅') +
        ' → ' +
        (row.current_engine_use_class || '∅'),
    );
  }

  if (
    (row.next_review_date_snapshot || '') !==
    (row.current_next_review_date || '')
  ) {
    changes.push(
      'revue ' +
        (row.next_review_date_snapshot || '∅') +
        ' → ' +
        (row.current_next_review_date || '∅'),
    );
  }

  if (
    Number(
      row.verification_required_before_publication_snapshot ||
        0,
    ) !==
    Number(
      row.current_verification_required_before_publication ||
        0,
    )
  ) {
    changes.push(
      'vérification avant publication ' +
        Number(
          row.verification_required_before_publication_snapshot ||
            0,
        ) +
        ' → ' +
        Number(
          row.current_verification_required_before_publication ||
            0,
        ),
    );
  }

  return (
    'La preuve ' +
    row.evidence_id +
    ' a changé depuis la création du contenu : ' +
    changes.join(' ; ')
  );
}

export async function syncStaleContentReviews(
  db: EvidenceDb,
  limit = 500,
) {
  const stale = await findStaleContentDependencies(
    db,
    limit,
  );

  const queued = new Set<string>();

  for (const row of stale) {
    const reviewId =
      'STALE-' +
      row.artifact_id +
      '-' +
      row.evidence_id;

    const reason = staleReason(row);
    const severity = staleSeverity(row);

    await db
      .prepare(
        [
          'INSERT INTO content_review_queue (',
          'review_id, artifact_id, evidence_id, trigger_type, reason, severity, status, detected_at',
          ") VALUES (?, ?, ?, 'EVIDENCE_STATE_CHANGE', ?, ?, 'OPEN', CURRENT_TIMESTAMP)",
          'ON CONFLICT(review_id) DO UPDATE SET',
          "reason=excluded.reason, severity=excluded.severity, status='OPEN',",
          'detected_at=CURRENT_TIMESTAMP, resolved_at=NULL, resolution=NULL',
        ].join(' '),
      )
      .bind(
        reviewId,
        row.artifact_id,
        row.evidence_id,
        reason,
        severity,
      )
      .run();

    queued.add(row.artifact_id);
  }

  return {
    staleDependencies: stale.length,
    queuedArtifacts: queued.size,
  };
}


export async function listOpenContentReviews(
  db: EvidenceDb,
  limit = 200,
) {
  const safeLimit = Math.max(1, Math.min(limit, 500));

  const rows = await db
    .prepare(
      [
        'SELECT',
        'q.review_id, q.artifact_id, q.evidence_id, q.trigger_type,',
        'q.reason, q.severity, q.status, q.detected_at,',
        'a.artifact_type, a.title, a.slug, a.route',
        'FROM content_review_queue q',
        'JOIN content_artifacts a ON a.artifact_id = q.artifact_id',
        "WHERE q.status = 'OPEN'",
        "ORDER BY CASE q.severity",
        "WHEN 'BLOCKING' THEN 1",
        "WHEN 'HIGH' THEN 2",
        "WHEN 'MEDIUM' THEN 3",
        'ELSE 4 END, q.detected_at DESC',
        'LIMIT ?',
      ].join(' '),
    )
    .bind(safeLimit)
    .all<{
      review_id: string;
      artifact_id: string;
      evidence_id: string | null;
      trigger_type: string;
      reason: string;
      severity: string;
      status: string;
      detected_at: string;
      artifact_type: string;
      title: string;
      slug: string | null;
      route: string | null;
    }>();

  return rows.results || [];
}

export async function resolveContentReview(
  db: EvidenceDb,
  reviewId: string,
  resolution: string,
) {
  const id = reviewId.trim();
  if (!id) return false;

  const review = await db
    .prepare(
      [
        'SELECT artifact_id, evidence_id, status',
        'FROM content_review_queue',
        'WHERE review_id=?',
      ].join(' '),
    )
    .bind(id)
    .first<{
      artifact_id: string;
      evidence_id: string | null;
      status: string;
    }>();

  if (!review || review.status !== 'OPEN') {
    return review?.status === 'RESOLVED';
  }

  await db
    .prepare(
      [
        'UPDATE content_review_queue',
        "SET status='RESOLVED', resolved_at=CURRENT_TIMESTAMP, resolution=?",
        "WHERE review_id=? AND status='OPEN'",
      ].join(' '),
    )
    .bind(resolution.slice(0, 2000), id)
    .run();

  if (review.evidence_id) {
    const snapshot = await db
      .prepare(
        [
          'SELECT status, engine_use_class, next_review_date,',
          'verification_required_before_publication',
          'FROM evidence WHERE evidence_id=?',
        ].join(' '),
      )
      .bind(review.evidence_id)
      .first<{
        status: string | null;
        engine_use_class: string | null;
        next_review_date: string | null;
        verification_required_before_publication: number | null;
      }>();

    if (snapshot) {
      await db
        .prepare(
          [
            'UPDATE content_evidence_dependencies SET',
            'evidence_status_snapshot=?,',
            'engine_use_class_snapshot=?,',
            'next_review_date_snapshot=?,',
            'verification_required_before_publication_snapshot=?,',
            'recorded_at=CURRENT_TIMESTAMP',
            'WHERE artifact_id=? AND evidence_id=?',
          ].join(' '),
        )
        .bind(
          snapshot.status || null,
          snapshot.engine_use_class || null,
          snapshot.next_review_date || null,
          snapshot.verification_required_before_publication || 0,
          review.artifact_id,
          review.evidence_id,
        )
        .run();
    }
  }

  const row = await db
    .prepare(
      'SELECT status FROM content_review_queue WHERE review_id=?',
    )
    .bind(id)
    .first<{ status: string }>();

  return row?.status === 'RESOLVED';
}


export async function getGenerationUsageSummary(
  db: EvidenceDb,
  days = 30,
) {
  const safeDays = Math.max(1, Math.min(days, 365));
  const modifier = '-' + safeDays + ' days';

  const overall = await db
    .prepare(
      [
        'SELECT',
        'COUNT(*) AS runs,',
        'COALESCE(SUM(input_tokens),0) AS input_tokens,',
        'COALESCE(SUM(output_tokens),0) AS output_tokens,',
        'COALESCE(SUM(total_tokens),0) AS total_tokens,',
        'COALESCE(SUM(CASE WHEN total_tokens = 0 THEN 1 ELSE 0 END),0) AS zero_token_runs,',
        'COALESCE(SUM(CASE WHEN web_used = 1 THEN 1 ELSE 0 END),0) AS web_runs',
        'FROM content_generation_runs',
        "WHERE generated_at >= datetime('now', ?)",
      ].join(' '),
    )
    .bind(modifier)
    .first<{
      runs: number;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      zero_token_runs: number;
      web_runs: number;
    }>();

  const byPipeline = await db
    .prepare(
      [
        'SELECT',
        'pipeline,',
        'COUNT(*) AS runs,',
        'COALESCE(SUM(input_tokens),0) AS input_tokens,',
        'COALESCE(SUM(output_tokens),0) AS output_tokens,',
        'COALESCE(SUM(total_tokens),0) AS total_tokens,',
        'COALESCE(SUM(CASE WHEN web_used = 1 THEN 1 ELSE 0 END),0) AS web_runs',
        'FROM content_generation_runs',
        "WHERE generated_at >= datetime('now', ?)",
        'GROUP BY pipeline',
        'ORDER BY runs DESC, pipeline ASC',
      ].join(' '),
    )
    .bind(modifier)
    .all<{
      pipeline: string;
      runs: number;
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
      web_runs: number;
    }>();

  return {
    days: safeDays,
    overall: overall ?? {
      runs: 0,
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      zero_token_runs: 0,
      web_runs: 0,
    },
    byPipeline: byPipeline.results ?? [],
  };
}
