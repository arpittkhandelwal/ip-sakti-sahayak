// ============================================================
// IP-SAKTI Sahayak – Answer Verifier
// Ensures every cited section/article/ID exists in retrieved chunks.
// Strips or flags fabricated citations.
// ============================================================

import type { Chunk } from '../types/index.js';

export interface VerificationResult {
  verifiedAnswer: string;
  strippedClaims: string[];
  citedChunkIds: string[];
}

const CHUNK_CITATION_PATTERN = /\[CHUNK-([^\]]+)\]/g;
const SECTION_PATTERN = /\b(?:Section|Sec|Article|Art|Rule|Regulation)\s+[\d\w().,/-]+/gi;

/**
 * Verify that all citations in the answer exist in the retrieved chunks.
 * Strip citations to non-existent chunks and flag suspicious section references.
 */
export function verifyAnswer(
  rawAnswer: string,
  retrievedChunks: Chunk[],
): VerificationResult {
  const validIds = new Set(retrievedChunks.map((c) => c.id));
  const strippedClaims: string[] = [];
  const citedChunkIds: string[] = [];
  
  // 1. Verify chunk citations [CHUNK-xxx]
  let verifiedAnswer = rawAnswer.replace(CHUNK_CITATION_PATTERN, (match, id) => {
    const fullId = `CHUNK-${id}`;
    if (validIds.has(fullId)) {
      citedChunkIds.push(fullId);
      return match; // keep
    } else {
      strippedClaims.push(`Unverified citation: [${fullId}]`);
      return ''; // strip
    }
  });
  
  // 2. Cross-check section references against retrieved chunk content
  const sectionRefs = [...rawAnswer.matchAll(SECTION_PATTERN)].map((m) => m[0]);
  const retrievedText = retrievedChunks.map((c) => c.content + ' ' + c.section_or_article).join(' ').toLowerCase();
  
  for (const sectionRef of sectionRefs) {
    const normalized = sectionRef.toLowerCase().replace(/\s+/g, ' ');
    if (!retrievedText.includes(normalized) && !isCommonLegalPhrase(normalized)) {
      // Flag but don't strip (may be paraphrase), add note
      strippedClaims.push(`Unverified reference: "${sectionRef}" – not found in retrieved corpus`);
    }
  }
  
  // 3. Add disclaimer if claims were stripped
  if (strippedClaims.length > 0) {
    verifiedAnswer = verifiedAnswer.trim() + 
      '\n\n> ⚠️ **Note:** Some references could not be verified against the retrieved corpus and have been flagged. Please consult primary sources.';
  }
  
  return {
    verifiedAnswer: verifiedAnswer.trim(),
    strippedClaims,
    citedChunkIds: [...new Set(citedChunkIds)],
  };
}

function isCommonLegalPhrase(ref: string): boolean {
  const commonPhrases = [
    'section 3', 'article 27', 'rule 158', 'schedule i', 'schedule ii',
    'chapter iv', 'part iii',
  ];
  return commonPhrases.some((p) => ref.includes(p));
}

/**
 * Compute confidence score based on BM25 scores and citation coverage.
 * NOT self-reported by LLM.
 */
export function computeConfidence(
  retrievedChunks: Chunk[],
  citedChunkIds: string[],
  minScoreThreshold: number,
): { level: 'High' | 'Medium' | 'Low'; score: number } {
  if (retrievedChunks.length === 0) {
    return { level: 'Low', score: 0 };
  }
  
  const scores = retrievedChunks.map((c) => c.score ?? 0);
  const maxScore = Math.max(...scores);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Citation coverage: what fraction of retrieved chunks were cited?
  const citationCoverage = citedChunkIds.length / Math.min(retrievedChunks.length, 5);
  
  // Composite score (0-1)
  const normalizedMax = Math.min(maxScore / 20, 1); // BM25 scores vary; normalize
  const normalizedAvg = Math.min(avgScore / 10, 1);
  const compositeScore = 0.4 * normalizedMax + 0.3 * normalizedAvg + 0.3 * citationCoverage;
  
  let level: 'High' | 'Medium' | 'Low';
  if (compositeScore >= 0.65 && maxScore >= minScoreThreshold * 20) {
    level = 'High';
  } else if (compositeScore >= 0.35) {
    level = 'Medium';
  } else {
    level = 'Low';
  }
  
  return { level, score: Math.round(compositeScore * 100) / 100 };
}

