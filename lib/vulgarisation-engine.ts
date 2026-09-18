import type { StudioProject, StoryboardSlide } from './studio-schema';

export type VulgarisationQualityGate = {
  hook: boolean;
  simplicity: boolean;
  mobileReadability: boolean;
  saveValue: boolean;
  shareValue: boolean;
  transferValue: boolean;
  levoisBridge: boolean;
  collegienTest: boolean;
  noNewTopicLate: boolean;
};

export type VulgarisationBrief = {
  centralIdea: string;
  readerTakeaway: string;
  keyProofRefs: string[];
  rejectedEvidence: string[];
  simplifications: string[];
  nextPersonalQuestion: string;
  ctaLabel: string;
  slides: StoryboardSlide[];
  qualityGate: VulgarisationQualityGate;
};

const weakHooks = [
  /^tout savoir/i,
  /^guide complet/i,
  /^\d+\s+conseils/i,
  /^les erreurs à éviter/i,
];

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function isSimpleSlide(slide: StoryboardSlide) {
  return wordCount(slide.headline) <= 12 && wordCount(slide.body) <= 45;
}

function hasMemorableMethod(slides: StoryboardSlide[]) {
  return slides.some(
    (slide) =>
      slide.narrativeRole === 'method' &&
      (
        /\b3\b/.test(slide.headline + ' ' + slide.body) ||
        /nommer|mesurer|comparer|affecter|tester|arbitrer/i.test(
          slide.headline + ' ' + slide.body,
        )
      ),
  );
}

function strongHook(slide?: StoryboardSlide) {
  if (!slide || slide.narrativeRole !== 'hook') return false;
  if (wordCount(slide.headline) < 2 || wordCount(slide.headline) > 12) return false;
  return !weakHooks.some((pattern) => pattern.test(slide.headline.trim()));
}

function hasLateTopicDrift(slides: StoryboardSlide[]) {
  const lateSlides = slides.slice(Math.max(0, slides.length - 2));
  return lateSlides.some((slide) =>
    /nouveau sujet|autre sujet|et le prix|et le financement|et le dpe/i.test(
      slide.headline + ' ' + slide.body,
    ),
  );
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
  const bridge = slides.at(-1);

  const simplifications: string[] = [];
  if (slides.some((slide) => wordCount(slide.body) > 45)) {
    simplifications.push('Réduire les corps de slide à 45 mots maximum.');
  }
  if (!hasMemorableMethod(slides)) {
    simplifications.push('Ramener la méthode à trois opérations mémorisables.');
  }
  if (hasLateTopicDrift(slides)) {
    simplifications.push('Supprimer le nouveau sujet introduit dans les deux dernières slides.');
  }

  const qualityGate: VulgarisationQualityGate = {
    hook: strongHook(slides[0]),
    simplicity: slides.every(isSimpleSlide),
    mobileReadability: slides.every(
      (slide) => wordCount(slide.headline) <= 12 && wordCount(slide.body) <= 45,
    ),
    saveValue: Boolean(selectedAngle?.saveValue && selectedAngle.saveValue.length > 24),
    shareValue: slides.some(
      (slide) =>
        slide.narrativeRole === 'insight' ||
        slide.narrativeRole === 'method' ||
        slide.narrativeRole === 'exercise',
    ),
    transferValue: slides.some((slide) => slide.narrativeRole === 'transfer'),
    levoisBridge: bridge?.narrativeRole === 'bridge',
    collegienTest:
      project.articleMaster.keyTakeaway.split(/[.!?]/).filter(Boolean).length <= 3 &&
      wordCount(project.articleMaster.keyTakeaway) <= 28,
    noNewTopicLate: !hasLateTopicDrift(slides),
  };

  return {
    centralIdea: project.articleMaster.centralThesis,
    readerTakeaway: project.articleMaster.keyTakeaway,
    keyProofRefs: centralProofs,
    rejectedEvidence,
    simplifications,
    nextPersonalQuestion: project.articleMaster.nextPersonalQuestion,
    ctaLabel: project.articleMaster.recommendedLevoisPath.label,
    slides,
    qualityGate,
  };
}

export function vulgarisationReady(brief: VulgarisationBrief) {
  return Object.values(brief.qualityGate).every(Boolean);
}
