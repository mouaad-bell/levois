import type { CarouselRenderPackage, CarouselVisualAsset } from './carousel-render-contract';
import type { StudioProject } from './studio-schema';

export type AssetProductionMode =
  | 'real_source_required'
  | 'generated_explanatory_allowed'
  | 'programmatic'
  | 'editorial_texture';

export type VisualAssetTask = {
  taskId: string;
  slideNumber: number;
  assetId: string;
  kind: CarouselVisualAsset['kind'];
  requirement: string;
  mode: AssetProductionMode;
  reason: string;
  evidenceRefs: string[];
  qualifierRequired: boolean;
  canImplyPropertyFact: false;
  status: 'todo' | 'ready' | 'review';
};

function modeFor(
  asset: CarouselVisualAsset,
  requirement: string,
): AssetProductionMode {
  const text = requirement.toLowerCase();

  if (asset.kind === 'map' || asset.kind === 'data') {
    return 'programmatic';
  }

  if (asset.kind === 'photo') {
    if (text.includes('locale') || text.includes('réelle') || text.includes('reelle')) {
      return 'real_source_required';
    }
    return 'generated_explanatory_allowed';
  }

  if (asset.kind === 'plan') {
    if (
      text.includes('pédagog') ||
      text.includes('pedagog') ||
      text.includes('fictif') ||
      text.includes('schéma') ||
      text.includes('schema') ||
      text.includes('illustration')
    ) {
      return 'generated_explanatory_allowed';
    }
    return 'real_source_required';
  }

  if (asset.kind === 'document') {
    return 'real_source_required';
  }

  if (asset.kind === 'texture') {
    return 'editorial_texture';
  }

  return 'generated_explanatory_allowed';
}

function reasonFor(
  mode: AssetProductionMode,
  requirement: string,
) {
  if (mode === 'real_source_required') {
    return 'Le visuel peut être interprété comme une observation réelle : utiliser une source réelle et documentée.';
  }
  if (mode === 'programmatic') {
    return 'Le visuel doit expliquer une relation ou une donnée sans dépendre d’une image générée.';
  }
  if (mode === 'editorial_texture') {
    return 'La matière sert uniquement la composition et ne porte aucun fait immobilier.';
  }
  return (
    'Une illustration peut être générée si elle reste explicitement explicative/fictive et ne suggère aucun fait sur un bien réel : ' +
    requirement
  );
}

export function buildVisualAssetPlan(
  project: StudioProject,
  render: CarouselRenderPackage,
) {
  const tasks: VisualAssetTask[] = [];

  for (const slide of render.slides) {
    for (const assetId of slide.assetIds) {
      const asset = render.assets.find(
        (candidate) => candidate.assetId === assetId,
      );
      if (!asset) continue;

      const requirement = asset.label || asset.alt;
      const mode = modeFor(asset, requirement);
      const qualifierRequired =
        mode === 'generated_explanatory_allowed';

      tasks.push({
        taskId:
          'ASSET-TASK-' +
          project.projectId +
          '-' +
          String(slide.slideNumber).padStart(2, '0') +
          '-' +
          assetId,
        slideNumber: slide.slideNumber,
        assetId,
        kind: asset.kind,
        requirement,
        mode,
        reason: reasonFor(mode, requirement),
        evidenceRefs: asset.evidenceRefs,
        qualifierRequired,
        canImplyPropertyFact: false,
        status: asset.status === 'missing' ? 'todo' : 'ready',
      });
    }
  }

  const summary = {
    total: tasks.length,
    todo: tasks.filter((task) => task.status === 'todo').length,
    realSourceRequired: tasks.filter((task) => task.mode === 'real_source_required').length,
    programmatic: tasks.filter((task) => task.mode === 'programmatic').length,
    generatedAllowed: tasks.filter((task) => task.mode === 'generated_explanatory_allowed').length,
    editorialTexture: tasks.filter((task) => task.mode === 'editorial_texture').length,
  };

  return {
    planVersion: 'LEVOIS_VISUAL_ASSET_PLAN_V1' as const,
    projectId: project.projectId,
    summary,
    tasks,
  };
}
