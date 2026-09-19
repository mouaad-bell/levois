import type { AnswerPageBrief } from './answers-engine';
import type { StudioProject } from './studio-schema';
import type {
  LevoisAnalyticsEventName,
} from './analytics-contract';

export type ContentAnalyticsTrigger = {
  event: LevoisAnalyticsEventName;
  trigger: string;
  purpose: string;
  requiredProperties: string[];
};

export type ContentAnalyticsPlan = {
  version: 'LEVOIS_CONTENT_ANALYTICS_PLAN_V1';
  contentId: string;
  canonicalPath: string;
  triggers: ContentAnalyticsTrigger[];
  forbiddenProperties: string[];
};

export function buildContentAnalyticsPlan(
  project: StudioProject,
  answer: AnswerPageBrief,
): ContentAnalyticsPlan {
  const liveRoute =
    project.articleMaster.recommendedLevoisPath
      .routeStatus === 'live';

  const triggers: ContentAnalyticsTrigger[] = [
    {
      event: 'content_view',
      trigger:
        'La ressource Answers est effectivement affichée dans le navigateur.',
      purpose:
        'Distinguer une page réellement vue d’une simple impression technique.',
      requiredProperties: [
        'contentId',
        'familyId',
        'route',
        'channel',
        'canonVersion',
        'evidenceLibraryVersion',
      ],
    },
    {
      event: 'content_complete',
      trigger:
        'Le lecteur atteint la fin de la réponse principale ou le dernier bloc utile de l’article.',
      purpose:
        'Observer la progression jusqu’à la résolution sans supposer une compréhension parfaite.',
      requiredProperties: [
        'contentId',
        'familyId',
        'route',
      ],
    },
    {
      event: 'content_source_opened',
      trigger:
        'Le lecteur ouvre un bloc source, méthode ou preuve réellement interactif.',
      purpose:
        'Savoir si la couche inspectable de preuve est utilisée.',
      requiredProperties: [
        'contentId',
        'route',
        'stepId',
      ],
    },
    {
      event: 'content_method_applied',
      trigger:
        'Le lecteur lance l’exercice, la grille ou le test associé à la méthode.',
      purpose:
        'Mesurer le passage de la lecture à une action autonome.',
      requiredProperties: [
        'contentId',
        'route',
        'toolId',
      ],
    },
  ];

  if (liveRoute) {
    triggers.push({
      event: 'next_resource_opened',
      trigger:
        'Le lecteur choisit la prochaine étape LEVOIS proposée après la résolution.',
      purpose:
        'Mesurer une continuité choisie, pas une obligation commerciale.',
      requiredProperties: [
        'contentId',
        'route',
        'outcome',
      ],
    });
  }

  return {
    version: 'LEVOIS_CONTENT_ANALYTICS_PLAN_V1',
    contentId:
      'ANS-' + project.projectId,
    canonicalPath: answer.canonicalPath,
    triggers,
    forbiddenProperties: [
      'email',
      'phone',
      'name',
      'address',
      'raw_input',
      'free_text',
      'message',
    ],
  };
}
