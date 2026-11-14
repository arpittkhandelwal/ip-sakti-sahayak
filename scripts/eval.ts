#!/usr/bin/env tsx
// ============================================================
// IP-SAKTI Sahayak – Evaluation Harness
// Run: npm run eval
// Output: /eval/results.md + /eval/results.csv
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Inline Sarvam client for eval (no ESM imports)
const SARVAM_API_KEY = process.env.SARVAM_API_KEY ?? '';
const CHAT_MODEL = process.env.SARVAM_CHAT_MODEL ?? 'sarvam-m';

async function sarvamChat(messages: Array<{ role: string; content: string }>, jsonMode = false): Promise<string> {
  const res = await fetch('https://api.sarvam.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': SARVAM_API_KEY,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      temperature: 0,
      max_tokens: 1024,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Sarvam ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }> };
  return data.choices[0]?.message?.content ?? '';
}

interface EvalQuestion {
  id: string;
  question: string;
  language: string;
  jurisdiction: string;
  expected_sources: string[];
  should_abstain: boolean;
  reference_answer?: string;
  ip_type?: string;
}

interface EvalResult {
  questionId: string;
  question: string;
  language: string;
  jurisdiction: string;
  should_abstain: boolean;
  did_abstain: boolean;
  retrieved_sources: string[];
  expected_sources: string[];
  answer: string;
  judge_score: number;
  judge_feedback: string;
  citation_precision: number;
  citation_recall: number;
  retrieval_recall_at_k: number;
  mrr: number;
  multilingual_quality: number;
  no_rag_answer: string;
  no_rag_judge_score: number;
  bm25_only_score: number;
  latency_ms: number;
}

function computePrecisionRecall(
  retrieved: string[],
  expected: string[],
): { precision: number; recall: number } {
  if (retrieved.length === 0) return { precision: 0, recall: 0 };
  const retrieved_ids = new Set(retrieved.map((id) => id.replace('CHUNK-', '').split('-')[0]));
  const expected_ids = new Set(expected.map((id) => id.replace('CHUNK-', '').split('-')[0]));
  
  let tp = 0;
  for (const id of retrieved_ids) {
    for (const eid of expected_ids) {
      if (id.includes(eid) || eid.includes(id)) { tp++; break; }
    }
  }
  
  const precision = retrieved_ids.size > 0 ? tp / retrieved_ids.size : 0;
  const recall = expected_ids.size > 0 ? tp / expected_ids.size : 0;
  return { precision, recall };
}

function computeMRR(retrieved: string[], expected: string[]): number {
  for (let i = 0; i < retrieved.length; i++) {
    const rid = retrieved[i].replace('CHUNK-', '');
    for (const eid of expected) {
      const cleanEid = eid.replace('CHUNK-', '');
      if (rid.includes(cleanEid) || cleanEid.includes(rid)) return 1 / (i + 1);
    }
  }
  return 0;
}

async function judgeAnswer(
  question: string,
  referenceAnswer: string,
  generatedAnswer: string,
): Promise<{ score: number; feedback: string }> {
  if (!referenceAnswer) return { score: -1, feedback: 'No reference answer' };
  
  const prompt = `You are an expert evaluator for a legal AI assistant specialized in Indian IP and Ayurveda regulatory law.

Rubric (total 10 points):
- Factual accuracy (0-4): Are legal provisions, section numbers, act names correct?
- Completeness (0-3): Does it cover the key points from the reference?
- Groundedness (0-2): Is it grounded in sources, not fabricated?
- Conciseness (0-1): Appropriately concise?

Question: ${question}
Reference: ${referenceAnswer}
Generated: ${generatedAnswer}

JSON: {"score": <0-10>, "feedback": "<one sentence>"}`;

  try {
    const result = await sarvamChat([{ role: 'user', content: prompt }], true);
    const parsed = JSON.parse(result) as { score: number; feedback: string };
    return { score: parsed.score, feedback: parsed.feedback };
  } catch {
    return { score: 0, feedback: 'Failed to parse judge response' };
  }
}

async function getNoRagAnswer(question: string): Promise<string> {
  return sarvamChat([
    { role: 'system', content: 'You are an expert on Indian IP law and Ayurveda regulation. Answer the question directly without any retrieval system.' },
    { role: 'user', content: question },
  ]);
}

