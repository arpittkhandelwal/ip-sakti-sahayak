// ============================================================
// IP-SAKTI Sahayak – TKDL Prior-Art Search Page
// Dedicated search interface for traditional knowledge prior art
// ============================================================

import { useState } from 'react';
import { Search, ExternalLink, AlertTriangle, Info, Shield, BookOpen, ChevronRight } from 'lucide-react';
import type { Chunk } from '../types';

type RiskLevel = 'High' | 'Medium' | 'Low';

function getRiskLevel(score: number): RiskLevel {
  if (score > 80) return 'High';
  if (score > 40) return 'Medium';
  return 'Low';
}

function getTraditionSystem(chunk: Chunk): string {
  const text = (chunk.title + ' ' + chunk.content + ' ' + chunk.act_or_treaty).toLowerCase();
  if (text.includes('unani') || text.includes('hakim')) return 'UNI';
  if (text.includes('siddha') || text.includes('tamil')) return 'SID';
  if (text.includes('ayurved') || text.includes('charaka') || text.includes('sushruta')) return 'AYU';
  if (text.includes('yoga') || text.includes('naturo')) return 'YN';
  return 'AYU';
}

const SYSTEM_COLORS: Record<string, string> = {
  AYU: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300',
  UNI: 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300',
  SID: 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300',
  YN: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300',
};

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles = {
    High: 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    Medium: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    Low: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  };
  const icons = { High: '🔴', Medium: '🟡', Low: '🟢' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${styles[level]}`}>
      {icons[level]} {level} Biopiracy Risk
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="institutional-card p-5 space-y-3 animate-pulse">
      <div className="flex gap-3">
        <div className="skeleton h-6 w-24 rounded" />
        <div className="skeleton h-6 w-16 rounded" />
      </div>
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-4 w-full rounded" />
      <div className="skeleton h-4 w-5/6 rounded" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-8 w-28 rounded-lg" />
        <div className="skeleton h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function TKDLSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Chunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;
    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const res = await fetch('/api/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: `traditional knowledge prior art TKDL ${query}` }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { retrievedChunks: Chunk[] };
      setResults(data.retrievedChunks ?? []);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const tkdlUrl = (term: string) =>
    `https://tkdl.res.in/TKDL_Main/search.aspx?query=${encodeURIComponent(term)}`;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="institutional-card p-6 border-l-4 border-l-amber-600">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-900 flex items-center justify-center text-amber-300 flex-shrink-0">
            <Shield size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 mb-1">
              TKDL Prior-Art Engine · CSIR-TKDL Trust
            </div>
            <h1 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
              Traditional Knowledge Digital Library — Prior-Art Search
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Search for traditional Ayurvedic, Unani, and Siddha formulations in the statutory corpus to assess biopiracy risk and prior-art existence before filing patents.
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ingredient, formulation, or treatment (e.g. turmeric, ashwagandha, Triphala…)"
            className="input-field pl-9 text-sm"
          />
        </div>
        <button type="submit" disabled={!query.trim() || loading} className="btn-primary px-6 flex items-center gap-2 disabled:opacity-50">
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={15} />
          )}
          Search
        </button>
      </form>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap gap-2">
        {['Turmeric (Curcuma longa)', 'Ashwagandha', 'Triphala', 'Neem (Azadirachta indica)', 'Holy Basil (Tulsi)', 'Guduchi (Tinospora)'].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => setQuery(term)}
            className="text-xs px-3 py-1.5 rounded-full border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors font-medium"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
          <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
          Search failed: {error}. Ensure the BM25 index is built (`npm run ingest`).
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Results */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="institutional-card p-8 text-center space-y-3">
          <BookOpen size={36} className="text-slate-300 mx-auto" />
          <h3 className="font-serif font-bold text-slate-800 dark:text-slate-200">No prior-art records found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No matching statutory corpus entries found for &ldquo;{query}&rdquo;. This may indicate low biopiracy risk, but always verify directly on the TKDL database.
          </p>
          <a href={tkdlUrl(query)} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2 text-xs mt-2">
            <ExternalLink size={13} /> Search TKDL Database Directly
          </a>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold">{results.length} statutory corpus records found</span>
            <a href={tkdlUrl(query)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold hover:underline">
              <ExternalLink size={11} /> Full TKDL Database Search
            </a>
          </div>

          {results.map((chunk) => {
            const risk = getRiskLevel(chunk.score ?? 0);
            const system = getTraditionSystem(chunk);
            return (
              <div key={chunk.id} className="institutional-card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-wrap items-start gap-2 mb-3">
                  <RiskBadge level={risk} />
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${SYSTEM_COLORS[system] ?? SYSTEM_COLORS['AYU']}`}>
                    {system} — {system === 'AYU' ? 'Ayurveda' : system === 'UNI' ? 'Unani' : system === 'SID' ? 'Siddha' : 'Yoga/Naturopathy'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded ml-auto">
                    BM25: {Math.round(chunk.score ?? 0)}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base mb-1">{chunk.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-2">
                  {chunk.act_or_treaty} · {chunk.section_or_article}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {chunk.content.slice(0, 300)}…
                </p>

                <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <a
                    href={tkdlUrl(query)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1.5 py-1.5 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-xs"
                  >
                    <Shield size={12} /> Search TKDL Database
                  </a>
                  <a
                    href={chunk.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary flex items-center gap-1.5 py-1.5 text-xs"
                  >
                    <ExternalLink size={12} /> View Source Act
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box — always shown */}
      {!searched && (
        <div className="p-5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-2">
          <h3 className="font-serif font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2">
            <Info size={15} /> What is TKDL?
          </h3>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            The <strong>Traditional Knowledge Digital Library (TKDL)</strong> is a pioneering Indian initiative by CSIR and Ministry of Ayush to document traditional medicinal knowledge in machine-readable formats accessible to international patent offices (USPTO, EPO, JPO, CGPDTM) — preventing biopiracy.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {[
              { label: '2.5 Lakh+ Formulations', sub: 'Ayurveda, Unani, Siddha, Yoga documented' },
              { label: '45 Countries', sub: 'Patent offices with TKDL access agreements' },
              { label: '900+ Patents Revoked', sub: 'Biopiracy cases blocked using TKDL prior art' },
            ].map(({ label, sub }) => (
              <div key={label} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-900/40 text-center">
                <div className="font-bold text-sm text-amber-800 dark:text-amber-300">{label}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
            Note: Full TKDL database access for patent offices requires a CSIR inter-institutional agreement. Public access is restricted to summary information.
          </p>
        </div>
      )}

      {/* Nav footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
        <a href="/" className="flex items-center gap-1 hover:text-ayush-800 dark:hover:text-emerald-400 transition-colors">
          ← Back to Chat
        </a>
        <a href="https://tkdl.res.in" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline font-semibold">
          tkdl.res.in <ExternalLink size={11} />
        </a>
      </div>
    </div>
  );
}

