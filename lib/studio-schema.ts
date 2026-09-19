export const STUDIO_SCHEMA_VERSION = '1.0' as const;

export type StudioFamilyId =
  | 'decider_arbitrer'
  | 'prix_valeur'
  | 'budget_financement'
  | 'espace_usage'
  | 'lieu_mobilite'
  | 'bien_technique'
  | 'marche_territoire'
  | 'verifier_transaction';

export type StudioFamily = {
  id: StudioFamilyId;
  code: string;
  label: string;
  accent: string;
  textOnAccent: string;
};

export const STUDIO_FAMILIES: Record<StudioFamilyId, StudioFamily> = {
  decider_arbitrer: { id: 'decider_arbitrer', code: '01', label: 'Décider / Arbitrer', accent: '#00D9F5', textOnAccent: '#03161D' },
  prix_valeur: { id: 'prix_valeur', code: '02', label: 'Prix / Valeur', accent: '#FF4D4D', textOnAccent: '#210606' },
  budget_financement: { id: 'budget_financement', code: '03', label: 'Budget / Financement', accent: '#8A5CFF', textOnAccent: '#100827' },
  espace_usage: { id: 'espace_usage', code: '04', label: 'Espace / Usage', accent: '#FFD447', textOnAccent: '#241900' },
  lieu_mobilite: { id: 'lieu_mobilite', code: '05', label: 'Lieu / Mobilité', accent: '#2979FF', textOnAccent: '#06142E' },
  bien_technique: { id: 'bien_technique', code: '06', label: 'Bien / Technique', accent: '#33D17A', textOnAccent: '#052313' },
  marche_territoire: { id: 'marche_territoire', code: '07', label: 'Marché / Territoire', accent: '#FF4FA3', textOnAccent: '#2C061B' },
  verifier_transaction: { id: 'verifier_transaction', code: '08', label: 'Vérifier / Transaction', accent: '#FF8A2A', textOnAccent: '#2B1200' },
};

export type StudioInputType = 'idea' | 'question' | 'url' | 'document' | 'dataset' | 'mixed';

export type EditorialScope = {
  rawTopic: string;
  decisionQuestion: string;
  audience: string;
  territory: string;
  objective: string;
  hypothesesToTest: string[];
  mustNotAssume: string[];
};

export type SourceReliability = 'primary' | 'secondary' | 'context';
export type StudioSource = {
  sourceId: string;
  type: 'official_dataset' | 'official_document' | 'institutional_page' | 'research' | 'press' | 'user_document' | 'other';
  publisher: string;
  title: string;
  url?: string;
  dataPeriod?: string;
  geographicScope?: string;
  reliability: SourceReliability;
  notes?: string;
};

export type ClaimType = 'fact' | 'calculation' | 'declaration' | 'observation' | 'scenario' | 'unknown';
export type ClaimStatus = 'verified' | 'qualified' | 'insufficient' | 'rejected';

export type StudioClaim = {
  claimId: string;
  claim: string;
  claimType: ClaimType;
  value?: number | string;
  unit?: string;
  population?: string;
  geographicScope?: string;
  timeScope?: string;
  sourceRefs: string[];
  evidenceRefs?: string[];
  evidenceStrength: 'strong' | 'medium' | 'weak' | 'none';
  status: ClaimStatus;
  allowedUses: string[];
  forbiddenInferences: string[];
};

export type StudioUnknown = {
  unknownId: string;
  question: string;
  importance: 'high' | 'medium' | 'low';
  reason: string;
  blocking: boolean;
};

export type EvidencePack = {
  sources: StudioSource[];
  claims: StudioClaim[];
  unknowns: StudioUnknown[];
  summary: {
    verifiedClaims: number;
    qualifiedClaims: number;
    insufficientClaims: number;
    rejectedClaims: number;
    researchConfidence: 'high' | 'medium' | 'low';
    canPublish: boolean;
    limitations: string[];
  };
};

export type EditorialAngle = {
  angleId: string;
  title: string;
  promise: string;
  hook: string;
  centralProof: string;
  saveValue: string;
  bridgeQuestion: string;
  claimRefs?: string[];
  selected?: boolean;
};

export type CanonHookFamily =
  | 'situation'
  | 'usage'
  | 'comparison'
  | 'condition'
  | 'calendar'
  | 'scope'
  | 'unknown'
  | 'result';

