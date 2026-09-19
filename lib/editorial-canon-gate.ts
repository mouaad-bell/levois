import {
  LEVOIS_CANON_VERSION,
  LEVOIS_PREPUBLICATION_QUESTIONS,
  type HookBrief,
} from './content-canon';
import type { StudioProject, StoryboardSlide } from './studio-schema';

export type CanonControlId =
  | 'subject'
  | 'understanding'
  | 'recognition'
  | 'interest'
  | 'promise'
  | 'progression'
  | 'mechanism'
  | 'limits'
  | 'resolution'
  | 'autonomy'
  | 'format'
  | 'continuity';

export type CanonVetoId =
  | 'fabricatedFact'
  | 'unjustifiedFear'
  | 'forcedCommercialResolution';

export type CanonGateResult = {
  canonVersion: typeof LEVOIS_CANON_VERSION;
  controls: Record<CanonControlId, {
    pass: boolean;
    reason: string;
    correction?: string;
  }>;
  vetos: Record<CanonVetoId, {
    active: boolean;
    reason: string;
  }>;
  ready: boolean;
};

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasRole(
  slides: StoryboardSlide[],
  roles: StoryboardSlide['narrativeRole'][],
) {
  return slides.some((slide) => roles.includes(slide.narrativeRole));
}

function selectedAngle(project: StudioProject) {
  return project.angles.find((angle) => angle.selected) ?? project.angles[0];
}

function referencedClaims(project: StudioProject) {
  const refs = new Set<string>();

  for (const slide of project.storyboard.slides) {
    for (const ref of slide.claimRefs) refs.add(ref);
  }
  for (const section of project.articleMaster.sections) {
    for (const ref of section.claimRefs) refs.add(ref);
  }
  for (const ref of selectedAngle(project)?.claimRefs ?? []) refs.add(ref);

  return project.evidencePack.claims.filter((claim) =>
    refs.has(claim.claimId),
  );
}

function hasUnjustifiedFear(project: StudioProject) {
  const fear =
    /\b(catastrophe|danger immédiat|urgent|urgence|fait échouer|vous allez perdre|pi[eè]ge absolu|ruiner|perdre tout)\b/i;

  const opening = [
    selectedAngle(project)?.hook ?? '',
    project.storyboard.slides[0]?.headline ?? '',
    project.storyboard.slides[0]?.body ?? '',
  ].join(' ');

  if (!fear.test(opening)) return false;

  return !referencedClaims(project).some(
    (claim) =>
      (claim.status === 'verified' ||
        claim.status === 'qualified') &&
      (claim.sourceRefs.length > 0 ||
        (claim.evidenceRefs?.length ?? 0) > 0),
  );
}

function commercialResolutionReplacesValue(
  project: StudioProject,
) {
  const slides = project.storyboard.slides;
  const hasAutonomousTake =
    hasRole(slides, ['method', 'exercise', 'transfer']) ||
    project.articleMaster.sections.some(
      (section) => section.type === 'method',
    ) ||
    Boolean(project.canon?.autonomousAction?.trim());

  const last = slides.at(-1);
  return Boolean(
    last?.narrativeRole === 'bridge' && !hasAutonomousTake,
  );
}

function factualVeto(project: StudioProject) {
  return referencedClaims(project).some(
    (claim) =>
      (claim.claimType === 'fact' ||
        claim.claimType === 'calculation') &&
      (claim.status === 'insufficient' ||
        claim.status === 'rejected'),
  );
}

function decisionFrame(project: StudioProject): HookBrief | undefined {
  return project.canon?.decisionFrame;
}

function control(
  id: CanonControlId,
  pass: boolean,
  reason: string,
) {
  return {
    pass,
    reason,
    correction: pass
      ? undefined
      : LEVOIS_PREPUBLICATION_QUESTIONS[id].correction,
  };
}