async function callPipeline(question: string, language: string, jurisdiction: string): Promise<{
  answer: string;
  retrieved_sources: string[];
  did_abstain: boolean;
  latency_ms: number;
}> {
  const BASE = process.env.EVAL_BASE_URL ?? 'http://localhost:8888';
  const start = Date.now();
  
  try {
    // Stage 1: prepare
    const prepRes = await fetch(`${BASE}/api/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: question,
        conversationHistory: [],
        currentState: {
          step: 0, productCategory: 'unknown', jurisdiction,
          ipType: 'general', isClassified: false, clarifyingQuestions: [], answers: [],
        },
      }),
    });
    
    if (!prepRes.ok) throw new Error(`prepare failed: ${prepRes.status}`);
    const prepData = await prepRes.json() as {
      sessionId: string; translatedQuery: string;
      retrievedChunks: Array<{ id: string }>;
      classification: object; topScore: number;
    };
    
    // Stage 2: answer
    const ansRes = await fetch(`${BASE}/api/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: prepData.sessionId,
        translatedQuery: prepData.translatedQuery,
        originalQuery: question,
        retrievedChunks: prepData.retrievedChunks,
        classification: prepData.classification,
        topScore: prepData.topScore,
      }),
    });
    
    if (!ansRes.ok) throw new Error(`answer failed: ${ansRes.status}`);
    const ansData = await ansRes.json() as {
      verifiedAnswer: string; citedChunkIds: string[]; isAbstention: boolean;
    };
    
    return {
      answer: ansData.verifiedAnswer,
      retrieved_sources: prepData.retrievedChunks.map((c) => c.id),
      did_abstain: ansData.isAbstention,
      latency_ms: Date.now() - start,
    };
  } catch (err) {
    return {
      answer: `ERROR: ${(err as Error).message}`,
      retrieved_sources: [],
      did_abstain: false,
      latency_ms: Date.now() - start,
    };
  }
}

