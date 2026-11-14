// ============================================================
// IP-SAKTI Sahayak – src/lib/crossRef.ts
// Cross-reference lookup: maps statutory sections to related
// provisions and international analogs.
// ============================================================

export interface CrossRef {
  relatedSections: string[];
  internationalAnalog?: string;
  explanation: string;
}

const CROSS_REFS: Array<{ pattern: string; ref: CrossRef }> = [
  {
    pattern: '3(p)',
    ref: {
      relatedSections: ['Section 2(1)(j) – Definition of Invention', 'Section 25 – Opposition grounds', 'Section 64 – Revocation'],
      internationalAnalog: 'TRIPS Article 27.3(b)',
      explanation: "Section 3(p) implements India's TRIPS Art. 27.3(b) flexibility to exclude traditional knowledge from patentability.",
    },
  },
  {
    pattern: 'section 7',
    ref: {
      relatedSections: ['Section 3 – NBA Approval', 'Section 4 – ABS Agreements', 'Section 6 – Foreign Access'],
      internationalAnalog: 'Nagoya Protocol Article 6 (ABS Prior Informed Consent)',
      explanation: 'Section 7 of the BD Act gives domestic effect to the Nagoya Protocol prior informed consent obligation for State-level utilization.',
    },
  },
  {
    pattern: 'article 27',
    ref: {
      relatedSections: ['Article 28 – Patent Rights', 'Article 65 – Transitional Arrangements', 'Article 7 – Objectives'],
      internationalAnalog: 'Indian Patents Act Sections 3(j) and 3(p)',
      explanation: 'TRIPS Article 27.3(b) allows WTO members to exclude biological inventions — India implemented this via Sections 3(j) and 3(p) of the Patents Act.',
    },
  },
  {
    pattern: 'article 6',
    ref: {
      relatedSections: ['Article 7 – Benefit Sharing', 'Article 15 – Monitoring', 'Article 5 – Fair & Equitable Benefit Sharing'],
      internationalAnalog: 'Indian BD Act Section 3 (NBA Prior Approval)',
      explanation: 'Nagoya Protocol Article 6 PIC requirement is domesticated by the NBA prior approval mandate under Section 3 BD Act.',
    },
  },
  {
    pattern: 'gratk',
    ref: {
      relatedSections: ['Nagoya Protocol Article 6', 'TRIPS Article 27', 'CBD Article 15'],
      internationalAnalog: 'Indian BD Act + Patents Act Section 3(p)',
      explanation: 'WIPO GRATK Treaty 2024 creates a mandatory disclosure obligation for traditional knowledge origins in patent applications worldwide.',
    },
  },
];

export function getCrossRef(sectionOrArticle: string): CrossRef | null {
  const lower = sectionOrArticle.toLowerCase();
  for (const { pattern, ref } of CROSS_REFS) {
    if (lower.includes(pattern.toLowerCase())) return ref;
  }
  return null;
}

