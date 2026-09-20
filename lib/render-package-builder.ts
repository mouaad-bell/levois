import type {
  CarouselRenderPackage,
  CarouselVisualAsset,
  VisualAssetKind,
} from './carousel-render-contract';
import type {
  StudioProject,
  StoryboardSlide,
} from './studio-schema';

function kindFromRequirement(
  requirement: string,
): VisualAssetKind {
  const value = requirement.toLowerCase();

  if (value.includes('photo') || value.includes('photographie')) return 'photo';
  if (value.includes('chronologie') || value.includes('horaire') || value.includes('timeline')) return 'timeline';
  if (value.includes('carte') || value.includes('territoire') || value.includes('trajet')) return 'map';
  if (value.includes('plan') || value.includes('pièce') || value.includes('piece')) return 'plan';
  if (value.includes('document') || value.includes('dossier') || value.includes('devis')) return 'document';
  if (value.includes('donnée') || value.includes('data') || value.includes('chiffre') || value.includes('prix')) return 'data';
  if (value.includes('matière') || value.includes('texture')) return 'texture';
  return 'object';
}

function qualifierFromSlide(
  slide: StoryboardSlide,
) {
  const text = [slide.sourceLabel, slide.headline, slide.body]
    .filter(Boolean)
    .join(' ');

  const match = text.match(
    /(CAS FICTIF|CAS PÉDAGOGIQUE|CAS PEDAGOGIQUE|SIMULATION|HISTORIQUE|À VÉRIFIER|A VERIFIER)/i,
  );

  return match?.[0]?.toUpperCase();
}

function evidenceRefsForSlide(
  project: StudioProject,
  slide: StoryboardSlide,
) {
  const refs = new Set<string>();

  for (const claimId of slide.claimRefs) {
    const claim = project.evidencePack.claims.find(
      (candidate) => candidate.claimId === claimId,
    );

    for (const evidenceId of claim?.evidenceRefs ?? []) {
      refs.add(evidenceId);
    }
  }

  return [...refs];
}

function slideAssets(
  slide: StoryboardSlide,
  evidenceRefs: string[],
) {
  return slide.assetRequirements.map(
    (requirement, index): CarouselVisualAsset => ({
      assetId:
        'SLIDE-' +
        String(slide.slideNumber).padStart(2, '0') +
        '-ASSET-' +
        String(index + 1).padStart(2, '0'),
      kind: kindFromRequirement(requirement),
      status: 'missing',
      label: requirement,
      source: 'À fournir avant rendu final',
      evidenceRefs,
      alt:
        'Asset requis pour la slide ' +
        slide.slideNumber +
        ' : ' +
        requirement,
      canImplyPropertyFact: false,
    }),
  );
}

/**
 * Convertit un storyboard Studio en contrat de rendu structurel.
 *
 * Les assets demandés restent volontairement marqués missing :
 * cette fonction permet de prévisualiser la hiérarchie du contenu
 * sans faire croire qu'une photo, une carte ou un plan final a déjà
 * été documenté et validé.
 */
export function buildStructuralRenderPackage(
  project: StudioProject,
): CarouselRenderPackage {
  const assets: CarouselVisualAsset[] = [];

  const slides = project.storyboard.slides.map((slide) => {
    const evidenceRefs = evidenceRefsForSlide(project, slide);
    const requiredAssets = slideAssets(slide, evidenceRefs);

    assets.push(...requiredAssets);

    return {
      slideNumber: slide.slideNumber,
      familyId: project.family.id,
      layout: slide.layout,
      headline: slide.headline,
      body: slide.body,
      sourceLabel: slide.sourceLabel,
      essentialQualifier: qualifierFromSlide(slide),
      assetIds: requiredAssets.map((asset) => asset.assetId),
      evidenceRefs,
    };
  });

  return {
    renderVersion: 'CAROUSEL_RENDER_CONTRACT_V1',
    width: 1080,
    height: 1350,
    slides,
    assets,
  };
}
