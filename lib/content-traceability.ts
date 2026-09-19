import type { StudioProject } from './studio-schema';

export type ContentArtifactType =
  | 'article'
  | 'carousel'
  | 'video'
  | 'site_experience';

export type EvidenceDependencyRole =
  | 'central'
  | 'context'
  | 'limit'
  | 'method'
  | 'visual'
  | 'other';

export type ContentDependency = {
  evidenceId: string;
  claimId?: string;
  role: EvidenceDependencyRole;
};

export type ContentTraceabilityManifest = {
  artifactId: string;
  artifactType: ContentArtifactType;
  title: string;
  familyId: string;
  canonVersion: string;
  contentVersion: string;
  evidenceLibraryVersion: 'V21';
  generatedAt: string;
  input: string;
  dependencies: ContentDependency[];
  rejectedEvidenceIds: string[];
  webUsed: boolean;
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).toUpperCase();
}

function uniqueDependencies(items: ContentDependency[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key =
      item.evidenceId +
      '|' +
      (item.claimId ?? '') +
      '|' +
      item.role;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function claimDependencies(
  project: StudioProject,
  claimIds: string[],
  role: EvidenceDependencyRole,
) {
  const wanted = new Set(claimIds);
  return project.evidencePack.claims
    .filter((claim) => wanted.has(claim.claimId))
    .flatMap((claim) =>
      (claim.evidenceRefs ?? []).map((evidenceId) => ({
        evidenceId,
        claimId: claim.claimId,
        role,
      })),
    );
}

export function buildTraceabilityManifest(
  project: StudioProject,
  artifactType: ContentArtifactType,
  options: {
    contentVersion?: string;
    rejectedEvidenceIds?: string[];
    webUsed?: boolean;
  } = {},
): ContentTraceabilityManifest {
  const selectedAngle =
    project.angles.find((angle) => angle.selected) ??
    project.angles[0];

  const centralClaimIds = selectedAngle?.claimRefs ?? [];
  const articleClaimIds =
    project.articleMaster.sections.flatMap(
      (section) => section.claimRefs,
    );
  const storyboardClaimIds =
    project.storyboard.slides.flatMap(
      (slide) => slide.claimRefs,
    );

  const limitClaimIds = project.articleMaster.sections
    .filter((section) => section.type === 'limits')
    .flatMap((section) => section.claimRefs);

  const dependencies = uniqueDependencies([
    ...claimDependencies(
      project,
      centralClaimIds,
      'central',
    ),
    ...claimDependencies(
      project,
      articleClaimIds,
      'context',
    ),
    ...claimDependencies(
      project,
      storyboardClaimIds,
      'visual',
    ),
    ...claimDependencies(
      project,
      limitClaimIds,
      'limit',
    ),
  ]);

  const contentVersion =
    options.contentVersion ?? 'draft-1';
  const title =
    project.articleMaster.workingTitle ||
    project.scope.decisionQuestion;
  const artifactId =
    'LEV-CONT-' +
    stableHash(
      [
        artifactType,
        project.projectId,
        contentVersion,
        title,
      ].join('|'),
    );

  return {
    artifactId,
    artifactType,
    title,
    familyId: project.family.id,
    canonVersion:
      project.canon?.canonVersion ?? 'missing',
    contentVersion,
    evidenceLibraryVersion: 'V21',
    generatedAt: project.generatedAt,
    input: project.input.rawInput,
    dependencies,
    rejectedEvidenceIds:
      options.rejectedEvidenceIds ?? [],
    webUsed: options.webUsed ?? false,
  };
}

export function impactedArtifacts(
  changedEvidenceIds: string[],
  manifests: ContentTraceabilityManifest[],
) {
  const changed = new Set(changedEvidenceIds);
  return manifests.filter((manifest) =>
    manifest.dependencies.some((dependency) =>
      changed.has(dependency.evidenceId),
    ),
  );
}
