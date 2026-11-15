// ============================================================
// IP-SAKTI Sahayak – ABS Compliance Wizard
// Guided 6-step form for Access & Benefit Sharing compliance
// ============================================================

import { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Building2, Leaf, BookOpen,
  Banknote, Download, CheckCircle2, AlertTriangle, Info,
  ShieldCheck, ChevronRight,
} from 'lucide-react';

type EntityType = 'indian-company' | 'foreign-entity' | 'research' | 'individual' | null;
type BioOrigin = 'india-wild' | 'india-cultivated' | 'outside-india' | 'none' | null;
type TKAssociation = 'classical-text' | 'community-knowledge' | 'none' | null;
type CommercialPurpose = 'domestic' | 'export' | 'rd-only' | null;

interface WizardState {
  entityType: EntityType;
  bioOrigin: BioOrigin;
  tkAssociation: TKAssociation;
  commercialPurpose: CommercialPurpose;
}

type Route = 'nba-approval' | 'sbb-intimation' | 'no-filing' | null;

function computeRoute(state: WizardState): Route {
  if (state.bioOrigin === 'none') return 'no-filing';
  if (state.entityType === 'foreign-entity' || state.commercialPurpose === 'export' || state.bioOrigin === 'outside-india') {
    return 'nba-approval';
  }
  if (state.tkAssociation !== 'none' || state.commercialPurpose === 'domestic') {
    return 'sbb-intimation';
  }
  if (state.commercialPurpose === 'rd-only') return 'no-filing';
  return 'sbb-intimation';
}

const ROUTE_INFO = {
  'nba-approval': {
    title: 'NBA Form I Approval Required',
    badge: 'Mandatory — National Biodiversity Authority',
    color: 'rose',
    icon: AlertTriangle,
    authority: 'National Biodiversity Authority (NBA), Chennai',
    portal: 'https://nbaindia.org',
    timeline: '90–180 days',
    checklist: [
      'File Form I with NBA, Chennai before initiating research or commercial access.',
      'Submit a detailed research/commercial proposal including ABS terms.',
      'Negotiate and execute a Material Transfer Agreement (MTA) with benefit-sharing provisions.',
      'Obtain Prior Informed Consent (PIC) from local communities if community knowledge is involved.',
      'Deposit agreed benefit-sharing amount with NBA before export/commercialization.',
      'Report annual progress and benefit-sharing compliance to NBA.',
    ],
    law: 'Biological Diversity Act 2002, Section 3 (as amended 2023)',
    nagoya: 'Nagoya Protocol Article 6 — Prior Informed Consent',
  },
  'sbb-intimation': {
    title: 'SBB Section 7 Prior Intimation Required',
    badge: 'Mandatory — State Biodiversity Board',
    color: 'amber',
    icon: Info,
    authority: 'State Biodiversity Board (SBB) of relevant state',
    portal: 'https://nbaindia.org/content/32/27/1/state-biodiversity-board.html',
    timeline: '30–60 days',
    checklist: [
      'Give prior intimation to the State Biodiversity Board (SBB) of the relevant state before accessing biological resources.',
      'File intimation under Section 7 of the BD Act 2002 (as amended 2023).',
      'If traditional knowledge is associated, document its provenance and ensure benefit-sharing with knowledge holders.',
      'Obtain written acknowledgment from SBB before commencing commercial activities.',
      'Pay applicable Access and Benefit Sharing fees as prescribed under the 2024 ABS Rules.',
      'Maintain records of biological resource utilization for annual compliance reporting.',
    ],
    law: 'Biological Diversity Act 2002, Section 7 (as amended by BD Amendment Act 2023)',
    nagoya: 'Nagoya Protocol Article 15 — Monitoring Utilization',
  },
  'no-filing': {
    title: 'No ABS Filing Required',
    badge: 'Compliant — No Bio-Resource Access',
    color: 'emerald',
    icon: CheckCircle2,
    authority: 'Not Applicable',
    portal: 'https://nbaindia.org',
    timeline: 'Immediate',
    checklist: [
      'No ABS filing required as your activity does not involve access to Indian biological resources.',
      'Maintain documentation confirming no biological resource of Indian origin is used.',
      'If the situation changes (e.g., future use of bio-resources), re-assess ABS obligations immediately.',
      'Ensure product labeling complies with FSSAI / AYUSH standards as applicable.',
      'Consider voluntary benefit-sharing if any traditional community knowledge informed R&D.',
    ],
    law: 'Biological Diversity Act 2002 — Not applicable in this case',
    nagoya: 'Nagoya Protocol — Not triggered',
  },
};

