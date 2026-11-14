type Stage = 'prepare' | 'answer' | 'localize';

const STAGE_LABELS: Record<Stage, string> = {
  prepare: 'Detecting language & retrieving sources...',
  answer: 'Generating grounded answer...',
  localize: 'Translating response...',
};

const STAGE_STEPS: Record<Stage, number> = {
  prepare: 1,
  answer: 2,
  localize: 3,
};

export function TypingIndicator({ stage }: { stage: Stage }) {
  const step = STAGE_STEPS[stage];

  return (
    <div className="flex justify-start animate-fade-in">
      <div className="card p-4 max-w-xs w-full">
        {/* Progress steps */}
        <div className="flex gap-2 mb-3">
          {(['prepare', 'answer', 'localize'] as Stage[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full transition-all ${
                  i + 1 < step ? 'bg-ayush-500' :
                  i + 1 === step ? 'bg-saffron-500 animate-pulse-soft' :
                  'bg-gray-200 dark:bg-gray-600'
                }`}
              />
              {i < 2 && <div className={`h-px w-4 ${i + 1 < step ? 'bg-ayush-400' : 'bg-gray-200 dark:bg-gray-600'}`} />}
            </div>
          ))}
        </div>

        {/* Label */}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{STAGE_LABELS[stage]}</p>

        {/* Skeleton lines */}
        <div className="space-y-2">
          <div className="skeleton h-3 w-full" />
          <div className="skeleton h-3 w-5/6" />
          <div className="skeleton h-3 w-4/6" />
        </div>
      </div>
    </div>
  );
}

