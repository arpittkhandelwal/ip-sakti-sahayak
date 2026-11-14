import { useAppStore } from '../store/appStore';
import { PRODUCT_CATEGORY_LABELS, IP_TYPE_LABELS } from '../types';
import { ShieldCheck, Scale, ExternalLink, BookOpen, Building2, CheckCircle } from 'lucide-react';
import { CorpusHealthPanel } from './CorpusHealthPanel';

export function ClassifierSidebar() {
  const { classificationState, lastRetrievedChunks } = useAppStore();
  const { productCategory, jurisdiction, ipType, isClassified } = classificationState;

  // Compute ABS mandate based on product category & jurisdiction
  const isABSMandatory = productCategory !== 'unknown';
  const requiresNBA = jurisdiction === 'international' || jurisdiction === 'both';

  return (
    <div className="p-4 space-y-6 text-xs bg-white dark:bg-slate-900 h-full">
      {/* Corpus Health & Index Status */}
      <CorpusHealthPanel />

      {/* Docket Header */}
      <div>
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 font-serif font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
            <Scale size={14} className="text-ayush-800 dark:text-emerald-400" />
            <span>Case Classification Docket</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
            isClassified
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
          }`}>
            {isClassified ? '✓ Verified' : '○ Analyzing'}
          </span>
        </div>

        {/* Docket Fields */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Product Category</span>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 text-xs">
              {PRODUCT_CATEGORY_LABELS[productCategory]}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jurisdiction</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 text-xs">
                {jurisdiction === 'india' ? '🇮🇳 India' : jurisdiction === 'international' ? '🌍 International' : '⚖️ Cross-Border'}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">IP Domain</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 text-xs">
                {IP_TYPE_LABELS[ipType]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ABS Regulatory Mandate Card */}
      <div className="space-y-2">
        <h3 className="font-serif font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-emerald-600" />
          <span>ABS Regulatory Posture</span>
        </h3>
        <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-950 dark:text-emerald-200">
              {requiresNBA ? 'National Biodiversity Authority (NBA)' : 'State Biodiversity Board (SBB)'}
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100/80 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
              {requiresNBA ? 'Form I Approval' : 'Sec 7 Intimation'}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
            {requiresNBA
              ? 'International utilization or foreign entities require mandatory prior approval from NBA (Chennai) under Section 3 of BD Act 2002.'
              : 'Domestic AYUSH manufacturers require prior intimation to State Biodiversity Board under the 2023 Amendment to the BD Act.'}
          </p>
        </div>
      </div>

      {/* Primary Corpus Chunks */}
      {lastRetrievedChunks.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <BookOpen size={13} className="text-ayush-800 dark:text-emerald-400" />
              <span>Verified Corpus Chunks ({lastRetrievedChunks.length})</span>
            </h3>
          </div>
          <div className="space-y-2">
            {lastRetrievedChunks.map((chunk) => (
              <div
                key={chunk.id}
                className="p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 hover:border-slate-300 transition-colors"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate">
                  {chunk.title}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {chunk.act_or_treaty} ({chunk.section_or_article})
                </div>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px]">
                  <span className="font-mono text-slate-400 uppercase">{chunk.jurisdiction}</span>
                  {chunk.score !== undefined && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      BM25 {Math.round(chunk.score)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Government Portals */}
      <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2.5">
        <h3 className="font-serif font-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Building2 size={13} className="text-amber-600" />
          <span>Statutory Registries & Portals</span>
        </h3>
        <div className="space-y-1.5">
          {[
            { label: 'IP India (Patents, GI & Trademarks)', url: 'https://ipindia.gov.in' },
            { label: 'TKDL (CSIR-Ayush Prior Art Library)', url: 'https://tkdl.res.in' },
            { label: 'NBA India (E-Filings for ABS)', url: 'https://nbaindia.org' },
            { label: 'Ayush Regulatory Portal (API Online)', url: 'https://ayush.gov.in' },
            { label: 'WIPO GRATK Treaty (Genetic Resources)', url: 'https://www.wipo.int/gratk/en/' },
            { label: 'ABS Clearing-House (Nagoya IRCC)', url: 'https://absch.cbd.int' },
          ].map(({ label, url }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-[11px]"
            >
              <span className="truncate pr-2">{label}</span>
              <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
