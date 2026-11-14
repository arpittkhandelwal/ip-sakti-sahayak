// ============================================================
// IP-SAKTI Sahayak – Classification State Machine
// LLM extracts structured JSON; at most 3 clarifying questions.
// ============================================================

import { chatCompletion } from './sarvam.js';
import type { ClassificationState, Jurisdiction, IPType, ProductCategory } from '../types/index.js';
import { MAX_CLARIFYING_QUESTIONS } from '../types/index.js';

export interface ClassificationInput {
  query: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  currentState: ClassificationState;
}

export interface ClassificationOutput {
  updatedState: ClassificationState;
  pendingQuestion?: string;
  needsClarification: boolean;
}

const CLASSIFICATION_SYSTEM = `You are an expert classifier for Ayurveda intellectual property queries for the IP-SAKTI Sahayak system.

Your task is to extract structured information from the user's query and classify:
1. Product Category (required)
2. Jurisdiction (required)  
3. IP Type (required)

Product Categories:
- "classical": Listed in First Schedule of Drugs & Cosmetics Act; classical formulations from Ayurvedic texts
- "patent-proprietary": Proprietary/patent medicines not in First Schedule
- "new-non-classical": New drugs under Ayurveda not in classical texts
- "phytopharmaceutical": Plant-derived drugs under Schedule Y-A of D&C Act
- "ayurveda-aahar": Ayurveda Aahar / nutraceuticals under FSSAI
- "cosmetic": Ayurvedic cosmetics under D&C Act
- "unknown": Cannot determine from available information

IP Types (map user intent to one of):
- "patent": Patents including Sec 3(p) exclusion for traditional knowledge
- "gi": Geographical Indications (e.g., Mysore Sandal, Darjeeling)
- "trademark": Trademarks, brand names
- "copyright": Copyright in formulation texts, clinical data
- "design": Industrial designs of packaging/apparatus
- "ppvfra": Plant Variety Protection under PPVFRA 2001
- "biodiversity": Biological Diversity Act, ABS, TKDL
- "drugs-regulatory": Drugs & Cosmetics Act, DMR(OA) Act, FSSAI compliance
- "trips": TRIPS Agreement, WTO
- "cbd-nagoya": CBD 1992, Nagoya Protocol 2010
- "wipo-gratk": WIPO Treaty on GRATK 2024
- "pct-madrid-hague-budapest": International filing systems
- "general": Cannot determine specific IP type

Jurisdictions: "india", "international", "both"

Respond ONLY with valid JSON in this format:
{
  "productCategory": "<category or unknown>",
  "jurisdiction": "<india|international|both>",
  "ipType": "<type or general>",
  "isClassified": <true if all three are confidently determined>,
  "confidence": "<high|medium|low>",
  "pendingQuestion": "<single clarifying question if needed, or null>",
  "reasoning": "<brief reasoning>"
}`;

