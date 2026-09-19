import type { ResearchBundle } from './lib/studio-research';
import { searchEvidenceLibrary, libraryCoverageSummary, type EvidenceDb } from './lib/evidence-library';

type AssetsBinding = { fetch(request: Request): Promise<Response> };

type StudioEnv = {
  ASSETS: AssetsBinding;
  OPENAI_API_KEY?: string;
  STUDIO_ACCESS_TOKEN?: string;
  STUDIO_RESEARCH_MODEL?: string;
  LEVOIS_EVIDENCE_DB?: EvidenceDb;
};

type OpenAIResponse = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: unknown[];
  error?: { message?: string };
};

const FAMILY_IDS = [
  'decider_arbitrer',
  'prix_valeur',
  'budget_financement',
  'espace_usage',
  'lieu_mobilite',
  'bien_technique',
  'marche_territoire',
  'verifier_transaction',
] as const;

const researchSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    familyId: { type: 'string', enum: FAMILY_IDS },
    scope: {
      type: 'object',
      additionalProperties: false,
      properties: {
        decisionQuestion: { type: 'string' },
        objective: { type: 'string' },
        hypothesesToTest: { type: 'array', items: { type: 'string' } },
        mustNotAssume: { type: 'array', items: { type: 'string' } },
      },
      required: ['decisionQuestion', 'objective', 'hypothesesToTest', 'mustNotAssume'],
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          sourceId: { type: 'string' },
          type: { type: 'string', enum: ['official_dataset', 'official_document', 'institutional_page', 'research', 'press', 'user_document', 'other'] },
          publisher: { type: 'string' },
          title: { type: 'string' },
          url: { type: 'string' },
          dataPeriod: { type: 'string' },
          geographicScope: { type: 'string' },
          reliability: { type: 'string', enum: ['primary', 'secondary', 'context'] },
        },
        required: ['sourceId', 'type', 'publisher', 'title', 'url', 'dataPeriod', 'geographicScope', 'reliability'],
      },
    },
    claims: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          claimId: { type: 'string' },
          claim: { type: 'string' },
          claimType: { type: 'string', enum: ['fact', 'calculation', 'declaration', 'observation', 'scenario', 'unknown'] },
          value: { type: 'string' },
          unit: { type: 'string' },
          population: { type: 'string' },
          geographicScope: { type: 'string' },
          timeScope: { type: 'string' },
          sourceRefs: { type: 'array', items: { type: 'string' } },
          evidenceRefs: { type: 'array', items: { type: 'string' } },
          evidenceStrength: { type: 'string', enum: ['strong', 'medium', 'weak', 'none'] },
          status: { type: 'string', enum: ['verified', 'qualified', 'insufficient', 'rejected'] },
          allowedUses: { type: 'array', items: { type: 'string' } },
          forbiddenInferences: { type: 'array', items: { type: 'string' } },
        },
        required: ['claimId', 'claim', 'claimType', 'value', 'unit', 'population', 'geographicScope', 'timeScope', 'sourceRefs', 'evidenceRefs', 'evidenceStrength', 'status', 'allowedUses', 'forbiddenInferences'],
      },
    },
    unknowns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          unknownId: { type: 'string' },
          question: { type: 'string' },
          importance: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' },
          blocking: { type: 'boolean' },
        },
        required: ['unknownId', 'question', 'importance', 'reason', 'blocking'],
      },
    },
    limitations: { type: 'array', items: { type: 'string' } },
    angles: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          angleId: { type: 'string' },
          title: { type: 'string' },
          promise: { type: 'string' },
          hook: { type: 'string' },
          centralProof: { type: 'string' },
          saveValue: { type: 'string' },
          bridgeQuestion: { type: 'string' },
          claimRefs: { type: 'array', items: { type: 'string' } },
          selected: { type: 'boolean' },
        },
        required: ['angleId', 'title', 'promise', 'hook', 'centralProof', 'saveValue', 'bridgeQuestion', 'claimRefs', 'selected'],
      },
    },
    articleMaster: {
      type: 'object',
      additionalProperties: false,
      properties: {
        workingTitle: { type: 'string' },
        centralQuestion: { type: 'string' },
        centralThesis: { type: 'string' },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              sectionId: { type: 'string' },
              type: { type: 'string', enum: ['question', 'intuition', 'proof', 'mechanism', 'case', 'method', 'limits', 'application'] },
              heading: { type: 'string' },
              body: { type: 'string' },
              claimRefs: { type: 'array', items: { type: 'string' } },
            },
            required: ['sectionId', 'type', 'heading', 'body', 'claimRefs'],
          },
        },
        keyTakeaway: { type: 'string' },
        transferablePrinciple: { type: 'string' },
        nextPersonalQuestion: { type: 'string' },
        ctaLabel: { type: 'string' },
      },
      required: ['workingTitle', 'centralQuestion', 'centralThesis', 'sections', 'keyTakeaway', 'transferablePrinciple', 'nextPersonalQuestion', 'ctaLabel'],
    },
    storyboard: {
      type: 'object',
      additionalProperties: false,
      properties: {
        slides: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              slideNumber: { type: 'number' },
              narrativeRole: { type: 'string', enum: ['hook', 'tension', 'proof', 'explanation', 'case', 'method', 'insight', 'transfer', 'exercise', 'bridge'] },
              objective: { type: 'string' },
              headline: { type: 'string' },
              body: { type: 'string' },
              claimRefs: { type: 'array', items: { type: 'string' } },
              layout: { type: 'string', enum: ['HERO_PHOTO', 'HERO_NUMBER', 'HERO_MAP', 'EDITORIAL_SPLIT', 'COMPARISON_DUAL', 'MAP_NETWORK', 'MAP_ZONE', 'METHOD_STEPS', 'CASE_DUAL', 'DATA_FIELD', 'QUESTION_SHIFT', 'FINAL_BRIDGE'] },
              readerEffect: { type: 'string', enum: ['stop', 'curiosity', 'surprise', 'credibility', 'clarity', 'identification', 'understanding', 'memorization', 'participation', 'action'] },
              sourceLabel: { type: 'string' },
              assetRequirements: { type: 'array', items: { type: 'string' } },
            },
            required: ['slideNumber', 'narrativeRole', 'objective', 'headline', 'body', 'claimRefs', 'layout', 'readerEffect', 'sourceLabel', 'assetRequirements'],
          },
        },
      },
      required: ['slides'],
    },
  },
  required: ['familyId', 'scope', 'sources', 'claims', 'unknowns', 'limitations', 'angles', 'articleMaster', 'storyboard'],
} as const;

