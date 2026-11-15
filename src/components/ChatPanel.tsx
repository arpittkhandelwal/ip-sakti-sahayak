import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Scale, ShieldAlert, FileText, Globe2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ExportButton } from './ExportButton';
import { VoiceRecorder } from './VoiceRecorder';

const PRACTICE_AREAS = [
  {
    icon: Scale,
    title: 'Patents Act § 3(p)',
    summary: 'Classical texts, TKDL prior-art bar, novel extraction vs. traditional knowledge.',
    sampleQuery: 'Can a classical Ayurvedic formulation like Triphala be patented under Section 3(p)?',
  },
  {
    icon: ShieldAlert,
    title: 'Biological Diversity Act 2023',
    summary: 'NBA Form I approval vs. SBB Section 7 prior intimation & benefit-sharing.',
    sampleQuery: 'What is the ABS compliance process for Indian entities under the 2023 Amendment?',
  },
  {
    icon: FileText,
    title: 'Drugs & Cosmetics Act 1940',
    summary: 'First Schedule classical medicines, Schedule Y-A Phytopharmaceuticals.',
    sampleQuery: 'How is a Schedule Y-A phytopharmaceutical regulated differently from a classical drug?',
  },
  {
    icon: Globe2,
    title: 'International IP Treaties',
    summary: 'WIPO GRATK Treaty 2024, Nagoya Protocol PIC/MAT, TRIPS Article 27.3(b).',
    sampleQuery: 'How does the WIPO GRATK Treaty 2024 affect Ayurvedic patent applications internationally?',
  },
];

const QUICK_PILLS = [
  { label: 'Section 3(p)', query: 'Does Section 3(p) prevent patenting my modified herbal formulation?' },
  { label: 'NBA vs SBB', query: 'Do Indian AYUSH companies need NBA approval or only SBB intimation under 2023 Rules?' },
  { label: 'TKDL Prior Art', query: 'How does TKDL access by USPTO and EPO prevent biopiracy of Ayurveda?' },
  { label: 'GI Tag', query: 'What criteria must a regional Ayurvedic preparation fulfill for a Geographical Indication?' },
  { label: 'Class 5 Trademark', query: 'How should an Ayurvedic enterprise protect brand names under Trade Marks Act 1999?' },
];

const DEMO_QUESTIONS = [
  { lang: 'en' as const, tag: '§ 3(p)', question: 'Can a classical Ayurvedic formulation like Triphala be patented under Section 3(p) of the Patents Act?' },
  { lang: 'en' as const, tag: 'ABS', question: 'What ABS compliance steps must an Ayurvedic company follow under the Biological Diversity (Amendment) Act 2023?' },
  { lang: 'en' as const, tag: 'GI Act', question: 'What criteria must a regional Ayurvedic preparation fulfill to be registered as a Geographical Indication?' },
  { lang: 'en' as const, tag: 'WIPO GRATK', question: 'How does the WIPO GRATK Treaty 2024 require disclosure of traditional knowledge in patent applications?' },
  { lang: 'hi' as const, tag: 'पेटेंट 3(p)', question: 'क्या आयुर्वेदिक दवाओं जैसे त्रिफला का पेटेंट हो सकता है? धारा 3(p) क्या कहती है?' },
  { lang: 'hi' as const, tag: 'नागोया', question: 'नागोया प्रोटोकॉल भारतीय जैव संसाधनों को कैसे बचाता है और ABS अनुपालन क्या है?' },
  { lang: 'hi' as const, tag: 'GI टैग', question: 'भौगोलिक संकेत (GI टैग) के लिए आयुर्वेदिक उत्पाद की पात्रता क्या है?' },
  { lang: 'hi' as const, tag: 'TKDL', question: 'TKDL क्या है और यह आयुर्वेदिक पारम्परिक ज्ञान की जैव-चोरी से कैसे रक्षा करता है?' },
];

export function ChatPanel() {
  const { messages, clearMessages, resetClassification, language, classificationState, jurisdiction } = useAppStore();
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-950">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {messages.length === 0 ? (
          <WelcomeScreen
            onSelectQuery={(q) => { setInput(q); textareaRef.current?.focus(); }}
            onFireQuery={fireQuery}
          />
        ) : (
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onSuggestedQuery={(q) => sendMessage(q)}
              />
            ))}
            {isLoading && <TypingIndicator stage={loadingStage!} />}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {QUICK_PILLS.map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => { setInput(pill.query); textareaRef.current?.focus(); }}
                className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition-colors flex-shrink-0"
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Input */}
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
                style={{ minHeight: '44px' }}
              />
              <span className="absolute right-3 bottom-3 text-[10px] text-slate-400 font-mono">
                {input.length}/2000
              </span>
            </div>

            <VoiceRecorder
              language={language}
              disabled={isLoading}
              onTranscript={(text) => {
                setInput(text);
                textareaRef.current?.focus();
              }}
            />

            <div className="flex gap-1.5 flex-shrink-0">
              {messages.length > 0 && (
                <>
                  <ExportButton
                    messages={messages}
                    classificationState={classificationState}
                    jurisdiction={jurisdiction}
                  />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-secondary h-11 w-10 flex items-center justify-center p-0 text-slate-500"
                    title="Clear chat"
                  >
                    <RotateCcw size={15} />
                  </button>
                </>
              )}
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="btn-primary h-11 px-4 flex items-center gap-2"
              >
                <Send size={14} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-0.5">
            <span>Patents Act 1970 · BD Act 2023 · D&amp;C Act 1940 · WIPO GRATK 2024</span>
            <span>Not legal advice</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onSelectQuery,
  onFireQuery,
}: {
  onSelectQuery: (q: string) => void;
  onFireQuery: (q: string) => void;
}) {
  const [demoTab, setDemoTab] = useState<'en' | 'hi'>('en');
  const visibleDemos = DEMO_QUESTIONS.filter((d) => d.lang === demoTab);

  return (
    <div className="max-w-3xl mx-auto py-4 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ayurveda IP & Regulatory Guidance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Legal research assistant for Indian IP law, ABS compliance, TKDL prior-art, and regulatory pathways — in English and Hindi.
        </p>
      </div>

      {/* Practice areas */}
      <div>
        <h2 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Practice areas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRACTICE_AREAS.map((area) => {
            const Icon = area.icon;
            return (
              <button
                key={area.title}
                onClick={() => onSelectQuery(area.sampleQuery)}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-left hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors flex-shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{area.title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{area.summary}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Demo questions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sample questions</h2>
          <div className="flex gap-1">
            <button
              onClick={() => setDemoTab('en')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                demoTab === 'en'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setDemoTab('hi')}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                demoTab === 'hi'
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              हिंदी
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {visibleDemos.map((demo, i) => (
            <button
              key={i}
              onClick={() => onFireQuery(demo.question)}
              className="border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-left hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
            >
              <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{demo.tag}</div>
              <p className={`text-sm text-slate-700 dark:text-slate-300 leading-snug ${demo.lang === 'hi' ? 'font-hindi' : ''}`}>
                {demo.question}
              </p>
            </button>
          ))}
        </div>

        {demoTab === 'hi' && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-2">
            Hindi queries are auto-translated to English for retrieval, then returned in Hindi.
          </p>
        )}
      </div>
    </div>
  );
}
