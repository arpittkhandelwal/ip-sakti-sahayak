import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Mail, CheckCircle2, List } from 'lucide-react';
import type { ChatMessage } from '../types';
import { useAppStore } from '../store/appStore';

interface Props {
  message: ChatMessage;
}

function ConfidenceBadge({ level, score }: { level: string; score?: number }) {
  const cls =
    level === 'High' ? 'badge-high' :
    level === 'Medium' ? 'badge-medium' :
    'badge-low';
  return (
    <span className={`badge ${cls}`}>
      {level === 'High' ? '✓' : level === 'Medium' ? '~' : '⚠'} {level}
      {score !== undefined && ` (${Math.round(score * 100)}%)`}
    </span>
  );
}

export function MessageBubble({ message }: Props) {
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [absOpen, setAbsOpen] = useState(false);
  const [tkdlOpen, setTkdlOpen] = useState(false);
  const { classificationState } = useAppStore();

  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-in">
        <div className="max-w-[80%] bg-saffron-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-sm">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.error) {
    return (
      <div className="flex justify-start animate-slide-in">
        <div className="max-w-[90%] card border-l-4 border-l-red-400 p-4">
          <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <p className="text-sm">{message.content}</p>
          </div>
        </div>
      </div>
    );
  }

  const hasCitations = message.citations && message.citations.length > 0;
  const hasABS = message.absChecklist && message.absChecklist.length > 0;
  const hasTKDL = message.tkdlPointers && message.tkdlPointers.length > 0;

  const escalateSubject = encodeURIComponent('[IP-SAKTI] IP Query Escalation');
  const escalateBody = encodeURIComponent(
    `Classification: ${classificationState.productCategory} | ${classificationState.ipType} | ${classificationState.jurisdiction}\n\nQuery:\n${message.content?.slice(0, 500)}\n\nPlease assist with this Ayurveda IP matter.`
  );

  return (
    <div className="flex justify-start animate-slide-in">
      <div className="max-w-[90%] w-full space-y-2">
        {/* Main message card */}
        <div className="card p-4">
          {/* Abstention notice */}
          {message.isAbstention && (
            <div className="mb-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2.5 text-xs">
              <AlertTriangle size={14} />
              <span>Insufficient corpus data – consulting official sources recommended</span>
            </div>
          )}

          {/* Markdown content */}
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-saffron-600 dark:text-saffron-400 hover:underline">
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Footer row */}
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
            {message.confidence && (
              <ConfidenceBadge level={message.confidence} score={message.confidenceScore} />
            )}
            <span className="text-xs text-gray-400">
              {message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
            <div className="ml-auto flex gap-2">
              {/* Escalate button */}
              <a
                href={`mailto:ip-facilitator@aiia.res.in?subject=${escalateSubject}&body=${escalateBody}`}
                className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-saffron-500 transition-colors"
                title="Escalate to human IP facilitator"
              >
                <Mail size={13} />
                <span className="hidden sm:inline">Escalate</span>
              </a>
            </div>
          </div>
        </div>

        {/* Citation cards */}
        {hasCitations && (
          <div className="ml-2">
            <button
              onClick={() => setCitationsOpen(!citationsOpen)}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-1"
            >
              {citationsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span className="font-medium">
                {message.citations!.length} source{message.citations!.length !== 1 ? 's' : ''} cited
              </span>
            </button>
            {citationsOpen && (
              <div className="space-y-2 mt-1">
                {message.citations!.map((chunk) => (
                  <div key={chunk.id} className="citation-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs text-gray-800 dark:text-gray-200 truncate">
                          {chunk.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {chunk.act_or_treaty} · {chunk.section_or_article}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="badge bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                            {chunk.jurisdiction}
                          </span>
                          <span className="badge bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                            {chunk.ip_type}
                          </span>
                        </div>
                      </div>
                      <a
                        href={chunk.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-saffron-500 hover:text-saffron-600 flex-shrink-0"
                        title="Open source"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABS Checklist */}
        {hasABS && (
          <div className="ml-2">
            <button
              onClick={() => setAbsOpen(!absOpen)}
              className="flex items-center gap-1.5 text-xs text-ayush-600 dark:text-ayush-400 hover:text-ayush-700 dark:hover:text-ayush-300 py-1 font-medium"
            >
              {absOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <CheckCircle2 size={14} />
              ABS Compliance Checklist ({message.absChecklist!.length} items)
            </button>
            {absOpen && (
              <div className="mt-1 card border-l-4 border-l-ayush-500 p-3 space-y-2">
                {message.absChecklist!.map((item, i) => (
                  <div key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-300">
                    <span className="text-ayush-500 flex-shrink-0 font-bold">{i + 1}.</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TKDL Pointers */}
        {hasTKDL && (
          <div className="ml-2">
            <button
              onClick={() => setTkdlOpen(!tkdlOpen)}
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1 font-medium"
            >
              {tkdlOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <List size={14} />
              TKDL Prior Art Pointers
            </button>
            {tkdlOpen && (
              <div className="mt-1 card border-l-4 border-l-blue-400 p-3 space-y-1.5">
                {message.tkdlPointers!.map((pointer, i) => (
                  <p key={i} className="text-xs text-gray-600 dark:text-gray-300">{pointer}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