const STEPS = [
  { number: 1, title: 'Entity Type', icon: Building2 },
  { number: 2, title: 'Bio-Resource Origin', icon: Leaf },
  { number: 3, title: 'Traditional Knowledge', icon: BookOpen },
  { number: 4, title: 'Commercial Purpose', icon: Banknote },
  { number: 5, title: 'ABS Route & Checklist', icon: ShieldCheck },
];

function RadioOption({
  value, selected, onChange, label, sublabel,
}: {
  value: string; selected: boolean; onChange: () => void; label: string; sublabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        selected
          ? 'border-ayush-700 bg-ayush-50 dark:bg-ayush-950/40 dark:border-ayush-600'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-ayush-700 dark:border-ayush-500' : 'border-slate-300 dark:border-slate-600'
        }`}>
          {selected && <div className="w-2.5 h-2.5 rounded-full bg-ayush-700 dark:bg-ayush-500" />}
        </div>
        <div>
          <div className={`font-semibold text-sm ${selected ? 'text-ayush-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
            {label}
          </div>
          {sublabel && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </button>
  );
}

export function ABSWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>({
    entityType: null,
    bioOrigin: null,
    tkAssociation: null,
    commercialPurpose: null,
  });

  const route = step === 5 ? computeRoute(state) : null;
  const routeInfo = route ? ROUTE_INFO[route] : null;

  const canNext = (): boolean => {
    if (step === 1) return state.entityType !== null;
    if (step === 2) return state.bioOrigin !== null;
    if (step === 3) return state.tkAssociation !== null;
    if (step === 4) return state.commercialPurpose !== null;
    return false;
  };

  const handlePrint = () => {
    if (!routeInfo) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>IP-SAKTI Sahayak — ABS Compliance Dossier</title>
<style>
  body { font-family: Georgia, serif; margin: 40px; color: #000; }
  h1 { font-size: 20px; border-bottom: 2px solid #000; padding-bottom: 8px; }
  h2 { font-size: 16px; margin-top: 24px; }
  .badge { display: inline-block; padding: 4px 10px; border: 1px solid #000; border-radius: 4px; font-size: 12px; font-family: monospace; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; font-size: 13px; line-height: 1.6; }
  .footer { margin-top: 40px; font-size: 11px; color: #666; border-top: 1px solid #ccc; padding-top: 12px; }
  table { border-collapse: collapse; width: 100%; margin-top: 16px; }
  td, th { border: 1px solid #ccc; padding: 8px 12px; font-size: 12px; }
  th { background: #f5f5f5; font-weight: bold; }
</style>
</head>
<body>
<h1>IP-SAKTI Sahayak — ABS Compliance Dossier</h1>
<p style="font-size:12px;color:#666;">Generated: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })} | AIIA / Ministry of Ayush</p>

<h2>Entity Profile</h2>
<table>
<tr><th>Entity Type</th><td>${state.entityType ?? 'N/A'}</td></tr>
<tr><th>Bio-Resource Origin</th><td>${state.bioOrigin ?? 'N/A'}</td></tr>
<tr><th>Traditional Knowledge</th><td>${state.tkAssociation ?? 'N/A'}</td></tr>
<tr><th>Commercial Purpose</th><td>${state.commercialPurpose ?? 'N/A'}</td></tr>
</table>

<h2>Computed ABS Route</h2>
<p><span class="badge">${routeInfo?.title}</span></p>
<p><strong>Governing Authority:</strong> ${routeInfo?.authority}</p>
<p><strong>Applicable Law:</strong> ${routeInfo?.law}</p>
<p><strong>International Framework:</strong> ${routeInfo?.nagoya}</p>
<p><strong>Estimated Timeline:</strong> ${routeInfo?.timeline}</p>

<h2>Compliance Checklist</h2>
<ul>
${(routeInfo?.checklist ?? []).map((item, i) => `<li>${i + 1}. ${item}</li>`).join('\n')}
</ul>

<div class="footer">
⚖️ This document is generated by IP-SAKTI Sahayak for informational purposes only. It does not constitute formal legal advice. 
Please consult a registered IP attorney and the official portal at ${routeInfo?.portal} for authoritative guidance.
</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="institutional-card p-6 border-l-4 border-l-emerald-700">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center text-amber-400 flex-shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-[11px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 mb-1">
              ABS Compliance Navigator · Biological Diversity Act 2023
            </div>
            <h1 className="font-serif text-xl font-bold text-slate-900 dark:text-white">
              Access &amp; Benefit Sharing Compliance Wizard
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Answer 4 guided questions to determine your ABS filing requirements under the BD Act 2002 (as amended 2023) and Nagoya Protocol.
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = step > s.number;
          const isActive = step === s.number;
          return (
            <div key={s.number} className="flex items-center gap-1 flex-shrink-0">
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isDone ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' :
                isActive ? 'bg-ayush-900 text-white shadow-sm' :
                'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {isDone ? <CheckCircle2 size={12} /> : <Icon size={12} />}
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.number}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="institutional-card p-6 space-y-4">
        {step === 1 && (
          <>
            <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 size={18} className="text-ayush-800 dark:text-emerald-400" />
              Step 1: What type of entity are you?
            </h2>
            <div className="space-y-3">
              <RadioOption value="indian-company" selected={state.entityType === 'indian-company'} onChange={() => setState(s => ({ ...s, entityType: 'indian-company' }))} label="Indian AYUSH Company / Manufacturer" sublabel="Registered in India, operating primarily in domestic market" />
              <RadioOption value="foreign-entity" selected={state.entityType === 'foreign-entity'} onChange={() => setState(s => ({ ...s, entityType: 'foreign-entity' }))} label="Foreign Entity / MNC" sublabel="Foreign-incorporated company or joint venture with majority foreign control" />
              <RadioOption value="research" selected={state.entityType === 'research'} onChange={() => setState(s => ({ ...s, entityType: 'research' }))} label="Research Institution / University" sublabel="Academic or government research body (Indian or foreign-funded)" />
              <RadioOption value="individual" selected={state.entityType === 'individual'} onChange={() => setState(s => ({ ...s, entityType: 'individual' }))} label="Individual Innovator / Startup" sublabel="Sole proprietor or early-stage startup with no foreign funding" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Leaf size={18} className="text-ayush-800 dark:text-emerald-400" />
              Step 2: Where do your biological resources originate?
            </h2>
            <div className="space-y-3">
              <RadioOption value="india-wild" selected={state.bioOrigin === 'india-wild'} onChange={() => setState(s => ({ ...s, bioOrigin: 'india-wild' }))} label="From India — Wild / Forest / Natural Habitat" sublabel="Plants, fungi, microorganisms collected from Indian natural ecosystems" />
              <RadioOption value="india-cultivated" selected={state.bioOrigin === 'india-cultivated'} onChange={() => setState(s => ({ ...s, bioOrigin: 'india-cultivated' }))} label="From India — Cultivated / Agricultural" sublabel="Commercially cultivated herbs, crops grown in farms across India" />
              <RadioOption value="outside-india" selected={state.bioOrigin === 'outside-india'} onChange={() => setState(s => ({ ...s, bioOrigin: 'outside-india' }))} label="From Outside India / Imported" sublabel="Raw materials sourced from other countries under bilateral ABS agreements" />
              <RadioOption value="none" selected={state.bioOrigin === 'none'} onChange={() => setState(s => ({ ...s, bioOrigin: 'none' }))} label="No Biological Resources Used" sublabel="Synthetic compounds, minerals, or non-biological active ingredients only" />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-ayush-800 dark:text-emerald-400" />
              Step 3: Is traditional knowledge (TK) associated?
            </h2>
            <div className="space-y-3">
              <RadioOption value="classical-text" selected={state.tkAssociation === 'classical-text'} onChange={() => setState(s => ({ ...s, tkAssociation: 'classical-text' }))} label="Yes — Documented in Classical Texts" sublabel="Charaka Samhita, Sushruta Samhita, Ashtanga Hridayam, Bhavaprakasha, API, etc." />
              <RadioOption value="community-knowledge" selected={state.tkAssociation === 'community-knowledge'} onChange={() => setState(s => ({ ...s, tkAssociation: 'community-knowledge' }))} label="Yes — Community / Oral Traditional Knowledge" sublabel="Knowledge held by specific tribal, pastoral, or local communities" />
              <RadioOption value="none" selected={state.tkAssociation === 'none'} onChange={() => setState(s => ({ ...s, tkAssociation: 'none' }))} label="No Traditional Knowledge Involved" sublabel="Novel formulation or process not derived from documented traditional practices" />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="font-serif font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Banknote size={18} className="text-ayush-800 dark:text-emerald-400" />
              Step 4: What is the commercial purpose?
            </h2>
            <div className="space-y-3">
              <RadioOption value="domestic" selected={state.commercialPurpose === 'domestic'} onChange={() => setState(s => ({ ...s, commercialPurpose: 'domestic' }))} label="Commercial — Indian Domestic Market Only" sublabel="Sale and distribution within India, no export planned" />
              <RadioOption value="export" selected={state.commercialPurpose === 'export'} onChange={() => setState(s => ({ ...s, commercialPurpose: 'export' }))} label="Commercial — Export or International" sublabel="Products will be exported, licensed internationally, or used by foreign entities" />
              <RadioOption value="rd-only" selected={state.commercialPurpose === 'rd-only'} onChange={() => setState(s => ({ ...s, commercialPurpose: 'rd-only' }))} label="Research &amp; Development Only (Non-commercial)" sublabel="Academic research, clinical trials, or feasibility studies with no current commercial intent" />
            </div>
          </>
        )}

        {step === 5 && routeInfo && route && (
          <div className="space-y-5">
            {/* Route Badge */}
            <div className={`p-4 rounded-xl border-2 ${
              route === 'nba-approval' ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30' :
              route === 'sbb-intimation' ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' :
              'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
            }`}>
              <div className="flex items-start gap-3">
                {(() => { const Icon = routeInfo.icon; return <Icon size={24} className={route === 'nba-approval' ? 'text-rose-600' : route === 'sbb-intimation' ? 'text-amber-600' : 'text-emerald-600'} />; })()}
                <div>
                  <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white">{routeInfo.title}</h3>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5">{routeInfo.badge}</p>
                </div>
              </div>
            </div>

            {/* Key Info */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Authority', value: routeInfo.authority },
                { label: 'Timeline', value: routeInfo.timeline },
                { label: 'Governing Law', value: routeInfo.law },
                { label: 'Int\'l Framework', value: routeInfo.nagoya },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{label}</div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium leading-snug">{value}</div>
                </div>
              ))}
            </div>

            {/* Compliance Checklist */}
            <div>
              <h4 className="font-serif font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Compliance Checklist ({routeInfo.checklist.length} steps)
              </h4>
              <div className="space-y-2">
                {routeInfo.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <a href={routeInfo.portal} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2 text-xs">
                <Building2 size={14} /> Official Portal
              </a>
              <button onClick={handlePrint} className="btn-primary flex items-center gap-2 text-xs">
                <Download size={14} /> Download Dossier (PDF)
              </button>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              ⚖️ This wizard provides informational guidance only, not formal legal advice. Consult a qualified IP or regulatory attorney before filing.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="btn-secondary flex items-center gap-2 disabled:opacity-40"
        >
          <ArrowLeft size={15} /> Back
        </button>
        {step < 4 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            Continue <ArrowRight size={15} />
          </button>
        ) : step === 4 ? (
          <button
            onClick={() => setStep(5)}
            disabled={!canNext()}
            className="btn-primary flex items-center gap-2 disabled:opacity-40"
          >
            <ShieldCheck size={15} /> View ABS Route
          </button>
        ) : (
          <button onClick={() => { setStep(1); setState({ entityType: null, bioOrigin: null, tkAssociation: null, commercialPurpose: null }); }} className="btn-secondary flex items-center gap-2">
            Start Over
          </button>
        )}
      </div>
    </div>
  );
}

