// ============================================================
// IP-SAKTI Sahayak – BM25 Retrieval Engine
// Uses minisearch under the hood with BM25 scoring.
// Supports metadata filters, field boosting, and reranking.
// ============================================================

import MiniSearch from 'minisearch';
import type { Chunk, BM25Index, Jurisdiction, IPType } from '../types/index.js';

export interface SearchOptions {
  jurisdiction?: Jurisdiction;
  ipType?: IPType;
  topK?: number;
  enableLLMRerank?: boolean;
}

export interface SearchResult extends Chunk {
  score: number;
  termCoverage: number;
  phraseMatch: boolean;
}

let miniSearchInstance: MiniSearch | null = null;
let loadedChunks: Chunk[] = [];

/**
 * Initialize the BM25 index from pre-built index data.
 * Called once at module scope in each Netlify function.
 */
export function initIndex(indexData: BM25Index): void {
  loadedChunks = indexData.chunks;
  
  miniSearchInstance = new MiniSearch({
    fields: ['title', 'section_or_article', 'act_or_treaty', 'content'],
    storeFields: ['id', 'title', 'jurisdiction', 'ip_type', 'act_or_treaty', 'section_or_article', 'source_url', 'last_verified', 'sample', 'filepath'],
    searchOptions: {
      boost: { title: 3, section_or_article: 2, act_or_treaty: 2, content: 1 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'AND',
    },
  });
  
  miniSearchInstance.addAll(
    loadedChunks.map((c) => ({
      ...c,
      id: c.id,
    })),
  );
}

/**
 * Search the BM25 index with metadata filtering and reranking.
 */
export function search(
  query: string,
  options: SearchOptions = {},
): SearchResult[] {
  if (!miniSearchInstance) {
    throw new Error('BM25 index not initialized. Call initIndex() first.');
  }
  
  const { jurisdiction, ipType, topK = 5 } = options;
  
  // BM25 search with OR fallback if AND returns nothing
  let results = miniSearchInstance.search(query, {
    combineWith: 'AND',
    boost: { title: 3, section_or_article: 2, act_or_treaty: 2 },
    fuzzy: 0.2,
    prefix: true,
  });
  
  if (results.length === 0) {
    results = miniSearchInstance.search(query, {
      combineWith: 'OR',
      boost: { title: 3, section_or_article: 2 },
      fuzzy: 0.2,
      prefix: true,
    });
  }
  
  // Map to chunks with score
  const scored: SearchResult[] = results
    .map((r) => {
      const chunk = loadedChunks.find((c) => c.id === r.id);
      if (!chunk) return null;
      return {
        ...chunk,
        score: r.score,
        termCoverage: computeTermCoverage(query, chunk.content),
        phraseMatch: computePhraseMatch(query, chunk.content),
      };
    })
    .filter((r): r is SearchResult => r !== null);
  
  // Metadata filters
  let filtered = scored;
  if (jurisdiction && jurisdiction !== 'both') {
    filtered = filtered.filter(
      (r) => r.jurisdiction === jurisdiction || r.jurisdiction === 'both',
    );
  }
  if (ipType && ipType !== 'general') {
    // If filter returns too few, don't apply strictly
    const ipFiltered = filtered.filter((r) => r.ip_type === ipType);
    if (ipFiltered.length >= 2) filtered = ipFiltered;
  }
  
  // Lightweight rerank: score = BM25 * (1 + termCoverage) * (phraseMatch ? 1.2 : 1.0)
  const reranked = filtered
    .map((r) => ({
      ...r,
      score: r.score * (1 + r.termCoverage) * (r.phraseMatch ? 1.2 : 1.0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  return reranked;
}

/** What fraction of unique query terms appear in the content? */
function computeTermCoverage(query: string, content: string): number {
  const terms = tokenize(query);
  if (terms.length === 0) return 0;
  const contentLower = content.toLowerCase();
  const matched = terms.filter((t) => contentLower.includes(t));
  return matched.length / terms.length;
}

/** Does the content contain a 2+ word phrase from the query? */
function computePhraseMatch(query: string, content: string): boolean {
  const words = tokenize(query);
  if (words.length < 2) return false;
  const contentLower = content.toLowerCase();
  for (let i = 0; i < words.length - 1; i++) {
    if (contentLower.includes(`${words[i]} ${words[i + 1]}`)) return true;
  }
  return false;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Get all chunks (for eval or display). */
export function getAllChunks(): Chunk[] {
  return loadedChunks;
}

/** Check if only sample chunks are loaded. */
export function isSampleOnly(chunks: Chunk[]): boolean {
  return chunks.length > 0 && chunks.every((c) => c.sample);
}

