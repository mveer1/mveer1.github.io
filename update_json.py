import json

data = [
  {
    "Section": "Header",
    "Name / Title": "Mahavir Chaudhari",
    "Attributes (JSON)": json.dumps({
        "email": "mveer.rc@gmail.com",
        "portfolio": "https://mveer1.github.io/",
        "linkedin": "https://linkedin.com/in/mahavir01",
        "github": "https://github.com/mveer1"
    })
  },
  {
    "Section": "Education",
    "Name / Title": "BITS Pilani, BE in Computer Science",
    "Attributes (JSON)": json.dumps({
        "duration": "2019-2023",
        "coursework": [
            "Computer Architecture", "Machine Learning", "Deep Learning", 
            "Database Management", "Operating Systems", "Design and Analysis of Algorithms", 
            "Data Structures and Algorithms"
        ]
    })
  },
  {
    "Section": "Experience",
    "Name / Title": "Data Engineer II",
    "Attributes (JSON)": json.dumps({
        "company": "Providence Global Center",
        "duration": "Jul 2025 – Present",
        "highlights": [
            "Architected a financial reconciliation platform consolidating 8 independent Finance reports into a unified Snowflake pipeline processing 1B+ records daily, reducing manual reconciliation effort by 80% while enabling audit-ready reporting across multiple Finance teams.",
            "Architecting the AI Data Lifecycle Companion (AIDLC), a standardized enterprise AI framework enabling Data Engineering teams to build AI-powered solutions through reusable skills, guardrails, MCP integrations, and modular agent workflows, establishing scalable patterns for enterprise AI development.",
            "Led the modernization of enterprise ETL workloads by migrating 400+ production notebooks and 11 API-driven ingestion pipelines from Databricks to Snowflake, leveraging AI-assisted development workflows to accelerate migration while maintaining production continuity and functional parity."
        ]
    })
  },
  {
    "Section": "Experience",
    "Name / Title": "Data Engineer I",
    "Attributes (JSON)": json.dumps({
        "company": "Providence Global Center",
        "duration": "Jul 2023 – Jun 2025",
        "highlights": [
            "Redesigned the Mandatory Days Off (MDO) scheduling engine supporting 6,000+ clinicians, reducing end-to-end execution time from 2 hours to 10 minutes (92% improvement) through scalable query optimization and workflow redesign.",
            "Engineered a metadata-driven test automation framework using Python and Streamlit, reducing enterprise QA execution time from 14 hours to approximately 1 hour, improving validation consistency across production data pipelines."
        ]
    })
  },
  {
    "Section": "Experience",
    "Name / Title": "Software Development Intern",
    "Attributes (JSON)": json.dumps({
        "company": "Fortranix Technologies",
        "duration": "Jan 2023 - Jun 2023",
        "highlights": [
            "Developed production-ready full-stack application features by building RESTful APIs, integrating relational databases, and collaborating in an Agile development environment, strengthening software engineering and backend development practices."
        ]
    })
  },
  {
    "Section": "Experience",
    "Name / Title": "Software Developer (Part-time)",
    "Attributes (JSON)": json.dumps({
        "company": "Streamn",
        "duration": "May 2021 - Aug 2022",
        "highlights": [
            "Built backend services and data-driven application features using Python, SQL, and REST APIs while automating development workflows and delivering production-quality software in a fast-paced startup environment."
        ]
    })
  },
  {
    "Section": "Project",
    "Name / Title": "Enterprise AI Context Engineering",
    "Attributes (JSON)": json.dumps({
        "highlights": [
            "Architected a modular context engineering framework for enterprise AI agents, designing reusable skills, MCP integrations, guardrails, prompts, and metadata-driven context abstractions to enable scalable, domain-aware agent workflows.",
            "Engineered dynamic context retrieval and orchestration strategies that separated business knowledge from agent logic, improving maintainability, extensibility, and response consistency across enterprise AI applications."
        ],
        "tech": ["Python", "Snowflake", "Oracle", "Cortex CLI", "MCP", "LLMs", "Prompt Engineering"]
    })
  },
  {
    "Section": "Project",
    "Name / Title": "Smart Research Scout",
    "Attributes (JSON)": json.dumps({
        "highlights": [
            "Built a full-stack AI research platform integrating Retrieval-Augmented Generation (RAG), semantic search, and conversational interfaces to enable intelligent exploration of structured and unstructured enterprise knowledge.",
            "Engineered scalable document ingestion, embedding, indexing, and retrieval pipelines with a production-ready FastAPI backend and React frontend, delivering context-aware responses through modular APIs and vector search."
        ],
        "tech": ["Python", "FastAPI", "React", "PostgreSQL", "Redis", "LangGraph", "OpenAI APIs", "Docker"]
    })
  },
  {
    "Section": "Skill",
    "Name / Title": "AI & LLM Engineering",
    "Attributes (JSON)": json.dumps({
        "skills": ["Agentic AI", "Context Engineering", "Retrieval-Augmented Generation (RAG)", "MCP", "LangGraph", "LangChain", "Prompt Engineering", "Semantic Search", "Vector Search", "OpenAI APIs"]
    })
  },
  {
    "Section": "Skill",
    "Name / Title": "Data Engineering",
    "Attributes (JSON)": json.dumps({
        "skills": ["Python", "SQL", "Snowflake", "Azure Data Factory", "dbt", "PySpark", "ETL/ELT", "Data Modeling", "Data Warehousing", "Data Quality", "Batch Processing", "Stream Processing", "Distributed Systems", "Control-M"]
    })
  },
  {
    "Section": "Skill",
    "Name / Title": "Cloud & DevOps",
    "Attributes (JSON)": json.dumps({
        "skills": ["Azure", "AWS", "GCP", "Docker", "Git", "GitHub Actions"]
    })
  },
  {
    "Section": "Skill",
    "Name / Title": "Languages & Frameworks",
    "Attributes (JSON)": json.dumps({
        "skills": ["Java", "Go", "Rust", "JavaScript", "Bash", "C/C++", "FastAPI", "Flask", "React", "PostgreSQL", "MySQL", "Redis", "SQLite", "HTML", "CSS"]
    })
  }
]

with open('/Users/mahavir/Downloads/resume_bank.json', 'w') as f:
    json.dump(data, f, indent=2)

print("Updated resume_bank.json successfully.")
