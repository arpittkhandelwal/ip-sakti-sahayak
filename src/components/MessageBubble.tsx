import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertTriangle,
  Mail,
  CheckCircle2,
  FileCheck2,
  Scale,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { ChatMessage } from '../types';
import { useAppStore } from '../store/appStore';
import { getReformulations } from '../lib/reformulation';
import { getCrossRef } from '../lib/crossRef';

interface Props {
  message: ChatMessage;
  onSuggestedQuery?: (q: string) => void;
}

const SECTION_EXPLANATIONS: Record<string, string> = {
  '3(p)': 'Section 3(p) of the Patents Act, 1970 explicitly excludes from patentability any invention that in effect is traditional knowledge or is an aggregation or duplication of known properties of traditionally documented components.',
  'section 7': 'Section 7 of the Biological Diversity Act, 2002 (as amended 2023) mandates prior intimation to the State Biodiversity Board (SBB) before commercial utilization of biological resources by Indian citizens and domestic entities.',
  'section 3': 'Section 3 of the BD Act requires prior formal approval from the National Biodiversity Authority (NBA), Chennai before accessing biological resources or traditional knowledge for research or commercialization by foreign entities.',
  'article 27': 'TRIPS Agreement Article 27.3(b) permits member nations to exclude plants, animals, and biological processes from patentability, forming the international legal justification for India\'s TK protection.',
  'nagoya': 'The Nagoya Protocol under the CBD establishes the legal architecture for Access and Benefit Sharing (ABS), requiring Prior Informed Consent (PIC) and Mutually Agreed Terms (MAT).',
  'gratk': 'WIPO GRATK Treaty (May 2024) mandates patent applicants worldwide to disclose the country of origin of genetic resources and associated traditional knowledge in their patent filings.',
};

