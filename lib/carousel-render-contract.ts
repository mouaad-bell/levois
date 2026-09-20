import type { StoryboardSlide, StudioFamilyId } from './studio-schema';

export type VisualAssetStatus =
  | 'real_documented'
  | 'illustrative'
  | 'pedagogical_fiction'
  | 'generated_explanatory'
  | 'missing';

export type VisualAssetKind =
  | 'photo'
  | 'map'
  | 'plan'
  | 'timeline'
  | 'document'
  | 'data'
  | 'object'
  | 'texture'
  | 'none';

export type CarouselVisualAsset = {
  assetId: string;
  kind: VisualAssetKind;
  status: VisualAssetStatus;
  label?: string;
  source?: string;
  evidenceRefs: string[];
  alt: string;
  canImplyPropertyFact: boolean;
};

export type CarouselRenderSlide = {
  slideNumber: number;
  familyId: StudioFamilyId;
  layout: StoryboardSlide['layout'];
  headline: string;
  body: string;
  sourceLabel?: string;
  essentialQualifier?: string;
  assetIds: string[];
  evidenceRefs: string[];
};

export type CarouselRenderPackage = {
  renderVersion: 'CAROUSEL_RENDER_CONTRACT_V1';
  width: 1080;
  height: 1350;
  slides: CarouselRenderSlide[];
  assets: CarouselVisualAsset[];
};

export type RenderReadinessIssue = {
  slideNumber: number;
  severity: 'blocker' | 'review';
  reason: string;
};

function visibleQualifier(text: string) {
  return /cas fictif|cas pédagogique|cas pedagogique|simulation|historique|à vérifier|a verifier/i.test(
    text,
  );
}

export function reviewCarouselRender(
  render: CarouselRenderPackage,
): {
  ready: boolean;
  issues: RenderReadinessIssue[];
} {
  const assetById = new Map(
    render.assets.map((asset) => [asset.assetId, asset]),
  );
  const issues: RenderReadinessIssue[] = [];

  for (const slide of render.slides) {
    const assets = slide.assetIds
      .map((assetId) => assetById.get(assetId))
      .filter((asset): asset is CarouselVisualAsset => Boolean(asset));

    if (slide.assetIds.some((assetId) => !assetById.has(assetId))) {
      issues.push({
        slideNumber: slide.slideNumber,
        severity: 'blocker',
        reason: 'Asset référencé mais absent du package.',
      });
    }

    if (assets.some((asset) => asset.status === 'missing')) {
      issues.push({
        slideNumber: slide.slideNumber,
        severity: 'blocker',
        reason: 'Un asset nécessaire est encore manquant.',
      });
    }

    const fictionalAssets = assets.filter(
      (asset) =>
        asset.status === 'pedagogical_fiction' ||
        asset.status === 'generated_explanatory',
    );

    if (
      fictionalAssets.length &&
      !visibleQualifier(
        [
          slide.headline,
          slide.body,
          slide.sourceLabel,
          slide.essentialQualifier,
          ...fictionalAssets.map((asset) => asset.label),
        ]
          .filter(Boolean)
          .join(' '),
      )
    ) {
      issues.push({
        slideNumber: slide.slideNumber,
        severity: 'blocker',
        reason:
          'Une image fictive/générée explique le raisonnement mais son statut n’est pas visible.',
      });
    }

    if (
      assets.some(
        (asset) =>
          asset.status !== 'real_documented' &&
          asset.canImplyPropertyFact,
      )
    ) {
      issues.push({
        slideNumber: slide.slideNumber,
        severity: 'blocker',
        reason:
          'Un visuel non documenté est autorisé à suggérer un fait sur un bien réel.',
      });
    }

    const numeric = /\d/.test(slide.headline + ' ' + slide.body);
    if (
      numeric &&
      !slide.evidenceRefs.length &&
      !visibleQualifier(
        [
          slide.headline,
          slide.body,
          slide.essentialQualifier,
          slide.sourceLabel,
        ]
          .filter(Boolean)
          .join(' '),
      )
    ) {
      issues.push({
        slideNumber: slide.slideNumber,
        severity: 'review',
        reason:
          'Slide chiffrée sans evidenceRef ni statut pédagogique/historique visible.',
      });
    }

    if (slide.headline.length > 95) {
      issues.push({
        slideNumber: slide.slideNumber,
        severity: 'review',
        reason:
          'Titre long : vérifier la hiérarchie et la lisibilité réelle sur smartphone.',
      });
    }
  }

  return {
    ready: !issues.some((issue) => issue.severity === 'blocker'),
    issues,
  };
}
