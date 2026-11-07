// Portfolio content for the world. Single source for panels, chapter cards and the
// field guide. Facts come from docs/portfolio-content-inventory.md: mahavir.pdf first,
// then the project write-ups of the earlier version of this site (see git history), then the
// public READMEs they link to.
// Do not add a metric here that is not in one of those sources.

export const SITE = {
  name: 'Mahavir Chaudhari',
  role: 'Data Engineer',
  current: 'Data Engineer II at Providence Global Center',
  email: 'mveer.rc@gmail.com',
  linkedin: 'https://www.linkedin.com/in/mahavir01',
  github: 'https://github.com/mveer1',
  cv: 'mahavir.pdf',
  formAction: 'https://formspree.io/f/xnjnezwz',
};

export const ISLANDS = [
  { id: 'harbour', name: 'The Harbour', label: 'Start', summary: 'Who I am and the results worth knowing first.' },
  { id: 'works', name: 'The Works', label: 'Production systems', summary: 'Data platforms I built and rebuilt at Providence, the healthcare organisation I work for.' },
  { id: 'lab', name: 'The Signal Lab', label: 'AI systems', summary: 'Context engineering, agent platforms and AI research tools.' },
  { id: 'workshop', name: 'The Workshop', label: 'Personal builds', summary: 'Apps, simulations and tools I build outside work.' },
  { id: 'archive', name: 'The Archive', label: 'Timeline and skills', summary: 'Where the work came from: roles, school and the parts I build with.' },
  { id: 'lookout', name: 'The Lookout', label: 'Contact', summary: 'Email, profiles and the CV.' },
  { id: 'dormant', name: 'The Dormant Rock', label: 'Hidden', summary: 'Something not built yet.', hidden: true },
];

const PROV = 'Providence Global Center';

