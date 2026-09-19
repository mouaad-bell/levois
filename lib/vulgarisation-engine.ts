import type { StudioProject, StoryboardSlide } from './studio-schema';
import { LEVOIS_CANON_VERSION } from './content-canon';

export type VulgarisationQualityGate = {
  canonPresent: boolean;
  subjectClear: boolean;
  promiseHeld: boolean;
  progression: boolean;
  mechanism: boolean;
  limitsVisible: boolean;
  resolution: boolean;
  autonomy: boolean;
  mobileReadability: boolean;
  continuity: boolean;
  factuality: boolean;
};

export type VulgarisationBrief = {
  canonVersion: string;
  centralIdea: string;
  readerTakeaway: string;
  authorizedConclusion: string;
  autonomousAction: string;
  essentialLimit: string;
  keyProofRefs: string[];
  rejectedEvidence: string[];
  simplifications: string[];
  nextPersonalQuestion: string;
  ctaLabel: string;
  slides: StoryboardSlide[];
  qualityGate: VulgarisationQualityGate;
  observations: {
    saveValuePresent: boolean;
    shareValuePresent: boolean;
    hasLevoisBridge: boolean;
  };
};

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function normalized(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(a: string, b: string) {
  const tokens = (value: string) =>
    new Set(
      normalized(value)
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 3),
    );
  const left = tokens(a);
  const right = tokens(b);
  if (!left.size || !right.size) return 0;
  let common = 0;
  for (const token of left) if (right.has(token)) common += 1;
  return common / Math.min(left.size, right.size);
}

function slideChangesUnderstanding(slide: StoryboardSlide) {
  const text = (slide.headline + ' ' + slide.body).trim();
  if (!text) return false;
  return !/important|essentiel|à retenir|saviez-vous|mais ce n'est pas tout|attendez la suite/i.test(
    text,
  );
}

function mobileReadable(slide: StoryboardSlide) {
  const headlineWords = wordCount(slide.headline);
  const bodyWords = wordCount(slide.body);

  // These are rendering safeguards, not canonical editorial laws.
  // A slide may exceed them if the renderer proves readability at 1080x1350.
  return headlineWords <= 16 && bodyWords <= 60;
}

function hasVisibleLimit(project: StudioProject) {
  if (project.canon?.essentialLimit.trim()) return true;
  if (project.evidencePack.summary.limitations.length > 0) return true;
  return project.storyboard.slides.some((slide) =>
    /limite|ne permet pas|cas fictif|simulation|à vérifier|inconnu/i.test(
      slide.headline + ' ' + slide.body,
    ),
  );
}

function promiseHeld(project: StudioProject) {
  if (!project.canon) return false;
  const selected = project.canon.hookCandidates.find(
    (candidate) => candidate.mode === project.canon?.selectedHookMode,
  );
  if (!selected) return false;

  const promised = selected.explicitPromise + ' ' + selected.implicitPromise;
  const conclusion = project.canon.decisionFrame.authorizedConclusion;
  const action = project.canon.autonomousAction;

  return (
    tokenOverlap(promised, conclusion) >= 0.2 ||
    tokenOverlap(promised, action) >= 0.2 ||
    tokenOverlap(selected.text, conclusion) >= 0.2
  );
}

function hasMechanism(project: StudioProject) {
  const beat = project.canon?.storyBeats.find(
    (candidate) => candidate.function === 'demonstration',
  );
  if (beat && beat.copy.trim().length > 0) return true;

  return project.articleMaster.sections.some(
    (section) =>
      section.type === 'mechanism' &&
      section.body.trim().length > 0 &&
      !/à rédiger|à générer|à établir/i.test(section.body),
  );
}

function hasResolution(project: StudioProject) {
  if (project.canon?.decisionFrame.authorizedConclusion.trim()) return true;
  return project.articleMaster.centralThesis.trim().length > 0;
}

function hasAutonomy(project: StudioProject) {
  if (project.canon?.autonomousAction.trim()) return true;
  return project.storyboard.slides.some((slide) =>
    ['method', 'transfer', 'exercise'].includes(slide.narrativeRole),
  );
}

