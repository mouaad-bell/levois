import { buildAnswerPageBrief } from './answers-engine';
import type { StudioProject } from './studio-schema';

export type DistributionChannel =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'pinterest';

export type DistributionChannelBrief = {
  channel: DistributionChannel;
  objective: string;
  opening: string;
  coreIdea: string;
  practicalTake: string;
  essentialLimit: string;
  sourceLine: string;
  ctaLabel?: string;
  ctaPath?: string;
  writingConstraints: string[];
};

export type DistributionBrief = {
  version: 'LEVOIS_DISTRIBUTION_BRIEF_V1';
  projectId: string;
  canonVersion: string;
  evidenceLibraryVersion: 'V21';
  title: string;
  channels: DistributionChannelBrief[];
};

function selectedHook(project: StudioProject) {
  const canon = project.canon;
  if (!canon) return project.angles.find((angle) => angle.selected)?.hook ?? '';

  return (
    canon.hookCandidates.find(
      (candidate) => candidate.mode === canon.selectedHookMode,
    )?.text ?? ''
  );
}

function essentialLimit(project: StudioProject) {
  if (project.canon?.essentialLimit?.trim()) {
    return project.canon.essentialLimit.trim();
  }

  const limits = project.evidencePack.summary.limitations;
  return limits[0] ?? '';
}

function practicalTake(project: StudioProject) {
  if (project.canon?.autonomousAction?.trim()) {
    return project.canon.autonomousAction.trim();
  }

  const method = project.articleMaster.sections.find(
    (section) => section.type === 'method',
  );

  return method?.body?.trim() ?? project.articleMaster.keyTakeaway.trim();
}

function sourceLine(project: StudioProject) {
  const sources = project.evidencePack.sources
    .filter((source) => source.reliability === 'primary')
    .slice(0, 3)
    .map((source) => {
      const period = source.dataPeriod ? ' · ' + source.dataPeriod : '';
      return source.publisher + period;
    });

  return sources.length
    ? 'Sources : ' + sources.join(' · ')
    : 'Sources et limites disponibles dans le dossier LEVOIS.';
}

function liveCta(project: StudioProject) {
  const route = project.articleMaster.recommendedLevoisPath;
  if (route.routeStatus !== 'live') return {};

  return {
    ctaLabel: route.label,
    ctaPath: route.path,
  };
}

export function buildDistributionBrief(
  project: StudioProject,
): DistributionBrief {
  const answer = buildAnswerPageBrief(project);
  const opening = selectedHook(project);
  const take = practicalTake(project);
  const limit = essentialLimit(project);
  const sources = sourceLine(project);
  const cta = liveCta(project);

  const shared = {
    opening,
    coreIdea: answer.answerShort,
    practicalTake: take,
    essentialLimit: limit,
    sourceLine: sources,
    ...cta,
  };

  return {
    version: 'LEVOIS_DISTRIBUTION_BRIEF_V1',
    projectId: project.projectId,
    canonVersion:
      project.canon?.canonVersion ??
      'CONTENT_EXPERIENCE_V1_2026-09-19',
    evidenceLibraryVersion: 'V21',
    title: answer.title,
    channels: [
      {
        channel: 'instagram',
        objective:
          'Accompagner le carrousel sans recopier chaque slide ; rappeler le déclic, la méthode et la limite essentielle.',
        ...shared,
        writingConstraints: [
          'Ne pas cacher la réponse pour forcer le swipe.',
          'Ne pas ajouter de fait absent du dossier.',
          'Rester lisible sans hashtags obligatoires.',
          'Un CTA commercial n’apparaît que si la destination est réellement live.',
          'Le cas fictif ou pédagogique reste qualifié dans la légende lorsqu’il porte un élément central.',
        ],
      },
      {
        channel: 'facebook',
        objective:
          'Donner une version directe et conversationnelle du raisonnement, compréhensible sans voir le carrousel.',
        ...shared,
        writingConstraints: [
          'Donner l’idée utile dans les premières lignes.',
          'Éviter le jargon professionnel.',
          'Conserver la limite qui change le sens de la conclusion.',
          'Ne pas créer d’urgence artificielle.',
        ],
      },
      {
        channel: 'linkedin',
        objective:
          'Développer le mécanisme de décision et la discipline de preuve sans transformer le post en autopromotion.',
        ...shared,
        writingConstraints: [
          'Commencer par la décision ou le mécanisme, pas par une présentation de Mouaad.',
          'Distinguer explicitement observation, méthode et limite.',
          'Montrer ce que le lecteur peut réutiliser dans une autre situation.',
          'Éviter les conclusions générales à partir d’un cas pédagogique.',
        ],
      },
      {
        channel: 'pinterest',
        objective:
          'Créer un texte descriptif et durable qui aide à comprendre le sujet et renvoie vers la ressource correspondante quand elle existe.',
        ...shared,
        writingConstraints: [
          'Titre descriptif plutôt que sensationnaliste.',
          'Employer les mots ordinaires de la question.',
          'Ne pas ajouter de localisation sans preuve ou ressource locale propre.',
          'Ne pas promettre une destination non publiée.',
        ],
      },
    ],
  };
}
