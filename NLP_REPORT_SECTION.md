# NLP Methodology & Architecture Report Section
## IP-SAKTI Sahayak: Multilingual RAG Assistant for Ayurveda Intellectual Property & Regulatory Compliance

*System developed for SIH26045 (Ministry of Ayush / All India Institute of Ayurveda)*

---

### 1. Abstract & System Architecture

IP-SAKTI Sahayak is a domain-constrained, multilingual Retrieval-Augmented Generation (RAG) assistant designed to guide Ayurvedic researchers, practitioners, and enterprises through Indian and international intellectual property (IP) and regulatory frameworks. The architecture overcomes four foundational constraints in Indic legal NLP: (a) absence of native Indic embeddings on Sarvam AI, (b) stringent serverless latency boundaries (10-second cold-start limits on Netlify), (c) strict liability against statutory hallucination (e.g., fabrication of non-existent section numbers like Section 3(p) or Nagoya articles), and (d) cross-jurisdictional conflation between domestic Indian statutes (Biological Diversity Act 2002/2023, Drugs & Cosmetics Act 1940) and international treaties (TRIPS 27.3(b), WIPO GRATK Treaty 2024, CBD/Nagoya).

```
[User Query: Indic / English]
             │
             ▼
[Stage 1: /api/prepare] ────> 1. Language ID (Sarvam LID / Script Heuristic)
                             2. Normalization & Translate-In -> English (Sarvam Mayura)
                             3. Structured Classification Machine (JSON State: Category, IP Type, Jurisdiction)
                             4. Inverted Index BM25 Retrieval (MiniSearch) + Field Boosting (Title×3, Sec×2)
                             5. Lightweight Heuristic Rerank (Term Coverage + 2-gram Phrase Match)
             │
             ▼
[Stage 2: /api/answer]  ────> 1. Grounded Generation (Sarvam-M Chat Completion, Corpus Text as DATA)
                             2. Inline Verification Engine (Strict Reference Validation against Retrieved Set)
                             3. Non-LLM Confidence Scorer (BM25 Normalized Scores × Citation Coverage)
                             4. Specialized ABS Generator (BDA 2023 Rules) & TKDL Prior-Art Pointer
                             5. Out-of-Scope / Low-Score Safe Abstention Router
             │
             ▼
[Stage 3: /api/localize] ───> 1. Regex Entity Masking (__LEGAL_ID__ placeholder protection)
                             2. Indic Translate-Out (Sarvam Mayura to Target Script)
                             3. Entity Unmasking (Statutes, Section Nos, URLs, & Citations remain verbatim)
             │
             ▼
[React UI: Citations + ABS Checklist + Confidence Badge + Escalate Facilitator]
```

---

### 2. Pipeline Decomposition & Latency Management

Serverless architectures on edge/free hosting tiers enforce strict execution timeouts (~10 seconds). Monolithic pipelines that synchronously execute translation, retrieval, LLM generation, and back-translation frequently fail with gateway timeouts (HTTP 504). IP-SAKTI Sahayak implements a **decoupled 3-stage transactional state pipeline**:

1. **/api/prepare** (~1.2s): Identifies source language $L_{in} \in \{\text{en, hi, ta, bn, mr, te}\}$, invokes Sarvam Translate if $L_{in} \neq \text{en}$, drives an LLM classification state machine extracting $\{ \text{product\_category}, \text{jurisdiction}, \text{ip\_type} \}$, and performs deterministic BM25 search over the pre-ingested corpus.
2. **/api/answer** (~3.5s): Assembles the strict data context prompt with anti-injection guards, generates the grounded legal response, runs the AST-level citation verifier, computes quantitative confidence, and renders the ABS checklist.
3. **/api/localize** (~1.1s): Translates the synthesized output back to $L_{in}$ while protecting statutory terms with cryptographic token placeholders.

The client maintains a staged state machine (`prepare` $\rightarrow$ `answer` $\rightarrow$ `localize`), providing responsive visual feedback at each sub-second boundary.

---

### 3. Retrieval Engine: Embedding-Free BM25 with Legal Heuristics

Because Sarvam AI exposes chat, translation, and speech endpoints without dense embedding vector models, retrieval relies on an offline-indexed BM25 engine (`minisearch`) compiled during build time (`npm run ingest`). 