export function runCanonGate(
  project: StudioProject,
): CanonGateResult {
  const slides = project.storyboard.slides;
  const first = slides[0];
  const second = slides[1];
  const angle = selectedAngle(project);
  const frame = decisionFrame(project);

  const limits = project.articleMaster.sections.find(
    (section) => section.type === 'limits',
  );
  const mechanism = project.articleMaster.sections.find(
    (section) => section.type === 'mechanism',
  );
  const method = project.articleMaster.sections.find(
    (section) => section.type === 'method',
  );
  const route = project.articleMaster.recommendedLevoisPath;

  const controls: CanonGateResult['controls'] = {
    subject: control(
      'subject',
      Boolean(first?.headline && project.scope.decisionQuestion),
      'Le sujet est identifiable dès l’entrée et relié à une décision.',
    ),
    understanding: control(
      'understanding',
      Boolean(first) &&
        words(first.headline) <= 24 &&
        slides.every((slide) => words(slide.body) <= 60),
      'L’entrée et les slides restent compréhensibles sans miniaturisation.',
    ),
    recognition: control(
      'recognition',
      Boolean(frame?.person?.trim()) &&
        Boolean(frame?.decision?.trim()) &&
        Boolean(frame?.pressureTest?.trim()),
      'La personne, la décision et la contrainte sont explicites.',
    ),
    interest: control(
      'interest',
      Boolean(angle?.promise?.trim()) &&
        Boolean(second) &&
        second.headline.trim() !== first?.headline.trim(),
      'La deuxième unité commence à payer la promesse.',
    ),
    promise: control(
      'promise',
      Boolean(frame?.authorizedConclusion?.trim()) &&
        Boolean(frame?.finalOperation?.trim()) &&
        project.status === 'storyboard_ready',
      'La conclusion autorisée et l’opération finale existent avant le hook final.',
    ),
    progression: control(
      'progression',
      new Set(
        project.canon?.storyBeats.map((beat) => beat.function) ?? [],
      ).size >= 5,
      'Les étapes apportent des changements de compréhension distincts.',
    ),
    mechanism: control(
      'mechanism',
      Boolean(mechanism?.body?.trim()) ||
        Boolean(
          project.canon?.storyBeats.find(
            (beat) => beat.function === 'demonstration',
          )?.copy.trim(),
        ),
      'Le dossier explique pourquoi l’information change la lecture.',
    ),
    limits: control(
      'limits',
      Boolean(project.canon?.essentialLimit?.trim()) ||
        Boolean(limits?.body?.trim()),
      'Une limite essentielle est explicite.',
    ),
    resolution: control(
      'resolution',
      Boolean(frame?.authorizedConclusion?.trim()) &&
        !/à établir|non déterminée/i.test(
          frame?.authorizedConclusion ?? '',
        ),
      'La question principale reçoit la réponse maximale autorisée.',
    ),
    autonomy: control(
      'autonomy',
      Boolean(project.canon?.autonomousAction?.trim()) ||
        Boolean(method?.body?.trim()) ||
        hasRole(slides, ['method', 'exercise']),
      'Le lecteur repart avec une opération autonome.',
    ),
    format: control(
      'format',
      slides.every(
        (slide) =>
          words(slide.headline) <= 24 &&
          words(slide.body) <= 60,
      ),
      'Le support reste lisible sur mobile.',
    ),
    continuity: control(
      'continuity',
      route.routeStatus === 'live' ||
        slides.at(-1)?.narrativeRole !== 'bridge',
      'Un CTA n’est activé que vers une destination réellement disponible.',
    ),
  };

  const vetos: CanonGateResult['vetos'] = {
    fabricatedFact: {
      active: factualVeto(project),
      reason:
        'Un fait ou calcul utilisé par le contenu est insuffisant ou rejeté.',
    },
    unjustifiedFear: {
      active: hasUnjustifiedFear(project),
      reason:
        'L’ouverture emploie une conséquence grave sans preuve proportionnée.',
    },
    forcedCommercialResolution: {
      active: commercialResolutionReplacesValue(project),
      reason:
        'Le contenu se termine commercialement sans avoir donné une prise autonome.',
    },
  };

  const ready =
    Object.values(controls).every(
      (entry) => entry.pass,
    ) &&
    Object.values(vetos).every(
      (entry) => !entry.active,
    );

  return {
    canonVersion: LEVOIS_CANON_VERSION,
    controls,
    vetos,
    ready,
  };
}
