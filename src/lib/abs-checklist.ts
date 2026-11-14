// ============================================================
// IP-SAKTI Sahayak – ABS Compliance Checklist Generator
// Based on Biological Diversity Act 2002 (amended 2023)
// and Biological Diversity Rules 2004 (amended 2024)
// ============================================================

import type { ProductCategory, Jurisdiction } from '../types/index.js';

export interface ABSChecklistItem {
  id: string;
  category: 'mandatory' | 'conditional' | 'recommended';
  title: string;
  description: string;
  authority: string;
  reference: string;
  sourceUrl: string;
}

export function generateABSChecklist(
  productCategory: ProductCategory,
  jurisdiction: Jurisdiction,
): ABSChecklistItem[] {
  const items: ABSChecklistItem[] = [];
  
  // Core ABS items for India
  if (jurisdiction === 'india' || jurisdiction === 'both') {
    items.push({
      id: 'abs-1',
      category: 'mandatory',
      title: 'NBA Prior Approval / ABS Agreement',
      description: 'If your product uses biological resources native to India and is intended for commercial use, obtain prior approval from the National Biodiversity Authority (NBA) or relevant State Biodiversity Board (SBB) under Section 3 of the Biological Diversity Act, 2002.',
      authority: 'National Biodiversity Authority (NBA)',
      reference: 'Biological Diversity Act, 2002, Section 3; BD (Amendment) Act 2023',
      sourceUrl: 'https://nbaindia.org',
    });
    
    items.push({
      id: 'abs-2',
      category: 'mandatory',
      title: 'Benefit Sharing with Local Communities',
      description: 'Ensure equitable benefit sharing with local communities or individuals who contributed traditional knowledge about the biological resource. Document benefit-sharing arrangements per the 2024 Rules.',
      authority: 'National Biodiversity Authority (NBA)',
      reference: 'Biological Diversity Act, 2002, Section 21; BD Rules 2004 (amended 2024)',
      sourceUrl: 'https://nbaindia.org/content/25/19/1/biodiversity-rules.html',
    });
    
    items.push({
      id: 'abs-3',
      category: 'conditional',
      title: 'TKDL Prior Art Search',
      description: 'Conduct a TKDL (Traditional Knowledge Digital Library) prior art search before filing a patent. Submit TKDL search results with patent application to demonstrate awareness of traditional knowledge.',
      authority: 'CSIR-TKDL Unit / IP India',
      reference: 'Patents Act 1970, Section 3(p); TKDL Access Agreement',
      sourceUrl: 'https://tkdl.res.in',
    });
    
    if (productCategory === 'classical' || productCategory === 'new-non-classical') {
      items.push({
        id: 'abs-4',
        category: 'mandatory',
        title: 'Register as Researcher/Commercial User with SBB',
        description: 'Indian nationals accessing biological resources for commercial purposes (including Ayurvedic product development) must give prior intimation to the State Biodiversity Board under Section 7 of the BD Act.',
        authority: 'State Biodiversity Board (SBB)',
        reference: 'Biological Diversity Act, 2002, Section 7',
        sourceUrl: 'https://nbaindia.org/content/4/2/1/state-biodiversity-boards.html',
      });
    }
    
    if (productCategory === 'phytopharmaceutical') {
      items.push({
        id: 'abs-5',
        category: 'mandatory',
        title: 'Phytopharmaceutical ABS Documentation',
        description: 'Phytopharmaceuticals derived from Indian biological resources require NBA approval before commercial use. The Material Transfer Agreement (MTA) must specify benefit-sharing terms.',
        authority: 'National Biodiversity Authority (NBA)',
        reference: 'BD Act 2002, Section 3; D&C Act Schedule Y-A',
        sourceUrl: 'https://nbaindia.org',
      });
    }
  }
  
  // International ABS items
  if (jurisdiction === 'international' || jurisdiction === 'both') {
    items.push({
      id: 'abs-6',
      category: 'mandatory',
      title: 'Nagoya Protocol Compliance',
      description: 'If exporting biological resources or traditional knowledge to Nagoya Protocol signatory countries, comply with Prior Informed Consent (PIC) and Mutually Agreed Terms (MAT) requirements. Obtain IRCC (Internationally Recognized Certificate of Compliance).',
      authority: 'ABS Clearing-House (ABSCH)',
      reference: 'Nagoya Protocol on ABS, 2010, Article 6 & 7',
      sourceUrl: 'https://absch.cbd.int',
    });
    
    items.push({
      id: 'abs-7',
      category: 'recommended',
      title: 'WIPO GRATK Treaty – Disclosure Requirement',
      description: 'Under the newly adopted WIPO Treaty on Intellectual Property, Genetic Resources and Associated Traditional Knowledge (2024), patent applications involving genetic resources or traditional knowledge may require disclosure of origin. Check the treaty status in the filing jurisdiction.',
      authority: 'WIPO / National Patent Offices',
      reference: 'WIPO GRATK Treaty 2024, Article 3',
      sourceUrl: 'https://www.wipo.int/gratk/en/',
    });
    
    items.push({
      id: 'abs-8',
      category: 'recommended',
      title: 'CBD Article 8(j) Compliance',
      description: 'Ensure traditional knowledge holders have provided Free, Prior and Informed Consent (FPIC) for use of their knowledge in product development.',
      authority: 'CBD Secretariat',
      reference: 'Convention on Biological Diversity, 1992, Article 8(j)',
      sourceUrl: 'https://www.cbd.int/abs/',
    });
  }
  
  items.push({
    id: 'abs-9',
    category: 'recommended',
    title: 'Document Provenance of Traditional Knowledge',
    description: 'Maintain detailed records of the traditional knowledge used, its sources (community, text, practitioner), and how it was accessed. This documentation is essential for ABS compliance and defending against misappropriation claims.',
    authority: 'Internal / Legal Counsel',
    reference: 'Best Practice Guidance; BD Act 2002',
    sourceUrl: 'https://nbaindia.org/content/36/27/1/abs-guidelines.html',
  });
  
  return items;
}

export function generateTKDLPointers(query: string): string[] {
  const lowerQuery = query.toLowerCase();
  const pointers: string[] = [];
  
  pointers.push('Search TKDL for prior art: https://tkdl.res.in (access via IP India / CSIR agreement)');
  
  if (lowerQuery.includes('patent') || lowerQuery.includes('novel')) {
    pointers.push('TKDL covers 3,00,000+ formulations from Ayurveda, Unani, Siddha, and Yoga. Any formulation found in TKDL classifies as prior art under Section 3(p) of the Patents Act.');
  }
  
  if (lowerQuery.includes('plant') || lowerQuery.includes('herb') || lowerQuery.includes('botanical')) {
    pointers.push('Cross-reference with TKDL Ayurvedic pharmacopoeia entries for the specific plant/herb in question.');
    pointers.push('Consult Ayurvedic Pharmacopoeia of India (API) vols. I–XI at: https://ayush.gov.in/ayurvedic-pharmacopoeia-of-india');
  }
  
  if (lowerQuery.includes('formulation') || lowerQuery.includes('composition')) {
    pointers.push('TKDL Access Agreement (for patent offices): https://tkdl.res.in/TKDL_Access_Agreement.aspx');
  }
  
  return pointers;
}

