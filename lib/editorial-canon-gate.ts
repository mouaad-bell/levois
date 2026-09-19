import {
  LEVOIS_CONTENT_CANON,
  type LevoisAbsoluteVeto,
  type LevoisPreflightControl,
} from './content-canon-v1';
import type { StudioProject, StoryboardSlide } from './studio-schema';

export type CanonGateResult = {
  canonId: typeof LEVOIS_CONTENT_CANON.canonId;
  canonVersion: typeof LEVOIS_CONTENT_CANON.version;
  controls: Record<LevoisPreflightControl, {
    pass: boolean;
    reason: string;
    correction?: string;
  }>;
  vetos: Record<LevoisAbsoluteVeto, {
    active: boolean;
    reason: string;
  }>;
  ready: boolean;
};

function words(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function hasRole(slides: StoryboardSlide[], roles: StoryboardSlide['narrativeRole'][]) {
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
  return project.evidencePack.claims.filter((claim) => refs.has(claim.claimId));
}

function hasUnjustifiedFear(project: StudioProject) {
  const fear = /\b(catastrophe|danger|urgent|urgence|échouer|echec|échec|pi[eè]ge|ruiner|perdre tout|jamais)\b/i;
  const opening = [
    selectedAngle(project)?.hook ?? '',
    project.storyboard.slides[0]?.headline ?? '',
    project.storyboard.slides[0]?.body ?? '',
  ].join(' ');

  if (!fear.test(opening)) return false;

  const supported = referencedClaims(project).some(
    (claim) =>
      (claim.status === 'verified' || claim.status === 'qualified') &&
      claim.sourceRefs.length > 0,
  );
  return !supported;
}

function commercialResolutionReplacesValue(project: StudioProject) {
  const slides = project.storyboard.slides;
  const hasAutonomousTake =
    hasRole(slides, ['method', 'exercise', 'transfer']) ||
    project.articleMaster.sections.some((section) => section.type === 'method');

  const last = slides.at(-1);
  const commercialEnding = last?.narrativeRole === 'bridge';

  return Boolean(commercialEnding && !hasAutonomousTake);
}

function factualVeto(project: StudioProject) {
  return referencedClaims(project).some(
    (claim) =>
      (claim.claimType === 'fact' || claim.claimType === 'calculation') &&
      (claim.status === 'insufficient' || claim.status === 'rejected'),
  );
}

export function runCanonGate(project: StudioProject): CanonGateResult {
  const slides = project.storyboard.slides;
  const first = slides[0];
  const angle = selectedAngle(project);
  const limits = project.articleMaster.sections.find((section) => section.type === 'limits');
  const mechanism = project.articleMaster.sections.find((section) => section.type === 'mechanism');
  const method = project.articleMaster.sections.find((section) => section.type === 'method');
  const route = project.articleMaster.recommendedLevoisPath;

  const controls: CanonGateResult['controls'] = {
    sujet: {
      pass: Boolean(first?.headline && project.scope.decisionQuestion),
      reason: 'Le sujet doit être identifiable dès l’entrée et relié à une décision.',
      correction: 'Avancer l’objet, le moment ou la décision.',
    },
    comprehension: {
      pass:
        Boolean(first) &&
        words(first.headline) <= 18 &&
        slides.every((slide) => words(slide.body) <= 55),
      reason: 'L’entrée reste concise et chaque slide reste lisible sans miniaturiser le texte.',
      correction: 'Réduire jargon, ambiguïtés ou densité.',
    },
    reconnaissance: {
      pass:
        Boolean(project.canon?.decisionFrame?.person) &&
        Boolean(project.canon?.decisionFrame?.decision) &&
        hasRole(slides, ['tension', 'case']),
      reason: 'Le lecteur doit reconnaître une personne qui décide quelque chose dans une situation.',
      correction: 'Remplacer un thème abstrait par une scène, une intention et une contrainte.',
    },
    interet: {
      pass:
        Boolean(angle?.promise?.trim()) &&
        slides.length >= 2 &&
        slides[1].headline.trim() !== first?.headline.trim(),
      reason: 'La deuxième unité doit commencer à payer la promesse au lieu de répéter le hook.',
      correction: 'Donner une distinction, une donnée ou un cas immédiatement après l’entrée.',
    },
    promesse: {
      pass:
        Boolean(project.canon?.decisionFrame?.authorizedConclusion) &&
        Boolean(project.canon?.decisionFrame?.finalOperation) &&
        project.status === 'storyboard_ready',
      reason: 'La conclusion autorisée et l’opération finale existent avant la formulation finale du hook.',
      correction: 'Réduire l’accroche ou compléter la démonstration.',
    },
    progression: {
      pass:
        new Set(slides.map((slide) => slide.narrativeRole)).size >= Math.min(4, slides.length),
      reason: 'Les étapes doivent changer l’état de compréhension.',
      correction: 'Fusionner ou supprimer les répétitions.',
    },
    mecanisme: {
      pass: Boolean(mechanism?.body?.trim()),
      reason: 'Le contenu doit montrer pourquoi l’information change la lecture.',
      correction: 'Ajouter la relation, la condition ou le contre-exemple qui relie fait et conséquence.',
    },
    limites: {
      pass:
        Boolean(limits?.body?.trim()) &&
        project.evidencePack.summary.limitations.length > 0,
      reason: 'Les qualifications essentielles doivent être visibles dans le dossier.',
      correction: 'Rapprocher la limite de l’affirmation qu’elle restreint.',
    },
    resolution: {
      pass:
        Boolean(project.articleMaster.centralThesis.trim()) &&
        !/à établir|non déterminée/i.test(project.articleMaster.centralThesis),
      reason: 'La question principale doit recevoir la réponse autorisée.',
      correction: 'Écrire la réponse réellement soutenue par le dossier.',
    },
    autonomie: {
      pass: Boolean(method?.body?.trim()) || hasRole(slides, ['method', 'exercise']),
      reason: 'Le lecteur doit repartir avec une opération utilisable sans contacter LEVOIS.',
      correction: 'Ajouter un test, une question ou un document à examiner.',
    },
    format: {
      pass:
        slides.every(
          (slide) =>
            words(slide.headline) <= 18 &&
            words(slide.body) <= 55,
        ),
      reason: 'Le support doit pouvoir être lu sur mobile sans dépendre d’un microtexte.',
      correction: 'Réduire la densité ou changer de format.',
    },
    continuite: {
      pass:
        route.routeStatus === 'live' ||
        slides.at(-1)?.narrativeRole !== 'bridge',
      reason: 'Un CTA ne peut annoncer qu’une destination réellement disponible.',
      correction: 'Retirer le CTA ou relier une destination effectivement vérifiée.',
    },
  };

  const vetos: CanonGateResult['vetos'] = {
    fait_fabrique_presente_comme_reel: {
      active: factualVeto(project),
      reason: 'Un fait ou calcul utilisé par le contenu est insuffisant ou rejeté.',
    },
    peur_non_justifiee: {
      active: hasUnjustifiedFear(project),
      reason: 'L’ouverture emploie une conséquence grave sans preuve proportionnée.',
    },
    resolution_remplacee_par_obligation_commerciale: {
      active: commercialResolutionReplacesValue(project),
      reason: 'Le contenu se termine commercialement sans avoir donné une prise autonome.',
    },
  };

  const ready =
    Object.values(controls).every((control) => control.pass) &&
    Object.values(vetos).every((veto) => !veto.active);

  return {
    canonId: LEVOIS_CONTENT_CANON.canonId,
    canonVersion: LEVOIS_CONTENT_CANON.version,
    controls,
    vetos,
    ready,
  };
}
