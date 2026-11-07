# Portfolio content inventory

Audit date: 2026-11-05. Branch: the lego-world feature branch.

This file lists what the workspace actually says about Mahavir. Nothing here is inferred. Where sources disagree, both values are recorded and one is chosen, with the reason.

## Sources and precedence

| Rank | Source | Last changed | Notes |
|---|---|---|---|
| 1 | `mahavir.pdf` | 2026-10-24 ("res update") | Linked from the site as the CV. Newest, so it is canonical. |
| 2 | `index.html` | 2026-08-21 | Project cards, project modals, skills, about text, contact. |
| 3 | `main.tex`, `resume.json` | 2026-08-20 | Identical to each other. Older than the PDF. |
| 4 | `timeline-data.js` | 2026-08-20 | Year-by-year narrative (2020 to 2026). |
| 5 | `resume_bank.txt` | 2026-07-07 | Older bullet bank. |
| 6 | Public GitHub READMEs (`github.com/mveer1/*`) | various | Fetched read-only for projects the site already links to. |

**Rule used in the world:** a metric is shown only if it appears in `mahavir.pdf` or in the project modal text on `index.html`. A secondary source is used only for detail the PDF does not cover. Values from older sources that the PDF has since changed are not shown.

## Identity (already published)

| Field | Value | Source |
|---|---|---|
| Name | Mahavir Chaudhari | all |
| Headline | Data Engineer | `index.html` title, social preview |
| Current role | Data Engineer II, Providence Global Center, Hyderabad | PDF |
| Location line | "India · Remote-friendly", "Open to collaborations" | `index.html` summary modal |
| Email | mveer.rc@gmail.com | all |
| LinkedIn | linkedin.com/in/mahavir01 | all |
| GitHub | github.com/mveer1 | all |
| Phone | Present in the PDF only | Not shown on the site, so the world does not show it either. |
| About text | Three paragraphs in `#about` ("Hi, I'm a data engineer who enjoys working behind the scenes...") | `index.html` |
| Footer line | "built with caffeine & curiosity" | `index.html` |
| Brand mark | "MAHAVIR" wordmark with the Material Symbols `hub` icon; lime `#bada55` and cyan `#00ccff` | `index.html`, `style.css` |

## Career timeline

| Dates | Role | Organisation | Location | Source |
|---|---|---|---|---|
| Jul 2025 to present | Data Engineer II | Providence Global Center | Hyderabad | PDF |
| Jul 2023 to Jun 2025 | Data Engineer I | Providence Global Center | Hyderabad | PDF |
| Jan 2023 to Jun 2023 | Software Development Intern | Fortranix Technologies (see discrepancy D1) | Bangalore | PDF |
| May 2021 to Aug 2022 | Software Developer (part-time) | Streamn | Remote | PDF |
| 2019 to 2023 | BE in Computer Science | BITS Pilani | | PDF |
| 2020 | Data and ML foundations, self-taught | | | `timeline-data.js` |

## Professional accomplishments (canonical: `mahavir.pdf`)

### Data Engineer II, Jul 2025 to present

| # | Accomplishment | Metrics | Stack named |
|---|---|---|---|
| P1 | Financial reconciliation data layer in Snowflake: dimensional modelling, SCD Type 2, ELT pipelines | 1B+ records daily; manual reconciliation effort down 80% | Snowflake |
| P2 | AIDLC workflow: automated source discovery, canonical data modelling for a unified healthcare data model, generated data contracts | 5-month timeline compressed to 4 weeks ("80% reductions") | |
| P3 | Migration of the DSS platform from Oracle Exadata to Snowflake | $1.25M saved; runtime 15 h to 12 h; AI cut the timeline 50% (8 months to 4 months) | Oracle Exadata, Snowflake |
| P4 | Cost Insight ETL optimisation: parallel DML, higher DOP, partitioning, configuration-driven Oracle procedures, LLM engineering | runtime down 25% (20 h to 15 h); $16k a year in warehouse cost | Oracle |
| P5 | Architected the AI Data Life Cycle (AIDLC): enterprise agentic AI platform for context engineering, MCP integrations, reusable skills, agent orchestration, HIPAA-compliant guardrails | "resolving KTLO items instantaneously" (no number) | MCP |

### Data Engineer I, Jul 2023 to Jun 2025

| # | Accomplishment | Metrics | Stack named |
|---|---|---|---|
| P6 | Re-architected the Mandatory Days Off (MDO) scheduling engine: data models, query paths, batch workflows | 2 h to 10 min (92%); all hospitals in the region; 6,000+ clinicians | Snowflake, SQL, Oracle, Control-M (timeline) |
| P7 | Migrated 400+ PySpark ETL workloads and 11 production ingestion pipelines from Databricks to Snowflake | zero production downtime | Databricks, Snowflake, PySpark |
| P8 | Metadata-driven AI validation framework: Python, Streamlit, dynamic SQL, reusable reconciliation | development time down 86% (7 h to 1 h) | Python, Streamlit |

### Earlier roles