export async function classifyQuery(
  input: ClassificationInput,
): Promise<ClassificationOutput> {
  const { query, conversationHistory, currentState } = input;
  
  // Build messages for classifier
  const messages = [
    { role: 'system' as const, content: CLASSIFICATION_SYSTEM },
    ...conversationHistory.slice(-6),
    {
      role: 'user' as const,
      content: `Current classification state: ${JSON.stringify({
        step: currentState.step,
        productCategory: currentState.productCategory,
        jurisdiction: currentState.jurisdiction,
        ipType: currentState.ipType,
      })}

User query: "${query}"

Extract the classification. If any field is "unknown" or "general" and we have fewer than ${MAX_CLARIFYING_QUESTIONS} clarifying questions asked so far (current count: ${currentState.clarifyingQuestions.length}), include a pendingQuestion to resolve the most important ambiguity.`,
    },
  ];
  
  let response = '';
  try {
    response = await chatCompletion(messages, {
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 512,
    });
  } catch (err) {
    console.warn('[classifier] Sarvam call failed, falling back to rule-based classification:', (err as Error).message);
    const lower = query.toLowerCase();
    let ipType: IPType = 'general';
    if (lower.includes('patent') || lower.includes('3(p)') || lower.includes('inven') || lower.includes('triphala')) ipType = 'patent';
    else if (lower.includes('biodiversity') || lower.includes('abs') || lower.includes('nba') || lower.includes('tkdl') || lower.includes('biological')) ipType = 'biodiversity';
    else if (lower.includes('gi') || lower.includes('geographical')) ipType = 'gi';
    else if (lower.includes('trademark') || lower.includes('brand')) ipType = 'trademark';
    else if (lower.includes('wipo') || lower.includes('gratk')) ipType = 'wipo-gratk';
    else if (lower.includes('nagoya') || lower.includes('cbd')) ipType = 'cbd-nagoya';
    else if (lower.includes('cosmetic') || lower.includes('drug') || lower.includes('aahar') || lower.includes('nutraceutical')) ipType = 'drugs-regulatory';

    let productCategory: ProductCategory = 'unknown';
    if (lower.includes('classical') || lower.includes('generic') || lower.includes('triphala') || lower.includes('first schedule')) productCategory = 'classical';
    else if (lower.includes('proprietary') || lower.includes('patent drug')) productCategory = 'patent-proprietary';
    else if (lower.includes('phytopharmaceutical')) productCategory = 'phytopharmaceutical';
    else if (lower.includes('aahar') || lower.includes('nutraceutical')) productCategory = 'ayurveda-aahar';
    else if (lower.includes('cosmetic')) productCategory = 'cosmetic';

    let jurisdiction: Jurisdiction = 'india';
    if (lower.includes('international') || lower.includes('wipo') || lower.includes('nagoya') || lower.includes('trips')) {
      jurisdiction = lower.includes('india') ? 'both' : 'international';
    }

    return {
      updatedState: {
        ...currentState,
        step: currentState.step + 1,
        productCategory: productCategory !== 'unknown' ? productCategory : currentState.productCategory,
        jurisdiction,
        ipType: ipType !== 'general' ? ipType : currentState.ipType,
        isClassified: true,
      },
      needsClarification: false,
    };
  }
  
  let parsed: {
    productCategory?: ProductCategory;
    jurisdiction?: Jurisdiction;
    ipType?: IPType;
    isClassified?: boolean;
    pendingQuestion?: string | null;
    reasoning?: string;
  };
  
  try {
    parsed = JSON.parse(response);
  } catch {
    parsed = {};
  }
  
  const updatedState: ClassificationState = {
    ...currentState,
    step: currentState.step + 1,
    productCategory: parsed.productCategory ?? currentState.productCategory,
    jurisdiction: parsed.jurisdiction ?? currentState.jurisdiction,
    ipType: parsed.ipType ?? currentState.ipType,
    isClassified: parsed.isClassified ?? false,
  };
  
  const canAskMore = currentState.clarifyingQuestions.length < MAX_CLARIFYING_QUESTIONS;
  const needsClarification =
    !updatedState.isClassified &&
    canAskMore &&
    !!parsed.pendingQuestion;
  
  if (needsClarification && parsed.pendingQuestion) {
    updatedState.clarifyingQuestions = [
      ...currentState.clarifyingQuestions,
      parsed.pendingQuestion,
    ];
  }
  
  return {
    updatedState,
    pendingQuestion: needsClarification ? (parsed.pendingQuestion ?? undefined) : undefined,
    needsClarification,
  };
}

export function getCategoryGuidance(category: ProductCategory): string {
  const guidance: Record<ProductCategory, string> = {
    classical: `**Classical/Generic Drugs** (First Schedule): These are formulations based on Ayurvedic texts and listed in the First Schedule of the Drugs & Cosmetics Act, 1940. Under Section 3(p) of the Patents Act, traditional knowledge-based inventions are non-patentable. However, GI protection, trademark protection for brand names, and copyright in proprietary annotations may be available.`,
    'patent-proprietary': `**Patent/Proprietary Drugs**: Not listed in classical texts or First Schedule. These are eligible for patent protection if they meet novelty, inventive step, and industrial applicability criteria. Section 3(p) must be carefully navigated to ensure the innovation is not based solely on traditional knowledge.`,
    'new-non-classical': `**New Non-Classical Drugs**: Requires approval under Schedule Y (or Y-A for phytopharmaceuticals) of the Drugs & Cosmetics Act. Full clinical trial data needed. Patent protection possible if truly novel. ABS compliance mandatory if using biological resources.`,
    phytopharmaceutical: `**Phytopharmaceuticals**: Regulated under Schedule Y-A of D&C Rules. Require Ayurvedic pharmacopoeial data + safety/efficacy study. Patent possible for novel extraction/formulation processes. PPVFRA protection available for novel plant varieties.`,
    'ayurveda-aahar': `**Ayurveda Aahar/Nutraceuticals**: Regulated by FSSAI under Food Safety and Standards (Health Supplements, Nutraceuticals...) Regulations 2022. Must comply with FSSAI Ayurveda Aahar category. Trademark protection for brand names; ABS compliance for plant ingredients.`,
    cosmetic: `**Ayurvedic Cosmetics**: Regulated under Chapter IV-A of D&C Act and Rules. Must comply with standards in Schedule Q. Trademark protection for brands; GI possible for region-specific preparations.`,
    unknown: `Please provide more details about your product to get specific guidance.`,
  };
  return guidance[category] ?? guidance.unknown;
}