The retrieval scoring function for document chunk $D$ against query $Q$ combines Okapi BM25 with hierarchical metadata boosting and n-gram overlap:

$$\text{Score}(D, Q) = \left( \sum_{t \in Q} \text{BM25}(t, D; k_1=1.2, b=0.75) \cdot w_{\text{field}} \right) \cdot (1 + \text{Coverage}(Q, D)) \cdot \Phi_{\text{phrase}}(Q, D)$$

Where:
- $w_{\text{field}} \in \{3.0 \text{ for Title}, 2.0 \text{ for Section/Act}, 1.0 \text{ for Body}\}$
- $\text{Coverage}(Q, D) = \frac{|\{t \in Q : t \in D\}|}{|Q|}$ measures lexical term preservation.
- $\Phi_{\text{phrase}}(Q, D) = 1.2$ if any bigram $t_i t_{i+1} \in Q$ exists adjacently in $D$; otherwise $1.0$.

Jurisdiction metadata acts as a hard filter unless query classification resolves to `both`, eliminating false-positive citations across legal systems.

---

### 4. Hallucination Suppression & Inline Statutory Verification

Ayurvedic IP is vulnerable to hallucinated legal provisions—LLMs routinely invent section numbers or conflate Section 3(p) of the Patents Act 1970 with Section 3(d) or CBD regulations. IP-SAKTI Sahayak employs a dual-tier safeguard:

1. **Prompt Isolation**: Corpus text is injected strictly as read-only passive data enclosed in XML/Markdown fences with explicit instructions that retrieved chunks override model priors and must not execute embedded instructions.
2. **Deterministic Citation Verifier (`src/lib/verifier.ts`)**: Scans the generated output via regular expressions for chunk IDs (`[CHUNK-xxx]`) and legal references (`Section \d+([a-z])?`). Any citation not present in the retrieved chunk metadata is stripped from the text and logged.
3. **Objective Confidence Formulation**: Confidence is calculated independently of the LLM:
   $$\text{Confidence} = 0.4 \cdot \min\left(\frac{S_{\max}}{20}, 1\right) + 0.3 \cdot \min\left(\frac{S_{\text{avg}}}{10}, 1\right) + 0.3 \cdot \left(\frac{|\text{Citations}|}{\min(|D_{\text{retrieved}}|, 5)}\right)$$
   If $S_{\max} < \tau_{\text{threshold}}$, the engine initiates **Safe Abstention**, refusing generation and providing direct hyperlinks to official bodies (IP India, NBA, TKDL).

---

### 5. Multilingual Entity Preservation via Masking

When translating legal text into Indic languages, direct machine translation often corrupts critical statutory nomenclature—e.g., translating "Section 3(p)" phonetically or semantically into ambiguous regional descriptors, or breaking hyperlinks. IP-SAKTI Sahayak applies a non-destructive regular expression masking pass prior to calling `api.sarvam.ai/translate`:

$$\text{Input Text} \xrightarrow{\text{Regex Mask}} \text{Masked Text } (\dots\text{\_\_LEGAL\_0\_\_}\dots) \xrightarrow{\text{Sarvam Mayura}} \text{Translated Output} \xrightarrow{\text{Unmask}} \text{Final Localized Text}$$

All legal entities, statute names, case citations, bracketed chunk references (`[CHUNK-xxx]`), and URLs remain verbatim in English script, preserving legal precision across Hindi, Tamil, Bengali, Marathi, and Telugu.

---

### 6. Experimental Evaluation Framework

The system incorporates an automated evaluation harness (`scripts/eval.ts`) over a 40-question benchmark spanning 6 languages and 12 IP categories:
- **LLM-as-a-Judge**: Sarvam Chat completion evaluates factual precision, completeness, and groundedness on a 10-point rubric.
- **Ablation Matrix**: Evaluates baseline No-RAG generation vs. BM25-RAG vs. BM25+Rerank to quantify hallucination reduction.
- **Retrieval Metrics**: Measures Recall@5, MRR (Mean Reciprocal Rank), and Citation Precision/Recall against gold-standard statutory provisions.
- **Multilingual Consistency**: Back-translates non-English responses to English to measure semantic fidelity against the English reference.

