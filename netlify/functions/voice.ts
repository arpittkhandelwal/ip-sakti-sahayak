// ============================================================
// IP-SAKTI Sahayak – /api/voice
// Optional: Speech-to-Text and Text-to-Speech via Sarvam Saarika/Bulbul.
// Feature-flagged: VITE_ENABLE_VOICE=true
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { speechToText, textToSpeech } from '../../src/lib/sarvam.js';
import { LANGUAGE_CODES_SARVAM } from '../../src/types/index.js';
import type { Language } from '../../src/types/index.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const VOICE_ENABLED = process.env.VITE_ENABLE_VOICE === 'true';

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!VOICE_ENABLED) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ error: 'Voice features are disabled. Set VITE_ENABLE_VOICE=true to enable.' }),
    };
  }

  let body: {
    action?: 'stt' | 'tts';
    audioBase64?: string;
    text?: string;
    language?: Language;
  };

  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON body' }) };
  }

  const { action, audioBase64, text, language = 'en' } = body;
  const langCode = LANGUAGE_CODES_SARVAM[language];

  try {
    if (action === 'stt') {
      if (!audioBase64) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'audioBase64 required for STT' }) };
      }
      const transcript = await speechToText(audioBase64, langCode);
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ transcript }) };
    }

    if (action === 'tts') {
      if (!text) {
        return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'text required for TTS' }) };
      }
      const audioBase64Out = await textToSpeech(text, {
        target_language_code: langCode,
        speaker: 'meera',
      });
      return { statusCode: 200, headers: CORS, body: JSON.stringify({ audioBase64: audioBase64Out }) };
    }

    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'action must be "stt" or "tts"' }) };
  } catch (err) {
    console.error('[voice] Error:', err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: (err as Error).message }),
    };
  }
};