function getExplanation(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [key, val] of Object.entries(SECTION_EXPLANATIONS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

function ConfidenceBadge({ level, score }: { level: string; score?: number }) {
  const isHigh = level === 'High';
  const isMed = level === 'Medium';
  const cls = isHigh ? 'badge-high' : isMed ? 'badge-medium' : 'badge-low';

  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isHigh ? 'bg-emerald-600' : isMed ? 'bg-amber-600' : 'bg-rose-600'}`}></span>
      <span>{level} Evidence Support</span>
      {score !== undefined && <span className="opacity-80 font-mono">({Math.round(score * 100)}%)</span>}
    </span>
  );
}

export function MessageBubble({ message, onSuggestedQuery }: Props) {
  const [citationsOpen, setCitationsOpen] = useState(true);
  const [absOpen, setAbsOpen] = useState(true);
  const [tkdlOpen, setTkdlOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const { classificationState } = useAppStore();

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-in">
        <div className="max-w-[85%] bg-gradient-to-r from-ayush-950 to-slate-900 text-white rounded-2xl rounded-tr-xs px-5 py-3.5 shadow-md border border-ayush-800/40">
          <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1 flex items-center gap-1.5">
            <Scale size={12} />
            Inquirer Docket
          </div>
          <p className="text-sm font-sans leading-relaxed text-slate-100">{message.content}</p>
          <div className="text-[10px] text-slate-400 text-right mt-1.5">
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex justify-start animate-slide-in">
        <div className="max-w-[90%] card border-l-4 border-l-rose-500 p-4">
          <div className="flex items-start gap-3 text-rose-700 dark:text-rose-400">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Advisory Processing Notice</h4>
              <p className="text-xs mt-1 text-slate-700 dark:text-slate-300">{message.content}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasCitations = message.citations && message.citations.length > 0;
  const hasABS = message.absChecklist && message.absChecklist.length > 0;
  const hasTKDL = message.tkdlPointers && message.tkdlPointers.length > 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const escalateSubject = encodeURIComponent('[AIIA IP Desk] Formal Legal Advisory Request: ' + message.content.slice(0, 60));
  const escalateBody = encodeURIComponent(
    `Case Classification:\nCategory: ${classificationState.productCategory}\nIP Domain: ${classificationState.ipType}\nJurisdiction: ${classificationState.jurisdiction}\n\nUser Inquiry & Advisory Summary:\n${message.content}\n\nGenerated via IP-SAKTI Sahayak (Ministry of Ayush / AIIA).`
  );

  return (
    <div className="flex justify-start animate-slide-in w-full">
      <div className="w-full space-y-3">
        {/* Main Advisory Briefing Card */}
        <div className="institutional-card overflow-hidden border-t-3 border-t-ayush-800">
          {/* Official Advisory Header Strip */}
          <div className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200/80 dark:border-slate-800 px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-ayush-900 text-amber-400 flex items-center justify-center text-xs font-serif font-black">
                ⚖
              </div>
              <div>
                <span className="text-xs font-serif font-bold text-slate-900 dark:text-white">
                  Statutory Advisory Findings
                </span>
                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                  REF-AYUSH-{message.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {message.confidence && (
                <ConfidenceBadge level={message.confidence} score={message.confidenceScore} />
              )}
              <button
                onClick={handleCopy}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                title="Copy Full Advisory Text"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Abstention notice if applicable */}
          {message.isAbstention && (
            <div className="mx-5 mt-4 p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span className="font-bold">Corpus Boundary Notice:</span> This specific inquiry falls outside the indexed statutory corpus. Official registry consultation is required.
              </div>
            </div>
          )}

          {/* Main Legal Opinion Body */}
          <div className="p-5 md:p-6 prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed font-sans">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="font-serif text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-serif text-sm font-bold text-ayush-900 dark:text-emerald-400 mt-4 mb-1.5">
                    {children}
                  </h3>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-slate-900 dark:text-white">
                    {children}
                  </strong>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-3 border-ayush-700 bg-parchment-50 dark:bg-slate-800/60 pl-3.5 py-1.5 my-2.5 rounded-r-md text-xs italic text-slate-700 dark:text-slate-300">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ayush-700 dark:text-emerald-400 font-medium underline underline-offset-2 hover:text-ayush-900"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Footer Bar: Timestamp & Human Facilitator Escalation */}
          <div className="bg-slate-50/70 dark:bg-slate-900/60 px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1 font-mono">
                <ShieldCheck size={12} className="text-emerald-500" />
                Deterministic Verification Complete
              </span>
              <span>·</span>
              <span>
                {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`mailto:ip-facilitator@aiia.res.in?subject=${escalateSubject}&body=${escalateBody}`}
                className="btn-secondary flex items-center gap-1.5 py-1.5 text-ayush-900 dark:text-emerald-400 border-ayush-300/80 dark:border-ayush-800/80 hover:bg-ayush-50"
              >
                <Mail size={13} />
                <span>Escalate to Human IP Facilitator</span>
              </a>
            </div>
          </div>
        </div>

        {/* Collapsible Section 1: Primary Statutory Authorities Cited */}
        {hasCitations && (
          <div className="institutional-card overflow-hidden">
            <button
              onClick={() => setCitationsOpen(!citationsOpen)}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileCheck2 size={16} className="text-ayush-800 dark:text-emerald-400" />
                <span className="font-serif font-bold text-xs text-slate-900 dark:text-white">
                  Primary Statutory Authorities Verified ({message.citations!.length})
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">
                  (IndiaCode · IP India · Official Gazette)
                </span>
              </div>
              {citationsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {citationsOpen && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {message.citations!.map((chunk) => (
                  <div key={chunk.id} className="citation-card p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {chunk.title}
                      </div>
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-ayush-700 hover:text-ayush-900 dark:text-emerald-400 flex-shrink-0"
                        title="View Official Statute Source"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 font-serif">
                      {chunk.act_or_treaty} · {chunk.section_or_article}
                    </div>
                    <div className="flex items-center gap-2 pt-1 text-[10px]">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-mono uppercase font-semibold">
                        {chunk.jurisdiction}
                      </span>
                      <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-semibold">
                        {chunk.ip_type}
                      </span>
                      {chunk.score !== undefined && (
                        <span className="text-slate-400 font-mono">
                          BM25: {Math.round(chunk.score)}
                        </span>
                      )}
                      {getExplanation(chunk.section_or_article) && (
                        <button
                          type="button"
                          onClick={() => setActiveTooltip(activeTooltip === chunk.id ? null : chunk.id)}
                          className="ml-auto text-ayush-800 dark:text-emerald-400 hover:underline flex items-center gap-0.5 font-semibold"
                          title="Statutory Explanation"
                        >
                          <HelpCircle size={11} />
                          <span>Explain</span>
                        </button>
                      )}
                    </div>
                    {activeTooltip === chunk.id && getExplanation(chunk.section_or_article) && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed animate-fade-in">
                        <strong>Statutory Context:</strong> {getExplanation(chunk.section_or_article)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Section 2: ABS Compliance Mandate */}
        {hasABS && (
          <div className="institutional-card overflow-hidden border-l-3 border-l-emerald-600">
            <button
              onClick={() => setAbsOpen(!absOpen)}
              className="w-full px-5 py-3 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 dark:text-emerald-400" />
                <span className="font-serif font-bold text-xs text-emerald-900 dark:text-emerald-300">
                  Access & Benefit Sharing (ABS) Compliance Protocol
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono">
                  Biological Diversity Act 2023
                </span>
              </div>
              {absOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {absOpen && (
              <div className="p-4 space-y-2 border-t border-emerald-200/60 dark:border-emerald-900/60 bg-white dark:bg-slate-900">
                {message.absChecklist!.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 p-2 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Collapsible Section 3: TKDL Prior Art Verification */}
        {hasTKDL && (
          <div className="institutional-card overflow-hidden">
            <button
              onClick={() => setTkdlOpen(!tkdlOpen)}
              className="w-full px-5 py-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-amber-600" />
                <span className="font-serif font-bold text-xs text-slate-900 dark:text-white">
                  Traditional Knowledge Digital Library (TKDL) Prior-Art Checkpoints
                </span>
              </div>
              {tkdlOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {tkdlOpen && (
              <div className="p-4 space-y-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300">
                {message.tkdlPointers!.map((pointer, i) => (
                  <div key={i} className="p-2 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 leading-relaxed">
                    {pointer}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 4: Query Reformulation & Next Legal Steps */}
        {!message.isAbstention && onSuggestedQuery && (
          <div className="pt-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Sparkles size={12} className="text-amber-500" />
              <span>Related Legal Inquiries (Next Inquirer Steps):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {getReformulations(classificationState).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSuggestedQuery(item.query)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-ayush-600 dark:hover:border-ayush-500 hover:bg-ayush-50/50 dark:hover:bg-ayush-950/40 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs group"
                >
                  <span>{item.icon}</span>
                  <span className="group-hover:text-ayush-900 dark:group-hover:text-emerald-300 font-semibold">{item.label}</span>
                  <ArrowRight size={11} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