export type CanonHookMode = 'direct' | 'scene' | 'comparison';

export type CanonDecisionFrame = {
  person: string;
  decision: string;
  spontaneousReading: string;
  pressureTest: string;
  authorizedConclusion: string;
  finalOperation: string;
};

export type CanonHookCandidate = {
  mode: CanonHookMode;
  family: CanonHookFamily;
  text: string;
  explicitPromise: string;
  implicitPromise: string;
  evidenceStatus: 'sourced' | 'pedagogical_scenario' | 'non_numeric';
  qualifier: string;
  claimRefs: string[];
  evidenceRefs: string[];
};

export type CanonStoryFunction =
  | 'situation'
  | 'initial_reading'
  | 'friction'
  | 'demonstration'
  | 'rereading'
  | 'practical_take';

export type CanonStoryBeat = {
  function: CanonStoryFunction;
  before: string;
  after: string;
  copy: string;
  claimRefs: string[];
};

export type CanonEditorialRecord = {
  canonVersion: string;
  decisionFrame: CanonDecisionFrame;
  hookCandidates: CanonHookCandidate[];
  selectedHookMode: CanonHookMode;
  storyBeats: CanonStoryBeat[];
  essentialLimit: string;
  autonomousAction: string;
};

export type ArticleSectionType =
  | 'question'
  | 'intuition'
  | 'proof'
  | 'mechanism'
  | 'case'
  | 'method'
  | 'limits'
  | 'application';

export type ArticleSection = {
  sectionId: string;
  type: ArticleSectionType;
  heading: string;
  body: string;
  claimRefs: string[];
};

export type ArticleMaster = {
  workingTitle: string;
  centralQuestion: string;
  centralThesis: string;
  family: StudioFamilyId;
  sections: ArticleSection[];
  keyTakeaway: string;
  transferablePrinciple: string;
  nextPersonalQuestion: string;
  recommendedLevoisPath: {
    label: string;
    path: string;
    routeStatus: 'live' | 'pending';
    reason: string;
  };
};

export type SlideRole = 'hook' | 'tension' | 'proof' | 'explanation' | 'case' | 'method' | 'insight' | 'transfer' | 'exercise' | 'bridge';
export type ReaderEffect = 'stop' | 'curiosity' | 'surprise' | 'credibility' | 'clarity' | 'identification' | 'understanding' | 'memorization' | 'participation' | 'action';

export type SlideLayout =
  | 'HERO_PHOTO'
  | 'HERO_NUMBER'
  | 'HERO_MAP'
  | 'EDITORIAL_SPLIT'
  | 'COMPARISON_DUAL'
  | 'MAP_NETWORK'
  | 'MAP_ZONE'
  | 'METHOD_STEPS'
  | 'CASE_DUAL'
  | 'DATA_FIELD'
  | 'QUESTION_SHIFT'
  | 'FINAL_BRIDGE';

export type StoryboardSlide = {
  slideNumber: number;
  narrativeRole: SlideRole;
  objective: string;
  headline: string;
  body: string;
  claimRefs: string[];
  layout: SlideLayout;
  readerEffect: ReaderEffect;
  sourceLabel?: string;
  assetRequirements: string[];
};

export type Storyboard = {
  format: 'instagram_carousel_4x5';
  family: StudioFamilyId;
  accentColor: string;
  slideCount: number;
  slides: StoryboardSlide[];
  qualityGate: {
    hook: boolean;
    factuality: boolean;
    narrative: boolean;
    mobileDensity: boolean;
    transferValue: boolean;
    saveValue: boolean;
    levoisBridge: boolean;
    canonPromise?: boolean;
    resolution?: boolean;
    autonomy?: boolean;
    limitsVisible?: boolean;
  };
};

export type StudioProject = {
  schemaVersion: typeof STUDIO_SCHEMA_VERSION;
  projectId: string;
  status: 'research_required' | 'evidence_ready' | 'storyboard_ready';
  input: {
    inputType: StudioInputType;
    rawInput: string;
  };
  family: StudioFamily;
  scope: EditorialScope;
  evidencePack: EvidencePack;
  angles: EditorialAngle[];
  canon?: CanonEditorialRecord;
  articleMaster: ArticleMaster;
  storyboard: Storyboard;
  generatedAt: string;
};
