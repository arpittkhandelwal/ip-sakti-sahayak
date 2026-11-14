import { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';

const SUGGESTED_QUESTIONS = [
  "Can a classical Ayurvedic formulation be patented?",
  "What is the ABS compliance process for a new herbal product?",
  "How does Section 3(p) affect Ayurveda patent applications?",
  "What GI tags exist for Ayurvedic products in India?",
];

export function ChatPanel() {
  const { messages, clearMessages, resetClassification, language } = useAppStore();
  const { sendMessage, loadingStage } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    // Auto-resize
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
    <div className="flex flex-col h-full">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <WelcomeScreen onSuggest={(q) => { setInput(q); textareaRef.current?.focus(); }} />
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator stage={loadingStage!} />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                language === 'hi' ? 'अपना प्रश्न यहाँ लिखें...' :
                language === 'ta' ? 'உங்கள் கேள்வியை இங்கே உள்ளிடுங்கள்...' :
                language === 'bn' ? 'আপনার প্রশ্ন এখানে লিখুন...' :
                language === 'mr' ? 'आपला प्रश्न येथे लिहा...' :
                language === 'te' ? 'మీ ప్రశ్న ఇక్కడ నమోదు చేయండి...' :
                'Ask about Ayurveda IP, patents, GI, ABS compliance...'
              }
              rows={1}
              maxLength={2000}
              disabled={isLoading}
              className="input-field"
              style={{ minHeight: '44px' }}
            />
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {messages.length > 0 && (
              <button type="button" onClick={handleReset} className="btn-secondary" title="Clear conversation">
                <RotateCcw size={16} />
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="btn-primary flex items-center gap-2 px-5"
            >
              <Send size={16} />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          ⚖️ Legal information only, not legal advice · Max 2000 characters
        </p>
      </div>
    </div>
  );
}

function WelcomeScreen({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-fade-in">
      <div className="w-16 h-16 bg-gradient-to-br from-saffron-400 to-saffron-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
        <span className="text-3xl">⚖️</span>
      </div>
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        IP-SAKTI Sahayak
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-2 max-w-md text-sm">
        Your multilingual guide to Intellectual Property and regulatory compliance in Ayurveda.
        Powered by Sarvam AI.
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-8 max-w-sm">
        Covers: Patents (Sec 3p), GI, Trademarks, ABS/Biodiversity, Drugs & Cosmetics Act, TRIPS, Nagoya Protocol, WIPO GRATK Treaty 2024.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSuggest(q)}
            className="text-left p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-saffron-300 dark:hover:border-saffron-600 hover:shadow-sm transition-all text-xs text-gray-600 dark:text-gray-300 group"
          >
            <span className="text-saffron-500 mr-1.5 font-bold">→</span>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

