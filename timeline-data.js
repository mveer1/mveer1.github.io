/**
 * Timeline Data Model
 * Each entry drives the interactive timeline rendering.
 * Modes: impact (metrics focus), technical (stack focus), story (narrative focus)
 */
const TIMELINE_DATA = [
  {
    year: 2020,
    title: "Covid Data Exploration Phase",
    subtitle: "Self-taught · Remote Learning",
    description: {
      impact: "Lockdown-driven deep dive into data science — built 5+ personal projects and completed 10+ online certifications in ML, Python, and data analysis.",
      technical: "Learned Python, Pandas, Scikit-learn, SQL, and Jupyter notebooks from scratch. Built end-to-end ML pipelines for personal research projects.",
      story: "When the world stopped, I started. The lockdown became my launchpad — hours of curiosity-driven exploration into data, ML, and the systems behind them."
    },
    impact: { metric: "5+", label: "Projects Built" },
    techStack: ["Python", "Pandas", "Scikit-learn", "SQL"],
    expanded: {
      details: "Started with basic Python scripts and quickly moved into building complete data analysis pipelines. Explored NLP, computer vision, and classical ML algorithms through self-directed projects.",
      highlights: ["10+ certifications completed", "First ML model deployed", "Open source contributions began"]
    }
  },
  {
    year: 2021,
    title: "Machine Learning Engineer Intern",
    subtitle: "Streamn.ai · Part-time",
    description: {
      impact: "Shipped 3 ML models into production and reduced data processing latency by 30% through pipeline optimization.",
      technical: "Worked on applied ML problems — NLP classification, recommendation engines, and real-time inference pipelines using TensorFlow and FastAPI.",
      story: "My first real engineering role. Moving from solo projects to a team taught me that shipping code is only half the job — the other half is making it work reliably at scale."
    },
    impact: { metric: "3", label: "Models Shipped" },
    techStack: ["TensorFlow", "FastAPI", "Docker", "PostgreSQL"],
    expanded: {
      details: "Built and deployed ML models for content recommendation and text classification. Designed data pipelines that processed thousands of records daily with real-time inference capabilities.",
      highlights: ["30% latency reduction", "Production ML deployment", "API design fundamentals"]
    }
  },
  {
    year: 2022,
    title: "Engineering Intern",
    subtitle: "Streamn.ai · Full-time",
    description: {
      impact: "Shipped backend APIs serving 10K+ daily requests and optimized database queries reducing response times by 40%.",
      technical: "Full-stack backend development — REST APIs, data pipelines, PostgreSQL optimization, and CI/CD pipeline setup with GitHub Actions.",
      story: "Transitioned from ML-focused work to broader engineering. Learned that great data systems need great infrastructure — and I wanted to build both."
    },
    impact: { metric: "40%", label: "Faster Queries" },
    techStack: ["Node.js", "PostgreSQL", "Redis", "GitHub Actions"],
    expanded: {
      details: "Owned multiple backend services end-to-end. Implemented caching layers, database indexing strategies, and automated deployment pipelines that reduced release cycles from days to hours.",
      highlights: ["10K+ daily API requests", "CI/CD pipeline automation", "Database performance tuning"]
    }
  },
  {
    year: 2023,
    title: "CS Graduate & SWE Intern",
    subtitle: "BITS Pilani · Fortanix · Providence",
    description: {
      impact: "Graduated with distinction, shipped secure computing features in Rust at Fortanix, and joined Providence as Data Engineer I.",
      technical: "Systems programming in Rust, confidential computing, CI/CD hardening, and transition into cloud data engineering with Azure and Databricks.",
      story: "A year of three chapters — finishing my degree, diving into systems security at Fortanix, and finding my home in data engineering at Providence."
    },
    impact: { metric: "3", label: "Major Milestones" },
    techStack: ["Rust", "Azure", "Databricks", "CI/CD"],
    expanded: {
      details: "Graduated from BITS Pilani with a CS degree. Interned at Fortanix working on confidential computing in Rust. Joined Providence Health as Data Engineer I, beginning work on healthcare data platforms.",
      highlights: ["BITS Pilani CS graduate", "Rust systems programming", "Healthcare data platform onboarding"]
    }
  },
  {
    year: 2024,
    title: "Data Engineer I",
    subtitle: "Providence · Healthcare & Finance",
    description: {
      impact: "Built data pipelines processing 50M+ records daily across healthcare and financial systems, achieving 99.9% uptime.",
      technical: "Azure Data Factory, Databricks, Spark, Delta Lake, and dbt for production-grade ETL/ELT pipelines with full data lineage and quality monitoring.",
      story: "This was the year I stopped being a contributor and started being an owner. Building systems that directly impact patient care changes how you think about reliability."
    },
    impact: { metric: "50M+", label: "Records/Day" },
    techStack: ["Azure", "Spark", "Delta Lake", "dbt"],
    expanded: {
      details: "Designed and maintained production data pipelines for healthcare analytics and financial reporting. Implemented data quality frameworks, automated testing, and monitoring dashboards.",
      highlights: ["99.9% pipeline uptime", "Data quality framework", "Cross-functional leadership"]
    }
  },
  {
    year: 2025,
    title: "Data Engineer II",
    subtitle: "Providence · Promoted",
    description: {
      impact: "Promoted to lead larger systems, mentoring 2 engineers and driving automation that saved 20+ engineering hours per week.",
      technical: "Advanced orchestration with Airflow, infrastructure-as-code with Terraform, and building self-healing data pipelines with automated alerting.",
      story: "Promotion brought new challenges — not just building systems, but leading people. Mentoring engineers taught me that the best systems are built by empowered teams."
    },
    impact: { metric: "20+", label: "Hours Saved/Week" },
    techStack: ["Airflow", "Terraform", "Kubernetes", "Python"],
    expanded: {
      details: "Led automation initiatives that eliminated manual data operations. Mentored junior engineers on best practices in data engineering and cloud architecture.",
      highlights: ["Team mentorship", "Infrastructure automation", "Self-healing pipelines"]
    }
  },
  {
    year: 2026,
    title: "Senior Data Engineering",
    subtitle: "Providence · Current",
    description: {
      impact: "Architecting enterprise-scale workforce optimization and healthcare data platforms serving thousands of users.",
      technical: "Building next-gen data mesh architectures, real-time streaming with Kafka, and AI-augmented data pipelines using LLM-powered transformations.",
      story: "Working at the intersection of data, AI, and healthcare — building the invisible systems that help organizations make better decisions for the people they serve."
    },
    impact: { metric: "∞", label: "Systems Scaling" },
    techStack: ["Kafka", "Data Mesh", "LLMs", "Azure"],
    expanded: {
      details: "Leading the design of next-generation data platforms. Working on staffing optimization, workforce analytics, and healthcare data systems at enterprise scale.",
      highlights: ["Enterprise architecture", "Real-time streaming", "AI-augmented pipelines"]
    }
  }
];

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.TIMELINE_DATA = TIMELINE_DATA;
}
