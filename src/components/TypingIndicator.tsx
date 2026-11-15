import { Check, BookOpen, Scale, Languages } from 'lucide-react';

type Stage = 'prepare' | 'answer' | 'localize';

interface Props {
  stage: Stage;
}

const STAGES = [
  { key: 'prepare' as Stage, step: 1, label: 'Retrieving sources', icon: BookOpen },
  { key: 'answer' as Stage, step: 2, label: 'Generating answer', icon: Scale },
  { key: 'localize' as Stage, step: 3, label: 'Translating', icon: Languages },
];

export function TypingIndicator({ stage }: Props) {
  const currentStep = stage === 'prepare' ? 1 : stage === 'answer' ? 2 : 3;

  return (
    <div className="flex justify-start w-full max-w-lg">
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 px-4 py-3 w-full">
        <div className="flex items-center gap-4">
          {STAGES.map((s) => {
            const isDone = s.step < currentStep;
            const isActive = s.step === currentStep;
            const Icon = s.icon;
            return (
              <div key={s.key} className={`flex items-center gap-1.5 text-xs ${
                isDone ? 'text-green-600 dark:text-green-400' :
                isActive ? 'text-slate-800 dark:text-slate-200' :
                'text-slate-300 dark:text-slate-600'
              }`}>
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  isDone ? 'bg-green-100 dark:bg-green-900/50' :
                  isActive ? 'bg-slate-100 dark:bg-slate-800' :
                  'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {isDone ? <Check size={10} /> : <Icon size={10} className={isActive ? 'animate-pulse' : ''} />}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
