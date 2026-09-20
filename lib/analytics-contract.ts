export type LevoisAnalyticsEventName =
  | 'content_view'
  | 'content_complete'
  | 'content_method_applied'
  | 'content_source_opened'
  | 'tool_started'
  | 'tool_completed'
  | 'result_modified'
  | 'resource_saved'
  | 'next_resource_opened'
  | 'human_review_requested'
  | 'human_exchange_requested';

export type LevoisAnalyticsChannel =
  | 'google'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'pinterest'
  | 'direct'
  | 'internal'
  | 'unknown';

export type LevoisAnalyticsEvent = {
  name: LevoisAnalyticsEventName;
  timestamp: string;
  anonymousSessionId?: string;
  contentId?: string;
  questionId?: string;
  familyId?: string;
  route?: string;
  channel?: LevoisAnalyticsChannel;
  stepId?: string;
  toolId?: string;
  outcome?: string;
  evidenceLibraryVersion?: string;
  canonVersion?: string;
};

const FORBIDDEN_PROPERTY_NAMES = new Set([
  'email',
  'phone',
  'telephone',
  'name',
  'nom',
  'prenom',
  'first_name',
  'last_name',
  'address',
  'adresse',
  'raw_input',
  'input_text',
  'message',
  'free_text',
]);

export function validateAnalyticsEvent(
  event: Record<string, unknown>,
) {
  const errors: string[] = [];

  if (!event.name || typeof event.name !== 'string') {
    errors.push('Nom d’événement absent.');
  }

  for (const key of Object.keys(event)) {
    if (FORBIDDEN_PROPERTY_NAMES.has(key.toLowerCase())) {
      errors.push(
        'Propriété personnelle ou texte libre interdite : ' +
          key,
      );
    }
  }

  if (
    event.route !== undefined &&
    typeof event.route !== 'string'
  ) {
    errors.push('route doit être une chaîne.');
  }

  if (
    event.outcome !== undefined &&
    typeof event.outcome === 'string' &&
    event.outcome.length > 80
  ) {
    errors.push(
      'outcome doit rester une catégorie courte, pas du texte libre.',
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const LEVOIS_ANALYTICS_MEANING = {
  content_view:
    'La ressource a réellement été affichée.',
  content_complete:
    'Le lecteur a atteint la fin de la ressource ou son équivalent mesurable.',
  content_method_applied:
    'Le lecteur a déclenché l’action proposée par la méthode, sans supposer qu’il l’a comprise parfaitement.',
  content_source_opened:
    'Une source ou un bloc méthode/preuve a été ouvert.',
  tool_started:
    'Une expérience LEVOIS a été commencée.',
  tool_completed:
    'Une expérience a produit sa première valeur ou restitution.',
  result_modified:
    'Le lecteur a modifié une réponse ou un critère après avoir vu la restitution.',
  resource_saved:
    'La fonctionnalité réelle de conservation/sauvegarde a été utilisée.',
  next_resource_opened:
    'Le lecteur a continué vers une ressource liée.',
  human_review_requested:
    'Le lecteur a demandé à Mouaad de relire un point précis.',
  human_exchange_requested:
    'Le lecteur a choisi explicitement un échange avec Mouaad.',
} as const;
