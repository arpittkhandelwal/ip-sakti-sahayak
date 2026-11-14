// ============================================================
// IP-SAKTI Sahayak – Corpus Ingestion Script
// Reads /corpus/**/*.md, chunks by section, builds BM25 index.
// Run: npm run ingest
// ============================================================

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, relative } from 'path';
import matter from 'gray-matter';
import fg from 'fast-glob';
import MiniSearch from 'minisearch';

const ROOT = process.cwd();
const CORPUS_DIR = join(ROOT, 'corpus');
const OUTPUT_DIR = join(ROOT, 'netlify', 'functions', 'data');
const OUTPUT_FILE = join(OUTPUT_DIR, 'index.json');

// ── Types (inline to avoid ESM/CJS issues) ──────────────────
interface ChunkMetadata {
  id: string;
  title: string;
  jurisdiction: 'india' | 'international' | 'both';
  ip_type: string;
  act_or_treaty: string;
  section_or_article: string;
  source_url: string;
  last_verified: string;
  sample: boolean;
  filepath: string;
}

interface Chunk extends ChunkMetadata {
  content: string;
}

interface BM25Index {
  chunks: Chunk[];
  buildDate: string;
  totalChunks: number;
  sampleOnly: boolean;
}

// ── Section splitter ─────────────────────────────────────────
function splitIntoSections(markdown: string): Array<{ heading: string; content: string }> {
  const lines = markdown.split('\n');
  const sections: Array<{ heading: string; content: string }> = [];
  let currentHeading = '';
  let currentLines: string[] = [];

  for (const line of lines) {
    if (/^#{1,3}\s/.test(line)) {
      if (currentLines.length > 0) {
        sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      }
      currentHeading = line.replace(/^#+\s+/, '').trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }

  return sections.filter((s) => s.content.length > 50);
}

// ── Chunk a single MD file ───────────────────────────────────
function chunkFile(filepath: string): Chunk[] {
  const raw = readFileSync(filepath, 'utf-8');
  const { data: fm, content } = matter(raw);

  if (!fm.title || !fm.jurisdiction) {
    console.warn(`[ingest] Skipping ${filepath}: missing required frontmatter (title, jurisdiction)`);
    return [];
  }

  const relPath = relative(ROOT, filepath).replace(/\\/g, '/');
  const ipType = inferIPType(relPath, fm.ip_type);
  const jurisdiction = inferJurisdiction(relPath, fm.jurisdiction);

  const sections = splitIntoSections(content);

  if (sections.length === 0) {
    // Treat the whole content as one chunk
    const id = sanitizeId(`${fm.title}-whole`);
    return [{
      id: `CHUNK-${id}`,
      title: fm.title,
      jurisdiction,
      ip_type: ipType,
      act_or_treaty: fm.act_or_treaty ?? 'Unknown',
      section_or_article: fm.section_or_article ?? 'General',
      source_url: fm.source_url ?? '',
      last_verified: fm.last_verified ?? '',
      sample: fm.sample === true,
      filepath: relPath,
      content: content.trim().slice(0, 2000),
    }];
  }

  return sections.map((section, idx) => {
    const id = sanitizeId(`${fm.title}-${section.heading || idx}`);
    return {
      id: `CHUNK-${id}`,
      title: section.heading || fm.title,
      jurisdiction,
      ip_type: ipType,
      act_or_treaty: fm.act_or_treaty ?? 'Unknown',
      section_or_article: section.heading || (fm.section_or_article ?? 'General'),
      source_url: fm.source_url ?? '',
      last_verified: fm.last_verified ?? '',
      sample: fm.sample === true,
      filepath: relPath,
      content: section.content.slice(0, 2000),
    };
  });
}

function sanitizeId(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function inferIPType(relPath: string, fmType?: string): string {
  if (fmType) return fmType;
  const parts = relPath.split('/');
  const knownTypes = ['patents', 'gi', 'trademarks', 'designs', 'copyright', 'ppvfra', 'biodiversity', 'drugs-regulatory', 'trips', 'cbd-nagoya', 'wipo-gratk', 'pct-madrid-hague-budapest'];
  for (const part of parts) {
    if (knownTypes.includes(part)) return part;
  }
  return 'general';
}

function inferJurisdiction(relPath: string, fmJurisdiction?: string): 'india' | 'international' | 'both' {
  if (fmJurisdiction === 'india' || fmJurisdiction === 'international' || fmJurisdiction === 'both') {
    return fmJurisdiction;
  }
  if (relPath.includes('/india/')) return 'india';
  if (relPath.includes('/international/')) return 'international';
  return 'both';
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('[ingest] Starting corpus ingestion...');
  console.log(`[ingest] Corpus directory: ${CORPUS_DIR}`);

  if (!existsSync(CORPUS_DIR)) {
    console.error(`[ingest] ERROR: Corpus directory not found: ${CORPUS_DIR}`);
    process.exit(1);
  }

  // Find all .md files
  const files = await fg('**/*.md', {
    cwd: CORPUS_DIR,
    absolute: true,
    ignore: ['**/CORPUS_GUIDE.md'],
  });

  console.log(`[ingest] Found ${files.length} markdown files`);

  if (files.length === 0) {
    console.error('[ingest] No markdown files found in corpus. Check CORPUS_GUIDE.md for format.');
    process.exit(1);
  }

  // Chunk all files
  const allChunks: Chunk[] = [];
  for (const file of files) {
    try {
      const chunks = chunkFile(file);
      allChunks.push(...chunks);
      console.log(`[ingest] ${relative(ROOT, file)}: ${chunks.length} chunk(s)`);
    } catch (err) {
      console.error(`[ingest] Error processing ${file}:`, err);
    }
  }

  if (allChunks.length === 0) {
    console.error('[ingest] No chunks produced. Check your corpus markdown files.');
    process.exit(1);
  }

  // Check for duplicate IDs
  const idSet = new Set<string>();
  for (const chunk of allChunks) {
    if (idSet.has(chunk.id)) {
      console.warn(`[ingest] Duplicate chunk ID: ${chunk.id} – appending suffix`);
      chunk.id = `${chunk.id}-${Math.random().toString(36).slice(2, 6)}`;
    }
    idSet.add(chunk.id);
  }

  const sampleOnly = allChunks.every((c) => c.sample);

  // Build MiniSearch index (for validation)
  const ms = new MiniSearch({
    fields: ['title', 'section_or_article', 'act_or_treaty', 'content'],
    storeFields: ['id', 'title', 'jurisdiction', 'ip_type', 'act_or_treaty', 'section_or_article', 'source_url', 'last_verified', 'sample', 'filepath'],
  });
  ms.addAll(allChunks);

  const indexData: BM25Index = {
    chunks: allChunks,
    buildDate: new Date().toISOString(),
    totalChunks: allChunks.length,
    sampleOnly,
  };

  // Write output
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  writeFileSync(OUTPUT_FILE, JSON.stringify(indexData, null, 2));

  // Build cross-reference map
  try {
    const { getCrossRef } = await import('../src/lib/crossRef.js');
    const crossRefMap: Record<string, unknown> = {};
    for (const chunk of allChunks) {
      const ref = getCrossRef(chunk.section_or_article);
      if (ref) crossRefMap[chunk.id] = ref;
    }
    const crossRefPath = join(OUTPUT_DIR, 'crossRef.json');
    writeFileSync(crossRefPath, JSON.stringify(crossRefMap, null, 2), 'utf-8');
    console.log(`[ingest] Cross-reference map written: ${Object.keys(crossRefMap).length} entries → ${crossRefPath}`);
  } catch (err) {
    console.warn('[ingest] Cross-reference generation skipped:', (err as Error).message);
  }

  console.log(`\n[ingest] ✅ Done!`);
  console.log(`[ingest] Total chunks: ${allChunks.length}`);
  console.log(`[ingest] Sample only: ${sampleOnly}`);
  console.log(`[ingest] Output: ${OUTPUT_FILE}`);
  console.log(`[ingest] File size: ${(readFileSync(OUTPUT_FILE).length / 1024).toFixed(1)} KB`);

  if (sampleOnly) {
    console.log('\n[ingest] ⚠️  Only sample files indexed. Add real legal texts per CORPUS_GUIDE.md.');
  }
}

main().catch((err) => {
  console.error('[ingest] Fatal error:', err);
  process.exit(1);
});
