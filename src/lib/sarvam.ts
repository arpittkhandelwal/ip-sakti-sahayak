// ============================================================
// IP-SAKTI Sahayak – Sarvam AI API Client
// All Sarvam API calls are centralized here.
// Update model names / endpoints here when docs.sarvam.ai changes.
// ============================================================

import type { Language } from '../types/index.js';

// ── Environment / Model Config ──────────────────────────────
const SARVAM_API_KEY = process.env.SARVAM_API_KEY ?? '';
const BASE_URL = 'https://api.sarvam.ai';
const CHAT_COMPLETIONS_URL = `${BASE_URL}/v1/chat/completions`;
const TRANSLATE_URL = `${BASE_URL}/translate`;
const LID_URL = `${BASE_URL}/text-lid`;
const STT_URL = `${BASE_URL}/speech-to-text`;
const TTS_URL = `${BASE_URL}/text-to-speech`;

export const CHAT_MODEL = process.env.SARVAM_CHAT_MODEL ?? 'sarvam-m';
export const TRANSLATE_MODEL = process.env.SARVAM_TRANSLATE_MODEL ?? 'mayura:v1';
export const STT_MODEL = process.env.SARVAM_STT_MODEL ?? 'saarika:v2';
export const TTS_MODEL = process.env.SARVAM_TTS_MODEL ?? 'bulbul:v1';

