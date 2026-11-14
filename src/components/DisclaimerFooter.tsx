import { useAppStore } from '../store/appStore';

export function DisclaimerFooter() {
  const { isDarkMode } = useAppStore();
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2 flex-shrink-0">
      <p className="text-center text-xs text-gray-400 dark:text-gray-500">
        ⚖️ <strong>Information only, not legal advice.</strong> IP-SAKTI Sahayak is an AI research tool.
        Consult a qualified IP attorney for legal decisions. ·{' '}
        <a href="/privacy" className="text-saffron-500 hover:underline">Privacy Policy</a>
        {' · '}
        <span>Corpus last verified: see source citations</span>
        {' · '}
        <span>SIH26045 · Ministry of Ayush / AIIA</span>
      </p>
    </footer>
  );
}

