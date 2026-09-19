import { runCanonGate, type CanonGateResult } from './editorial-canon-gate';
import type { StudioProject, StoryboardSlide } from './studio-schema';

export type VulgarisationQualityGate = {
  hook: boolean;
  simplicity: boolean;
  mobileReadability: boolean;
  saveValue: boolean;
  shareValue: boolean;
  transferValue: boolean;
  continuity: boolean;
  collegienTest: boolean;
  noNewTopicLate: boolean;
  canonReady: boolean;
};

export type VulgarisationBrief = {
  centralIdea: string;
  readerTakeaway: string;
  keyProofRefs: string[];
  rejectedEvidence: string[];
  simplifications: string[];
  nextPersonalQuestion: string;
  ctaLabel?: string;
  slides: StoryboardSlide[];
  canonGate: CanonGateResult;
  qualityGate: VulgarisationQualityGate;
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isReadableSlide(slide: StoryboardSlide) {
  return wordCount(slide.headline) <= 18 && wordCount(slide.body) <= 55;
}

function hasPracticalTake(slides: StoryboardSlide[]) {
  return slides.some(
    (slide) =>
      slide.narrativeRole === 'method' ||
      slide.narrativeRole === 'exercise' ||
      slide.narrativeRole === 'transfer',
  );
}

function strongHook(slide?: StoryboardSlide) {
  if (!slide || slide.narrativeRole !== 'hook') return false;
  if (wordCount(slide.headline) < 1 || wordCount(slide.headline) > 18) return false;
  return Boolean(slide.headline.trim() || slide.body.trim());
}

function hasLateTopicDrift(slides: StoryboardSlide[]) {
  const lateSlides = slides.slice(Math.max(0, slides.length - 2));
  return lateSlides.some((slide) =>
    /nouveau sujet|autre sujet|et le prix|et le financement|et le dpe/i.test(
      slide.headline + ' ' + slide.body,
    ),
  );
}

function hasCommercialBridge(project: StudioProject) {
  return project.storyboard.slides.at(-1)?.narrativeRole === 'bridge';
}

export function buildVulgarisationBrief(project: StudioProject): VulgarisationBrief {
  const selectedAngle =
    project.angles.find((angle) => angle.selected) ?? project.angles[0];

  const centralProofs = selectedAngle?.claimRefs ?? [];
  const usedClaims = new Set(
    project.storyboard.slides.flatMap((slide) => slide.claimRefs),
  );

  const rejectedEvidence = project.evidencePack.claims
    .filter((claim) => !usedClaims.has(claim.claimId))
    .map((claim) => claim.claimId);

  const slides = project.storyboard.slides;
  const canonGate = runCanonGate(project);

  const simplifications: string[] = [];

  if (slides.some((slide) => !isReadableSlide(slide))) {
    simplifications.push(
      'Réduire la densité des slides concernées ou changer la mise en scène ; le canon n’impose pas de longueur universelle mais exige une lecture mobile réelle.',
    );
  }

  if (!hasPracticalTake(slides)) {
    simplifications.push(
      'Ajouter une prise pratique : test, question ou opération que le lecteur peut refaire sans contacter LEVOIS.',
    );
  }

  if (hasLateTopicDrift(slides)) {
    simplifications.push(
      'Supprimer le nouveau sujet introduit dans les dernières slides ou le relier explicitement à la décision initiale.',
    );
  }

  if (
    hasCommercialBridge(project) &&
    project.articleMaster.recommendedLevoisPath.routeStatus !== 'live'
  ) {
    simplifications.push(
      'Retirer le CTA commercial ou relier une destination réellement disponible avant publication.',
    );
  }

  for (const [name, control] of Object.entries(canonGate.controls)) {
    if (!control.pass && control.correction) {
      simplifications.push(name + ' : ' + control.correction);
    }
  }

  const qualityGate: VulgarisationQualityGate = {
    hook: strongHook(slides[0]),
    simplicity:
      wordCount(project.articleMaster.keyTakeaway) <= 32 &&
      slides.every((slide) => wordCount(slide.headline) <= 18),
    mobileReadability: slides.every(isReadableSlide),
    saveValue: Boolean(
      selectedAngle?.saveValue &&
      selectedAngle.saveValue.trim().length > 12,
    ),
    shareValue: slides.some(
      (slide) =>
        slide.narrativeRole === 'insight' ||
        slide.narrativeRole === 'method' ||
        slide.narrativeRole === 'exercise',
    ),
    transferValue: hasPracticalTake(slides),
    continuity: canonGate.controls.continuite.pass,
    collegienTest:
      project.articleMaster.keyTakeaway
        .split(/[.!?]/)
        .filter(Boolean).length <= 3 &&
      wordCount(project.articleMaster.keyTakeaway) <= 32,
    noNewTopicLate: !hasLateTopicDrift(slides),
    canonReady: canonGate.ready,
  };

  return {
    centralIdea: project.articleMaster.centralThesis,
    readerTakeaway: project.articleMaster.keyTakeaway,
    keyProofRefs: centralProofs,
    rejectedEvidence,
    simplifications: Array.from(new Set(simplifications)),
    nextPersonalQuestion: project.articleMaster.nextPersonalQuestion,
    ctaLabel:
      project.articleMaster.recommendedLevoisPath.routeStatus === 'live'
        ? project.articleMaster.recommendedLevoisPath.label
        : undefined,
    slides,
    canonGate,
    qualityGate,
  };
}

export function vulgarisationReady(brief: VulgarisationBrief) {
  return Object.values(brief.qualityGate).every(Boolean);
}