function json(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  return new Response(JSON.stringify(data), { ...init, headers });
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return diff === 0;
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value);
    url.hash = '';
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach((key) => url.searchParams.delete(key));
    if (url.pathname !== '/' && url.pathname.endsWith('/')) url.pathname = url.pathname.slice(0, -1);
    return url.toString();
  } catch {
    return '';
  }
}

function collectWebSources(response: OpenAIResponse) {
  const map = new Map<string, { url: string; title: string }>();

  function walk(value: unknown) {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    const record = value as Record<string, unknown>;
    const maybeUrl = typeof record.url === 'string' ? normalizeUrl(record.url) : '';
    if (maybeUrl) {
      const title = typeof record.title === 'string' ? record.title : '';
      if (!map.has(maybeUrl)) map.set(maybeUrl, { url: maybeUrl, title });
    }
    Object.values(record).forEach(walk);
  }

  for (const item of response.output ?? []) {
    if (item && typeof item === 'object' && (item as Record<string, unknown>).type === 'web_search_call') walk(item);
  }
  return map;
}

function extractOutputText(response: OpenAIResponse) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text;
  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    if (!item || typeof item !== 'object') continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== 'object') continue;
      const record = part as Record<string, unknown>;
      if (record.type === 'output_text' && typeof record.text === 'string') chunks.push(record.text);
    }
  }
  return chunks.join('\n');
}

