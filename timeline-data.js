/**
 * Timeline Data Model
 * Each entry drives the interactive timeline rendering.
 * Modes: impact (metrics focus), technical (stack focus), story (narrative focus)
 */
const TIMELINE_DATA = [
  {
    year: 2020,
    title: "Data & ML Foundations",
    subtitle: "Self-taught · Remote Learning",
    domain: "Data Science · Machine Learning",
    description: {
      impact: "Built personal data analysis and machine learning projects, establishing the foundation for a career in data engineering.",
      technical: "Learned Python, Pandas, SQL, and Scikit-learn while building data exploration, preprocessing, model training, and evaluation workflows.",
      story: "What started as curiosity during lockdown became a deeper interest in how data moves through systems — from raw datasets to models and insights."
    },
    impact: { metric: "ML → Data", label: "Engineering Foundation" },
    techStack: ["Python", "Pandas", "Scikit-learn", "SQL"],
    expanded: {
      details: "Started with exploratory analysis and gradually moved toward complete machine learning workflows, developing the programming and data fundamentals that later became the foundation for production data engineering.",
      highlights: [
        "Built end-to-end ML experiments",
        "Developed strong Python and SQL foundations",
        "Explored NLP and classical machine learning"
      ]
    }
  },
  {
    year: 2021,
    title: "Machine Learning Engineer Intern",
    subtitle: "Streamn.ai · Remote",
    domain: "Media AI · Backend Engineering",
    description: {
      impact: "Built backend services supporting ML workflows handling 10K+ API requests per week.",
      technical: "Developed REST APIs with FastAPI and Flask and integrated machine learning workflows for text recognition and multimedia processing.",
      story: "The first real engineering environment exposed the difference between building a model and building reliable software around it."
    },
    impact: { metric: "10K+", label: "API Requests / Week" },
    techStack: ["Python", "FastAPI", "Flask", "MySQL"],
    expanded: {
      details: "Worked on backend services and ML inference workflows supporting automated multimedia processing and content generation.",
      highlights: [
        "Production ML API development",
        "Backend service engineering",
        "First exposure to production data pipelines"
      ]
    }
  },
  {
    year: 2022,
    title: "ML Engineer → Applied Systems",
    subtitle: "Streamn.ai · Remote",
    domain: "Media Processing · Applied ML",
    description: {
      impact: "Optimized text recognition pipelines, improving execution speed by 30%, while supporting production multimedia processing systems.",
      technical: "Worked across Python, Bash, backend services, and data-processing workflows to improve pipeline performance and reliability.",
      story: "The focus shifted from experimenting with ML to making ML-powered systems faster, more reliable, and useful in production."
    },
    impact: { metric: "30%", label: "Pipeline Speed Improvement" },
    techStack: ["Python", "Bash", "FastAPI", "SQLite"],
    expanded: {
      details: "Optimized processing and inference workflows while contributing to backend services used for automated multimedia processing and content generation.",
      highlights: [
        "Pipeline performance optimization",
        "Backend API development",
        "Production ML systems experience"
      ]
    }
  },
  {
    year: 2023,
    title: "Systems Engineering → Data Engineering",
    subtitle: "BITS Pilani · Fortanix · Providence",
    domain: "Systems Security · Data Engineering",
    description: {
      impact: "Graduated in Computer Science, contributed to confidential computing systems at Fortanix, and began a career in enterprise data engineering at Providence.",
      technical: "Worked with Rust, automated testing, encryption and key-management modules, CI/CD, and enterprise data platforms.",
      story: "A transition year from academic systems programming and security engineering into large-scale enterprise data engineering."
    },
    impact: { metric: "35%", label: "Test Coverage Increase" },
    techStack: ["Rust", "Docker", "GitHub Actions", "CI/CD"],
    expanded: {
      details: "At Fortanix, improved reliability of systems software through automated Rust testing and CI/CD integration before transitioning into enterprise healthcare data engineering at Providence.",
      highlights: [
        "Rust systems programming",
        "Confidential computing exposure",
        "Production engineering practices",
        "Transition into data engineering"
      ]
    }
  },
  {
    year: 2024,
    title: "Data Engineer I",
    subtitle: "Providence · Healthcare Workforce Systems",
    domain: "Healthcare Operations Data",
    description: {
      impact: "Re-engineered the Mandatory Days Off scheduling system for 6K+ clinicians, reducing processing runtime by 92%.",
      technical: "Designed Snowflake SQL pipelines and Control-M workflows integrating Oracle and operational workforce datasets.",
      story: "The first year of owning production data systems — where performance, reliability, and correctness directly affect operational decisions."
    },
    impact: { metric: "92%", label: "Runtime Reduction" },
    techStack: ["Snowflake", "SQL", "Oracle", "Control-M"],
    expanded: {
      details: "Redesigned scheduling logic for the Mandatory Days Off system, reducing runtime from approximately two hours to ten minutes while supporting workforce operations for more than 6K clinicians.",
      highlights: [
        "92% production runtime reduction",
        "6K+ clinician scheduling system",
        "End-to-end production ownership",
        "Healthcare workforce data engineering"
      ]
    }
  },
  {
    year: 2025,
    title: "Data Engineer II",
    subtitle: "Providence · Enterprise Data Platforms",
    domain: "Financial Data · Platform Modernization",
    description: {
      impact: "Built reconciliation infrastructure processing 1B+ financial records daily and led modernization of 400+ production workloads from Databricks to Snowflake.",
      technical: "Engineered Snowflake and Azure Data Factory pipelines, rebuilt API ingestion workflows, and developed AI-assisted engineering automation.",
      story: "The role expanded from building individual pipelines to modernizing platforms, reducing operational effort, and enabling other engineering teams."
    },
    impact: { metric: "1B+", label: "Financial Records / Day" },
    techStack: ["Snowflake", "Azure Data Factory", "Python", "PySpark", "Streamlit"],
    expanded: {
      details: "Built a Project-to-GL reconciliation platform consolidating eight manual reports into a unified dataset processing more than 1B financial records daily. Led migration of 400+ PySpark notebooks from Databricks to Snowflake and rebuilt 11 API-driven ingestion pipelines.",
      highlights: [
        "1B+ financial records processed daily",
        "400+ production workloads migrated",
        "11 API ingestion pipelines rebuilt",
        "8 manual reports consolidated",
        "AI-assisted test automation"
      ]
    }
  },
  {
    year: 2026,
    title: "AI-Native Data Platform Engineering",
    subtitle: "Providence · Current Work",
    domain: "Decision Support · Context Engineering · AI",
    description: {
      impact: "Building decision-support and AI-ready data systems that connect clinical, financial, and operational data across the enterprise.",
      technical: "Developing Snowflake-based data platforms, context engineering workflows, reusable AI skills, and agentic tooling for enterprise data engineering.",
      story: "The focus has expanded from moving and transforming data to engineering the context, systems, and AI capabilities that make enterprise data actionable."
    },
    impact: { metric: "AI + Data", label: "Next-Generation Platform" },
    techStack: ["Snowflake", "SQL", "Python", "FastAPI", "LLMs", "Agentic AI"],
    expanded: {
      details: "Current work spans decision-support datasets, enterprise context engineering, AI-assisted data engineering workflows, and reusable frameworks for building AI-powered data solutions.",
      highlights: [
        "Decision-support systems",
        "Enterprise AI context engineering",
        "Reusable AI skills and agent workflows",
        "AI-ready data platforms",
        "Clinical + financial data integration"
      ]
    }
  }
];

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.TIMELINE_DATA = TIMELINE_DATA;
}