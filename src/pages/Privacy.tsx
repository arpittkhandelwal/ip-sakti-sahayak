// ============================================================
// IP-SAKTI Sahayak – DPDP Act 2023 Aligned Privacy Notice
// ============================================================

import { ShieldCheck, Lock, EyeOff, Server, FileText, ArrowLeft } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6 text-slate-800 dark:text-slate-100 animate-fade-in">
      <div className="institutional-card p-6 border-l-4 border-l-ayush-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-ayush-900 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-ayush-800 dark:text-emerald-400 mb-1">
              Data Protection &amp; Governance · DPDP Act, 2023
            </div>
            <h1 className="font-serif text-2xl font-bold text-slate-900 dark:text-white">
              Data Privacy &amp; Confidentiality Protocol
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Zero-PII storage architecture engineered for academic legal inquiry and regulatory confidentiality under the Digital Personal Data Protection Act, 2023.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="institutional-card p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold font-serif text-slate-900 dark:text-white text-sm">
            <EyeOff size={16} className="text-emerald-600" />
            <span>Zero PII Collection</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            IP-SAKTI Sahayak does not collect, store, or transmit personally identifiable information (PII). Inquiries are processed transiently in stateless Netlify Edge functions and are discarded immediately after response synthesis.
          </p>
        </div>

        <div className="institutional-card p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold font-serif text-slate-900 dark:text-white text-sm">
            <Server size={16} className="text-ayush-800 dark:text-emerald-400" />
            <span>Anonymized Audit Docket</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Audit logging is strictly maintained in non-persistent memory. Records contain only SHA-256 truncated hashes (first 16 hex characters), detected language, jurisdiction, confidence score, and timestamp. Raw inquiry text is never logged.
          </p>
        </div>

        <div className="institutional-card p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold font-serif text-slate-900 dark:text-white text-sm">
            <ShieldCheck size={16} className="text-amber-600" />
            <span>Statutory Verification Boundary</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Deterministic verifier ensures generated answers are strictly cross-referenced against the local statutory corpus. No prompt injections, external embeddings, or third-party web scrapers are permitted.
          </p>
        </div>

        <div className="institutional-card p-5 space-y-2">
          <div className="flex items-center gap-2 font-bold font-serif text-slate-900 dark:text-white text-sm">
            <FileText size={16} className="text-blue-600" />
            <span>DPDP Act 2023 Compliance</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            All operations comply with the provisions of the Digital Personal Data Protection Act, 2023 (Republic of India). Users retain complete data sovereignty with zero tracking cookies and client-side volatile memory.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
        <span>Formal Inquiries: <a href="mailto:privacy@aiia.res.in" className="text-ayush-800 dark:text-emerald-400 font-semibold hover:underline">privacy@aiia.res.in</a></span>
        <a href="/" className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 hover:text-ayush-800">
          <ArrowLeft size={13} /> Back to Legal Inquirer
        </a>
      </div>
    </div>
  );
}
