import { buildAnswerPageBrief } from './answers-engine';
import { buildDistributionBrief } from './distribution-brief';
import { runSeoPublicationGate } from './seo-publication-gate';
import { buildContentAnalyticsPlan } from './content-analytics-plan';
import { reviewCanon } from './canon-review';
import { buildTraceabilityManifest } from './content-traceability';
import { buildStructuralRenderPackage } from './render-package-builder';
import { reviewCarouselRender } from './carousel-render-contract';
import { buildVisualAssetPlan } from './visual-asset-plan';
import { buildImageGenerationBrief } from './image-generation-brief';
import type { StudioProject } from './studio-schema';
import { buildVulgarisationBrief } from './vulgarisation-engine';

export type PublicationPackageStatus =
  | 'blocked'
  | 'editorial_review'
  | 'render_review'
  | 'ready_for_human_approval';

export type PublicationPackage = {
  packageVersion: 'LEVOIS_PUBLICATION_PACKAGE_V1';
  projectId: string;
  status: PublicationPackageStatus;
  generatedAt: string;
  blockers: string[];
  warnings: string[];
  canon: ReturnType<typeof reviewCanon>;
  article: ReturnType<typeof buildAnswerPageBrief>;
  carousel: ReturnType<typeof buildVulgarisationBrief>;
  distribution: ReturnType<typeof buildDistributionBrief>;
  seo: ReturnType<typeof runSeoPublicationGate>;
  analytics: ReturnType<typeof buildContentAnalyticsPlan>;
  render: {
    package: ReturnType<typeof buildStructuralRenderPackage>;
    review: ReturnType<typeof reviewCarouselRender>;
    assetPlan: ReturnType<typeof buildVisualAssetPlan>;
    imageBriefs: ReturnType<typeof buildImageGenerationBrief>[];
  };
  traceability: {
    article: ReturnType<typeof buildTraceabilityManifest>;
    carousel: ReturnType<typeof buildTraceabilityManifest>;
  };
};

function deriveStatus(
  project: StudioProject,
  canon: ReturnType<typeof reviewCanon>,
  carousel: ReturnType<typeof buildVulgarisationBrief>,
  renderReview: ReturnType<typeof reviewCarouselRender>,
  blockers: string[],
): PublicationPackageStatus {
  if (
    project.status !== 'storyboard_ready' ||
    !project.evidencePack.summary.canPublish ||
    blockers.length > 0
  ) {
    return 'blocked';
  }

  if (!canon.ready) return 'editorial_review';

  if (
    !carousel.qualityGate.mobileReadability ||
    carousel.canonReview.items.find(
      (item) => item.id === 'format',
    )?.status !== 'pass' ||
    carousel.simplifications.length > 0 ||
    !renderReview.ready
  ) {
    return 'render_review';
  }

  return 'ready_for_human_approval';
}

export function buildPublicationPackage(
  project: StudioProject,
  options: {
    webUsed?: boolean;
    rejectedEvidenceIds?: string[];
    contentVersion?: string;
  } = {},
): PublicationPackage {
  const canon = reviewCanon(project);
  const article = buildAnswerPageBrief(project);
  const carousel = buildVulgarisationBrief(project);
  const distribution = buildDistributionBrief(project);
  const seo = runSeoPublicationGate(project, article);
  const analytics = buildContentAnalyticsPlan(project, article);
  const renderPackage = buildStructuralRenderPackage(project);
  const renderReview = reviewCarouselRender(renderPackage);
  const assetPlan = buildVisualAssetPlan(project, renderPackage);
  const imageBriefs = assetPlan.tasks.map((task) =>
    buildImageGenerationBrief(task, project.family),
  );

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!project.evidencePack.summary.canPublish) {
    blockers.push('Evidence Pack non publiable.');
  }

  for (const unknown of project.evidencePack.unknowns) {
    if (unknown.blocking) {
      blockers.push('Inconnue bloquante : ' + unknown.question);
    }
  }

  for (const claim of project.evidencePack.claims) {
    if (
      claim.status === 'insufficient' ||
      claim.status === 'rejected' ||
      claim.publicationReadiness === 'forbidden'
    ) {
      blockers.push(
        'Claim non publiable : ' + claim.claimId,
      );
    }

    if (
      claim.publicationReadiness === 'refresh_required' ||
      claim.verificationRequiredBeforePublication
    ) {
      warnings.push(
        'Revue avant publication : ' + claim.claimId,
      );
    }

    if (
      claim.publicationReadiness === 'historical_only'
    ) {
      warnings.push(
        'Conserver le millésime historique : ' +
          claim.claimId,
      );
    }

    if (
      claim.publicationReadiness === 'property_check'
    ) {
      warnings.push(
        'Application au bien à vérifier : ' +
          claim.claimId,
      );
    }

    if (
      claim.publicationReadiness === 'person_check'
    ) {
      warnings.push(
        'Application à la personne à vérifier : ' +
          claim.claimId,
      );
    }
  }

  if (
    project.articleMaster.recommendedLevoisPath
      .routeStatus !== 'live'
  ) {
    warnings.push(
      'CTA désactivé tant que la destination publique n’est pas recettée.',
    );
  }

  for (const check of seo.checks) {
    if (check.status === 'block') {
      blockers.push('SEO ' + check.id + ' : ' + check.reason);
    } else if (check.status === 'review') {
      warnings.push('SEO ' + check.id + ' : ' + check.reason);
    }
  }

  if (!canon.ready) {
    for (const item of canon.items) {
      if (item.status === 'fail') {
        blockers.push(
          'Canon ' + item.id + ' : ' + item.note,
        );
      } else if (item.status === 'review') {
        warnings.push(
          'Canon ' + item.id + ' : ' + item.note,
        );
      }
    }
  }

  for (const issue of renderReview.issues) {
    warnings.push(
      'Rendu slide ' +
        issue.slideNumber +
        ' [' +
        issue.severity +
        '] : ' +
        issue.reason,
    );
  }

  const traceabilityOptions = {
    contentVersion:
      options.contentVersion ?? 'draft-1',
    rejectedEvidenceIds:
      options.rejectedEvidenceIds ?? [],
    webUsed: options.webUsed ?? false,
  };

  const articleTrace = buildTraceabilityManifest(
    project,
    'article',
    traceabilityOptions,
  );

  const carouselTrace = buildTraceabilityManifest(
    project,
    'carousel',
    traceabilityOptions,
  );

  const uniqueBlockers = Array.from(new Set(blockers));
  const uniqueWarnings = Array.from(new Set(warnings));

  return {
    packageVersion: 'LEVOIS_PUBLICATION_PACKAGE_V1',
    projectId: project.projectId,
    status: deriveStatus(
      project,
      canon,
      carousel,
      renderReview,
      uniqueBlockers,
    ),
    generatedAt: project.generatedAt,
    blockers: uniqueBlockers,
    warnings: uniqueWarnings,
    canon,
    article,
    carousel,
    distribution,
    seo,
    analytics,
    render: {
      package: renderPackage,
      review: renderReview,
      assetPlan,
      imageBriefs,
    },
    traceability: {
      article: articleTrace,
      carousel: carouselTrace,
    },
  };
}