export const EXHIBITS = [
  // ---------------------------------------------------------------- Harbour
  {
    id: 'about', island: 'harbour', object: 'Signpost',
    title: 'About Mahavir', kicker: `Data Engineer II · ${PROV} · Hyderabad`,
    line: 'A data engineer who builds the systems that make data move.',
    paragraphs: [
      "Hi, I'm a data engineer who enjoys working behind the scenes, building the systems that make data move, talk, and tell stories. I graduated from a place called BITS Pilani in 2023, and ever since, I've been having a lot of fun working on personal and professional projects around data engineering and cloud systems.",
      "I mostly work with Python, SQL, Azure, and cloud data warehousing tools, with an ever-growing toolkit that stretches into big data, machine learning, and AI. I enjoy solving problems that don't come with step-by-step guides, and I'm always curious about how complex systems fit together.",
      "These days, I'm focusing more on backend data architectures and scaling systems that deal with massive amounts of information: the kind of work that's invisible when it works right (and unforgettable when it doesn't).",
    ],
    facts: [['Based in', 'India · remote-friendly'], ['Education', 'BE Computer Science, BITS Pilani, 2019 to 2023'], ['Open to', 'Collaborations']],
    links: [{ label: 'Download the CV', href: 'mahavir.pdf', kind: 'primary' }, { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mahavir01' }, { label: 'GitHub', href: 'https://github.com/mveer1' }],
  },
  {
    id: 'results', island: 'harbour', object: 'Noticeboard',
    title: 'Results at a glance', kicker: 'From the CV, October 2026',
    line: 'Four numbers from production systems, each with its machine on another island.',
    metrics: [
      ['1B+', 'finance records reconciled a day', 'gl-recon'],
      ['92%', 'faster clinician scheduling, 2 h to 10 min', 'mdo'],
      ['$1.25M', 'saved moving a platform off Oracle Exadata', 'migration'],
      ['400+', 'ETL workloads moved to Snowflake, zero downtime', 'migration'],
    ],
    paragraphs: ['Each result links to the machine that shows how it was built.'],
  },

  // ---------------------------------------------------------------- Works
  {
    id: 'gl-recon', island: 'works', object: 'Reconciliation Mill',
    title: 'Project-to-GL reconciliation', kicker: `${PROV} · Data Engineer II · 2025 to now`,
    line: 'Eight manual finance reports merged into one Snowflake layer.',
    metric: ['1B+', 'records a day'],
    metrics: [['1B+', 'records consolidated a day'], ['8', 'manual reports replaced'], ['80%', 'less manual reconciliation']],
    paragraphs: ['Finance teams reconciled project data against the general ledger using eight separate manual reports. This replaced them with one reconciliation data layer in Snowflake that produces audit-ready reporting every day.'],
    steps: [
      'Modelled the data dimensionally, with SCD Type 2 dimensions to keep history.',
      'Built ELT pipelines with daily batch orchestration and SLA monitoring.',
      'Automated validation and exception handling, with lineage for audits.',
    ],
    stack: ['Snowflake', 'Azure Data Factory', 'Control-M', 'SQL', 'Python'],
    links: [{ label: 'Email about this work', href: 'mailto:mveer.rc@gmail.com?subject=Project-to-GL%20Reconciliation' }],
  },
  {
    id: 'migration', island: 'works', object: 'Migration Depot',
    title: 'Warehouse migrations to Snowflake', kicker: `${PROV} · 2023 to now`,
    line: '400+ Databricks workloads and an Oracle Exadata platform, moved to Snowflake.',
    metric: ['$1.25M', 'saved'],
    metrics: [['400+', 'PySpark workloads migrated'], ['11', 'ingestion pipelines rebuilt'], ['$1.25M', 'saved on the DSS move'], ['8 → 4', 'months, with AI-assisted conversion']],
    paragraphs: [
      'Two migrations. As Data Engineer I, I moved 400+ PySpark ETL workloads and 11 production ingestion pipelines from Databricks to Snowflake with zero production downtime.',
      'As Data Engineer II, I led the move of the DSS platform from Oracle Exadata to Snowflake, which saved $1.25M and cut runtime from 15 hours to 12. AI-assisted conversion halved the timeline from 8 months to 4.',
    ],
    steps: [
      'Re-platformed the notebook estate to Snowflake patterns.',
      'Rebuilt the API-driven ingestion pipelines and their data contracts.',
      'Used AI agents and reusable skills to speed up conversion while checking functional parity.',
    ],
    stack: ['Snowflake', 'Databricks', 'PySpark', 'Oracle Exadata', 'Python', 'SQL'],
    links: [{ label: 'Email about this work', href: 'mailto:mveer.rc@gmail.com?subject=Snowflake%20migrations' }],
  },
  {
    id: 'mdo', island: 'works', object: 'Clock Tower',
    title: 'MDO scheduling engine', kicker: `${PROV} · Data Engineer I · 2023 to 2025`,
    line: 'Scheduling for 6,000+ clinicians, from two hours to ten minutes.',
    metric: ['92%', 'faster'],
    metrics: [['2 h → 10 min', 'per scheduling run'], ['92%', 'less execution time'], ['6,000+', 'clinicians scheduled']],
    paragraphs: ['The Mandatory Days Off engine schedules days off for clinicians across all hospitals in the region. I re-architected it so a run takes ten minutes instead of two hours.'],
    steps: [
      'Redesigned the data models.',
      'Rewrote the query paths across enterprise warehouses.',
      'Reworked the batch workflows.',
    ],
    stack: ['Snowflake', 'SQL', 'Oracle', 'Control-M'],
  },
  {
    id: 'qa', island: 'works', object: 'Inspection Gate',
    title: 'Metadata-driven validation framework', kicker: `${PROV} · Data Engineer I · 2023 to 2025`,
    line: 'Reusable checks for every pipeline, generated from metadata.',
    metric: ['7 h → 1 h', 'development time'],
    metrics: [['86%', 'less development time'], ['7 h → 1 h', 'per validation cycle']],
    paragraphs: ['Validation rules are stored as metadata. The framework turns them into SQL and runs them across production ETL pipelines, so each new pipeline gets its checks without hand-written tests.'],
    steps: [
      'Reusable validation rules.',
      'Schema verification.',
      'Automated data reconciliation with dynamic SQL generation.',
    ],
    stack: ['Python', 'Streamlit', 'SQL'],
  },
  {
    id: 'cost-insight', island: 'works', object: 'Boiler Gauge',
    title: 'Cost Insight pipeline tuning', kicker: `${PROV} · Data Engineer II · 2025 to now`,
    line: 'A 20-hour Oracle pipeline brought down to 15.',
    metric: ['$16k', 'a year saved'],
    metrics: [['20 h → 15 h', 'runtime'], ['25%', 'faster'], ['$16k', 'warehouse cost saved a year']],
    paragraphs: ["I optimised the Cost Insight ETL pipelines in Oracle, using LLM-assisted engineering to rework the procedures."],
    steps: [
      'Parallel DML and a higher degree of parallelism.',
      'Partitioning.',
      'Configuration-driven Oracle procedures.',
    ],
    stack: ['Oracle', 'SQL', 'LLMs'],
  },

  // ---------------------------------------------------------------- Lab
  {
    id: 'context', island: 'lab', object: 'Context Tower',
    title: 'Enterprise AI context engineering', kicker: 'Project · Providence data engineering',
    line: 'A layered context platform that grounds AI agents in enterprise data.',
    metric: ['30+', 'reusable skills'],
    metrics: [['30+', 'reusable data engineering skills']],
    paragraphs: ['A context layer that gives enterprise AI agents the right data and business meaning, so they can do data engineering work safely. Each layer of the tower is one layer of context.'],
    steps: [
      'Semantic models, ontologies and knowledge graphs describe the business.',
      'Dynamic context composition and semantic retrieval choose what an agent sees.',
      'MCP integrations and tool orchestration reach Oracle, Snowflake and Azure Data Factory.',
      'HIPAA-compliant PII and PHI guardrails sit around every action.',
    ],
    stack: ['Python', 'Docker', 'MCP', 'Snowflake', 'Cortex', 'Oracle', 'LLMs'],
    links: [{ label: 'Email about this work', href: 'mailto:mveer.rc@gmail.com?subject=Enterprise%20AI%20Context%20Engineering' }],
  },
  {
    id: 'aidlc', island: 'lab', object: 'Skill Switchboard',
    title: 'AI Data Lifecycle Companion (AIDLC)', kicker: `${PROV} · Data Engineer II · 2025 to now`,
    line: 'A shared platform for building agentic AI tools in data engineering.',
    metric: ['5 mo → 4 wk', 'workflow timeline'],
    metrics: [['5 months → 4 weeks', 'for source discovery to data contracts']],
    paragraphs: ['AIDLC standardises how data engineering teams build AI tools: context engineering, MCP integrations, reusable skills, agent orchestration and guardrails, packaged so each team does not start from scratch.'],
    steps: [
      'Automated source discovery.',
      'Canonical data modelling for a unified healthcare data model.',
      'Generated data contracts.',
      'HIPAA-compliant guardrails for production AI development and testing.',
    ],
    stack: ['Python', 'LLMs', 'MCP', 'Agentic AI'],
    links: [{ label: 'Email about this work', href: 'mailto:mveer.rc@gmail.com?subject=AI%20Data%20Lifecycle%20Companion' }],
  },
  {
    id: 'scout', island: 'lab', object: 'Telescope',
    title: 'Smart Research Scout', kicker: 'Personal project · live',
    line: 'Semantic search over papers, developer forums and social posts.',
    paragraphs: ['A full-stack research platform that gathers technical knowledge from research papers, developer communities and social platforms into one semantic search and analytics interface. Answers are grounded in the passages they cite.'],
    steps: [
      'Ingestion, embedding and indexing pipelines.',
      'Retrieval-augmented answers that cite their sources.',
      'Topic clustering to surface related work.',
    ],
    stack: ['FastAPI', 'React', 'PostgreSQL', 'Redis', 'LangGraph', 'Vector search'],
    links: [{ label: 'Open the live demo', href: 'https://mveer1.github.io/AI-research-scout/', kind: 'primary' }, { label: 'View the source', href: 'https://github.com/mveer1/AI-research-scout' }],
  },
  {
    id: 'small-data', island: 'lab', object: 'Analysis Bench',
    title: 'Small Data', kicker: 'Personal project',
    line: 'Ask questions of a small dataset and get an explanation, not a dashboard.',
    paragraphs: ['Small Data turns small and medium datasets into conversational analysis: patterns, anomalies and drivers explained in plain language, without setting up a dashboard first.'],
    steps: [
      'Conversational analysis from raw data to summary and explanation.',
      'Outlier detection and trend summaries without manual preprocessing.',
      'Structured prompts that turn findings into recommendations.',
    ],
    stack: ['FastAPI', 'Pandas', 'LangChain', 'OpenAI', 'Python'],
    links: [{ label: 'Email about Small Data', href: 'mailto:mveer.rc@gmail.com?subject=Small%20Data%20Project' }],
  },

  // ---------------------------------------------------------------- Workshop
  {
    id: 'taskboard', island: 'workshop', object: 'Task Board',
    title: 'Task Board', kicker: 'Personal project · live · kanban-taskboard',
    line: 'Projects, stories and tasks on a four-column board.',
    metric: ['161', 'tests'],
    metrics: [['4', 'columns: New, Active, Hold / Later, Done'], ['161', 'tests across six suites']],
    paragraphs: ['A three-level task tracker: projects hold stories, stories hold daily tasks. It runs two ways from one codebase.'],
    steps: [
      'Locally, on one readable JSON file that a person or an AI assistant can edit by hand.',
      'Hosted on GitHub Pages with Firebase Auth and Firestore for shared workspaces.',
      'Both backends share one validation module, and a parity test checks they agree.',
    ],
    stack: ['React', 'TypeScript', 'Vite', 'Firebase', 'Express', 'Chart.js', 'D3', 'SortableJS'],
    links: [{ label: 'Open the live site', href: 'https://mveer1.github.io/kanban-taskboard', kind: 'primary' }, { label: 'View the source', href: 'https://github.com/mveer1/kanban-taskboard' }],
  },
  {
    id: 'fit', island: 'workshop', object: 'Training Rack',
    title: 'fit', kicker: 'Personal project · live',
    line: 'A training log with a weekly plan and a 3D muscle atlas.',
    metric: ['873', 'exercises'],
    metrics: [['873', 'exercises in the local library']],
    paragraphs: ['A client-side training workspace. It works offline immediately, and syncs to Firestore after an optional Google sign-in.'],
    steps: [
      'An interactive front and back muscle atlas in 3D.',
      'Workout logging against an editable multi-day plan.',
      'Weekly muscle load, adherence and streaks.',
    ],
    stack: ['React 19', 'TypeScript', 'Vite', 'Three.js', 'React Three Fiber', 'Firebase'],
    links: [{ label: 'Open the live site', href: 'https://mveer1.github.io/fit', kind: 'primary' }, { label: 'View the source', href: 'https://github.com/mveer1/fit' }],
  },
  {
    id: 'physics', island: 'workshop', object: 'Orrery',
    title: 'Physics Hyperion', kicker: 'Personal project · live',
    line: 'A browser physics playground for particles and fields.',
    paragraphs: ['A browser-based physics laboratory that simulates particle interactions, gravitational fields and spring-mass systems in real time with WebGL. A personal deep-dive into rendering pipelines and numerical integration.'],
    steps: [
      'Particle systems with gravity, drag and wind.',
      'Verlet and Euler integrators for stable long runs.',
      'Custom GLSL for glow, motion trails and depth cues.',
    ],
    stack: ['JavaScript', 'WebGL', 'GLSL', 'Canvas API'],
    links: [{ label: 'Open the live demo', href: 'https://mveer1.github.io/hypelab/', kind: 'primary' }],
  },
  {
    id: 'echo', island: 'workshop', object: 'Writing Desk',
    title: 'Echo Journal', kicker: 'Personal project · live',
    line: 'A private journal that charts mood over time.',
    paragraphs: ['A mood-and-thought journal that uses natural language processing to show patterns in how you feel over time. Entries stay in the browser.'],
    steps: [
      'Sentiment scoring and emotion classification per entry.',
      'Weekly and monthly mood trends.',
      'Topic and keyword extraction for recurring themes.',
    ],
    stack: ['React', 'Python', 'NLP'],
    links: [{ label: 'Open the live site', href: 'https://mveer1.github.io/echo-journal/', kind: 'primary' }],
  },
  {
    id: 'motion', island: 'workshop', object: 'Projector',
    title: 'Motion Lab', kicker: 'Personal project · motion-graphics',
    line: 'Narrated explainer videos rendered on one Mac.',
    metric: ['4', 'films shipped'],
    metrics: [['4', 'narrated films shipped']],
    paragraphs: ['A local pipeline that turns a project folder into narrated explainers and short videos on one Apple Silicon Mac.'],
    steps: [
      'Scenes written in HTML, GSAP and SVG, rendered by HyperFrames in headless Chrome.',
      'Narration with Kokoro text-to-speech.',
      'FFmpeg assembly, then five scripted QA gates.',
    ],
    stack: ['GSAP', 'HyperFrames', 'Kokoro', 'FFmpeg', 'Python'],
    links: [{ label: 'View the source', href: 'https://github.com/mveer1/motion-graphics', kind: 'primary' }],
  },
  {
    id: 'arcade', island: 'workshop', object: 'Arcade Cabinet', open: 'Play at the arcade cabinet',
    title: 'Arcade: Flappy Byte and Life Cell', kicker: 'Playable here',
    line: 'Two small canvas games.',
    paragraphs: ['Flappy Byte: steer a data packet through the firewall with one key. Life Cell: draw a seed and watch Conway’s Game of Life evolve from four rules.', ],
    links: [{ label: 'Play Flappy Byte', href: '#play-flappy', kind: 'primary', play: 'flappy' }, { label: 'Play Life Cell', href: '#play-life', play: 'life' }],
  },

  // ---------------------------------------------------------------- Archive
  {
    id: 'timeline', island: 'archive', object: 'Timeline Stair',
    title: 'Career timeline', kicker: '2019 to now',
    line: 'One landing per year, from BITS Pilani to Data Engineer II.',
    timeline: [
      ['2019', 'BITS Pilani', 'Started a BE in Computer Science.'],
      ['2020', 'Data and ML foundations', 'Self-taught Python, Pandas, SQL and scikit-learn through end-to-end ML experiments.'],
      ['2021', 'Streamn · Software Developer (part-time)', 'GPU-accelerated computer vision models for logo detection in video streams. May 2021 to August 2022.'],
      ['2023', 'Fortranix Technologies · Software Development Intern', 'Automated Rust unit tests for an enterprise security platform, raising coverage from 30% to 80%. January to June 2023.'],
      ['2023', 'Providence · Data Engineer I', 'Joined in July 2023: MDO scheduling engine, the validation framework, and the Databricks to Snowflake migration.'],
      ['2025', 'Providence · Data Engineer II', 'From July 2025: the reconciliation layer, the DSS move off Oracle Exadata, Cost Insight tuning and AIDLC.'],
      ['2026', 'AI-native data platforms', 'Context engineering, reusable AI skills and agent workflows for enterprise data engineering.'],
    ],
  },
  {
    id: 'skills', island: 'archive', object: 'Parts Library',
    title: 'Skills', kicker: 'Sorted parts',
    line: 'The parts every system on these islands was built from.',
    bins: [
      ['Data engineering', ['Python', 'SQL', 'Snowflake', 'Azure Data Factory', 'PySpark', 'dbt', 'ETL / ELT', 'Data modelling', 'Dimensional modelling', 'SCD', 'Data warehousing', 'Batch processing', 'Distributed systems', 'Control-M', 'Oracle']],
      ['AI systems', ['Agentic AI', 'Context engineering', 'Semantic layers', 'Ontologies', 'Knowledge graphs', 'RAG', 'MCP', 'LangGraph', 'AI agents', 'Tool calling', 'Semantic search', 'Vector search', 'Orchestration']],
      ['Cloud', ['Azure', 'AWS', 'GCP', 'Docker', 'Git', 'GitHub Actions']],
      ['Languages and frameworks', ['FastAPI', 'Flask', 'React', 'PostgreSQL', 'Redis', 'MySQL', 'SQLite', 'Java', 'Go', 'Rust', 'Bash', 'JavaScript', 'HTML / CSS']],
    ],
    extraBin: ['Also listed on an earlier version of this site', ['Kafka', 'Flink', 'Spark Structured Streaming', 'Kinesis / Event Hubs', 'CDC (Debezium, Fivetran)', 'ClickHouse', 'DuckDB', 'Airflow', 'Dagster / Prefect', 'Great Expectations / Soda', 'Kubernetes and Helm', 'Terraform', 'Delta Lake / Iceberg', 'LlamaIndex', 'pgvector', 'Power BI']],
  },
  {
    id: 'education', island: 'archive', object: 'Plinth',
    title: 'BITS Pilani', kicker: 'Education · 2019 to 2023',
    line: 'Bachelor of Engineering in Computer Science.',
    paragraphs: ['Bachelor of Engineering in Computer Science at BITS Pilani, 2019 to 2023.'],
  },

  // ---------------------------------------------------------------- Lookout
  {
    id: 'contact', island: 'lookout', object: 'Mailbox',
    title: 'Contact', kicker: 'Open to collaborations',
    line: 'Email, LinkedIn, GitHub, or a message from here.',
    contact: true,
    links: [{ label: 'Email mveer.rc@gmail.com', href: 'mailto:mveer.rc@gmail.com', kind: 'primary' }, { label: 'LinkedIn', href: 'https://www.linkedin.com/in/mahavir01' }, { label: 'GitHub', href: 'https://github.com/mveer1' }],
  },
  {
    id: 'cv', island: 'lookout', object: 'Lamp Room',
    title: 'CV', kicker: 'PDF · one page',
    line: 'The one-page CV these islands were built from.',
    paragraphs: ['The full CV as a one-page PDF: experience, projects, skills and education.'],
    links: [{ label: 'Download the CV', href: 'mahavir.pdf', kind: 'primary' }],
  },

  // ---------------------------------------------------------------- Dormant
  {
    id: 'next', island: 'dormant', object: 'Machine Core',
    title: 'Next pipeline (planned)', kicker: 'Roadmap · not built yet',
    line: 'A streaming, agent-driven data platform that is still on the drawing board.',
    paragraphs: ['The next build combines streaming ingestion, a lakehouse core, agents that reason over the data, and a control plane that treats pipelines as products with contracts, SLAs and observability.'],
    steps: [
      'Real-time CDC ingestion into an Iceberg or Delta lakehouse.',
      'Agentic workflows over the warehouse through MCP-style tool interfaces.',
      'Data quality with contracts, tests and lineage built in.',
      'A natural-language interface for analysts to query and explain data.',
    ],
    stack: ['Kafka / Flink', 'Iceberg / Delta', 'dbt', 'Airflow / Dagster', 'LangGraph', 'Vector DB', 'Terraform', 'Kubernetes'],
    links: [{ label: 'Email me when it ships', href: 'mailto:mveer.rc@gmail.com?subject=Curious%20about%20your%20next%20project' }],
  },
];

export const byId = Object.fromEntries(EXHIBITS.map((e) => [e.id, e]));
export const exhibitsOf = (island) => EXHIBITS.filter((e) => e.island === island);
export const islandById = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));
