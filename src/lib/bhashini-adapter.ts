// ============================================================
// IP-SAKTI Sahayak – Bhashini Adapter (Future Swap-In)
// This file isolates the Bhashini API interface.
// To switch from Sarvam to Bhashini, implement the functions
// below and update the imports in netlify/functions/*.ts
// See: https://bhashini.gov.in/ulca/model/api-info/nmt
// ============================================================

import type { Language } from '../types/index.js';

export interface BhashiniTranslateOptions {
  sourceLanguage: Language;
  targetLanguage: Language;
  text: string;
  serviceId?: string; // from Bhashini model discovery
}

/**
 * Translate using Bhashini ULCA API.
 * NOT IMPLEMENTED – placeholder for future Bhashini integration.
 * Currently, the app uses Sarvam Translate (see sarvam.ts).
 */
export async function bhashiniTranslate(
  _options: BhashiniTranslateOptions,
): Promise<string> {
  throw new Error(
    'Bhashini adapter is not yet implemented. ' +
    'The app currently uses Sarvam Translate. ' +
    'To enable Bhashini: add BHASHINI_USER_ID and BHASHINI_API_KEY env vars, ' +
    'implement this function using the ULCA pipeline API, ' +
    'then update netlify/functions/prepare.ts and netlify/functions/localize.ts ' +
    'to import from bhashini-adapter instead of sarvam.',
  );
}

/**
 * Detect language using Bhashini LID.
 * NOT IMPLEMENTED – placeholder for future Bhashini integration.
 */
export async function bhashiniDetectLanguage(
  _text: string,
): Promise<Language> {
  throw new Error('Bhashini adapter LID not implemented.');
}

