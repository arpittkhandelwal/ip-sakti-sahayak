import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Sparkles, BookOpen, Scale, ShieldAlert, FileText, Globe2, ChevronRight } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

const PRACTICE_AREAS = [
  {
    icon: Scale,
    title: 'Patents Act, 1970 § 3(p)',
    category: 'Patentability Exclusion',
    summary: 'Classical texts, TKDL prior art bar, novel extraction vs. traditional knowledge.',
    sampleQuery: 'Can a classical Ayurvedic formulation like Triphala be patented under Section 3(p)?',
  },
  {
    icon: ShieldAlert,
    title: 'Biological Diversity Act 2023',
    category: 'ABS Compliance',
    summary: 'NBA Form I approval vs. SBB Section 7 prior intimation & benefit-sharing mandates.',
    sampleQuery: 'What is the ABS compliance process for Indian entities under the 2023 Amendment?',
  },
  {
    icon: FileText,
    title: 'Drugs & Cosmetics Act 1940',
    category: 'Regulatory Pathways',
    summary: 'First Schedule classical medicines, Schedule Y-A Phytopharmaceuticals, FSSAI Ayurveda Aahar.',
    sampleQuery: 'How is a Schedule Y-A phytopharmaceutical regulated differently from a classical drug?',
  },
  {
    icon: Globe2,
    title: 'International Treaties & Conventions',
    category: 'Cross-Border Protection',
    summary: 'WIPO GRATK Treaty 2024 disclosure, Nagoya Protocol PIC/MAT, TRIPS Article 27.3(b).',
    sampleQuery: 'How does the WIPO GRATK Treaty 2024 affect Ayurvedic patent applications internationally?',
  },
];

const STATUTORY_PILLS = [
  { label: 'Section 3(p) Patent Bar', query: 'Does Section 3(p) prevent patenting my modified herbal formulation?' },
  { label: 'NBA Form I vs SBB Intimation', query: 'Do Indian AYUSH companies need NBA approval or only SBB intimation under 2023 Rules?' },
  { label: 'TKDL Prior Art Check', query: 'How does TKDL access by USPTO and EPO prevent biopiracy of Ayurveda?' },
  { label: 'Ayurvedic GI Tag Eligibility', query: 'What criteria must a regional Ayurvedic preparation fulfill for a Geographical Indication?' },
  { label: 'Trademark Class 5 Strategy', query: 'How should an Ayurvedic enterprise protect brand names under Trade Marks Act 1999?' },
];

export function ChatPanel() {
  const { messages, clearMessages, resetClassification, language } = useAppStore();
  const { sendMessage, loadingStage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingStage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loadingStage !== null) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleReset = () => {
    clearMessages();
    resetClassification();
    setInput('');
  };

  const isLoading = loadingStage !== null;

  return (
    <div className="flex flex-col h-full bg-slate-50/70 dark:bg-slate-950">
      {/* Scrollable Chat or Executive Legal Portal Home */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <ExecutiveLegalPortal onSelectQuery={(q) => { setInput(q); textareaRef.current?.focus(); }} />
        ) : (
          <div className="max-w-4xl mx-auto space-y-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator stage={loadingStage!} />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Console */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Quick Statute Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex-shrink-0 mr-1 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> Quick Inquiries:
            </span>
            {STATUTORY_PILLS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => { setInput(pill.query); textareaRef.current?.focus(); }}
                className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors text-[11px] font-medium"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  language === 'hi' ? 'आयुर्वेदिक पेटेंट, ABS, धारा 3(p), जीआई या विनियामक प्रश्न यहाँ दर्ज करें...' :
                  language === 'ta' ? 'ஆயுர்வேத காப்புரிமை, ABS, பிரிவு 3(p) குறித்த உங்கள் சட்ட கேள்வியை உள்ளிடுக...' :
                  language === 'bn' ? 'আয়ুর্বেদিক পেটেন্ট, ABS বা নিয়ামক আইন সম্পর্কিত প্রশ্ন লিখুন...' :
                  language === 'mr' ? 'आयुर्वेदिक पेटंट, ABS, कलम 3(p) व नियामक कायदे विषयक प्रश्न लिहा...' :
                  language === 'te' ? 'ఆయుర్వేద పేటెంట్, ABS, చట్టపరమైన ప్రశ్న ఇక్కడ నమోదు చేయండి...' :
                  'Ask specific legal questions regarding Ayurveda patents, Section 3(p), ABS compliance, GI tags, or D&C regulatory pathways...'
                }
                rows={1}
                maxLength={2000}
                disabled={isLoading}
                className="input-field pr-12 text-sm leading-relaxed"
                style={{ minHeight: '48px' }}
              />
              <span className="absolute right-3 bottom-3 text-[10px] text-slate-400 font-mono">
                {input.length}/2000
              </span>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn-secondary h-12 w-11 flex items-center justify-center p-0 text-slate-500 hover:text-slate-700"
                  title="Clear Case Docket"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-primary h-12 px-5 flex items-center gap-2"
              >
                <Send size={15} />
                <span className="hidden sm:inline font-semibold">Analyze</span>
              </button>
            </div>
          </form>

          {/* Statutory Verification Footnote */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Primary Corpus: Patents Act 1970 · BD Act 2023 · D&C Act 1940 · WIPO GRATK 2024</span>
            </div>
            <span>Information Only · Not Legal Advice</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveLegalPortal({ onSelectQuery }: { onSelectQuery: (q: string) => void }) {
  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in">
      {/* Official Government Dossier Banner */}
      <div className="institutional-card p-6 md:p-8 bg-gradient-to-br from-white via-parchment-50 to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-ayush-950/20 border-l-4 border-l-ayush-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-ayush-100/80 dark:bg-ayush-950 text-ayush-900 dark:text-emerald-300 text-[11px] font-bold tracking-wider uppercase border border-ayush-300/60 dark:border-ayush-800">
              <span>National Legal Intelligence System</span>
              <span>·</span>
              <span>AIIA / Ministry of Ayush</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Ayurveda Intellectual Property & Regulatory Guidance Portal
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Autonomous legal research assistant designed to navigate Indian statutory frameworks, prevent traditional knowledge misappropriation, ensure Access & Benefit Sharing (ABS) compliance, and verify patent claims against TKDL prior-art standards.
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statutory Verification Engine</div>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Deterministic BM25 Index
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              46 Official Statutory Sections<br />No Embedding Hallucination Risk
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Statutory Practice Areas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
            Core Statutory Jurisdictions & Practice Areas
          </h2>
          <span className="text-[11px] text-ayush-700 dark:text-emerald-400 font-medium">Click to Load Pre-Configured Legal Brief</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRACTICE_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <button
                key={area.title}
                onClick={() => onSelectQuery(area.sampleQuery)}
                className="institutional-card p-5 text-left hover:border-ayush-700 dark:hover:border-ayush-600 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="w-9 h-9 rounded-lg bg-ayush-50 dark:bg-ayush-950/60 border border-ayush-200 dark:border-ayush-800/60 flex items-center justify-center text-ayush-800 dark:text-emerald-400 group-hover:bg-ayush-800 group-hover:text-white transition-colors">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {area.category}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 dark:text-white text-base group-hover:text-ayush-900 dark:group-hover:text-emerald-300 transition-colors">
                    {area.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {area.summary}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-ayush-800 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  <span>Inquire Case Law & Statutory Analysis</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