// ── Retry / Rate-limit helpers ───────────────────────────────
const RETRY_DELAYS = [500, 1500, 4000]; // ms

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = RETRY_DELAYS.length,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 503) {
        const delay = RETRY_DELAYS[attempt] ?? 8000;
        console.warn(`[sarvam] ${status} – retrying in ${delay}ms (attempt ${attempt + 1})`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sarvamFetch(
  url: string,
  options: RequestInit,
): Promise<Response> {
  if (!SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not configured. Add it to your environment variables.');
  }
  const headers: HeadersInit = {
    'api-subscription-key': SARVAM_API_KEY,
    'Authorization': `Bearer ${SARVAM_API_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const err = new Error(`Sarvam API error ${res.status}: ${body}`);
    (err as unknown as { status: number }).status = res.status;
    throw err;
  }
  return res;
}

// ── Types ────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' | 'text' };
}

export interface TranslateOptions {
  source_language_code?: string;
  target_language_code: string;
  mode?: 'formal' | 'modern-colloquial' | 'classic-colloquial';
  numerals_format?: 'international' | 'native';
  enable_preprocessing?: boolean;
}

export interface LIDResult {
  language_code: string;
  script_code?: string;
}

export interface TTSOptions {
  target_language_code: string;
  speaker?: string;
  pace?: number;
  pitch?: number;
  loudness?: number;
  speech_sample_rate?: number;
  enable_preprocessing?: boolean;
}

// ── Chat Completions ─────────────────────────────────────────
export async function chatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<string> {
  return withRetry(async () => {
    const res = await sarvamFetch(CHAT_COMPLETIONS_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: options.model ?? CHAT_MODEL,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.max_tokens ?? 1024,
        ...(options.response_format ? { response_format: options.response_format } : {}),
      }),
    });
    const data = await res.json() as {
      choices: Array<{ message: { content: string } }>;
    };
    return data.choices[0]?.message?.content ?? '';
  });
}

// ── Translation ───────────────────────────────────────────────
/**
 * Translate text between languages.
 * Statute names, section numbers, citations and URLs
 * are protected with placeholders before sending.
 */
export async function translate(
  text: string,
  options: TranslateOptions,
): Promise<string> {
  if (options.target_language_code === 'en-IN' && (!options.source_language_code || options.source_language_code === 'en-IN')) {
    return text; // no-op
  }
  return withRetry(async () => {
    const { protected: protectedText, map } = protectLegalTerms(text);
    const res = await sarvamFetch(TRANSLATE_URL, {
      method: 'POST',
      body: JSON.stringify({
        input: protectedText,
        source_language_code: options.source_language_code ?? 'en-IN',
        target_language_code: options.target_language_code,
        model: TRANSLATE_MODEL,
        mode: options.mode ?? 'formal',
        enable_preprocessing: options.enable_preprocessing ?? true,
        numerals_format: options.numerals_format ?? 'international',
      }),
    });
    const data = await res.json() as { translated_text: string };
    return restoreLegalTerms(data.translated_text, map);
  });
}

// Protect legal terms (statute names, section refs, URLs) with placeholders
function protectLegalTerms(text: string): { protected: string; map: Map<string, string> } {
  const map = new Map<string, string>();
  let idx = 0;
  
  // Patterns to protect
  const patterns = [
    // URLs
    /https?:\/\/[^\s<>"{}|\\^`[\]]+/g,
    // Section/Article references: Sec 3(p), Article 27.3(b), Rule 158, Chapter IV-A
    /(?:Section|Sec|Article|Art|Rule|Regulation|Chapter|Schedule|Clause|Part)\s+[\d\w().,/-]+/gi,
    // Citation brackets [CHUNK-xxx]
    /\[CHUNK-[^\]]+\]/g,
    // Act/Treaty names with years
    /(?:[A-Z][a-zA-Z\s&()'-]+(?:Act|Rules|Treaty|Protocol|Agreement|Convention|Directive|Regulation|Order|Schedule|Code|Bill)(?:\s*,?\s*\d{4})?)/g,
    // Standalone years in legal context
    /\b(19|20)\d{2}\b/g,
  ];
  
  let result = text;
  for (const pattern of patterns) {
    result = result.replace(pattern, (match) => {
      // Check if already a placeholder
      if (/^__LEGAL_\d+__$/.test(match)) return match;
      const key = `__LEGAL_${idx++}__`;
      map.set(key, match);
      return key;
    });
  }
  
  return { protected: result, map };
}

function restoreLegalTerms(text: string, map: Map<string, string>): string {
  let result = text;
  for (const [key, value] of map) {
    result = result.replaceAll(key, value);
  }
  return result;
}

// ── Language Identification ──────────────────────────────────
const SCRIPT_RANGES: Array<{ lang: Language; pattern: RegExp }> = [
  { lang: 'hi', pattern: /[\u0900-\u097F]/ },
  { lang: 'ta', pattern: /[\u0B80-\u0BFF]/ },
  { lang: 'bn', pattern: /[\u0980-\u09FF]/ },
  { lang: 'mr', pattern: /[\u0900-\u097F]/ }, // Devanagari (same as Hindi)
  { lang: 'te', pattern: /[\u0C00-\u0C7F]/ },
];

function scriptHeuristic(text: string): Language {
  for (const { lang, pattern } of SCRIPT_RANGES) {
    if (pattern.test(text)) {
      // Distinguish Marathi from Hindi by common markers
      if (lang === 'hi' && /\b(आहे|करणे|आणि|होते|नाही)\b/.test(text)) return 'mr';
      return lang;
    }
  }
  return 'en';
}

export async function detectLanguage(text: string): Promise<Language> {
  try {
    return await withRetry(async () => {
      const res = await sarvamFetch(LID_URL, {
        method: 'POST',
        body: JSON.stringify({ input: text.slice(0, 500) }),
      });
      const data = await res.json() as { language_code: string };
      const code = data.language_code?.split('-')[0] as Language;
      const supported: Language[] = ['en', 'hi', 'ta', 'bn', 'mr', 'te'];
      return supported.includes(code) ? code : 'en';
    });
  } catch {
    // Fallback to Unicode-script heuristic
    console.warn('[sarvam] LID API failed, using script heuristic');
    return scriptHeuristic(text);
  }
}

// ── Speech-to-Text (STT) ─────────────────────────────────────
export async function speechToText(
  audioBase64: string,
  languageCode: string,
): Promise<string> {
  return withRetry(async () => {
    const res = await sarvamFetch(STT_URL, {
      method: 'POST',
      body: JSON.stringify({
        model: STT_MODEL,
        language_code: languageCode,
        audio: audioBase64,
      }),
    });
    const data = await res.json() as { transcript: string };
    return data.transcript ?? '';
  });
}

// ── Text-to-Speech (TTS) ─────────────────────────────────────
export async function textToSpeech(
  text: string,
  options: TTSOptions,
): Promise<string> {
  return withRetry(async () => {
    // Strip markdown for TTS
    const cleanText = text
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[CHUNK-[^\]]+\]/g, '')
      .slice(0, 1000); // TTS limit
    
    const res = await sarvamFetch(TTS_URL, {
      method: 'POST',
      body: JSON.stringify({
        inputs: [cleanText],
        target_language_code: options.target_language_code,
        speaker: options.speaker ?? 'meera',
        model: TTS_MODEL,
        pace: options.pace ?? 1.0,
        pitch: options.pitch ?? 0,
        loudness: options.loudness ?? 1.5,
        speech_sample_rate: options.speech_sample_rate ?? 22050,
        enable_preprocessing: options.enable_preprocessing ?? true,
      }),
    });
    const data = await res.json() as { audios: string[] };
    return data.audios?.[0] ?? '';
  });
}

// ── LLM-as-Judge (Eval) ──────────────────────────────────────
export interface JudgeResult {
  score: number; // 0–10
  feedback: string;
}

export async function llmJudge(
  question: string,
  referenceAnswer: string,
  generatedAnswer: string,
): Promise<JudgeResult> {
  const prompt = `You are an expert evaluator for a legal AI assistant specialized in Indian Intellectual Property and Ayurveda regulatory law.

Evaluate the generated answer against the reference answer using this rubric:
- Factual accuracy (0-4): Are the legal provisions, section numbers, act names correct?
- Completeness (0-3): Does it cover the key points from the reference?
- Groundedness (0-2): Is it grounded in sources, not fabricated?
- Conciseness (0-1): Is it appropriately concise without losing meaning?

Question: ${question}
Reference Answer: ${referenceAnswer}
Generated Answer: ${generatedAnswer}

Respond with valid JSON only:
{"score": <0-10>, "feedback": "<one sentence>"}`;

  const result = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { response_format: { type: 'json_object' }, temperature: 0 },
  );
  
  try {
    const parsed = JSON.parse(result) as { score: number; feedback: string };
    return { score: Math.min(10, Math.max(0, parsed.score)), feedback: parsed.feedback };
  } catch {
    return { score: 0, feedback: 'Failed to parse judge response' };
  }
}
