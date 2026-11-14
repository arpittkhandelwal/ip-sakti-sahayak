// ============================================================
// IP-SAKTI Sahayak – Document Comparator Page
// Side-by-side comparison of two legal texts / patent claims
// ============================================================

import { useState } from 'react';
import { GitCompare, AlertTriangle, ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';

interface CompareResult {
  similarity: 'High' | 'Medium' | 'Low';
  similarityScore: number;
  differences: string[];
  conflictRisk: 'High' | 'Medium' | 'Low';
  conflictExplanation: string;
  commonLegalTerms: string[];
  recommendedActions: string[];
}

function RiskTrafficLight({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  const cfg = {
    High: { bg: 'bg-rose-100 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700', text: 'text-rose-800 dark:text-rose-300', dot: 'bg-rose-500', label: 'High Conflict Risk' },
    Medium: { bg: 'bg-amber-100 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700', text: 'text-amber-800 dark:text-amber-300', dot: 'bg-amber-500', label: 'Moderate Risk' },
    Low: { bg: 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-700', text: 'text-emerald-800 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Low Conflict Risk' },
  };
  const c = cfg[level];
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-sm ${c.bg} ${c.text}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function SimilarityBar({ score }: { score: number }) {
  const color = score > 60 ? 'bg-rose-500' : score > 30 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span>Legal Keyword Overlap</span>
        <span>{score}%</span>
      </div>
      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

const SAMPLE_A = `This invention relates to a novel process for extracting curcuminoids from Curcuma longa 
using supercritical CO2 at enhanced bioavailability. The extraction achieves 95% purity through 
proprietary nano-encapsulation delivering targeted anti-inflammatory action via cyclooxygenase 
pathway inhibition. The novel formulation exhibits 300% higher bioavailability compared to 
conventional turmeric preparations.`;

const SAMPLE_B = `Traditional Ayurvedic preparation of Haridra (Curcuma longa) in Ghrita (clarified butter) 
base as described in Charaka Samhita (Chikitsa Sthana 7.78) for Jwara (fever) and Vata-related 
disorders. Administered as 3-6 grams twice daily with warm milk. Well documented in Ayurvedic 
Pharmacopoeia of India (API) Volume 1.`;

export function DocumentComparator() {
  const [docA, setDocA] = useState('');
  const [docB, setDocB] = useState('');
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recOpen, setRecOpen] = useState(true);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docA.trim() || !docB.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentA: docA, documentB: docB }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error: string };
        throw new Error(err.error);
      }
      const data = await res.json() as CompareResult;
      setResult(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = () => {
    setDocA(SAMPLE_A);
    setDocB(SAMPLE_B);
    setResult(null);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="institutional-card p-6 border-l-4 border-l-slate-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 flex-shrink-0">
            <GitCompare size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              IP Conflict Analysis · Patent Claim Comparator
            </div>
            <h1 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
              Legal Document &amp; Patent Claim Comparator
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Paste two legal texts, patent claims, or formulation descriptions to get an AI-powered IP conflict risk analysis and key difference breakdown.
            </p>
          </div>
        </div>
      </div>

      {/* Load sample button */}
      <div className="flex justify-end">
        <button onClick={loadSample} className="btn-secondary flex items-center gap-2 text-xs">
          <Sparkles size={13} className="text-amber-500" /> Load Demo Sample (Turmeric Patent vs. Classical)
        </button>
      </div>

      {/* Two-Panel Input */}
      <form onSubmit={handleCompare} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Document A — Patent Claim / Novel Formulation
            </label>
            <textarea
              value={docA}
              onChange={(e) => setDocA(e.target.value)}
              rows={10}
              maxLength={3000}
              placeholder="Paste patent claim, formulation description, or legal text here…"
              className="input-field resize-none text-sm leading-relaxed"
            />
            <div className="text-right text-[10px] text-slate-400 font-mono">{docA.length}/3000</div>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Document B — Prior Art / Classical Reference
            </label>
            <textarea
              value={docB}
              onChange={(e) => setDocB(e.target.value)}
              rows={10}
              maxLength={3000}
              placeholder="Paste classical Ayurvedic text, prior patent, or reference formulation…"
              className="input-field resize-none text-sm leading-relaxed"
            />
            <div className="text-right text-[10px] text-slate-400 font-mono">{docB.length}/3000</div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!docA.trim() || !docB.trim() || loading}
            className="btn-primary px-8 py-3 flex items-center gap-3 disabled:opacity-40 text-sm"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Analyzing IP Conflict…
              </>
            ) : (
              <>
                <GitCompare size={16} />
                Compare Legal Position
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl text-sm text-rose-800 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* Top metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="institutional-card p-4 space-y-3">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Legal Similarity</div>
              <SimilarityBar score={result.similarityScore} />
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                result.similarity === 'High' ? 'bg-rose-100 text-rose-800' :
                result.similarity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>{result.similarity} Overlap</span>
            </div>
            <div className="institutional-card p-4 space-y-2">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">IP Conflict Risk</div>
              <RiskTrafficLight level={result.conflictRisk} />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{result.conflictExplanation}</p>
            </div>
            <div className="institutional-card p-4 space-y-2">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Common Legal Terms</div>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {result.commonLegalTerms.length > 0 ? result.commonLegalTerms.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-semibold text-slate-700 dark:text-slate-300 capitalize">{t}</span>
                )) : <span className="text-xs text-slate-400">No shared legal terms detected</span>}
              </div>
            </div>
          </div>

          {/* Key Differences */}
          <div className="institutional-card overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white">Key Legal Differences</h3>
            </div>
            <div className="p-5 space-y-2">
              {result.differences.map((diff, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="leading-relaxed">{diff}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="institutional-card overflow-hidden">
            <button
              onClick={() => setRecOpen(!recOpen)}
              className="w-full px-5 py-3 bg-ayush-50 dark:bg-ayush-950/20 flex items-center justify-between hover:bg-ayush-100 dark:hover:bg-ayush-950/40 transition-colors"
            >
              <h3 className="font-serif font-bold text-sm text-ayush-900 dark:text-emerald-300">
                Recommended Actions
              </h3>
              {recOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
            {recOpen && (
              <div className="p-5 space-y-2 border-t border-slate-200 dark:border-slate-800">
                {result.recommendedActions.map((action, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                    <span className="text-ayush-700 dark:text-emerald-400 font-bold flex-shrink-0">→</span>
                    <span className="leading-relaxed">{action}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center italic">
            ⚖️ This analysis is based on legal keyword overlap and BM25 corpus matching. It does not constitute formal legal advice. Consult a qualified IP attorney.
          </p>
        </div>
      )}

      {/* Nav footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <a href="/" className="hover:text-ayush-800 dark:hover:text-emerald-400 transition-colors">← Back to Chat</a>
        <a href="/tkdl" className="hover:text-amber-700 dark:hover:text-amber-400 transition-colors flex items-center gap-1">
          TKDL Prior-Art Search <ArrowRight size={11} />
        </a>
      </div>
    </div>
  );
}