function sanitizeBundle(
  bundle: ResearchBundle,
  acceptedSources: Map<string, { url: string; title: string }>,
  allowedEvidenceIds: Set<string>,
) {
  const oldToNew = new Map<string, string>();

  const sources = bundle.sources
    .map((source) => ({ ...source, url: normalizeUrl(source.url) }))
    .filter((source) => source.url && acceptedSources.has(source.url))
    .slice(0, 16)
    .map((source, index) => {
      const sourceId = `S${String(index + 1).padStart(3, '0')}`;
      oldToNew.set(source.sourceId, sourceId);
      const observed = acceptedSources.get(source.url);
      return { ...source, sourceId, title: observed?.title || source.title };
    });

  const validSourceIds = new Set(sources.map((source) => source.sourceId));
  let downgradedClaims = 0;

  const claims = bundle.claims.slice(0, 24).map((claim, index) => {
    const sourceRefs = claim.sourceRefs
      .map((sourceId) => oldToNew.get(sourceId) ?? '')
      .filter((sourceId, refIndex, refs) => Boolean(sourceId) && validSourceIds.has(sourceId) && refs.indexOf(sourceId) === refIndex);

    const evidenceRefs = (claim.evidenceRefs ?? [])
      .filter((evidenceId, refIndex, refs) => allowedEvidenceIds.has(evidenceId) && refs.indexOf(evidenceId) === refIndex);

    const claimId = `C${String(index + 1).padStart(3, '0')}`;
    const needsSource = claim.claimType === 'fact' || claim.claimType === 'calculation';
    let status = claim.status;
    let evidenceStrength = claim.evidenceStrength;

    if (needsSource && sourceRefs.length === 0 && evidenceRefs.length === 0) {
      status = 'insufficient';
      evidenceStrength = 'none';
      downgradedClaims += 1;
    }

    return { ...claim, claimId, sourceRefs, evidenceRefs, status, evidenceStrength };
  });

  const oldClaimIds = bundle.claims.map((claim) => claim.claimId);
  const claimMap = new Map(oldClaimIds.map((claimId, index) => [claimId, claims[index]?.claimId ?? '']));
  const validClaimIds = new Set(claims.map((claim) => claim.claimId));

  const remapClaimRefs = (refs: string[]) =>
    refs.map((ref) => claimMap.get(ref) ?? '').filter((ref, index, list) => Boolean(ref) && validClaimIds.has(ref) && list.indexOf(ref) === index);

  const articleMaster = {
    ...bundle.articleMaster,
    sections: bundle.articleMaster.sections.slice(0, 8).map((section, index) => ({
      ...section,
      sectionId: `SEC${String(index + 1).padStart(2, '0')}`,
      claimRefs: remapClaimRefs(section.claimRefs),
    })),
  };

  const storyboard = {
    slides: bundle.storyboard.slides.slice(0, 10).map((slide, index) => ({
      ...slide,
      slideNumber: index + 1,
      claimRefs: remapClaimRefs(slide.claimRefs),
    })),
  };

  return {
    bundle: {
      ...bundle,
      sources,
      claims,
      unknowns: bundle.unknowns.slice(0, 12).map((unknown, index) => ({ ...unknown, unknownId: `U${String(index + 1).padStart(3, '0')}` })),
      limitations: bundle.limitations.slice(0, 10),
      angles: bundle.angles.slice(0, 3).map((angle) => ({
        ...angle,
        claimRefs: remapClaimRefs(angle.claimRefs ?? []),
      })),
      articleMaster,
      storyboard,
    },
    downgradedClaims,
  };
}

