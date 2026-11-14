// ============================================================
// IP-SAKTI Sahayak – /api/compare
// Compares two legal documents / patent claims for IP overlap,
// conflict risk, and key differences.
// ============================================================

import type { Handler, HandlerEvent } from '@netlify/functions';
import { readFileSync } from 'fs';
import { join } from 'path';
import { chatCompletion } from '../../src/lib/sarvam.js';
import { initIndex, search } from '../../src/lib/bm25.js';
import type { BM25Index } from '../../src/types/index.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const LEGAL_TERMS = [
  'patent', 'trademark', 'section 3', 'traditional knowledge', 'biological diversity',
  'prior art', 'novelty', 'inventive step', 'prior informed consent', 'benefit sharing',
  'geographical indication', 'triphala', 'ashwagandha', 'ayurveda', 'nba', 'tkdl',
  'trips', 'wipo', 'nagoya', 'neem', 'turmeric', 'section 7', 'abs compliance',
  'nba approval', 'sbb intimation', 'drugs cosmetics', 'schedule y', 'first schedule',
];

function extractTerms(text: string): Set<string> {
  const lower = text.toLowerCase();
  return new Set(LEGAL_TERMS.filter((t) => lower.includes(t)));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

let indexLoaded = false;

function loadIndex(): void {
  if (indexLoaded) return;
  const indexPath = join(process.cwd(), 'netlify', 'functions', 'data', 'index.json');
  const raw = readFileSync(indexPath, 'utf-8');
  const indexData = JSON.parse(raw) as BM25Index;
  initIndex(indexData);
  indexLoaded = true;
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body: { documentA?: string; documentB?: string };
  try {
    body = JSON.parse(event.body ?? '{}');
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { documentA = '', documentB = '' } = body;
  if (!documentA.trim() || !documentB.trim()) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Both documentA and documentB are required' }) };
  }
  if (documentA.length > 3000 || documentB.length > 3000) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Each document must be under 3000 characters' }) };
  }

  // Load BM25 index
  try { loadIndex(); } catch { /* non-fatal */ }

  // Compute keyword similarity
  const termsA = extractTerms(documentA);
  const termsB = extractTerms(documentB);
  const commonTerms = [...termsA].filter((t) => termsB.has(t));
  const onlyA = [...termsA].filter((t) => !termsB.has(t));
  const onlyB = [...termsB].filter((t) => !termsA.has(t));
  const jaccardScore = jaccard(termsA, termsB);
  const similarityScore = Math.round(jaccardScore * 100);
  const similarity: 'High' | 'Medium' | 'Low' =
    jaccardScore > 0.55 ? 'High' : jaccardScore > 0.25 ? 'Medium' : 'Low';

  // BM25 overlapping chunks
  let commonChunks: string[] = [];
  try {
    const chunksA = search(documentA.slice(0, 300), { topK: 3 }).map((c) => c.id);
    const chunksB = search(documentB.slice(0, 300), { topK: 3 }).map((c) => c.id);
    commonChunks = chunksA.filter((id) => chunksB.includes(id));
  } catch { /* skip */ }

  // Try LLM analysis
  let differences: string[] = [];
  let conflictRisk: 'High' | 'Medium' | 'Low' = similarity;
  let conflictExplanation = '';
  let recommendedActions: string[] = [];

  try {
    const llmResult = await chatCompletion(
      [
        {
          role: 'system',
          content: 'You are an IP legal analyst specializing in Indian IP law and Ayurveda. Compare two documents and return JSON only.',
        },
        {
          role: 'user',
          content: `Compare these two legal documents from an Indian IP law perspective (Patents Act 1970, BD Act 2002, Trade Marks Act 1999, GI Act 1999).

Document A:
${documentA.slice(0, 1500)}

Document B:
${documentB.slice(0, 1500)}

Return valid JSON with:
{
  "differences": ["<3-5 specific legal differences between A and B>"],
  "conflictRisk": "High"|"Medium"|"Low",
  "conflictExplanation": "<1-2 sentences on conflict potential>",
  "recommendedActions": ["<3 specific recommended actions>"]
}`,
        },
      ],
      { temperature: 0.1, max_tokens: 600, response_format: { type: 'json_object' } },
    );

    const parsed = JSON.parse(llmResult) as {
      differences: string[];
      conflictRisk: 'High' | 'Medium' | 'Low';
      conflictExplanation: string;
      recommendedActions: string[];
    };
    differences = parsed.differences ?? [];
    conflictRisk = parsed.conflictRisk ?? conflictRisk;
    conflictExplanation = parsed.conflictExplanation ?? '';
    recommendedActions = parsed.recommendedActions ?? [];
  } catch {
    // Rule-based fallback
    differences = [
      onlyA.length > 0
        ? `Document A contains legal concepts not in B: ${onlyA.slice(0, 3).join(', ')}`
        : 'Document A does not contain unique legal terms not found in Document B.',
      onlyB.length > 0
        ? `Document B introduces additional concepts: ${onlyB.slice(0, 3).join(', ')}`
        : 'Document B does not introduce unique legal concepts beyond Document A.',
      `Common legal ground: ${commonTerms.length > 0 ? commonTerms.slice(0, 3).join(', ') : 'No shared legal terms detected'}`,
      commonChunks.length > 0
        ? `Both documents reference similar statutory corpus sections (${commonChunks.length} overlapping)`
        : 'Documents reference different areas of the statutory corpus.',
    ];
    conflictExplanation =
      similarity === 'High'
        ? 'High overlap in legal terms suggests potential trademark, patent, or IP conflict — formal legal assessment recommended.'
        : similarity === 'Medium'
        ? 'Moderate overlap detected. Documents share some legal concepts but diverge in scope — conflict risk is contextual.'
        : 'Low keyword overlap suggests distinct legal positions with minimal direct conflict risk.';
    recommendedActions = [
      'Engage a registered Indian IP attorney for formal opinion on conflict potential.',
      'Conduct a TKDL prior-art search at tkdl.res.in if traditional knowledge is involved.',
      'File an ABS compliance check with the relevant State Biodiversity Board or NBA.',
    ];
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({
      similarity,
      similarityScore,
      differences,
      conflictRisk,
      conflictExplanation,
      commonLegalTerms: commonTerms,
      recommendedActions,
    }),
  };
};

