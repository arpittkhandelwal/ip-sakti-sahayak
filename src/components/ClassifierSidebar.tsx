import { useAppStore } from '../store/appStore';
import { PRODUCT_CATEGORY_LABELS, IP_TYPE_LABELS } from '../types';
import { ExternalLink, BookOpen, Building2 } from 'lucide-react';
import { CorpusHealthPanel } from './CorpusHealthPanel';

export function ClassifierSidebar() {
  const { classificationState, lastRetrievedChunks } = useAppStore();
  const { productCategory, jurisdiction, ipType, isClassified } = classificationState;

  const requiresNBA = jurisdiction === 'international' || jurisdiction === 'both';

  return (
    <div className="p-4 space-y-5 text-xs h-full overflow-y-auto">
      <CorpusHealthPanel />

      {/* Case classification */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Classification</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            isClassified
              ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {isClassified ? 'Classified' : 'Pending'}
          </span>
        </div>

        <div className="space-y-2.5 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Category</div>
            <div className="font-medium text-slate-800 dark:text-slate-200">{PRODUCT_CATEGORY_LABELS[productCategory]}</div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Jurisdiction</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">
                {jurisdiction === 'india' ? 'India' : jurisdiction === 'international' ? 'International' : 'Cross-Border'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">IP Domain</div>
              <div className="font-medium text-slate-800 dark:text-slate-200">{IP_TYPE_LABELS[ipType]}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ABS posture */}
      <div>
        <h3 className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">ABS Requirement</h3>
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-800 dark:text-slate-200">
              {requiresNBA ? 'NBA approval' : 'SBB intimation'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {requiresNBA ? 'Form I' : 'Sec 7'}
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
            {requiresNBA
              ? 'International or foreign entities need prior approval from the National Biodiversity Authority (Section 3).'
              : 'Domestic AYUSH manufacturers need prior intimation to the State Biodiversity Board (2023 Amendment).'}
          </p>
        </div>
      </div>

      {/* Retrieved chunks */}
      {lastRetrievedChunks.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BookOpen size={12} className="text-slate-400" />
            <h3 className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Sources retrieved ({lastRetrievedChunks.length})
            </h3>
          </div>
          <div className="space-y-1.5">
            {lastRetrievedChunks.map((chunk) => (
              <div
                key={chunk.id}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-2.5"
              >
                <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{chunk.title}</div>
                <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                  {chunk.act_or_treaty} ({chunk.section_or_article})
                </div>
                <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-mono text-slate-400 uppercase text-[10px]">{chunk.jurisdiction}</span>
                  {chunk.score !== undefined && (
                    <span className="text-slate-400 font-mono text-[10px]">BM25 {Math.round(chunk.score)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official portals */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Building2 size={12} className="text-slate-400" />
          <h3 className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Official portals</h3>
        </div>
        <div className="space-y-0.5">
          {[
            { label: 'IP India', url: 'https://ipindia.gov.in' },
            { label: 'TKDL', url: 'https://tkdl.res.in' },
            { label: 'NBA India', url: 'https://nbaindia.org' },
            { label: 'Ayush Portal', url: 'https://ayush.gov.in' },
            { label: 'WIPO GRATK', url: 'https://www.wipo.int/gratk/en/' },
            { label: 'ABS Clearing-House', url: 'https://absch.cbd.int' },
          ].map(({ label, url }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <span>{label}</span>
              <ExternalLink size={11} className="text-slate-400" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
