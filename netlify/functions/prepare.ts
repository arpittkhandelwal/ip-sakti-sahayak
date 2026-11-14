// ============================================================
// IP-SAKTI Sahayak – /api/prepare
// Stage 1: Detect language, translate query to English,
//          run classification state machine, retrieve BM25 chunks.
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { readFileSync } from 'fs';
import { join } from 'path';
import { detectLanguage, translate } from '../../src/lib/sarvam.js';
import { classifyQuery } from '../../src/lib/classifier.js';
import { initIndex, search, isSampleOnly } from '../../src/lib/bm25.js';
import { logQuery } from '../../src/lib/audit.js';
import type {
  BM25Index,
  ClassificationState,
  Language,
  PrepareResponse,
} from '../../src/types/index.js';
import {
  TOP_K,
  MIN_SCORE_THRESHOLD,
  INPUT_MAX_CHARS,
  LANGUAGE_CODES_SARVAM,
} from '../../src/types/index.js';

// ── Load index once at module scope ──────────────────────────
let indexLoaded = false;
let indexData: BM25Index;

function loadIndex(): void {
  if (indexLoaded) return;
  const indexPath = join(process.cwd(), 'netlify', 'functions', 'data', 'index.json');
  try {
    const raw = readFileSync(indexPath, 'utf-8');
    indexData = JSON.parse(raw) as BM25Index;
    initIndex(indexData);
    indexLoaded = true;
    console.log(`[prepare] BM25 index loaded: ${indexData.totalChunks} chunks, sampleOnly=${indexData.sampleOnly}`);
  } catch (err) {
    console.error('[prepare] Failed to load index:', err);
    throw new Error('Search index not found. Run `npm run ingest` first.');
  }
}

// ── Rate limiting (in-memory, per cold start) ────────────────
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_RPM = parseInt(process.env.RATE_LIMIT_RPM ?? '20', 10);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_RPM) return false;
  entry.count++;
  return true;
}

// ── CORS headers ─────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // Rate limit
  const ip = event.headers['x-forwarded-for'] ?? event.headers['x-nf-client-connection-ip'] ?? 'unknown';
  if (!checkRateLimit(ip.split(',')[0].trim())) {
    return { statusCode: 429, headers: CORS, body: JSON.stringify({ error: 'Rate limit exceeded. Please wait a minute.' }) };
  }

  try {
    loadIndex();
  } catch (err) {
    return { statusCode: 503, headers: CORS, body: JSON.stringify({ error: (err as Error).message }) };
  }

  let body: {
    query?: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    currentState?: Partial<ClassificationState>;
    sessionId?: string;
  };

  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { query = '', conversationHistory = [], currentState, sessionId } = body;

  // Input validation
  if (!query.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Query is required' }) };
  }
  if (query.length > INPUT_MAX_CHARS) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Query too long. Max ${INPUT_MAX_CHARS} characters.` }) };
  }

  const sid = sessionId ?? `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. Detect language
  const detectedLanguage = await detectLanguage(query);

  // 2. Translate to English if needed
  let translatedQuery = query;
  if (detectedLanguage !== 'en') {
    translatedQuery = await translate(query, {
      source_language_code: LANGUAGE_CODES_SARVAM[detectedLanguage],
      target_language_code: 'en-IN',
    });
  }

  // 3. Classification state machine
  const initialState: ClassificationState = currentState
    ? ({
        step: currentState.step ?? 0,
        productCategory: currentState.productCategory ?? 'unknown',
        jurisdiction: currentState.jurisdiction ?? 'india',
        ipType: currentState.ipType ?? 'general',
        isClassified: currentState.isClassified ?? false,
        clarifyingQuestions: currentState.clarifyingQuestions ?? [],
        answers: currentState.answers ?? [],
      } satisfies ClassificationState)
    : {
        step: 0,
        productCategory: 'unknown',
        jurisdiction: 'india',
        ipType: 'general',
        isClassified: false,
        clarifyingQuestions: [],
        answers: [],
      };

  const classificationResult = await classifyQuery({
    query: translatedQuery,
    conversationHistory,
    currentState: initialState,
  });

  const { updatedState, pendingQuestion, needsClarification } = classificationResult;

  // 4. BM25 retrieval (even if still classifying, retrieve based on best-effort)
  const topK = parseInt(process.env.TOP_K ?? String(TOP_K), 10);
  const retrievedChunks = search(translatedQuery, {
    jurisdiction: updatedState.jurisdiction !== 'india' && updatedState.jurisdiction !== 'both' ? undefined : updatedState.jurisdiction,
    ipType: updatedState.ipType === 'general' ? undefined : updatedState.ipType,
    topK,
  });

  // Check if below score threshold (safe abstention signal)
  const minScore = parseFloat(process.env.MIN_SCORE_THRESHOLD ?? String(MIN_SCORE_THRESHOLD));
  const topScore = retrievedChunks[0]?.score ?? 0;
  const isSample = isSampleOnly(indexData.chunks);

  // Log audit (no PII)
  logQuery({
    query,
    detectedLanguage,
    jurisdiction: updatedState.jurisdiction,
    ipType: updatedState.ipType,
    sourceIds: retrievedChunks.map((c) => c.id),
    confidence: topScore < minScore ? 'Low' : 'Medium',
    abstained: false,
  });

  const response: PrepareResponse & { sampleOnly: boolean; topScore: number } = {
    sessionId: sid,
    detectedLanguage: detectedLanguage as Language,
    translatedQuery,
    classification: updatedState,
    retrievedChunks: retrievedChunks.map((c) => ({
      ...c,
      content: c.content.slice(0, 800), // limit content in response
    })),
    pendingQuestion,
    needsClarification,
    sampleOnly: isSample,
    topScore,
  };

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify(response),
  };
};
