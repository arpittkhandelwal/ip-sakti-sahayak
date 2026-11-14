// ============================================================
// IP-SAKTI Sahayak – Animated Pipeline Progress Tracker
// Replaces simple spinner with a 3-stage verifiable RAG pipeline
// ============================================================

import { Check, Sparkles, Scale, BookOpen, Languages } from 'lucide-react';

type Stage = 'prepare' | 'answer' | 'localize';

interface Props {
  stage: Stage;
}

const STAGES = [
  {
    key: 'prepare' as Stage,
    step: 1,
    title: 'Language & Retrieval',
    subtitle: 'LID detection & BM25 indexing search',
    icon: BookOpen,
  },
  {
    key: 'answer' as Stage,
    step: 2,
    title: 'Statutory Verification',
    subtitle: 'Grounded reasoning & claim audit',
    icon: Scale,
  },
  {
    key: 'localize' as Stage,
    step: 3,
    title: 'Indic Localization',
    subtitle: 'Translating with legal term preservation',
    icon: Languages,
  },
];

export function TypingIndicator({ stage }: Props) {
  const currentStep = stage === 'prepare' ? 1 : stage === 'answer' ? 2 : 3;

  return (
    <div className="flex justify-start animate-fade-in w-full max-w-2xl">
      <div className="institutional-card p-5 w-full border-l-4 border-l-amber-500 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500 animate-spin" />
            <span className="font-serif font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Autonomous Legal Analysis in Progress
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Pipeline Stage {currentStep} of 3
          </span>
        </div>

        {/* 3 Steps Visual Progress */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STAGES.map((s) => {
            const isDone = s.step < currentStep;
            const isActive = s.step === currentStep;

            return (
              <div
                key={s.key}
                className={`p-3 rounded-lg border transition-all ${
                  isDone
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : isActive
                    ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-amber-400/40'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isActive
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {isDone ? <Check size={11} /> : s.step}
                  </div>
                  <span className="font-semibold text-xs truncate">{s.title}</span>
                </div>
                <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  {s.subtitle}
                </p>

                {isActive && (
                  <div className="mt-2 h-1 bg-amber-200 dark:bg-amber-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-2/3 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Simulated Processing Skeleton */}
        <div className="space-y-1.5 pt-1">
          <div className="skeleton h-2.5 w-full" />
          <div className="skeleton h-2.5 w-4/5" />
        </div>
      </div>
    </div>
  );
}
