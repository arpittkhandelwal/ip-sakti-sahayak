// ============================================================
// IP-SAKTI Sahayak – Shared Type Definitions
// ============================================================

export type Jurisdiction = 'india' | 'international' | 'both';

export type IPType =
  | 'patent'
  | 'gi'
  | 'trademark'
  | 'copyright'
  | 'design'
  | 'ppvfra'
  | 'biodiversity'
  | 'drugs-regulatory'
  | 'trips'
  | 'cbd-nagoya'
  | 'wipo-gratk'
  | 'pct-madrid-hague-budapest'
  | 'general';

export type ProductCategory =
  | 'classical'
  | 'patent-proprietary'
  | 'new-non-classical'
  | 'phytopharmaceutical'
  | 'ayurveda-aahar'
  | 'cosmetic'
  | 'unknown';

export type Language =
  | 'en'
  | 'hi'
  | 'ta'
  | 'bn'
  | 'mr'
  | 'te';

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';

export interface ChunkMetadata {
  id: string;
  title: string;
  jurisdiction: Jurisdiction;
  ip_type: IPType;
  act_or_treaty: string;
  section_or_article: string;
  source_url: string;
  last_verified: string;
  sample: boolean;
  filepath: string;
}

export interface Chunk extends ChunkMetadata {
  content: string;
  score?: number;
}

export interface BM25Index {
  chunks: Chunk[];
  buildDate: string;
  totalChunks: number;
  sampleOnly: boolean;
}

export interface ClassificationState {
  step: number;
  productCategory: ProductCategory;
  jurisdiction: Jurisdiction;
  ipType: IPType;
  productName?: string;
  isClassified: boolean;
  clarifyingQuestions: string[];
  answers: string[];
}

export interface PrepareResponse {
  sessionId: string;
  detectedLanguage: Language;
  translatedQuery: string;
  classification: ClassificationState;
  retrievedChunks: Chunk[];
  pendingQuestion?: string;
  needsClarification: boolean;
}

export interface AnswerResponse {
  sessionId: string;
  rawAnswer: string;
  verifiedAnswer: string;
  citedChunkIds: string[];
  confidence: ConfidenceLevel;
  confidenceScore: number;
  strippedClaims: string[];
  absChecklistItems?: string[];
  tkdlPointers?: string[];
}

export interface LocalizeResponse {
  sessionId: string;
  localizedAnswer: string;
  targetLanguage: Language;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language?: Language;
  timestamp: Date;
  citations?: Chunk[];
  confidence?: ConfidenceLevel;
  confidenceScore?: number;
  absChecklist?: string[];
  tkdlPointers?: string[];
  isLoading?: boolean;
  loadingStage?: 'prepare' | 'answer' | 'localize';
  error?: string;
  isSampleCorpus?: boolean;
  isAbstention?: boolean;
}

export interface ConversationSession {
  id: string;
  messages: ChatMessage[];
  classification: ClassificationState;
  jurisdiction: Jurisdiction;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvalQuestion {
  id: string;
  question: string;
  language: Language;
  jurisdiction: Jurisdiction;
  expected_sources: string[];
  should_abstain: boolean;
  reference_answer?: string;
  ip_type?: IPType;
}

export interface EvalResult {
  questionId: string;
  question: string;
  language: Language;
  jurisdiction: Jurisdiction;
  should_abstain: boolean;
  did_abstain: boolean;
  retrieved_sources: string[];
  expected_sources: string[];
  answer: string;
  judge_score?: number;
  judge_feedback?: string;
  citation_precision: number;
  citation_recall: number;
  retrieval_recall_at_k: number;
  mrr: number;
  multilingual_quality?: number;
  no_rag_answer?: string;
  no_rag_judge_score?: number;
  bm25_only_score?: number;
  bm25_rerank_score?: number;
  latency_ms: number;
}

export interface AuditLogEntry {
  queryHash: string;
  timestamp: string;
  detectedLanguage: Language;
  jurisdiction: Jurisdiction;
  ipType: IPType;
  sourceIds: string[];
  confidence: ConfidenceLevel;
  abstained: boolean;
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  bn: 'বাংলা',
  mr: 'मराठी',
  te: 'తెలుగు',
};

export const LANGUAGE_CODES_SARVAM: Record<Language, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  te: 'te-IN',
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  classical: 'Classical / Generic Drug',
  'patent-proprietary': 'Patent / Proprietary Drug',
  'new-non-classical': 'New Drug (Non-Classical)',
  phytopharmaceutical: 'Phytopharmaceutical',
  'ayurveda-aahar': 'Ayurveda Aahar / Nutraceutical',
  cosmetic: 'Cosmetic (Ayurvedic)',
  unknown: 'Not Yet Classified',
};

export const IP_TYPE_LABELS: Record<IPType, string> = {
  patent: 'Patents (incl. Sec 3(p))',
  gi: 'Geographical Indications',
  trademark: 'Trademarks',
  copyright: 'Copyright',
  design: 'Industrial Designs',
  ppvfra: 'Plant Variety Protection',
  biodiversity: 'Biodiversity / ABS',
  'drugs-regulatory': 'Drugs & Cosmetics Act',
  trips: 'TRIPS Agreement',
  'cbd-nagoya': 'CBD / Nagoya Protocol',
  'wipo-gratk': 'WIPO GRATK Treaty 2024',
  'pct-madrid-hague-budapest': 'PCT / Madrid / Hague / Budapest',
  general: 'General IP Query',
};

export const MIN_SCORE_THRESHOLD = 0.5;
export const TOP_K = 5;
export const LLM_RERANK_TOP_N = 4;
export const INPUT_MAX_CHARS = 2000;
export const MAX_CLARIFYING_QUESTIONS = 3;
