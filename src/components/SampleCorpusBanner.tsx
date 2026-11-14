import { AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function SampleCorpusBanner() {
  const { isSampleCorpus } = useAppStore();

  if (!isSampleCorpus) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 py-2 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 flex-shrink-0">
      <AlertTriangle size={14} className="flex-shrink-0" />
      <span>
        <strong>Sample corpus active.</strong> Only sample documents are indexed. Add real legal texts per CORPUS_GUIDE.md and run <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">npm run ingest</code> to unlock full functionality.
      </span>
    </div>
  );
}

