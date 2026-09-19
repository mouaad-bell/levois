import type { ResearchBundle } from './lib/studio-research';
import { searchEvidenceLibrary, libraryCoverageSummary, inferRetrievalIntent, type EvidenceDb } from './lib/evidence-library';
import { buildEvidencePackFromLibrary } from './lib/evidence-pack';
import type { EditorialBundle } from './lib/studio-editorial';
import { recordGenerationRun, persistTraceabilityManifest, findImpactedContent, findStaleContentDependencies, syncStaleContentReviews, listOpenContentReviews, resolveContentReview } from './lib/content-traceability-db';
import type { ContentTraceabilityManifest } from './lib/content-traceability';
import { buildEditorialCacheKey, getEditorialCache, putEditorialCache } from './lib/studio-cache';

type AssetsBinding = { fetch(request: Request): Promise<Response> };

type StudioEnv = {
  ASSETS: AssetsBinding;
  OPENAI_API_KEY?: string;
  STUDIO_ACCESS_TOKEN?: string;
  STUDIO_RESEARCH_MODEL?: string;
  STUDIO_EDITORIAL_MODEL?: string;
  LEVOIS_EVIDENCE_DB?: EvidenceDb;
};

type OpenAIResponse = {
  id?: string;
  model?: string;
  output_text?: string;
  output?: unknown[];
  error?: { message?: string };
};

const LEVOIS_LOCAL_LABELS = [
  'Chartres',
  'Lèves',
  'Lucé',
  'Mainvilliers',
  'Luisant',
  'Le Coudray',
  'Champhol',
  'Chartres Métropole',
  'Bassin de vie 2022 de Chartres',
  'Unité urbaine 2020 de Chartres',
  "Aire d'attraction des villes 2020 de Chartres",
] as const;

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
    canon: {
      type: 'object',
      additionalProperties: false,
      properties: {
        canonVersion: { type: 'string' },
        decisionFrame: {
          type: 'object',
          additionalProperties: false,
          properties: {
            person: { type: 'string' },
            decision: { type: 'string' },
            spontaneousReading: { type: 'string' },
            pressureTest: { type: 'string' },
            authorizedConclusion: { type: 'string' },
            finalOperation: { type: 'string' },
          },
          required: ['person','decision','spontaneousReading','pressureTest','authorizedConclusion','finalOperation'],
        },
        hookCandidates: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              mode: { type: 'string', enum: ['direct','scene','comparison'] },
              family: { type: 'string', enum: ['situation','usage','comparison','condition','calendar','scope','unknown','result'] },
              text: { type: 'string' },
              explicitPromise: { type: 'string' },
              implicitPromise: { type: 'string' },
              evidenceStatus: { type: 'string', enum: ['sourced','pedagogical_scenario','non_numeric'] },
              qualifier: { type: 'string' },
              claimRefs: { type: 'array', items: { type: 'string' } },
              evidenceRefs: { type: 'array', items: { type: 'string' } },
            },
            required: ['mode','family','text','explicitPromise','implicitPromise','evidenceStatus','qualifier','claimRefs','evidenceRefs'],
          },
        },
        selectedHookMode: { type: 'string', enum: ['direct','scene','comparison'] },
        storyBeats: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              function: { type: 'string', enum: ['situation','initial_reading','friction','demonstration','rereading','practical_take'] },
              before: { type: 'string' },
              after: { type: 'string' },
              copy: { type: 'string' },
              claimRefs: { type: 'array', items: { type: 'string' } },
            },
            required: ['function','before','after','copy','claimRefs'],
          },
        },
        essentialLimit: { type: 'string' },
        autonomousAction: { type: 'string' },
      },
      required: ['canonVersion','decisionFrame','hookCandidates','selectedHookMode','storyBeats','essentialLimit','autonomousAction'],
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
  required: ['familyId', 'scope', 'sources', 'claims', 'unknowns', 'limitations', 'angles', 'canon', 'articleMaster', 'storyboard'],
} as const;

const editorialSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    familyId: researchSchema.properties.familyId,
    scope: researchSchema.properties.scope,
    evidenceSelection: {
      type: 'object',
      additionalProperties: false,
      properties: {
        centralEvidenceRefs: { type: 'array', items: { type: 'string' } },
        contextEvidenceRefs: { type: 'array', items: { type: 'string' } },
        rejectedEvidenceRefs: { type: 'array', items: { type: 'string' } },
        rationale: { type: 'string' },
      },
      required: ['centralEvidenceRefs','contextEvidenceRefs','rejectedEvidenceRefs','rationale'],
    },
    angles: researchSchema.properties.angles,
    canon: researchSchema.properties.canon,
    articleMaster: researchSchema.properties.articleMaster,
    storyboard: researchSchema.properties.storyboard,
  },
  required: ['familyId','scope','evidenceSelection','angles','canon','articleMaster','storyboard'],
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

  const canon = {
    ...bundle.canon,
    canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
    hookCandidates: bundle.canon.hookCandidates.slice(0, 3).map((candidate) => ({
      ...candidate,
      claimRefs: remapClaimRefs(candidate.claimRefs ?? []),
      evidenceRefs: (candidate.evidenceRefs ?? [])
        .filter((ref, index, refs) => allowedEvidenceIds.has(ref) && refs.indexOf(ref) === index),
    })),
    storyBeats: bundle.canon.storyBeats.slice(0, 6).map((beat) => ({
      ...beat,
      claimRefs: remapClaimRefs(beat.claimRefs ?? []),
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
      canon,
      articleMaster,
      storyboard,
    },
    downgradedClaims,
  };
}

function sanitizeEditorialBundle(
  bundle: EditorialBundle,
  claimIds: Set<string>,
  evidenceIds: Set<string>,
): EditorialBundle {
  const cleanClaimRefs = (refs: string[]) =>
    refs.filter((ref, index) => claimIds.has(ref) && refs.indexOf(ref) === index);

  const cleanEvidenceRefs = (refs: string[]) =>
    refs.filter((ref, index) => evidenceIds.has(ref) && refs.indexOf(ref) === index);

  const angles = bundle.angles.slice(0, 3).map((angle) => ({
    ...angle,
    claimRefs: cleanClaimRefs(angle.claimRefs ?? []),
  }));
  if (angles.length && !angles.some((angle) => angle.selected)) {
    angles[0] = { ...angles[0], selected: true };
  }

  return {
    ...bundle,
    evidenceSelection: {
      ...bundle.evidenceSelection,
      centralEvidenceRefs: cleanEvidenceRefs(bundle.evidenceSelection.centralEvidenceRefs ?? []),
      contextEvidenceRefs: cleanEvidenceRefs(bundle.evidenceSelection.contextEvidenceRefs ?? []),
      rejectedEvidenceRefs: cleanEvidenceRefs(bundle.evidenceSelection.rejectedEvidenceRefs ?? []),
    },
    angles,
    canon: {
      ...bundle.canon,
      canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
      hookCandidates: bundle.canon.hookCandidates.slice(0, 3).map((candidate) => ({
        ...candidate,
        claimRefs: cleanClaimRefs(candidate.claimRefs ?? []),
        evidenceRefs: cleanEvidenceRefs(candidate.evidenceRefs ?? []),
      })),
      storyBeats: bundle.canon.storyBeats.slice(0, 6).map((beat) => ({
        ...beat,
        claimRefs: cleanClaimRefs(beat.claimRefs ?? []),
      })),
    },
    articleMaster: {
      ...bundle.articleMaster,
      sections: bundle.articleMaster.sections.slice(0, 8).map((section, index) => ({
        ...section,
        sectionId: 'SEC' + String(index + 1).padStart(2, '0'),
        claimRefs: cleanClaimRefs(section.claimRefs ?? []),
      })),
    },
    storyboard: {
      slides: bundle.storyboard.slides.slice(0, 10).map((slide, index) => ({
        ...slide,
        slideNumber: index + 1,
        claimRefs: cleanClaimRefs(slide.claimRefs ?? []),
      })),
    },
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
  const hits = await searchEvidenceLibrary(env.LEVOIS_EVIDENCE_DB, { text: input, geographicLabels: [...LEVOIS_LOCAL_LABELS], limit });

  const coverage = libraryCoverageSummary(hits);
  const evidencePack = buildEvidencePackFromLibrary(hits);
  const retrievalIntent = inferRetrievalIntent(input);

  return json({
    hits,
    coverage: { ...coverage, retrievalIntent },
    evidencePack: evidencePack.pack,
    traceability: {
      evidenceIds: evidencePack.evidenceIds,
      directEvidenceIds: evidencePack.directEvidenceIds,
      conditionalEvidenceIds: evidencePack.conditionalEvidenceIds,
      excludedEvidenceIds: evidencePack.excludedEvidenceIds,
    },
  });
}

async function editorial(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN || !env.OPENAI_API_KEY) {
    return json({ error: 'Studio non configuré : secrets STUDIO_ACCESS_TOKEN et OPENAI_API_KEY requis.' }, { status: 503 });
  }
  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }
  if (!env.LEVOIS_EVIDENCE_DB) {
    return json({ error: 'Bibliothèque LEVOIS non connectée.' }, { status: 503 });
  }

  let body: { input?: unknown; force?: unknown };
  try {
    body = await request.json() as { input?: unknown; force?: unknown };
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }
  const input = typeof body.input === 'string' ? body.input.replace(/\s+/g, ' ').trim() : '';
  if (!input || input.length > 5000) {
    return json({ error: 'Le sujet doit contenir entre 1 et 5 000 caractères.' }, { status: 400 });
  }

  const hits = await searchEvidenceLibrary(env.LEVOIS_EVIDENCE_DB, { text: input, geographicLabels: [...LEVOIS_LOCAL_LABELS], limit: 30 });
  const coverage = libraryCoverageSummary(hits);
  const retrievalIntent = inferRetrievalIntent(input);
  const built = buildEvidencePackFromLibrary(hits);
  if (!built.pack.summary.canPublish) {
    return json({
      error: 'La bibliothèque ne fournit pas encore un noyau de preuve directement publiable pour ce sujet.',
      coverage,
      evidencePack: built.pack,
      traceability: { evidenceIds: built.evidenceIds, excludedEvidenceIds: built.excludedEvidenceIds },
    }, { status: 409 });
  }

  const model = env.STUDIO_EDITORIAL_MODEL || env.STUDIO_RESEARCH_MODEL || 'chat-latest';
  const compactPack = {
    sources: built.pack.sources,
    claims: built.pack.claims,
    unknowns: built.pack.unknowns,
    limitations: built.pack.summary.limitations,
  };

  const claimIds = new Set(
    built.pack.claims.map((claim) => claim.claimId),
  );
  const evidenceIds = new Set(built.evidenceIds);
  const cacheKey = await buildEditorialCacheKey({
    rawInput: input,
    model,
    canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
    evidenceLibraryVersion: 'V21',
    evidencePack: compactPack,
  });
  const forceGeneration = body.force === true;

  if (!forceGeneration) {
    const cached = await getEditorialCache<EditorialBundle>(
      env.LEVOIS_EVIDENCE_DB,
      cacheKey,
    );

    if (cached) {
      const sanitized = sanitizeEditorialBundle(
        cached,
        claimIds,
        evidenceIds,
      );

      let traceabilityLogged = false;
      try {
        await recordGenerationRun(env.LEVOIS_EVIDENCE_DB, {
          generationId: crypto.randomUUID(),
          inputText: input,
          pipeline: 'library_only_editorial_cache_hit',
          canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
          evidenceLibraryVersion: 'V21',
          webUsed: false,
          model,
          evidenceIds: built.evidenceIds,
          rejectedEvidenceIds: Array.from(
            new Set([
              ...built.excludedEvidenceIds,
              ...sanitized.evidenceSelection.rejectedEvidenceRefs,
            ]),
          ),
        });
        traceabilityLogged = true;
      } catch {
        traceabilityLogged = false;
      }

      return json({
        bundle: sanitized,
        evidencePack: built.pack,
        meta: {
          model,
          libraryHits: hits.length,
          directEvidence: built.directEvidenceIds.length,
          conditionalEvidence: built.conditionalEvidenceIds.length,
          rejectedEvidence: built.excludedEvidenceIds.length,
          requestId: '',
          webUsed: false,
          retrievalIntent,
          traceabilityLogged,
          cacheHit: true,
        },
      });
    }
  }

  const instructions = "Tu es la cellule éditoriale LEVOIS. Tu ne fais AUCUNE recherche web dans cette étape.\n\nSOURCE DE VÉRITÉ\nTu utilises uniquement le Evidence Pack fourni. Tu n'inventes aucun chiffre, règle, expérience client, citation, caractéristique locale ou fonction du site.\n\nCANON\nApplique CONTENT_EXPERIENCE_V1_2026-09-19.\n\nAvant les hooks, remplis canon.decisionFrame :\n- person : qui décide, dans quel moment concret ;\n- decision : ce que cette personne doit réellement décider ou vérifier ;\n- spontaneousReading : la première lecture plausible ;\n- pressureTest : l'information qui oblige à préciser cette lecture ;\n- authorizedConclusion : la conclusion maximale réellement soutenue ;\n- finalOperation : l'opération que le lecteur peut refaire sans contacter LEVOIS.\n\nPuis produis exactement trois hooks :\n- direct ;\n- scene ;\n- comparison.\nIls doivent promettre la même démonstration. Utilise les familles : situation, usage, comparison, condition, calendar, scope, unknown, result.\n\nContrôles d'entrée : Temps, Sens, Miroir, Écart.\nLa formulation la plus forte n'est jamais retenue si elle agrandit la conclusion.\n\nSTORYTELLING\nProduis exactement six storyBeats : situation, initial_reading, friction, demonstration, rereading, practical_take.\nPour chacun : ce que le lecteur sait avant, ce qu'il sait après, et la copie utile.\nSi un cas est inventé pour expliquer un mécanisme, rends-le explicitement fictif.\n\nPREUVE\nTous les faits proviennent des claimId fournis.\nTous les evidenceRefs proviennent des evidence_id fournis.\nUne preuve historique conserve sa période.\nUne règle VERIFY_PROPERTY ou VERIFY_PERSON ne devient pas une conclusion individuelle.\nRespecte allowedUses et forbiddenInferences.\n\nÉDITION\nRéponds assez tôt. Ne cache pas une réponse courte pour créer du suspense.\nLe carrousel contient seulement le nombre de slides nécessaire, maximum technique 10.\nChaque slide doit faire avancer la compréhension.\nLa résolution principale et l'action autonome précèdent tout CTA.\nUn CTA n'est ajouté que s'il prolonge réellement la valeur ; la destination est considérée comme non vérifiée à ce stade.\n\nARTICLE\nL'Article Master comporte au maximum 8 sections utiles. Les intertitres portent une réponse ou une opération.\nLa limite essentielle apparaît au moment où elle change la lecture.\n\nVETOS ABSOLUS\n- fait fabriqué présenté comme réel ;\n- peur non justifiée ;\n- résolution retenue contre un contact.\n\nSÉLECTION DE PREUVES\nevidenceSelection.centralEvidenceRefs = preuves nécessaires au raisonnement.\ncontextEvidenceRefs = contexte utile mais non décisif.\nrejectedEvidenceRefs = preuves disponibles volontairement écartées parce qu'elles n'aident pas la décision.\nExplique ce choix dans rationale.\n\nTu dois respecter strictement le schéma JSON.";

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      store: false,
      max_output_tokens: 8000,
      instructions,
      input: JSON.stringify({ user_input: input, evidence_pack: compactPack, retrieval_summary: coverage }),
      text: {
        format: { type: 'json_schema', name: 'levois_editorial_bundle', strict: true, schema: editorialSchema },
      },
      metadata: {
        app: 'levois-studio',
        schema: 'editorial-v1',
        canon: 'CONTENT_EXPERIENCE_V1_2026-09-19',
        evidence_policy: 'V21-2026-09-19',
      },
    }),
  });

  const payload = await response.json() as OpenAIResponse;
  if (!response.ok) {
    return json({ error: payload.error?.message || 'La construction éditoriale distante a échoué.' }, { status: response.status >= 400 && response.status < 500 ? 502 : response.status });
  }
  const outputText = extractOutputText(payload);
  if (!outputText) return json({ error: 'Aucun dossier éditorial structuré reçu.' }, { status: 502 });

  let bundle: EditorialBundle;
  try {
    bundle = JSON.parse(outputText) as EditorialBundle;
  } catch {
    return json({ error: 'La réponse éditoriale n’est pas un JSON exploitable.' }, { status: 502 });
  }

  const sanitized = sanitizeEditorialBundle(bundle, claimIds, evidenceIds);

  try {
    await putEditorialCache(env.LEVOIS_EVIDENCE_DB, {
      cacheKey,
      model: payload.model || model,
      canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
      evidenceLibraryVersion: 'V21',
      bundle: sanitized,
    });
  } catch {
    // Cache failure must never block a valid editorial result.
  }

  let traceabilityLogged = false;
  try {
    await recordGenerationRun(env.LEVOIS_EVIDENCE_DB, {
      generationId: payload.id || crypto.randomUUID(),
      inputText: input,
      pipeline: 'library_only_editorial',
      canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
      evidenceLibraryVersion: 'V21',
      webUsed: false,
      model: payload.model || model,
      evidenceIds: built.evidenceIds,
      rejectedEvidenceIds: Array.from(
        new Set([
          ...built.excludedEvidenceIds,
          ...sanitized.evidenceSelection.rejectedEvidenceRefs,
        ]),
      ),
      requestId: payload.id || undefined,
    });
    traceabilityLogged = true;
  } catch {
    traceabilityLogged = false;
  }

  return json({
    bundle: sanitized,
    evidencePack: built.pack,
    meta: {
      model: payload.model || model,
      libraryHits: hits.length,
      directEvidence: built.directEvidenceIds.length,
      conditionalEvidence: built.conditionalEvidenceIds.length,
      rejectedEvidence: built.excludedEvidenceIds.length,
      requestId: payload.id || '',
      webUsed: false,
      retrievalIntent,
      traceabilityLogged,
      cacheHit: false,
    },
  });
}
async function traceabilityReviews(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json(
      { error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json(
      { error: 'Bibliothèque LEVOIS non connectée.' },
      { status: 503 },
    );
  }

  let limit = 100;

  if (request.method === 'POST') {
    try {
      const body = await request.json() as { limit?: unknown };
      if (typeof body.limit === 'number') limit = body.limit;
    } catch {
      return json({ error: 'Corps JSON invalide.' }, { status: 400 });
    }
  }

  const reviews = await listOpenContentReviews(
    env.LEVOIS_EVIDENCE_DB,
    limit,
  );

  return json({
    reviews,
    count: reviews.length,
  });
}

async function traceabilityResolve(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json(
      { error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json(
      { error: 'Bibliothèque LEVOIS non connectée.' },
      { status: 503 },
    );
  }

  let body: { reviewId?: unknown; resolution?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const reviewId =
    typeof body.reviewId === 'string'
      ? body.reviewId.trim()
      : '';
  const resolution =
    typeof body.resolution === 'string'
      ? body.resolution.trim()
      : '';

  if (!reviewId || !resolution) {
    return json(
      { error: 'reviewId et resolution sont requis.' },
      { status: 400 },
    );
  }

  const resolved = await resolveContentReview(
    env.LEVOIS_EVIDENCE_DB,
    reviewId,
    resolution,
  );

  return json(
    { resolved, reviewId },
    { status: resolved ? 200 : 404 },
  );
}

async function traceabilitySync(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json(
      { error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json(
      { error: 'Bibliothèque LEVOIS non connectée.' },
      { status: 503 },
    );
  }

  let body: { limit?: unknown } = {};
  try {
    body = await request.json() as { limit?: unknown };
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const limit =
    typeof body.limit === 'number'
      ? body.limit
      : 500;

  const result = await syncStaleContentReviews(
    env.LEVOIS_EVIDENCE_DB,
    limit,
  );

  return json({
    synced: true,
    ...result,
  });
}

async function traceabilityStale(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json(
      { error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json(
      { error: 'Bibliothèque LEVOIS non connectée.' },
      { status: 503 },
    );
  }

  let limit = 500;

  if (request.method === 'POST') {
    try {
      const body = await request.json() as { limit?: unknown };
      if (typeof body.limit === 'number') limit = body.limit;
    } catch {
      return json({ error: 'Corps JSON invalide.' }, { status: 400 });
    }
  }

  const stale = await findStaleContentDependencies(
    env.LEVOIS_EVIDENCE_DB,
    limit,
  );

  return json({
    stale,
    dependencyCount: stale.length,
    artifactCount: new Set(
      stale.map((row) => row.artifact_id),
    ).size,
  });
}

async function traceabilityImpact(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json(
      { error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json(
      { error: 'Bibliothèque LEVOIS non connectée.' },
      { status: 503 },
    );
  }

  let body: { evidenceIds?: unknown };
  try {
    body = await request.json() as { evidenceIds?: unknown };
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const evidenceIds = Array.isArray(body.evidenceIds)
    ? body.evidenceIds
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 100)
    : [];

  if (!evidenceIds.length) {
    return json(
      { error: 'Au moins un evidence_id est requis.' },
      { status: 400 },
    );
  }

  const impacted = await findImpactedContent(
    env.LEVOIS_EVIDENCE_DB,
    evidenceIds,
  );

  return json({
    evidenceIds,
    impacted,
    artifactCount: new Set(
      impacted.map((row) => row.artifact_id),
    ).size,
  });
}

async function saveTraceability(request: Request, env: StudioEnv) {
  if (!env.STUDIO_ACCESS_TOKEN) {
    return json(
      { error: 'Studio non configuré : STUDIO_ACCESS_TOKEN requis.' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-studio-key') ?? '';
  if (!provided || !safeEqual(provided, env.STUDIO_ACCESS_TOKEN)) {
    return json({ error: 'Accès Studio refusé.' }, { status: 401 });
  }

  if (!env.LEVOIS_EVIDENCE_DB) {
    return json(
      { error: 'Bibliothèque LEVOIS non connectée.' },
      { status: 503 },
    );
  }

  let body: {
    manifest?: ContentTraceabilityManifest;
    slug?: unknown;
    route?: unknown;
    status?: unknown;
    notes?: unknown;
  };

  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Corps JSON invalide.' }, { status: 400 });
  }

  const manifest = body.manifest;

  if (
    !manifest ||
    manifest.canonVersion !== 'CONTENT_EXPERIENCE_V1_2026-09-19' ||
    manifest.evidenceLibraryVersion !== 'V21' ||
    !['article', 'carousel', 'video', 'site_experience'].includes(
      manifest.artifactType,
    ) ||
    !manifest.artifactId ||
    !manifest.title ||
    !Array.isArray(manifest.dependencies) ||
    manifest.dependencies.length > 200
  ) {
    return json(
      { error: 'Manifest de traçabilité invalide.' },
      { status: 400 },
    );
  }

  for (const dependency of manifest.dependencies) {
    if (
      !dependency.evidenceId ||
      ![
        'central',
        'context',
        'limit',
        'method',
        'visual',
        'other',
      ].includes(dependency.role)
    ) {
      return json(
        { error: 'Dépendance de preuve invalide.' },
        { status: 400 },
      );
    }
  }

  await persistTraceabilityManifest(
    env.LEVOIS_EVIDENCE_DB,
    manifest,
    {
      status:
        typeof body.status === 'string'
          ? body.status.slice(0, 64)
          : 'DRAFT_REVIEWED',
      slug:
        typeof body.slug === 'string'
          ? body.slug.slice(0, 180)
          : undefined,
      route:
        typeof body.route === 'string'
          ? body.route.slice(0, 300)
          : undefined,
      notes:
        typeof body.notes === 'string'
          ? body.notes.slice(0, 1000)
          : undefined,
    },
  );

  return json({
    saved: true,
    artifactId: manifest.artifactId,
    dependencies: manifest.dependencies.length,
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
    ? await searchEvidenceLibrary(env.LEVOIS_EVIDENCE_DB, { text: input, geographicLabels: [...LEVOIS_LOCAL_LABELS], limit: 24 })
    : [];
  const libraryCoverage = libraryCoverageSummary(libraryHits);
  const retrievalIntent = inferRetrievalIntent(input);
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
Transformer le sujet fourni en dossier factuel et éditorial. Commence par la bibliothèque LEVOIS lorsqu'elle est fournie. La recherche web n'est qu'un recours pour les lacunes nécessaires, les éléments à rafraîchir ou les preuves absentes. Privilégie les sources primaires et officielles : INSEE, data.gouv.fr/DVF, ADEME, Géorisques, service-public.fr, Legifrance, collectivités, documents originaux. Utilise une source secondaire seulement si elle ajoute une information nécessaire.

CONTRAT DE VÉRITÉ
- Ne fabrique jamais chiffre, prix, date, distance, temps de trajet, DPE, surface, règle ou citation.
- Chaque claim de type fact ou calculation doit référencer au moins une source réellement fournie par la bibliothèque ou réellement trouvée sur le web.
- Distingue clairement ce que la preuve démontre de ce qu'elle ne permet pas de conclure.
- Si une donnée importante manque, crée un unknown. Mets blocking=true UNIQUEMENT si l'angle sélectionné ne peut pas être publié honnêtement sans cette information. Une donnée manquante seulement nécessaire pour personnaliser le cas du lecteur, calculer ses trajets exacts ou enrichir l'exemple doit rester blocking=false.
- Un scénario pédagogique est autorisé seulement avec claimType=scenario et sans le présenter comme un cas réel.
- N'utilise pas une statistique locale hors de son périmètre ou de sa période.
- La conclusion doit rester proportionnée aux preuves.
- Pour “Chartres et alentours”, choisis le périmètre statistique qui correspond réellement à l'affirmation (commune, bassin de vie, unité urbaine, aire d'attraction ou liste de communes). Ne remplace jamais silencieusement un périmètre par un autre. Affiche toujours le périmètre exact.
- N'ajoute pas une statistique simplement parce qu'elle est disponible : chaque claim doit servir soit la pertinence locale, soit le mécanisme, soit une limite utile.

BIBLIOTHÈQUE LEVOIS V2.1
- Chaque preuve fournie contient un evidence_id stable. Si un claim repose sur cette preuve, recopie exactement cet ID dans evidenceRefs.
- REUSABLE_IMMEDIATELY peut soutenir une explication dans son périmètre documenté.
- HISTORICAL_ONLY exige un millésime explicite et ne devient jamais une situation actuelle.
- REFRESH_REQUIRED ne peut pas soutenir une affirmation actuelle sans nouvelle vérification.
- VERIFY_PROPERTY peut expliquer une règle générale mais toute conclusion sur un bien exige une vérification du bien.
- VERIFY_PERSON peut expliquer une règle générale mais toute conclusion sur une personne ou son financement exige ses paramètres.
- DO_NOT_USE n'est jamais fourni au modèle par le moteur.
- Respecte allowed_uses et forbidden_inferences. Ces champs sont des contraintes, pas des notes facultatives.
- Une preuve locale ne devient jamais une estimation individuelle.
- DPE : un numéro de diagnostic n'est pas un logement unique et le corpus ne représente pas automatiquement le parc.
- DVF : n<5 n'est jamais un repère public de prix ; 5≤n<15 exige une forte réserve.
- Risques, urbanisme, eau et bruit : contexte territorial ne signifie pas situation parcellaire.
- Si la bibliothèque suffit à soutenir honnêtement l'angle, n'invente pas un besoin de recherche web.

CANON LEVOIS CONTENU ET EXPÉRIENCE V1
Le canon est prioritaire sur les heuristiques marketing génériques.

Avant d’écrire les hooks, remplis canon.decisionFrame :
- person : qui décide, dans quel moment concret ;
- decision : ce que cette personne doit réellement décider ou vérifier ;
- spontaneousReading : la première lecture plausible ;
- pressureTest : l’information qui oblige à préciser cette lecture ;
- authorizedConclusion : la conclusion maximale réellement soutenue ;
- finalOperation : l’opération que le lecteur peut refaire sans contacter LEVOIS.

Ensuite seulement, produis exactement trois canon.hookCandidates :
1. mode=direct ;
2. mode=scene ;
3. mode=comparison.

Ils doivent promettre la même démonstration. Utilise l’une des familles canoniques : situation, usage, comparison, condition, calendar, scope, unknown, result.
Pour chacun, explicite la promesse explicite ET la promesse implicite. Renseigne evidenceStatus : sourced si l’ouverture dépend de preuves référencées, pedagogical_scenario si les nombres viennent d’un cas fictif, non_numeric sinon. qualifier doit rendre visible le statut nécessaire, par exemple « CAS FICTIF ». Ne choisis jamais une formule plus spectaculaire que authorizedConclusion.

Applique les quatre contrôles d’entrée :
- Temps : le sujet et l’utilité sont repérables immédiatement ;
- Sens : une formulation plus simple ne change pas le degré de certitude ;
- Miroir : le lecteur reconnaît une situation, pas seulement le mot “vous” ;
- Écart : une première lecture plausible est mise à l’épreuve sans contradiction artificielle.

Le storytelling canonique comporte six fonctions, pas six slides obligatoires. Dans canon.storyBeats, fournis exactement une entrée pour chacune :
situation, initial_reading, friction, demonstration, rereading, practical_take.
Pour chaque beat, before et after doivent montrer ce que le lecteur comprend avant puis après. Une étape qui ne change rien doit disparaître.

Trois vetos absolus :
- aucun fait fabriqué présenté comme réel ;
- aucune peur amplifiée non justifiée par le dossier ;
- aucune résolution retenue pour forcer une prise de contact.

La résolution doit rester utilisable sans Mouaad. Un CTA éventuel arrive après la réponse, jamais à sa place.
canon.canonVersion doit être exactement CONTENT_EXPERIENCE_V1_2026-09-19.

LIGNE ÉDITORIALE
- Français simple, concret, compréhensible par un collégien sans être infantilisant.
- LEVOIS rationalise la prise de décision sans employer le mot “rationalisme” comme slogan.
- Le lecteur doit repartir avec une méthode réutilisable, une raison d'enregistrer le carrousel et une question personnelle qui l'amène naturellement vers levois.fr.
- Pas de clickbait mensonger, pas de jargon, pas de CTA commercial agressif.
- Le hook doit être court, provocant par l'idée ou l'image, pas par l'exagération.
- Produit exactement 3 angles éditoriaux et sélectionne le meilleur. Chaque angle doit contenir claimRefs avec les IDs des preuves factuelles centrales qui le soutiennent.
- articleMaster.centralThesis doit être EXACTEMENT identique à canon.decisionFrame.authorizedConclusion. Cette duplication est volontaire pour contrôler la promesse ; ne la paraphrase pas dans centralThesis.
- Article Master : utilise seulement les sections nécessaires, maximum technique 8. Donne la réponse assez tôt puis rends la preuve, le mécanisme, la méthode et les limites inspectables.
- Méthode : préfère une opération courte et mémorisable quand le sujet le permet, sans imposer un nombre universel d'étapes.
- Storyboard : choisis seulement le nombre de slides nécessaire au raisonnement, dans la limite technique de 10. La première unité doit faire comprendre le sujet. La résolution principale doit être livrée avant tout prolongement commercial. La dernière slide peut être une méthode autonome ; un bridge LEVOIS n’est ajouté que s’il prolonge réellement la valeur.
- Dans le dernier tiers du carrousel, n'introduis pas un nouveau grand sujet qui détourne du raisonnement central. Par exemple, ne fais pas entrer le prix dans un carrousel de mobilité sauf s'il était déjà une variable centrale.
- Un CTA LEVOIS est facultatif. S'il existe, il vient après la résolution et décrit une action réellement disponible. Ne retiens jamais la réponse pour obtenir un contact.
- Choisis une seule famille parmi les 8 IDs autorisés.

SOURCES
Dans sources[], tu peux utiliser soit les URLs exactes fournies par la bibliothèque LEVOIS, soit des URLs réellement rencontrées pendant la recherche web. Ne fabrique jamais une URL. Les sourceId doivent être S001, S002, etc. Les claim sourceRefs doivent utiliser ces IDs.

CLAIMS
Les claimId doivent être C001, C002, etc. Pour une valeur numérique, mets uniquement la valeur dans value et l'unité séparément dans unit. Si pas de valeur courte, laisse value vide. Pour tout claim provenant de la bibliothèque, evidenceRefs doit contenir les evidence_id exacts fournis. Pour un claim obtenu uniquement par recherche web, evidenceRefs doit être [].

Tu dois respecter strictement le schéma JSON de sortie.`;

  const canSkipWeb =
    Boolean(env.LEVOIS_EVIDENCE_DB) &&
    libraryCoverage.candidateForWebSkip;

  const responseInput = libraryContext.length
    ? JSON.stringify({
        user_input: input,
        levois_library_evidence: libraryContext,
        retrieval_summary: libraryCoverage,
        instruction: canSkipWeb
          ? 'La bibliothèque fournit assez de preuves directement publiables pour commencer sans web. Utilise ces preuves. Si une lacune subsiste, déclare-la comme unknown plutôt que de fabriquer.'
          : 'Commence par ces preuves. Si une affirmation nécessaire reste absente ou exige un rafraîchissement, utilise le web uniquement pour cette lacune.',
      })
    : input;

  const requestBody: Record<string, unknown> = {
    model,
    store: false,
    max_output_tokens: 12000,
    instructions,
    input: responseInput,
    text: {
      format: {
        type: 'json_schema',
        name: 'levois_research_bundle',
        strict: true,
        schema: researchSchema,
      },
    },
    metadata: {
      app: 'levois-studio',
      schema: 'research-v1',
      evidence_policy: 'V21-2026-09-19',
    },
  };

  if (!canSkipWeb) {
    requestBody.max_tool_calls = 8;
    requestBody.tools = [{ type: 'web_search' }];
    requestBody.include = ['web_search_call.action.sources'];
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(requestBody),
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
  const librarySources = new Map<string, { url: string; title: string }>();
  for (const hit of libraryHits) {
    const url = hit.sourceUrl ? normalizeUrl(hit.sourceUrl) : '';
    if (url && !librarySources.has(url)) {
      librarySources.set(url, { url, title: hit.sourceTitle || '' });
    }
  }

  const acceptedSources = new Map([
    ...librarySources.entries(),
    ...webSources.entries(),
  ]);
  const sanitized = sanitizeBundle(bundle, acceptedSources, allowedEvidenceIds);

  let traceabilityLogged = false;
  if (env.LEVOIS_EVIDENCE_DB) {
    try {
      await recordGenerationRun(env.LEVOIS_EVIDENCE_DB, {
        generationId: payload.id || crypto.randomUUID(),
        inputText: input,
        pipeline: canSkipWeb
          ? 'library_research_no_web'
          : 'library_research_with_web',
        canonVersion: 'CONTENT_EXPERIENCE_V1_2026-09-19',
        evidenceLibraryVersion: 'V21',
        webUsed: !canSkipWeb,
        model: payload.model || model,
        evidenceIds: Array.from(allowedEvidenceIds),
        rejectedEvidenceIds: [],
        requestId: payload.id || undefined,
      });
      traceabilityLogged = true;
    } catch {
      traceabilityLogged = false;
    }
  }

  return json({
    bundle: sanitized.bundle,
    meta: {
      model: payload.model || model,
      searchedSources: webSources.size,
      acceptedSources: sanitized.bundle.sources.length,
      downgradedClaims: sanitized.downgradedClaims,
      requestId: payload.id || '',
      libraryHits: libraryHits.length,
      libraryCoverage,
      webSkipped: canSkipWeb,
      retrievalIntent,
      traceabilityLogged,
    },
  });
}

export default {
  async fetch(request: Request, env: StudioEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/api/studio/editorial') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return editorial(request, env);
    }
    if (url.pathname === '/api/studio/traceability/reviews') {
      if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'GET, POST' } });
      return traceabilityReviews(request, env);
    }

    if (url.pathname === '/api/studio/traceability/resolve') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return traceabilityResolve(request, env);
    }

    if (url.pathname === '/api/studio/traceability/sync') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return traceabilitySync(request, env);
    }

    if (url.pathname === '/api/studio/traceability/stale') {
      if (request.method !== 'GET' && request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'GET, POST' } });
      return traceabilityStale(request, env);
    }

    if (url.pathname === '/api/studio/traceability/impact') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return traceabilityImpact(request, env);
    }

    if (url.pathname === '/api/studio/traceability/save') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return saveTraceability(request, env);
    }

    if (url.pathname === '/api/studio/research') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return research(request, env);
    }

    if (url.pathname === '/api/studio/library/search') {
      if (request.method !== 'POST') return json({ error: 'Méthode non autorisée.' }, { status: 405, headers: { allow: 'POST' } });
      return librarySearch(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};
