import { useState, useRef, useEffect } from 'react';
import {
  Send, RotateCcw, Sparkles, Scale, ShieldAlert,
  FileText, Globe2, ChevronRight, MessageSquare, Languages,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

// ── Practice Area Cards ─────────────────────────────────────────
const PRACTICE_AREAS = [
  {
    icon: Scale,
    title: 'Patents Act, 1970 § 3(p)',
    category: 'Patentability',
    summary: 'Classical texts, TKDL prior-art bar, novel extraction vs. traditional knowledge.',
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
    category: 'Regulatory',
    summary: 'First Schedule classical medicines, Schedule Y-A Phytopharmaceuticals, FSSAI Ayurveda Aahar.',
    sampleQuery: 'How is a Schedule Y-A phytopharmaceutical regulated differently from a classical drug?',
  },
  {
    icon: Globe2,
    title: 'International IP Treaties',
    category: 'Cross-Border',
    summary: 'WIPO GRATK Treaty 2024 disclosure, Nagoya Protocol PIC/MAT, TRIPS Article 27.3(b).',
    sampleQuery: 'How does the WIPO GRATK Treaty 2024 affect Ayurvedic patent applications internationally?',
  },
];

// ── Quick-access pill shortcuts ─────────────────────────────────
const STATUTORY_PILLS = [
  { label: 'Section 3(p)', query: 'Does Section 3(p) prevent patenting my modified herbal formulation?' },
  { label: 'NBA vs SBB', query: 'Do Indian AYUSH companies need NBA approval or only SBB intimation under 2023 Rules?' },
  { label: 'TKDL Prior Art', query: 'How does TKDL access by USPTO and EPO prevent biopiracy of Ayurveda?' },
  { label: 'GI Tag Eligibility', query: 'What criteria must a regional Ayurvedic preparation fulfill for a Geographical Indication?' },
  { label: 'Class 5 Trademark', query: 'How should an Ayurvedic enterprise protect brand names under Trade Marks Act 1999?' },
];

// ── Demo Questions – bilingual (English + Hindi) ───────────────
interface DemoQ {
  lang: 'en' | 'hi';
  flag: string;
  question: string;
  tag: string;
}

const DEMO_QUESTIONS: DemoQ[] = [
  // English demos
  {
    lang: 'en', flag: '🇬🇧',
    tag: '§ 3(p) Patents',
    question: 'Can a classical Ayurvedic formulation like Triphala be patented under Section 3(p) of the Patents Act?',
  },
  {
    lang: 'en', flag: '🇬🇧',
    tag: 'ABS · BDA 2023',
    question: 'What ABS compliance steps must an Ayurvedic company follow under the Biological Diversity (Amendment) Act 2023?',
  },
  {
    lang: 'en', flag: '🇬🇧',
    tag: 'GI Act',
    question: 'What criteria must a regional Ayurvedic preparation fulfill to be registered as a Geographical Indication?',
  },
  {
    lang: 'en', flag: '🇬🇧',
    tag: 'WIPO GRATK 2024',
    question: 'How does the WIPO GRATK Treaty 2024 require disclosure of traditional knowledge in patent applications?',
  },
  // Hindi demos
  {
    lang: 'hi', flag: '🇮🇳',
    tag: 'पेटेंट धारा 3(p)',
    question: 'क्या आयुर्वेदिक दवाओं जैसे त्रिफला का पेटेंट हो सकता है? धारा 3(p) क्या कहती है?',
  },
  {
    lang: 'hi', flag: '🇮🇳',
    tag: 'नागोया प्रोटोकॉल',
    question: 'नागोया प्रोटोकॉल भारतीय जैव संसाधनों को कैसे बचाता है और ABS अनुपालन क्या है?',
  },
  {
    lang: 'hi', flag: '🇮🇳',
    tag: 'GI टैग',
    question: 'भौगोलिक संकेत (GI टैग) के लिए आयुर्वेदिक उत्पाद की पात्रता क्या है?',
  },
  {
    lang: 'hi', flag: '🇮🇳',
    tag: 'TKDL',
    question: 'TKDL क्या है और यह आयुर्वेदिक पारम्परिक ज्ञान की जैव-चोरी से कैसे रक्षा करता है?',
  },
];

// ── Main Component ──────────────────────────────────────────────
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

  const fireQuery = (q: string) => {
    setInput(q);
    // small timeout so the textarea value is visible briefly before submit
    setTimeout(() => {
      sendMessage(q);
      setInput('');
    }, 80);
  };

  const handleReset = () => {
    clearMessages();
    resetClassification();
    setInput('');
  };

  const isLoading = loadingStage !== null;

  const placeholder =
    language === 'hi' ? 'आयुर्वेदिक पेटेंट, ABS, धारा 3(p), जीआई या विनियामक प्रश्न यहाँ दर्ज करें...' :
    language === 'ta' ? 'ஆயுர்வேத காப்புரிமை, ABS, பிரிவு 3(p) குறித்த உங்கள் சட்ட கேள்வியை உள்ளிடுக...' :
    language === 'bn' ? 'আয়ুর্বেদিক পেটেন্ট, ABS বা নিয়ামক আইন সম্পর্কিত প্রশ্ন লিখুন...' :
    language === 'mr' ? 'आयुर्वेदिक पेटंट, ABS, कलम 3(p) व नियामक कायदे विषयक प्रश्न लिहा...' :
    language === 'te' ? 'ఆయుర్వేద పేటెంట్, ABS, చట్టపరమైన ప్రశ్న ఇక్కడ నమోదు చేయండి...' :
    'Ask about Ayurveda patents, Section 3(p), ABS compliance, GI tags, TKDL, or D&C regulatory pathways…';

  return (
    <div className="flex flex-col h-full bg-slate-50/70 dark:bg-slate-950">
      {/* Scrollable area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">
        {messages.length === 0 ? (
          <ExecutiveLegalPortal
            onSelectQuery={(q) => { setInput(q); textareaRef.current?.focus(); }}
            onFireQuery={fireQuery}
          />
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
              <Sparkles size={11} className="text-amber-500" /> Quick:
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
                placeholder={placeholder}
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
                  title="Clear Session"
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

          {/* Footnote */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Patents Act 1970 · BD Act 2023 · D&amp;C Act 1940 · WIPO GRATK 2024</span>
            </div>
            <span>Information Only · Not Legal Advice</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Executive Legal Portal (Welcome Screen) ─────────────────────
function ExecutiveLegalPortal({
  onSelectQuery,
  onFireQuery,
}: {
  onSelectQuery: (q: string) => void;
  onFireQuery: (q: string) => void;
}) {
  const [demoTab, setDemoTab] = useState<'en' | 'hi'>('en');
  const visibleDemos = DEMO_QUESTIONS.filter((d) => d.lang === demoTab);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 animate-fade-in">

      {/* Official Government Dossier Banner */}
      <div className="institutional-card p-6 md:p-8 bg-gradient-to-br from-white via-parchment-50 to-amber-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-ayush-950/20 border-l-4 border-l-ayush-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-ayush-100/80 dark:bg-ayush-950 text-ayush-900 dark:text-emerald-300 text-[11px] font-bold tracking-wider uppercase border border-ayush-300/60 dark:border-ayush-800">
              <span>SIH26045</span>
              <span>·</span>
              <span>AIIA / Ministry of Ayush</span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Ayurveda IP &amp; Regulatory Guidance Portal
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              Autonomous legal research assistant for Indian IP law, ABS compliance, TKDL prior-art
              verification, and regulatory pathways — in English and Hindi.
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/80 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm space-y-2 text-xs">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retrieval Engine</div>
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Deterministic BM25 Index
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              46 Statutory Sections Indexed<br />No Embedding Hallucination Risk
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Practice Areas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
            Core Statutory Practice Areas
          </h2>
          <span className="text-[11px] text-ayush-700 dark:text-emerald-400 font-medium">
            Click to pre-load a query
          </span>
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
                  <span>Open Advisory Brief</span>
                  <ChevronRight size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Demo Questions – Bilingual ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare size={14} className="text-ayush-700 dark:text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-sans">
              Demo Questions
            </h2>
          </div>
          {/* Language tab toggle */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setDemoTab('en')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                demoTab === 'en'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>🇬🇧</span> English
            </button>
            <button
              onClick={() => setDemoTab('hi')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                demoTab === 'hi'
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <span>🇮🇳</span> हिंदी
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visibleDemos.map((demo, i) => (
            <button
              key={i}
              onClick={() => onFireQuery(demo.question)}
              className="institutional-card p-4 text-left group hover:border-ayush-600 dark:hover:border-ayush-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-saffron-100 dark:bg-saffron-900/30 text-saffron-700 dark:text-saffron-300 text-xs font-bold">
                    {i + 1}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="inline-block text-[10px] uppercase font-bold tracking-wider text-ayush-700 dark:text-emerald-400 bg-ayush-50 dark:bg-ayush-950/50 px-1.5 py-0.5 rounded mb-1.5 border border-ayush-200/60 dark:border-ayush-800/50">
                    {demo.tag}
                  </span>
                  <p className={`text-sm text-slate-700 dark:text-slate-300 leading-snug group-hover:text-ayush-900 dark:group-hover:text-emerald-200 transition-colors ${
                    demo.lang === 'hi' ? 'font-hindi' : ''
                  }`}>
                    {demo.question}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 group-hover:text-ayush-700 dark:group-hover:text-emerald-400 transition-colors font-medium">
                <span className="flex items-center gap-1">
                  <Languages size={11} />
                  {demo.lang === 'hi' ? 'हिंदी · क्लिक करें' : 'Click to submit'}
                </span>
                <ChevronRight size={12} />
              </div>
            </button>
          ))}
        </div>

        {demoTab === 'hi' && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center pt-1">
            हिंदी प्रश्न स्वचालित रूप से अंग्रेज़ी में अनुवादित होकर BM25 इंजन से उत्तर प्राप्त करेंगे, फिर हिंदी में वापस अनुवादित होंगे।
            <br />
            <span className="italic">(Hindi queries are auto-translated to English for retrieval, then the answer is returned in Hindi.)</span>
          </p>
        )}
      </div>
    </div>
  );
}
