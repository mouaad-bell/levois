import type { StudioProject } from './studio-schema';
import {
  LEVOIS_CANON_VERSION,
  LEVOIS_PREPUBLICATION_QUESTIONS,
  hasAbsoluteVeto,
} from './content-canon';

export type CanonReviewStatus = 'pass' | 'review' | 'fail';

export type CanonReviewItem = {
  id: keyof typeof LEVOIS_PREPUBLICATION_QUESTIONS;
  status: CanonReviewStatus;
  question: string;
  correction: string;
  note: string;
};

export type CanonReview = {
  canonVersion: string;
  ready: boolean;
  vetoes: {
    fabricatedFact: boolean;
    unjustifiedFear: boolean;
    forcedCommercialResolution: boolean;
  };
  items: CanonReviewItem[];
};

function words(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function projectText(project: StudioProject) {
  return [
    project.scope.decisionQuestion,
    project.articleMaster.centralThesis,
    project.articleMaster.keyTakeaway,
    ...project.storyboard.slides.flatMap((slide) => [
      slide.headline,
      slide.body,
    ]),
  ].join(' ');
}

function item(
  id: CanonReviewItem['id'],
  status: CanonReviewStatus,
  note: string,
): CanonReviewItem {
  const rule = LEVOIS_PREPUBLICATION_QUESTIONS[id];
  return {
    id,
    status,
    question: rule.question,
    correction: rule.correction,
    note,
  };
}

export function reviewCanon(project: StudioProject): CanonReview {
  const canon = project.canon;

  if (!canon || canon.canonVersion !== LEVOIS_CANON_VERSION) {
    return {
      canonVersion: canon?.canonVersion ?? 'missing',
      ready: false,
      vetoes: {
        fabricatedFact: false,
        unjustifiedFear: false,
        forcedCommercialResolution: false,
      },
      items: [
        item(
          'subject',
          'fail',
          'Le dossier ne porte pas le Canon Contenu & Expérience V1.',
        ),
      ],
    };
  }

  const selectedHook = canon.hookCandidates.find(
    (candidate) => candidate.mode === canon.selectedHookMode,
  );
  const allSlides = project.storyboard.slides;
  const text = projectText(project);
  const vetoes = hasAbsoluteVeto(text);

  const progressionOk =
    canon.storyBeats.length >= 6 &&
    canon.storyBeats.every(
      (beat) =>
        beat.before.trim() &&
        beat.after.trim() &&
        beat.before.trim() !== beat.after.trim(),
    );

  const hasMechanism =
    canon.storyBeats.some(
      (beat) =>
        beat.function === 'demonstration' &&
        beat.copy.trim().length > 0,
    ) ||
    project.articleMaster.sections.some(
      (section) =>
        section.type === 'mechanism' &&
        section.body.trim().length > 0,
    );

  const limitVisible =
    canon.essentialLimit.trim().length > 0 &&
    (
      project.evidencePack.summary.limitations.length > 0 ||
      allSlides.some((slide) =>
        /cas fictif|simulation|limite|à vérifier|ne permet pas/i.test(
          slide.headline + ' ' + slide.body,
        ),
      )
    );

  const articleAnswer =
    canon.decisionFrame.authorizedConclusion.trim().length > 0;
  const autonomous =
    canon.autonomousAction.trim().length > 0;

  const mobileReviewNeeded = allSlides.some(
    (slide) =>
      words(slide.headline).length > 16 ||
      words(slide.body).length > 60,
  );

  const route = project.articleMaster.recommendedLevoisPath;
  const continuityOk =
    route.routeStatus === 'live' ||
    !/envoyer|recevoir|automatique|rendez-vous/i.test(route.label);

  const items: CanonReviewItem[] = [
    item(
      'subject',
      canon.decisionFrame.decision.trim() ? 'pass' : 'fail',
      canon.decisionFrame.decision.trim()
        ? 'Décision identifiée.'
        : 'Décision manquante.',
    ),
    item(
      'understanding',
      selectedHook && words(selectedHook.text).length <= 18
        ? 'pass'
        : 'review',
      selectedHook
        ? 'Hook retenu : ' + selectedHook.text
        : 'Aucun hook retenu.',
    ),
    item(
      'recognition',
      canon.decisionFrame.person.trim() &&
        canon.decisionFrame.pressureTest.trim()
        ? 'pass'
        : 'review',
      'Personne et situation décisionnelle présentes.',
    ),
    item(
      'interest',
      selectedHook?.explicitPromise.trim()
        ? 'pass'
        : 'review',
      selectedHook?.explicitPromise ||
        'Promesse explicite à préciser.',
    ),
    item(
      'promise',
      selectedHook &&
        canon.decisionFrame.authorizedConclusion.trim()
        ? 'pass'
        : 'fail',
      selectedHook
        ? 'La promesse doit rester bornée par la conclusion autorisée.'
        : 'Aucun hook sélectionné.',
    ),
    item(
      'progression',
      progressionOk ? 'pass' : 'fail',
      progressionOk
        ? 'Chaque story beat possède un avant et un après distincts.'
        : 'Progression canonique incomplète.',
    ),
    item(
      'mechanism',
      hasMechanism ? 'pass' : 'fail',
      hasMechanism
        ? 'Démonstration/mécanisme présent.'
        : 'Le lien entre information et décision reste à montrer.',
    ),
    item(
      'limits',
      limitVisible ? 'pass' : 'review',
      limitVisible
        ? 'Limite essentielle présente et visible dans le dossier.'
        : 'Rapprocher la limite de l’affirmation concernée.',
    ),
    item(
      'resolution',
      articleAnswer ? 'pass' : 'fail',
      articleAnswer
        ? canon.decisionFrame.authorizedConclusion
        : 'Conclusion autorisée absente.',
    ),
    item(
      'autonomy',
      autonomous ? 'pass' : 'fail',
      autonomous
        ? canon.autonomousAction
        : 'Action autonome absente.',
    ),
    item(
      'format',
      mobileReviewNeeded ? 'review' : 'pass',
      mobileReviewNeeded
        ? 'Au moins une slide doit être recettée pour densité mobile.'
        : 'Aucune alerte de densité textuelle brute.',
    ),
    item(
      'continuity',
      continuityOk ? 'pass' : 'review',
      continuityOk
        ? 'Le libellé final ne promet pas une fonction absente.'
        : 'La destination est à vérifier avant publication.',
    ),
  ];

  const hasFail = items.some((entry) => entry.status === 'fail');
  const hasVeto =
    vetoes.fabricatedFact ||
    vetoes.unjustifiedFear ||
    vetoes.forcedCommercialResolution;

  return {
    canonVersion: canon.canonVersion,
    ready:
      !hasFail &&
      !hasVeto &&
      project.evidencePack.summary.canPublish,
    vetoes,
    items,
  };
}
