import { Scale, Moon, Sun, Menu, Globe, Mic, MicOff } from 'lucide-react';
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
  const jurisdictions: { value: Jurisdiction; label: string }[] = [
    { value: 'india', label: '🇮🇳 India' },
    { value: 'international', label: '🌍 International' },
    { value: 'both', label: '🌐 Both' },
  ];

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3 z-10 flex-shrink-0">
      <button onClick={toggleSidebar} className="btn-ghost lg:hidden" aria-label="Toggle sidebar">
        <Menu size={20} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-9 h-9 bg-gradient-to-br from-saffron-500 to-saffron-600 rounded-lg flex items-center justify-center shadow-sm">
          <Scale size={20} className="text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
            IP-SAKTI Sahayak
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
            Ministry of Ayush / AIIA
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2 flex-wrap">
        {/* Jurisdiction toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5 gap-0.5">
          {jurisdictions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setJurisdiction(value)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                jurisdiction === value
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Language selector */}
        <div className="relative flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg px-2.5 py-1.5">
          <Globe size={14} className="text-gray-500 dark:text-gray-400" />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs font-medium text-gray-700 dark:text-gray-200 outline-none cursor-pointer appearance-none pr-4"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </div>

        {/* Voice toggle */}
        <button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          className={`btn-ghost ${voiceEnabled ? 'text-saffron-500' : ''}`}
          title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
        >
          {voiceEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* Dark mode */}
        <button onClick={toggleDarkMode} className="btn-ghost" aria-label="Toggle theme">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}

