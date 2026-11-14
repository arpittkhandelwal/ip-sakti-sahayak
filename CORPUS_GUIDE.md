# Corpus Guide – IP-SAKTI Sahayak

## Overview

The `/corpus` directory contains the legal knowledge base for IP-SAKTI Sahayak. Each file is a Markdown document with YAML frontmatter containing metadata.

## Directory Structure

```
corpus/
├── india/
│   ├── patents/           # Patents Act 1970, Sec 3(p), process claims
│   ├── gi/                # Geographical Indications Act 1999
│   ├── trademarks/        # Trade Marks Act 1999
│   ├── designs/           # Designs Act 2000
│   ├── copyright/         # Copyright Act 1957
│   ├── ppvfra/            # Protection of Plant Varieties and Farmers' Rights Act 2001
│   ├── biodiversity/      # Biological Diversity Act 2002 + 2023 Amendment + TKDL
│   └── drugs-regulatory/  # D&C Act, DMR(OA) Act, FSSAI Ayurveda Aahar
└── international/
    ├── trips/             # TRIPS Agreement
    ├── cbd-nagoya/        # CBD 1992 + Nagoya Protocol 2010
    ├── wipo-gratk/        # WIPO GRATK Treaty 2024
    └── pct-madrid-hague-budapest/  # PCT, Madrid, Hague, Budapest systems
```

## Frontmatter Schema

```yaml
---
title: "Human-readable title of this chunk"
jurisdiction: india | international | both
ip_type: patent | gi | trademark | copyright | design | ppvfra | biodiversity | drugs-regulatory | trips | cbd-nagoya | wipo-gratk | pct-madrid-hague-budapest | general
act_or_treaty: "Full name of the Act/Treaty"
section_or_article: "Section X" | "Article Y" | "Rule Z"
source_url: "https://official-source.gov.in/..."
last_verified: "YYYY-MM-DD"
sample: false   # true only for sample files
---
```

## Content Guidelines

1. **Source only from official primary sources** – no secondary sources, commentary, or paraphrased content without attribution
2. **Keep chunks under 2000 characters** – longer sections will be truncated by the ingestor
3. **Use headings (## or ###)** to split long documents into logical sections
4. **Quote statutory text exactly** where possible, with the source URL
5. **Mark sample files** with `sample: true` in frontmatter

## Official Sources (Where to Fetch Real Legal Text)

| Source | URL | What to Extract |
|--------|-----|-----------------|
| IndiaCode | https://indiacode.nic.in | Patents Act 1970, D&C Act 1940, BD Act 2002, GI Act 1999, TM Act 1999, Designs Act 2000, Copyright Act 1957, PPVFRA 2001 |
| IP India | https://ipindia.gov.in | Patent/GI/TM/Design rules and forms |
| TKDL | https://tkdl.res.in | TKDL overview, access agreements |
| NBA India | https://nbaindia.org | Biodiversity Rules, ABS guidelines |
| WIPO | https://www.wipo.int/edocs/lexdocs/treaties/ | TRIPS, PCT, Madrid, Hague, Budapest |
| CBD | https://www.cbd.int/abs/ | CBD text, Nagoya Protocol |
| WIPO GRATK | https://www.wipo.int/gratk/en/ | WIPO GRATK Treaty 2024 |
| Ministry of Ayush | https://ayush.gov.in | Ayurvedic pharmacopoeia, guidelines |
| FSSAI | https://fssai.gov.in | Ayurveda Aahar regulations |
| CDSCO | https://cdsco.gov.in | D&C Rules, Schedule Y-A |

## Sample File Example

```markdown
---
title: "Patents Act 1970 – Section 3(p) – Traditional Knowledge Exclusion"
jurisdiction: india
ip_type: patent
act_or_treaty: "Patents Act, 1970"
section_or_article: "Section 3(p)"
source_url: "https://indiacode.nic.in/handle/123456789/1392"
last_verified: "2024-01-01"
sample: true
---

## Section 3(p) – What is Not Patentable

The following are not inventions within the meaning of this Act:

> (p) an invention which, in effect, is traditional knowledge or which is an aggregation or duplication of known properties of traditionally known component or components.

**Explanation**: This provision explicitly bars patents on inventions that are based on or constitute traditional knowledge. Any formulation, preparation, or use documented in classical Ayurvedic, Unani, or Siddha texts is considered traditional knowledge and falls within this exclusion.

**Key implications for Ayurveda**:
- Classical formulations from texts like Charaka Samhita, Sushruta Samhita are non-patentable
- Known herbs used in known ways are excluded
- Novel dosage forms or delivery mechanisms may be patentable if truly inventive
```

