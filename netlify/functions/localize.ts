// ============================================================
// IP-SAKTI Sahayak – /api/localize
// Stage 3: Translate the verified answer back to the user's language.
// Statute names, section numbers, citations stay in English.
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { translate } from '../../src/lib/sarvam.js';
import type { Language, LocalizeResponse } from '../../src/types/index.js';
import { LANGUAGE_CODES_SARVAM } from '../../src/types/index.js';

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

  let body: {
    sessionId?: string;
    answer?: string;
    targetLanguage?: Language;
  };

  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { sessionId = `sess-${Date.now()}`, answer = '', targetLanguage = 'en' } = body;

  if (!answer.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'answer is required' }) };
  }

  let localizedAnswer = answer;

  if (targetLanguage !== 'en') {
    try {
      localizedAnswer = await translate(answer, {
        source_language_code: 'en-IN',
        target_language_code: LANGUAGE_CODES_SARVAM[targetLanguage],
        mode: 'formal',
      });
    } catch (err) {
      console.error('[localize] Translation failed:', err);
      // Fallback: return English answer with a note
      localizedAnswer = answer + '\n\n*[Translation unavailable – showing English version]*';
    }
  }

  const response: LocalizeResponse = {
    sessionId,
    localizedAnswer,
    targetLanguage,
  };

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify(response),
  };
};
