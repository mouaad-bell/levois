import type { EvidenceDb } from './evidence-library';
import type { ContentTraceabilityManifest } from './content-traceability';

export type GenerationRunRecord = {
  generationId: string;
  artifactId?: string;
  inputText: string;
  pipeline: string;
  canonVersion: string;
  evidenceLibraryVersion: string;
  webUsed: boolean;
  model?: string;
  evidenceIds: string[];
  rejectedEvidenceIds?: string[];
  requestId?: string;
};

export async function recordGenerationRun(
  db: EvidenceDb,
  record: GenerationRunRecord,
) {
  const sql = [
    'INSERT OR REPLACE INTO content_generation_runs (',
    'generation_id, artifact_id, input_text, pipeline, canon_version,',
    'evidence_library_version, web_used, model, evidence_ids_json,',
    'rejected_evidence_ids_json, request_id',
    ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  ].join(' ');

  await db
    .prepare(sql)
    .bind(
      record.generationId,
      record.artifactId || null,
      record.inputText,
      record.pipeline,
      record.canonVersion,
      record.evidenceLibraryVersion,
      record.webUsed ? 1 : 0,
      record.model || null,
      JSON.stringify(Array.from(new Set(record.evidenceIds))),
      JSON.stringify(Array.from(new Set(record.rejectedEvidenceIds || []))),
      record.requestId || null,
    )
    .run();
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

  for (const dependency of manifest.dependencies) {
    const dependencySql = [
      'INSERT OR REPLACE INTO content_evidence_dependencies (',
      'artifact_id, evidence_id, claim_id, dependency_role,',
      'evidence_library_version, recorded_at',
      ') VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
    ].join(' ');

    await db
      .prepare(dependencySql)
      .bind(
        manifest.artifactId,
        dependency.evidenceId,
        dependency.claimId || null,
        dependency.role,
        manifest.evidenceLibraryVersion,
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