| # | Accomplishment | Metrics | Source |
|---|---|---|---|
| P9 | Fortranix intern: automated Rust unit tests for an enterprise security platform | coverage 30% to 80% | PDF |
| P10 | Streamn: GPU-accelerated computer vision models for logo detection in video streams | none | PDF |
| P10b | Streamn (timeline version): backend services for ML workflows; text-recognition pipeline 30% faster | 10K+ API requests a week; 30% | `timeline-data.js` only |

## Projects

Fields marked "unknown" are not documented anywhere in the workspace or the linked public README.

| Id | Name | Kind | Problem | Architecture and features (documented) | Stack | Outcome / metrics | Links | Visual opportunity |
|---|---|---|---|---|---|---|---|---|
| gl-recon | Project-to-GL Reconciliation | Production (Providence) | Eight manual finance reports, spreadsheet risk | Unified reconciliation workflow; automated validation and exception handling; daily batch with SLA monitoring; audit lineage | Snowflake, ADF, Control-M, SQL, Python | 8 reports consolidated; 1B+ records a day; 80% less manual effort (PDF) | none (internal) | Eight hoppers feeding one conveyor into one ledger silo |
| dbx-snow | Databricks to Snowflake Modernization | Production | Large legacy notebook estate | 400+ notebooks re-platformed; 11 API ingestion pipelines rebuilt; standardised transforms | Snowflake, PySpark, Python, SQL | 400+ workloads, 11 pipelines, zero downtime | none | A crane moving crates from an old depot to a new one |
| dss | DSS platform: Oracle Exadata to Snowflake | Production | Decision-support platform on Exadata | unknown beyond the PDF line | Oracle Exadata, Snowflake | $1.25M saved; 15 h to 12 h; 8 months to 4 months | none | Shares the depot exhibit with dbx-snow |
| cost-insight | Cost Insight ETL optimisation | Production | 20-hour Oracle pipeline | Parallel DML, higher DOP, partitioning, config-driven procedures | Oracle, LLMs | 20 h to 15 h; $16k a year | none | A gauge on the Works boiler |
| mdo | MDO scheduling engine | Production | 2-hour scheduling batch | Redesigned data models, query paths, batch workflows | Snowflake, SQL, Oracle, Control-M | 92% faster; 6,000+ clinicians | none | Clock tower whose hand moves from 2 h to 10 min |
| qa-framework | Metadata-driven validation framework | Production | Slow manual QA of ETL | Reusable validation rules, schema checks, dynamic SQL, Streamlit UI | Python, Streamlit, SQL | 7 h to 1 h (86%) | none | Inspection gate that checks bricks |
| aidlc | AI Data Lifecycle Companion (AIDLC) | Framework (Providence) | Teams building AI tooling ad hoc | Modular skills, guardrails, MCP integrations, agent workflows, reusable context | Python, LLMs, MCP | 5 months to 4 weeks for the workflow (PDF) | none | Cabinet of skill drawers wired to a switchboard |
| context-eng | Enterprise AI Context Engineering | Project | Grounding AI agents in enterprise data | Layered context: semantic models, ontologies, knowledge graphs; 30+ reusable skills (PDF; older sources say 15+); dynamic context composition; PII/PHI guardrails; tools to Oracle, Snowflake, ADF | Python, Docker, MCP, Snowflake, Cortex, Oracle | 30+ skills | none | A stacked tower, one plate per context layer |
| research-scout | Smart Research Scout (site: "AI Research Scout") | Personal, live | Literature review is slow | FastAPI backend, React frontend, vector search, RAG with cited passages, topic clustering | FastAPI, React, PostgreSQL, Redis, LangGraph, vector search | unknown | mveer1.github.io/AI-research-scout, github.com/mveer1/AI-research-scout | Telescope aimed at a constellation of papers |
| small-data | Small Data | Personal | Small datasets need explanation, not dashboards | Conversational analysis, outlier detection, structured prompts | FastAPI, Pandas, LangChain, OpenAI | unknown | none | Lab bench with a tiny bar chart |
| echo-journal | Echo Journal | Personal, live | Reflection on journal entries | Sentiment scoring, emotion classification, trend charts, client-side storage | React, Python, NLP | unknown | mveer1.github.io/echo-journal | Writing desk with a mood dial |
| physics | Physics Hyperion | Personal, live | Learning rendering and numerical integration | Particle systems, Verlet/Euler integrators, custom GLSL | JavaScript, WebGL, GLSL | 60 fps target | mveer1.github.io/hypelab | Orrery of orbiting studs |
| kanban | kanban-taskboard ("Task Board") | Personal, live | Daily task management | Projects to Stories to Tasks; four columns (New, Active, Hold / Later, Done); two backends behind one interface (local JSON file or Firebase); shared validation with a parity test | React, TypeScript, Vite, Firebase, Express, Chart.js, D3, SortableJS | 161 tests across six suites (README) | live + source | A board with four columns of tiles |
| fit | fit (README: "FORM / Training Intelligence") | Personal, live | Training consistency | Site: seven-day plan board. README: muscle atlas in 3D, workout logging, editable plan, weekly load, 873-record exercise library, local-first with optional Firebase | React 19, TypeScript, Vite, Three.js, R3F, Firebase | 873 exercises in library | live + source | Weight rack and a seven-slot week board |
| motion-lab | Motion Lab (`motion-graphics` repo) | Personal | Producing narrated explainers locally | HTML + GSAP + SVG rendered by HyperFrames, Kokoro narration, FFmpeg assembly, five QA gates, one Mac | GSAP, HyperFrames, Kokoro, FFmpeg, Python | 4 narrated films shipped (README) | github.com/mveer1/motion-graphics | Film projector and a strip of frames. **Not on the current site**; included because the brief names motion graphics and the repo is public. |
| next-pipeline | Next Pipeline (roadmap) | Planned | | Streaming CDC into a lakehouse, agentic workflows over the warehouse | Kafka/Flink, Iceberg/Delta, dbt, LangGraph | not built | email | A dormant, half-built machine |
| arcade | Flappy Byte, Life Cell | Playable on the classic site | | Canvas games in `app.js` | JavaScript, Canvas | | `index.html` game modals | Arcade cabinet that opens them |