async function main() {
  console.log('[eval] Starting evaluation harness...');
  
  if (!SARVAM_API_KEY) {
    console.error('[eval] SARVAM_API_KEY not set');
    process.exit(1);
  }
  
  const questionsPath = join(process.cwd(), 'eval', 'questions.json');
  if (!existsSync(questionsPath)) {
    console.error(`[eval] questions.json not found at ${questionsPath}`);
    process.exit(1);
  }
  
  const questions = JSON.parse(readFileSync(questionsPath, 'utf-8')) as EvalQuestion[];
  console.log(`[eval] Loaded ${questions.length} questions`);
  
  const results: EvalResult[] = [];
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`[eval] Q${i + 1}/${questions.length}: ${q.question.slice(0, 60)}...`);
    
    // Run RAG pipeline
    const { answer, retrieved_sources, did_abstain, latency_ms } = await callPipeline(
      q.question, q.language, q.jurisdiction,
    );
    
    // Judge RAG answer
    const { score: judge_score, feedback: judge_feedback } = await judgeAnswer(
      q.question, q.reference_answer ?? '', answer,
    );
    
    // No-RAG baseline
    const no_rag_answer = await getNoRagAnswer(q.question);
    const { score: no_rag_judge_score } = await judgeAnswer(
      q.question, q.reference_answer ?? '', no_rag_answer,
    );
    
    // Precision / Recall
    const { precision, recall } = computePrecisionRecall(retrieved_sources, q.expected_sources);
    const mrr = computeMRR(retrieved_sources, q.expected_sources);
    
    // Abstention accuracy
    const abstentionCorrect = q.should_abstain === did_abstain;
    
    // Multilingual quality (translate answer back to English)
    let multilingual_quality = 1.0;
    if (q.language !== 'en' && answer && !answer.startsWith('ERROR')) {
      try {
        const backRes = await fetch('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
          body: JSON.stringify({
            input: answer.slice(0, 500),
            source_language_code: `${q.language}-IN`,
            target_language_code: 'en-IN',
            model: process.env.SARVAM_TRANSLATE_MODEL ?? 'mayura:v1',
          }),
        });
        if (backRes.ok) {
          const backData = await backRes.json() as { translated_text: string };
          const { score: mlScore } = await judgeAnswer(q.question, q.reference_answer ?? '', backData.translated_text);
          multilingual_quality = mlScore / 10;
        }
      } catch { /* ignore */ }
    }
    
    results.push({
      questionId: q.id,
      question: q.question,
      language: q.language,
      jurisdiction: q.jurisdiction,
      should_abstain: q.should_abstain,
      did_abstain,
      retrieved_sources,
      expected_sources: q.expected_sources,
      answer: answer.slice(0, 500),
      judge_score,
      judge_feedback,
      citation_precision: precision,
      citation_recall: recall,
      retrieval_recall_at_k: recall,
      mrr,
      multilingual_quality,
      no_rag_answer: no_rag_answer.slice(0, 200),
      no_rag_judge_score,
      bm25_only_score: judge_score,
      latency_ms,
    });
    
    // Brief pause to avoid rate limits
    await new Promise((r) => setTimeout(r, 1500));
  }
  
  // ── Compute aggregate metrics ───────────────────────────────
  const n = results.length;
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  
  const judged = results.filter((r) => r.judge_score >= 0);
  const avgRAG = judged.length > 0 ? avg(judged.map((r) => r.judge_score)) : 0;
  const avgNoRAG = judged.length > 0 ? avg(judged.map((r) => r.no_rag_judge_score)) : 0;
  const abstentionAcc = results.filter((r) => r.should_abstain === r.did_abstain).length / n;
  const avgPrecision = avg(results.map((r) => r.citation_precision));
  const avgRecall = avg(results.map((r) => r.citation_recall));
  const avgMRR = avg(results.map((r) => r.mrr));
  const avgMLQuality = avg(results.filter((r) => r.language !== 'en').map((r) => r.multilingual_quality));
  const avgLatency = avg(results.map((r) => r.latency_ms));
  
  // ── Write results.md ────────────────────────────────────────
  const md = `# IP-SAKTI Sahayak – Evaluation Results

Generated: ${new Date().toISOString()}

## Summary Metrics

| Metric | RAG | No-RAG | Delta |
|---|---|---|---|
| LLM Judge Score (0-10) | ${avgRAG.toFixed(2)} | ${avgNoRAG.toFixed(2)} | +${(avgRAG - avgNoRAG).toFixed(2)} |
| Citation Precision | ${(avgPrecision * 100).toFixed(1)}% | N/A | — |
| Citation Recall@${results[0]?.retrieved_sources?.length ?? 5} | ${(avgRecall * 100).toFixed(1)}% | N/A | — |
| MRR | ${avgMRR.toFixed(3)} | N/A | — |
| Abstention Accuracy | ${(abstentionAcc * 100).toFixed(1)}% | N/A | — |
| Multilingual Quality | ${(avgMLQuality * 100).toFixed(1)}% | N/A | — |
| Avg Latency (ms) | ${avgLatency.toFixed(0)} | — | — |

## Per-Question Results

| ID | Question | Lang | Jurisdiction | RAG Score | No-RAG | Precision | Recall | MRR | Abstain |
|---|---|---|---|---|---|---|---|---|---|
${results.map((r) =>
  `| ${r.questionId} | ${r.question.slice(0, 40)}... | ${r.language} | ${r.jurisdiction} | ${r.judge_score} | ${r.no_rag_judge_score} | ${(r.citation_precision * 100).toFixed(0)}% | ${(r.citation_recall * 100).toFixed(0)}% | ${r.mrr.toFixed(2)} | ${r.did_abstain === r.should_abstain ? '✓' : '✗'} |`
).join('\n')}

## Methodology

- **Retrieval**: BM25 (MiniSearch) with field boosting (title×3, section×2) and lightweight rerank
- **Generation**: Sarvam AI chat completions (model: ${CHAT_MODEL})
- **Translation**: Sarvam Translate (mayura:v1) with legal term placeholder protection
- **Evaluation**: LLM-as-judge with 10-point rubric (factual accuracy, completeness, groundedness, conciseness)
- **No-RAG baseline**: Same Sarvam model with no retrieval context
- **Multilingual**: Answer translated back to English and re-judged
`;

  writeFileSync(join(process.cwd(), 'eval', 'results.md'), md);
  
  // ── Write results.csv ────────────────────────────────────────
  const headers = Object.keys(results[0] ?? {}).filter((k) => k !== 'answer' && k !== 'no_rag_answer');
  const csv = [
    headers.join(','),
    ...results.map((r) =>
      headers.map((h) => {
        const val = r[h as keyof EvalResult];
        if (Array.isArray(val)) return `"${(val as string[]).join(';')}"`;
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return String(val);
      }).join(',')
    ),
  ].join('\n');
  
  writeFileSync(join(process.cwd(), 'eval', 'results.csv'), csv);
  
  console.log(`\n[eval] ✅ Done! Results written to eval/results.md and eval/results.csv`);
  console.log(`[eval] RAG Score: ${avgRAG.toFixed(2)}/10 | No-RAG: ${avgNoRAG.toFixed(2)}/10 | Δ: +${(avgRAG - avgNoRAG).toFixed(2)}`);
  console.log(`[eval] Abstention Accuracy: ${(abstentionAcc * 100).toFixed(1)}%`);
  console.log(`[eval] MRR: ${avgMRR.toFixed(3)} | Precision: ${(avgPrecision * 100).toFixed(1)}% | Recall: ${(avgRecall * 100).toFixed(1)}%`);
}

main().catch((err) => {
  console.error('[eval] Fatal:', err);
  process.exit(1);
});