async function librarySearch(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json({ error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' }, { status: 503 });
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json({ error: 'Bibliothèque LEVOIS non connectée.' }, { status: 503 });
  }

  let body: { input?: unknown; limit?: unknown };
  try {
    body = await request.json() as { input?: unknown; limit?: unknown };
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const input = typeof body.input === 'string' ? body.input.replace(/\s+/g, ' ').trim() : '';
  if (!input || input.length > 5000) {
    return json({ error: 'Le sujet doit contenir entre 1 et 5 000 caractères.' }, { status: 400 });
  }

  const limit = typeof body.limit === 'number' ? body.limit : 24;
  const hits = await searchEvidenceLibrary(env.LEVOIS_EVIDENCE_DB, { text: input, limit });

  return json({
    hits,
    coverage: libraryCoverageSummary(hits),
  });
}

async function research(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN || !env.OPENAI_API_KEY) {
    return json(
      { error: 'Studio non configuré : secrets STUDIO_ACCESS_TOKEN et OPENAI_API_KEY requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  let body: { input?: unknown };
  try {
    body = await request.json() as { input?: unknown };
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const input = typeof body.input === 'string' ? body.input.replace(/\s+/g, ' ').trim() : '';
  if (!input || input.length > 5000) {
    return json({ error: 'Le sujet doit contenir entre 1 et 5 000 caractères.' }, { status: 400 });
  }

  const libraryHits = env.LEVOIS_EVIDENCE_DB
    ? await searchEvidenceLibrary(env.LEVOIS_EVIDENCE_DB, { text: input, limit: 24 })
    : [];
  const libraryCoverage = libraryCoverageSummary(libraryHits);
  const allowedEvidenceIds = new Set(libraryHits.map((hit) => hit.evidenceId));

  const libraryContext = libraryHits.slice(0, 18).map((hit) => ({
    evidence_id: hit.evidenceId,
    claim: hit.claim,
    value: hit.value,
    unit: hit.unit,
    population: hit.population,
    geographic_scope_type: hit.geographicScopeType,
    geographic_scope_label: hit.geographicScopeLabel,
    geographic_code: hit.geographicCode,
    time_period: hit.timePeriod,
    source_publisher: hit.sourcePublisher,
    source_title: hit.sourceTitle,
    source_url: hit.sourceUrl,
    source_tier: hit.sourceTier,
    engine_use_class: hit.engineUseClass,
    publication_readiness: hit.publicationReadiness,
    verification_required_before_publication: hit.verificationRequiredBeforePublication,
    verification_required_for_property_application: hit.verificationRequiredForPropertyApplication,
    verification_required_for_person_application: hit.verificationRequiredForPersonApplication,
    freshness: hit.freshness,
    allowed_uses: hit.allowedUses,
    forbidden_inferences: hit.forbiddenInferences,
    decision_use: hit.decisionUse,
  }));

  const model = env.STUDIO_RESEARCH_MODEL || 'chat-latest';
  const instructions = `Tu es la cellule de recherche du Studio éditorial LEVOIS, consacré à la décision immobilière à Chartres et alentours.

MISSION
Transformer le sujet fourni en dossier factuel et éditorial. Utilise réellement la recherche web avant d'affirmer des faits. Privilégie les sources primaires et officielles : INSEE, data.gouv.fr/DVF, ADEME, Géorisques, service-public.fr, Legifrance, collectivités, documents originaux. Utilise une source secondaire seulement si elle ajoute une information nécessaire.

CONTRAT DE VÉRITÉ
- Ne fabrique jamais chiffre, prix, date, distance, temps de trajet, DPE, surface, règle ou citation.
- Chaque claim de type fact ou calculation doit référencer au moins une source réellement trouvée.
- Distingue clairement ce que la preuve démontre de ce qu'elle ne permet pas de conclure.
- Si une donnée importante manque, crée un unknown. Mets blocking=true UNIQUEMENT si l'angle sélectionné ne peut pas être publié honnêtement sans cette information. Une donnée manquante seulement nécessaire pour personnaliser le cas du lecteur, calculer ses trajets exacts ou enrichir l'exemple doit rester blocking=false.
- Un scénario pédagogique est autorisé seulement avec claimType=scenario et sans le présenter comme un cas réel.
- N'utilise pas une statistique locale hors de son périmètre ou de sa période.
- La conclusion doit rester proportionnée aux preuves.
- Pour “Chartres et alentours”, choisis le périmètre statistique qui correspond réellement à l'affirmation (commune, bassin de vie, unité urbaine, aire d'attraction ou liste de communes). Ne remplace jamais silencieusement un périmètre par un autre. Affiche toujours le périmètre exact.
- N'ajoute pas une statistique simplement parce qu'elle est disponible : chaque claim doit servir soit la pertinence locale, soit le mécanisme, soit une limite utile.

LIGNE ÉDITORIALE
- Français simple, concret, compréhensible par un collégien sans être infantilisant.
- LEVOIS rationalise la prise de décision sans employer le mot “rationalisme” comme slogan.
- Le lecteur doit repartir avec une méthode réutilisable, une raison d'enregistrer le carrousel et une question personnelle qui l'amène naturellement vers levois.fr.
- Pas de clickbait mensonger, pas de jargon, pas de CTA commercial agressif.
- Le hook doit être court, provocant par l'idée ou l'image, pas par l'exagération.
- Produit exactement 3 angles éditoriaux et sélectionne le meilleur. Chaque angle doit contenir claimRefs avec les IDs des preuves factuelles centrales qui le soutiennent.
- Article Master : 8 sections dans cet ordre logique : question, intuition, proof, mechanism, case, method, limits, application.
- Méthode : vise 3 opérations mémorisables ; 4 maximum seulement si le sujet l'exige réellement. Évite les listes de 5 étapes ou plus.
- Storyboard : 7 à 10 slides ; slide 1=hook ; dernière=bridge ; une idée dominante par slide ; texte lisible sur mobile.
- Dans le dernier tiers du carrousel, n'introduis pas un nouveau grand sujet qui détourne du raisonnement central. Par exemple, ne fais pas entrer le prix dans un carrousel de mobilité sauf s'il était déjà une variable centrale.
- La dernière slide doit ouvrir explicitement la question personnelle créée par le contenu et proposer un CTA LEVOIS contextuel, sans sollicitation commerciale agressive.
- Choisis une seule famille parmi les 8 IDs autorisés.

SOURCES
Dans sources[], n'utilise que des URLs que tu as réellement rencontrées pendant la recherche web. Les sourceId doivent être S001, S002, etc. Les claim sourceRefs doivent utiliser ces IDs.

CLAIMS
Les claimId doivent être C001, C002, etc. Pour une valeur numérique, mets uniquement la valeur dans value et l'unité séparément dans unit. Si pas de valeur courte, laisse value vide.

Tu dois respecter strictement le schéma JSON de sortie.`;

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 12000,
      max_tool_calls: 10,
      tools: [{ type: 'web_search' }],
      include: ['web_search_call.action.sources'],
      instructions,
      input,
      text: {
        format: {
          type: 'json_schema',
          name: 'levois_research_bundle',
          strict: true,
          schema: researchSchema,
        },
      },
      metadata: { app: 'levois-studio', schema: 'research-v1' },
    }),
  });

  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) {
    return json(
      { error: payload.error?.message || 'La recherche distante a échoué.' },
      { status: response.status >= 400 && response.status < 500 ? 502 : response.status },
    );
  }

  const outputText = extractOutputText(payload);
  if (!outputText) return json({ error: 'Aucun dossier structuré reçu.' }, { status: 502 });

  let bundle: ResearchBundle;
  try {
    bundle = JSON.parse(outputText) as ResearchBundle;
  } catch {
    return json({ error: 'La réponse de recherche n’est pas un JSON exploitable.' }, { status: 502 });
  }

  const webSources = collectWebSources(payload);
  const sanitized = sanitizeBundle(bundle, webSources);

  return json({
    bundle: sanitized.bundle,
    meta: {
      model: payload.model || model,
      searchedSources: webSources.size,
      acceptedSources: sanitized.bundle.sources.length,
      downgradedClaims: sanitized.downgradedClaims,
      requestId: payload.id || '',
    },
  });
}

export default {
  async fetch(request: Request, env: StudioEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/studio/research') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return research(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
