import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Moon, Sun, Menu, Globe, Scale, ShieldCheck, Search, GitCompare, BarChart3 } from 'lucide-react';
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
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        toggleDarkMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleDarkMode]);

  const languages: Language[] = ['en', 'hi', 'ta', 'bn', 'mr', 'te'];
  const jurisdictions: { value: Jurisdiction; label: string }[] = [
    { value: 'india', label: 'India' },
    { value: 'international', label: 'International' },
    { value: 'both', label: 'Cross-Border' },
  ];

  const NAV_ITEMS = [
    { to: '/', label: 'Chat', icon: Scale },
    { to: '/abs-wizard', label: 'ABS Wizard', icon: ShieldCheck },
    { to: '/tkdl', label: 'TKDL Search', icon: Search },
    { to: '/compare', label: 'Comparator', icon: GitCompare },
    { to: '/eval', label: 'Eval', icon: BarChart3 },
  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-20 flex-shrink-0">
      <div className="px-4 h-12 flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Brand */}
        <NavLink to="/" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg">⚖️</span>
          <div>
            <span className="font-semibold text-sm text-slate-900 dark:text-white">IP-SAKTI Sahayak</span>
            <span className="ml-2 text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Ministry of Ayush</span>
          </div>
        </NavLink>

        <div className="flex-1" />

        {/* Jurisdiction */}
        <div className="hidden sm:flex items-center gap-0.5 text-xs">
          {jurisdictions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setJurisdiction(value)}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                jurisdiction === value
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Language */}
        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
          <Globe size={13} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-transparent text-xs text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang} className="bg-white dark:bg-slate-900">
                {LANGUAGE_LABELS[lang]}
              </option>
            ))}
          </select>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-1.5 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle dark mode"
        >
          {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Nav bar */}
      <div className="px-4 flex items-center gap-0.5 overflow-x-auto no-scrollbar border-t border-slate-100 dark:border-slate-800">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-slate-900 dark:border-white text-slate-900 dark:text-white font-medium'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`
              }
            >
              <Icon size={12} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
