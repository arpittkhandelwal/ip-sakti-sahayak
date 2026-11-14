import { Moon, Sun, Menu, Globe, Mic, MicOff, ShieldCheck, BookOpen } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { LANGUAGE_LABELS } from '../types';
import type { Language, Jurisdiction } from '../types';

export function Header() {
  const {
    isDarkMode,
    toggleDarkMode,
    toggleSidebar,
    language,
    setLanguage,
    jurisdiction,
    setJurisdiction,
    voiceEnabled,
    setVoiceEnabled,
  } = useAppStore();

  const languages: Language[] = ['en', 'hi', 'ta', 'bn', 'mr', 'te'];
  const jurisdictions: { value: Jurisdiction; label: string; sub: string }[] = [
    { value: 'india', label: 'India', sub: 'Patents Act, BDA 2023, D&C' },
    { value: 'international', label: 'International', sub: 'WIPO, Nagoya, TRIPS' },
    { value: 'both', label: 'Cross-Border', sub: 'Comparative Analysis' },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 flex-shrink-0 shadow-sm">
      {/* Top Ministerial Bar */}
      <div className="bg-ayush-950 text-slate-300 text-[11px] px-4 py-1 flex items-center justify-between border-b border-ayush-900/60 font-medium tracking-wide">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SIH26045
          </span>
          <span className="text-slate-400 hidden sm:inline">|</span>
          <span className="hidden sm:inline text-slate-300">
            आयुष मंत्रालय, भारत सरकार · Ministry of Ayush, Govt. of India
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 text-[11px]">
          <span className="hidden md:inline">अखिल भारतीय आयुर्वेद संस्थान (AIIA)</span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px] bg-ayush-900/80 px-2 py-0.5 rounded">
            <ShieldCheck size={12} />
            CORPUS VERIFIED
          </span>
        </div>
      </div>

      {/* Main Header Navigation */}
      <div className="px-4 py-2.5 flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="btn-ghost lg:hidden p-1.5 text-slate-600 dark:text-slate-300"
          aria-label="Toggle Legal Drawer"
        >
          <Menu size={20} />
        </button>

        {/* Institutional Crest & Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-ayush-900 via-ayush-800 to-amber-900 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-ayush-950 rounded-[10px] flex items-center justify-center text-amber-400">
              <span className="text-lg font-serif font-black tracking-tighter">⚖</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-slate-900 dark:text-white text-base tracking-tight leading-none">
                IP-SAKTI Sahayak
              </span>
              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 px-1.5 py-0.2 rounded font-semibold tracking-wider">
                RAG v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 flex items-center gap-1.5">
              <span>National Ayurveda Intellectual Property & Regulatory Desk</span>
            </div>
          </div>
        </div>

        {/* Right Section: Jurisdiction Selector + Controls */}
        <div className="flex-1 flex items-center justify-end gap-2.5 flex-wrap">
          {/* Jurisdiction Segmented Control */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1 border border-slate-200/80 dark:border-slate-700/80">
            {jurisdictions.map(({ value, label, sub }) => {
              const active = jurisdiction === value;
              return (
                <button
                  key={value}
                  onClick={() => setJurisdiction(value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all text-left ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-ayush-900 dark:text-emerald-400 shadow-sm border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                  title={sub}
                >
                  <div className="leading-none">{label}</div>
                </button>
              );
            })}
          </div>

          {/* Multilingual Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 shadow-sm">
            <Globe size={14} className="text-ayush-700 dark:text-emerald-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer pr-1"
            >
              {languages.map((lang) => (
                <option key={lang} value={lang} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {LANGUAGE_LABELS[lang]}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Command Toggle */}
          <button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`p-2 rounded-lg border transition-all ${
              voiceEnabled
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800'
            }`}
            title={voiceEnabled ? 'Sarvam Saarika Voice Active' : 'Enable Voice Interaction'}
          >
            {voiceEnabled ? <Mic size={15} /> : <MicOff size={15} />}
          </button>

          {/* Theme Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </header>
  );
}
