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
  FileText,
  Building2,
  Copy,
  Check,
  ArrowRight,
} from 'lucide-react';
import type { ChatMessage } from '../types';
import { useAppStore } from '../store/appStore';
import { getReformulations } from '../lib/reformulation';

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
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-slate-900 dark:bg-slate-700 text-white rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-sm leading-relaxed">{message.content}</p>
          <div className="text-[10px] text-slate-400 text-right mt-1">
            {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </div>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex justify-start">
        <div className="max-w-[90%] border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded-xl p-4">
          <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Something went wrong</p>
              <p className="text-xs mt-1 text-slate-600 dark:text-slate-400">{message.content}</p>
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

  const escalateSubject = encodeURIComponent('[AIIA IP Desk] Advisory Request: ' + message.content.slice(0, 60));
  const escalateBody = encodeURIComponent(
    `Category: ${classificationState.productCategory}\nIP Domain: ${classificationState.ipType}\nJurisdiction: ${classificationState.jurisdiction}\n\n${message.content}\n\n— Sent via IP-SAKTI Sahayak (Ministry of Ayush / AIIA)`
  );

  return (
    <div className="flex justify-start w-full">
      <div className="w-full space-y-2">

        {/* Main answer */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>⚖️</span>
              <span>IP-SAKTI Sahayak</span>
              {message.confidence && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                  message.confidence === 'High'
                    ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                    : message.confidence === 'Medium'
                    ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'
                    : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                }`}>
                  {message.confidence} confidence
                </span>
              )}
            </div>
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
              title="Copy"
            >
              {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Out-of-scope notice */}
          {message.isAbstention && (
            <div className="mx-4 mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 flex items-start gap-2 text-xs text-yellow-800 dark:text-yellow-300">
              <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
              <span>This query is outside the indexed statutory corpus. Please consult an official registry.</span>
            </div>
          )}

          {/* Answer body */}
          <div className="px-4 py-4 prose prose-slate dark:prose-invert max-w-none text-sm leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white mt-5 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1">
                    {children}
                  </h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-slate-300 dark:border-slate-600 pl-3 py-0.5 my-2 text-xs italic text-slate-600 dark:text-slate-400">
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            <a
              href={`mailto:ip-facilitator@aiia.res.in?subject=${escalateSubject}&body=${escalateBody}`}
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <Mail size={12} />
              <span>Escalate to IP facilitator</span>
            </a>
          </div>
        </div>

        {/* Citations */}
        {hasCitations && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <button
              onClick={() => setCitationsOpen(!citationsOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <FileText size={14} className="text-slate-400" />
                <span>Statutory sources ({message.citations!.length})</span>
              </div>
              {citationsOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {citationsOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                {message.citations!.map((chunk) => (
                  <div key={chunk.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug">{chunk.title}</span>
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-blue-600 flex-shrink-0"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {chunk.act_or_treaty} · {chunk.section_or_article}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono uppercase text-[10px]">
                        {chunk.jurisdiction}
                      </span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-[10px]">
                        {chunk.ip_type}
                      </span>
                      {chunk.score !== undefined && (
                        <span className="text-slate-400 font-mono text-[10px]">score: {Math.round(chunk.score)}</span>
                      )}
                      {getExplanation(chunk.section_or_article) && (
                        <button
                          type="button"
                          onClick={() => setActiveTooltip(activeTooltip === chunk.id ? null : chunk.id)}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-[10px]"
                        >
                          explain
                        </button>
                      )}
                    </div>
                    {activeTooltip === chunk.id && getExplanation(chunk.section_or_article) && (
                      <div className="mt-1 p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                        {getExplanation(chunk.section_or_article)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABS Checklist */}
        {hasABS && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <button
              onClick={() => setAbsOpen(!absOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <CheckCircle2 size={14} className="text-green-500" />
                <span>ABS compliance steps</span>
              </div>
              {absOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {absOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-1.5">
                {message.absChecklist!.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-[10px] font-medium flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TKDL Pointers */}
        {hasTKDL && (
          <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden">
            <button
              onClick={() => setTkdlOpen(!tkdlOpen)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                <Building2 size={14} className="text-slate-400" />
                <span>TKDL prior-art checkpoints</span>
              </div>
              {tkdlOpen ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </button>

            {tkdlOpen && (
              <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-1.5">
                {message.tkdlPointers!.map((pointer, i) => (
                  <div key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed p-2 rounded bg-slate-50 dark:bg-slate-800">
                    {pointer}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Related questions */}
        {!message.isAbstention && onSuggestedQuery && (
          <div className="pt-1">
            <div className="text-[11px] text-slate-400 mb-1.5">Related questions:</div>
            <div className="flex flex-wrap gap-1.5">
              {getReformulations(classificationState).map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onSuggestedQuery(item.query)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1 transition-colors"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <ArrowRight size={10} className="text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