## Skills

Two lists exist and they differ.

- **Evidenced** (PDF "Technical Skills"): Python, SQL, Snowflake, Azure Data Factory, distributed systems, PySpark, dbt, ETL/ELT, data modelling, dimensional modelling, SCD, data warehousing, batch processing, Control-M; agentic AI, context engineering, semantic layers, ontologies, knowledge graphs, RAG, MCP, LangGraph, AI agents, tool calling, semantic search, vector search, APIs, orchestration; Azure, AWS, GCP, Docker, Git, GitHub Actions; FastAPI, Flask, React, PostgreSQL, Redis, MySQL, SQLite, Java, Go, Rust, Bash, JavaScript, HTML/CSS. Oracle and Oracle Exadata appear in experience bullets.
- **Site-only** (`index.html` `#skills`): Kafka, Flink, Spark Structured Streaming, Kinesis / Event Hubs, CDC (Debezium, Fivetran), ClickHouse, DuckDB, Airflow, Dagster / Prefect, Great Expectations / Soda, Kubernetes and Helm, Terraform, Serverless, Delta Lake / Iceberg, Data Vault, LlamaIndex, Pinecone, pgvector, Weaviate, GraphQL, Power BI. None of these appears in the PDF or any project description except the roadmap.

The world shows the evidenced list as the main skill bins. The site-only items are shown in a separate bin labelled as listed on the classic site, so nothing published is removed and nothing is overstated.

## Discrepancies found

| Id | Topic | Values | Used in world |
|---|---|---|---|
| D1 | Intern employer spelling | "Fortranix Technologies" (PDF, tex, json); "Fortanix" (timeline) | PDF spelling. Owner should confirm. |
| D2 | Validation framework result | "development time 86% (7 h to 1 h)" (PDF); "QA execution time 86% (7 h to 1 h)" (tex); "14 hours to approximately 1 hour" (bank) | PDF wording |
| D3 | Fortranix coverage | 30% to 80% (PDF); "35% test coverage increase" (timeline) | PDF |
| D4 | Streamn work | logo detection CV (PDF); backend services (bank); "ML Engineer Intern", 10K+ API requests a week, 30% faster pipelines (timeline) | PDF, with the timeline items in the Archive as the timeline's own narrative |
| D5 | Context-engineering skill count | 30+ (PDF); 15+ (tex, json) | 30+ |
| D6 | Databricks migration timing | Data Engineer I (PDF); Data Engineer II (tex, json, timeline 2025) | Shown under Providence without a role date |
| D7 | Summary stat "400+ Pipelines Shipped" | The source says 400+ notebooks/workloads migrated, not pipelines shipped | World says "400+ workloads migrated" |
| D8 | Summary stat "4+ Years in Data" | Not in the PDF | Not shown |
| D9 | fit description | Site: lightweight seven-day tracker. README: full training workspace (FORM) | README facts, site name |
| D10 | Copyright year | Footer says 2025 | Not changed on the classic site |

## Existing assets

| Asset | Use in the world |
|---|---|
| `assets/images/*.png` (project art, 1024 px JPEG data with .png names) | Not used. They are generated mood images (the MDO image shows invented dates and labels), not screenshots, and they are not referenced by `index.html` either. |
| `assets/images/social-preview.png` | Kept as the share image for the world page. |
| `assets/images/favicons/*` | Unused by the site; not used. |
| `favicon.ico` | Reused. |
| `mahavir.pdf` | Linked from the Lookout and the field guide. |
| 3D models | None exist. The classic hero builds a procedural "neural mesh" with Three.js r128. |

## Existing functionality to preserve

- Classic one-page site (`index.html`, `style.css`, `app.js`, `timeline-data.js`): theme toggle, loading screen, typing hero, timeline with three modes, eleven project modals, skills, contact form (Formspree `xnjnezwz`), profile summary modal, two canvas games.
- Zero-build deploy: GitHub Pages serves the repository root directly; there is no workflow. Vite is used only for local development.
- SEO: canonical URL, Open Graph, JSON-LD Person, `robots.txt`, `sitemap.xml`.
