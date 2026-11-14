// ============================================================
// IP-SAKTI Sahayak – Session Dossier Export Component
// Exports the entire Q&A docket as a formal Ministry of Ayush brief
// ============================================================

import { Download } from 'lucide-react';
import type { ChatMessage, ClassificationState, Jurisdiction } from '../types';
import { PRODUCT_CATEGORY_LABELS, IP_TYPE_LABELS } from '../types';

interface Props {
  messages: ChatMessage[];
  classificationState: ClassificationState;
  jurisdiction: Jurisdiction;
}

export function ExportButton({ messages, classificationState, jurisdiction }: Props) {
  const handleExport = () => {
    if (messages.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const now = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const qas = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .reduce((acc, m, idx, arr) => {
        if (m.role === 'user') {
          const next = arr[idx + 1];
          acc.push({
            q: m.content,
            time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '',
            ans: next && next.role === 'assistant' ? next.content : 'Pending Analysis...',
            citations: next?.citations || [],
            confidence: next?.confidence || 'N/A',
            score: next?.confidenceScore,
            abs: next?.absChecklist || [],
          });
        }
        return acc;
      }, [] as Array<{ q: string; time: string; ans: string; citations: any[]; confidence: string; score?: number; abs: string[] }>);

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>IP-SAKTI Sahayak — Statutory Legal Dossier</title>
<style>
  @page { margin: 20mm; size: A4; }
  body { font-family: "Georgia", "Times New Roman", serif; color: #1e293b; line-height: 1.5; font-size: 11pt; }
  .header { border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }
  .title { font-size: 18pt; font-weight: bold; margin: 0; color: #064e3b; text-transform: uppercase; letter-spacing: 0.5px; }
  .subtitle { font-size: 10pt; color: #475569; margin-top: 4px; font-sans: sans-serif; }
  .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9.5pt; font-family: sans-serif; }
  .meta-table td, .meta-table th { border: 1px solid #cbd5e1; padding: 6px 10px; }
  .meta-table th { background: #f8fafc; text-align: left; font-weight: bold; width: 25%; }
  .qa-block { margin-bottom: 28px; page-break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; }
  .q-title { font-family: sans-serif; font-size: 10.5pt; font-weight: bold; color: #0f172a; margin-bottom: 8px; }
  .q-text { background: #f1f5f9; padding: 10px 12px; border-left: 4px solid #064e3b; margin-bottom: 14px; font-style: italic; }
  .ans-title { font-family: sans-serif; font-size: 10.5pt; font-weight: bold; color: #064e3b; margin-bottom: 6px; }
  .ans-body { font-size: 10.5pt; white-space: pre-wrap; margin-bottom: 12px; }
  .citations { background: #fafafa; border: 1px dashed #cbd5e1; padding: 8px 12px; border-radius: 4px; font-size: 9pt; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 8.5pt; background: #e0f2fe; color: #0369a1; }
  .footer { margin-top: 36px; border-top: 1px solid #cbd5e1; padding-top: 12px; font-size: 8.5pt; color: #64748b; text-align: center; font-sans: sans-serif; }
</style>
</head>
<body>
  <div class="header">
    <div class="title">IP-SAKTI Sahayak — Statutory Advisory Dossier</div>
    <div class="subtitle">Autonomous Intellectual Property & Regulatory Legal Intelligence · Ministry of Ayush / AIIA (SIH26045)</div>
    <div class="subtitle">Case Record Date: ${now} · Reference ID: AYUSH-DOCKET-${Math.random().toString(36).slice(2, 8).toUpperCase()}</div>
  </div>

  <table class="meta-table">
    <tr>
      <th>Product Classification</th>
      <td>${PRODUCT_CATEGORY_LABELS[classificationState.productCategory]}</td>
      <th>Target IP Domain</th>
      <td>${IP_TYPE_LABELS[classificationState.ipType]}</td>
    </tr>
    <tr>
      <th>Governing Jurisdiction</th>
      <td>${jurisdiction === 'india' ? 'Republic of India' : jurisdiction === 'international' ? 'International Multilateral' : 'Cross-Border Comparative'}</td>
      <th>ABS Mandate Posture</th>
      <td>${classificationState.jurisdiction === 'international' ? 'Mandatory NBA Form I Prior Approval' : 'State Biodiversity Board Section 7 Intimation'}</td>
    </tr>
  </table>

  ${qas
    .map(
      (item, i) => `
    <div class="qa-block">
      <div class="q-title">Inquiry Docket Record #${i + 1} (${item.time})</div>
      <div class="q-text">"${item.q}"</div>

      <div class="ans-title">Statutory Advisory Determination [Confidence: <span class="badge">${item.confidence}${item.score ? ` — ${Math.round(item.score * 100)}%` : ''}</span>]</div>
      <div class="ans-body">${item.ans}</div>

      ${
        item.citations.length > 0
          ? `
        <div class="citations">
          <strong>Primary Statutory Authorities Cited (${item.citations.length}):</strong><br/>
          ${item.citations.map((c: any) => `• <strong>${c.title}</strong> — ${c.act_or_treaty} (${c.section_or_article})`).join('<br/>')}
        </div>
      `
          : ''
      }
    </div>
  `,
    )
    .join('')}

  <div class="footer">
    ⚖️ <strong>Statutory Disclaimer:</strong> This document is generated for academic and informational research under SIH26045. It reflects retrieved statutory provisions and deterministic verifier analysis. It does not constitute formal legal counsel.
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      className="btn-secondary h-12 px-3 flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-ayush-800 dark:hover:text-emerald-400"
      title="Export Legal Brief as Print / PDF"
    >
      <Download size={15} />
      <span className="hidden sm:inline font-semibold">Dossier PDF</span>
    </button>
  );
}