function hasContinuity(project: StudioProject) {
  const path = project.articleMaster.recommendedLevoisPath;
  if (!path) return true;
  if (path.routeStatus === 'pending') {
    return !/envoyer|recevoir|comparer automatiquement|prendre rendez-vous/i.test(
      path.label,
    );
  }
  return true;
}

export function buildVulgarisationBrief(
  project: StudioProject,
): VulgarisationBrief {
  const selectedAngle =
    project.angles.find((angle) => angle.selected) ?? project.angles[0];

  const usedClaims = new Set(
    project.storyboard.slides.flatMap((slide) => slide.claimRefs),
  );

  const rejectedEvidence = project.evidencePack.claims
    .filter((claim) => !usedClaims.has(claim.claimId))
    .map((claim) => claim.claimId);

  const simplifications: string[] = [];
  for (const slide of project.storyboard.slides) {
    if (!slideChangesUnderstanding(slide)) {
      simplifications.push(
        'Slide ' +
          slide.slideNumber +
          ' : fusionner ou supprimer si elle ne change pas la compréhension.',
      );
    }
    if (!mobileReadable(slide)) {
      simplifications.push(
        'Slide ' +
          slide.slideNumber +
          ' : tester à taille mobile et réduire la densité ou changer de composition si nécessaire.',
      );
    }
  }

  if (!hasVisibleLimit(project)) {
    simplifications.push(
      'Rapprocher la limite essentielle de l’affirmation qu’elle qualifie.',
    );
  }

  if (!hasMechanism(project)) {
    simplifications.push(
      'Montrer le mécanisme qui relie l’information à ce qu’elle change dans la décision.',
    );
  }

  if (!hasAutonomy(project)) {
    simplifications.push(
      'Ajouter une opération que le lecteur peut refaire sans contacter LEVOIS.',
    );
  }

  const canonicalStoryBeats = project.canon?.storyBeats ?? [];

  const qualityGate: VulgarisationQualityGate = {
    canonPresent:
      project.canon?.canonVersion === LEVOIS_CANON_VERSION,
    subjectClear:
      Boolean(project.scope.decisionQuestion.trim()) &&
      Boolean(project.canon?.decisionFrame.decision.trim()),
    promiseHeld: promiseHeld(project),
    progression:
      Boolean(project.canon) &&
      canonicalStoryBeats.length >= 6 &&
      canonicalStoryBeats.every(
        (beat) =>
          beat.copy.trim().length > 0 &&
          normalized(beat.before) !== normalized(beat.after),
      ),
    mechanism: hasMechanism(project),
    limitsVisible: hasVisibleLimit(project),
    resolution: hasResolution(project),
    autonomy: hasAutonomy(project),
    mobileReadability: project.storyboard.slides.every(mobileReadable),
    continuity: hasContinuity(project),
    factuality: project.evidencePack.summary.canPublish,
  };

  const observations = {
    saveValuePresent: Boolean(
      selectedAngle?.saveValue && selectedAngle.saveValue.trim().length > 0,
    ),
    shareValuePresent: project.storyboard.slides.some((slide) =>
      ['insight', 'method', 'exercise', 'transfer'].includes(
        slide.narrativeRole,
      ),
    ),
    hasLevoisBridge: project.storyboard.slides.some(
      (slide) => slide.narrativeRole === 'bridge',
    ),
  };

  return {
    canonVersion: project.canon?.canonVersion ?? 'missing',
    centralIdea: project.articleMaster.centralThesis,
    readerTakeaway: project.articleMaster.keyTakeaway,
    authorizedConclusion:
      project.canon?.decisionFrame.authorizedConclusion ??
      project.articleMaster.centralThesis,
    autonomousAction:
      project.canon?.autonomousAction ??
      project.articleMaster.transferablePrinciple,
    essentialLimit:
      project.canon?.essentialLimit ??
      project.evidencePack.summary.limitations[0] ??
      '',
    keyProofRefs: selectedAngle?.claimRefs ?? [],
    rejectedEvidence,
    simplifications,
    nextPersonalQuestion: project.articleMaster.nextPersonalQuestion,
    ctaLabel: project.articleMaster.recommendedLevoisPath.label,
    slides: project.storyboard.slides,
    qualityGate,
    observations,
  };
}

export function vulgarisationReady(brief: VulgarisationBrief) {
  return Object.values(brief.qualityGate).every(Boolean);
}
