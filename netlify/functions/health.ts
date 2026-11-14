// ============================================================
// IP-SAKTI Sahayak – /api/health
// Corpus health endpoint — returns index stats and coverage.
// ============================================================

import type { Handler } from '@netlify/functions';
import { readFileSync, statSync } from 'fs';
import { join } from 'path';
import type { BM25Index, Jurisdiction, IPType } from '../../src/types/index.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };

  try {
    const indexPath = join(process.cwd(), 'netlify', 'functions', 'data', 'index.json');
    const raw = readFileSync(indexPath, 'utf-8');
    const stat = statSync(indexPath);
    const indexData = JSON.parse(raw) as BM25Index;

    // Build coverage grid
    const coverage: Record<string, Record<string, number>> = {};
    for (const chunk of indexData.chunks) {
      const j = chunk.jurisdiction as Jurisdiction;
      const ip = chunk.ip_type as IPType;
      coverage[j] ??= {};
      coverage[j][ip] = (coverage[j][ip] ?? 0) + 1;
    }

    const status: 'healthy' | 'sample' | 'empty' =
      indexData.totalChunks === 0 ? 'empty' : indexData.sampleOnly ? 'sample' : 'healthy';

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        totalChunks: indexData.totalChunks,
        sampleOnly: indexData.sampleOnly,
        buildDate: indexData.buildDate,
        coverage,
        indexSizeKB: Math.round(stat.size / 1024),
        status,
      }),
    };
  } catch (err) {
    return {
      statusCode: 503,
      headers: CORS,
      body: JSON.stringify({ error: 'Index not available. Run `npm run ingest` first.', status: 'empty' }),
    };
  }
};

