import { useAppStore } from '../store/appStore';
import { PRODUCT_CATEGORY_LABELS, IP_TYPE_LABELS } from '../types';

export function ClassifierSidebar() {
  const { classificationState, lastRetrievedChunks } = useAppStore();

  const { productCategory, jurisdiction, ipType, isClassified, clarifyingQuestions } = classificationState;

  return (
    <div className="p-4 space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Classification
        </h3>

        <div className="space-y-3">
          <InfoRow
            label="Product Category"
            value={PRODUCT_CATEGORY_LABELS[productCategory]}
            highlight={productCategory !== 'unknown'}
          />
          <InfoRow
            label="Jurisdiction"
            value={jurisdiction === 'india' ? '🇮🇳 India' : jurisdiction === 'international' ? '🌍 International' : '🌐 Both'}
            highlight
          />
          <InfoRow
            label="IP Type"
            value={IP_TYPE_LABELS[ipType]}
            highlight={ipType !== 'general'}
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Status:</span>
            <span className={`text-xs font-medium ${isClassified ? 'text-ayush-600 dark:text-ayush-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isClassified ? '✓ Classified' : '○ Pending'}
            </span>
          </div>
        </div>
      </div>

      {clarifyingQuestions.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Clarifications Asked
          </h3>
          <ul className="space-y-1.5">
            {clarifyingQuestions.map((q, i) => (
              <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex gap-1.5">
                <span className="text-saffron-500 font-bold flex-shrink-0">{i + 1}.</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lastRetrievedChunks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Retrieved Sources ({lastRetrievedChunks.length})
          </h3>
          <ul className="space-y-2">
            {lastRetrievedChunks.map((chunk) => (
              <li key={chunk.id} className="text-xs">
                <div className="font-medium text-gray-700 dark:text-gray-300 truncate" title={chunk.title}>
                  {chunk.title}
                </div>
                <div className="text-gray-400 dark:text-gray-500">
                  {chunk.ip_type} · {chunk.jurisdiction}
                </div>
                {chunk.score !== undefined && (
                  <div className="text-gray-400 dark:text-gray-500">
                    Score: {chunk.score.toFixed(2)}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Quick Links
        </h3>
        <ul className="space-y-1.5">
          {[
            { label: 'IP India', url: 'https://ipindia.gov.in' },
            { label: 'TKDL', url: 'https://tkdl.res.in' },
            { label: 'NBA India', url: 'https://nbaindia.org' },
            { label: 'Ministry of Ayush', url: 'https://ayush.gov.in' },
            { label: 'WIPO GRATK', url: 'https://www.wipo.int/gratk/en/' },
            { label: 'CBD ABS Clearing-House', url: 'https://absch.cbd.int' },
          ].map(({ label, url }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-saffron-600 dark:text-saffron-400 hover:underline"
              >
                → {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-400 dark:text-gray-500">{label}</div>
      <div className={`text-xs font-medium mt-0.5 ${highlight ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 italic'}`}>
        {value}
      </div>
    </div>
  );
}

