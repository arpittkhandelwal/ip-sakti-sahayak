// ============================================================
// IP-SAKTI Sahayak – src/lib/reformulation.ts
// Rule-based query reformulation suggestions (no API call)
// ============================================================

import type { ClassificationState, IPType } from '../types/index.js';

export interface SuggestedQuery {
  label: string;
  query: string;
  icon: string;
}

const SUGGESTIONS: Partial<Record<IPType | 'general', SuggestedQuery[]>> = {
  patent: [
    { icon: '🏷️', label: 'GI Alternative', query: 'What are the Geographical Indication registration requirements for regional Ayurvedic preparations as an alternative to patent protection?' },
    { icon: '🌿', label: 'ABS Obligations', query: 'What Access and Benefit Sharing obligations under the BD Act 2023 apply to Ayurvedic herbal formulations before commercialization?' },
    { icon: '🌍', label: 'TRIPS Art. 27.3(b)', query: 'How does TRIPS Article 27.3(b) affect patent rights for Ayurvedic plant-based inventions in international jurisdictions?' },
  ],
  gi: [
    { icon: '™️', label: 'Trademark Strategy', query: 'How can an Ayurvedic brand be protected through trademark registration under Trade Marks Act 1999 alongside GI status?' },
    { icon: '🔬', label: 'Patent Landscape', query: 'What process or extraction patents are available for Ayurvedic preparations that have GI status?' },
    { icon: '🌐', label: 'Madrid Protocol', query: 'How can an Ayurvedic GI-tagged product obtain international trademark protection through the Madrid Protocol?' },
  ],
  trademark: [
    { icon: '🏭', label: 'Process Patent', query: 'What novel manufacturing processes for Ayurvedic preparations are patent-eligible under the Patents Act 1970?' },
    { icon: '📍', label: 'GI Tag Eligibility', query: 'What criteria must an Ayurvedic product meet to qualify for Geographical Indication registration?' },
    { icon: '🎨', label: 'Design Protection', query: 'How can distinctive packaging and trade dress of Ayurvedic products be protected under the Designs Act 2000?' },
  ],
  biodiversity: [
    { icon: '⚗️', label: 'Patent Bar § 3(p)', query: 'Does Section 3(p) of the Patents Act prevent patent protection for my Ayurvedic formulation using biodiversity resources?' },
    { icon: '🌐', label: 'Nagoya Protocol PIC/MAT', query: 'What Prior Informed Consent and Mutually Agreed Terms are required under the Nagoya Protocol for international commercialization?' },
    { icon: '🏛️', label: 'SBB vs NBA Route', query: 'Should my AYUSH company file with the State Biodiversity Board or seek National Biodiversity Authority approval under the 2023 Amendment?' },
  ],
  'drugs-regulatory': [
    { icon: '™️', label: 'Brand Trademark', query: 'How should an Ayurvedic pharmaceutical company register product brand names and logos under the Trade Marks Act 1999?' },
    { icon: '📍', label: 'GI If Regional', query: 'If my Ayurvedic drug formula is region-specific, can it qualify for Geographical Indication protection?' },
    { icon: '🌿', label: 'ABS for Herbal Source', query: 'What ABS compliance steps are required when sourcing biological materials from India for licensed AYUSH drug manufacturing?' },
  ],
  'cbd-nagoya': [
    { icon: '🏛️', label: 'NBA Approval Process', query: 'What is the step-by-step process to obtain National Biodiversity Authority approval for research involving Indian bio-resources?' },
    { icon: '⚗️', label: 'Patent Disclosure Obligation', query: 'Does the WIPO GRATK Treaty 2024 require disclosure of ABS compliance in patent applications for Ayurvedic inventions?' },
    { icon: '📋', label: 'ABS Compliance Checklist', query: 'What is the complete ABS compliance checklist for an Indian AYUSH company exporting herbal products internationally?' },
  ],
  'wipo-gratk': [
    { icon: '⚗️', label: 'Domestic Patent Implications', query: 'How does the WIPO GRATK Treaty 2024 affect patent examination for Ayurvedic formulations at the Indian Patent Office?' },
    { icon: '🛡️', label: 'Defensive Publication', query: 'How can Ayurvedic companies use TKDL defensive publication to prevent misappropriation of traditional formulations?' },
    { icon: '🌿', label: 'ABS Treaty Interplay', query: 'How do the WIPO GRATK Treaty 2024 disclosure requirements interact with the Nagoya Protocol ABS obligations?' },
  ],
  general: [
    { icon: '⚗️', label: 'Patent Landscape', query: 'What patent protections are available for novel Ayurvedic formulations that go beyond traditional knowledge under Section 3(p)?' },
    { icon: '🌿', label: 'ABS Compliance', query: 'What Access and Benefit Sharing compliance is required for AYUSH companies under the Biological Diversity Act 2023?' },
    { icon: '📍', label: 'GI Tag Eligibility', query: 'What criteria qualify a regional Ayurvedic preparation for Geographical Indication registration in India?' },
  ],
};

export function getReformulations(state: ClassificationState): SuggestedQuery[] {
  return SUGGESTIONS[state.ipType] ?? SUGGESTIONS['general'] ?? [];
}

