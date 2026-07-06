/**
 * Timeline Data Model
 * Each entry drives the interactive timeline rendering.
 * Modes: impact (metrics focus), technical (stack focus), story (narrative focus)
 */
const TIMELINE_DATA = [
  {
    year: 2020,
    title: "Data Exploration & ML Foundations",
    subtitle: "Self-taught · Remote Learning",
    domain: "Data Science · Machine Learning",
    description: {
      impact: "Built multiple personal ML and data analysis projects during the pandemic, laying the technical foundation for a career in data engineering.",
      technical: "Learned Python, Pandas, SQL, and Scikit-learn while building end-to-end ML experiments and data exploration pipelines in Jupyter.",
      story: "Lockdown curiosity turned into technical obsession — long hours learning how data systems work, from simple analysis notebooks to full ML workflows."
    },
    impact: { metric: "5+", label: "Projects Built" },
    techStack: ["Python", "Pandas", "Scikit-learn", "SQL"],
    expanded: {
      details: "Started with exploratory analysis and gradually built full ML workflows including data preprocessing, model training, and evaluation.",
      highlights: [
        "First ML models trained and evaluated",
        "Developed strong Python and SQL foundations",
        "Explored NLP and classical machine learning algorithms"
      ]
    }
  },
  {
    year: 2021,
    title: "Machine Learning Engineer Intern",
    subtitle: "Streamn.ai · Remote",
    domain: "Media AI · Content Processing",
    description: {
      impact: "Built backend services supporting machine learning workflows handling 10K+ weekly API requests.",
      technical: "Developed REST APIs using FastAPI and integrated ML pipelines for text recognition and multimedia processing.",
      story: "First real engineering environment — learning that building ML models is easy compared to building reliable systems around them."
    },
    impact: { metric: "10K+", label: "API Requests / Week" },
    techStack: ["Python", "FastAPI", "Flask", "MySQL"],
    expanded: {
      details: "Worked on ML inference pipelines and backend services that generated image outputs from incoming video streams.",
      highlights: [
        "Production ML API deployment",
        "Backend service development",
        "Real-world data pipeline experience"
      ]
    }
  },
  {
    year: 2022,
    title: "Machine Learning Engineer (Intern → Part-time)",
    subtitle: "Streamn.ai · Remote",
    domain: "Media Processing · Applied ML Systems",
    description: {
      impact: "Optimized text recognition pipeline improving execution speed by 30% and supported media processing services used in production systems.",
      technical: "Worked across Python, Bash scripting, and backend systems to optimize data processing and inference pipelines.",
      story: "Shifted focus from pure ML experimentation to building practical engineering systems that deliver results at scale."
    },
    impact: { metric: "30%", label: "Pipeline Speed Improvement" },
    techStack: ["Python", "Bash", "FastAPI", "SQLite"],
    expanded: {
      details: "Designed backend services for multimedia processing workflows and supported data pipelines used for automated content generation.",
      highlights: [
        "Pipeline performance optimization",
        "Backend API development",
        "Production ML systems exposure"
      ]
    }
  },
  {
    year: 2023,
    title: "CS Graduate & Systems Engineering",
    subtitle: "BITS Pilani · Fortanix · Providence",
    domain: "Systems Security → Data Engineering",
    description: {
      impact: "Graduated in Computer Science, worked on confidential computing systems in Rust at Fortanix, and joined Providence as a Data Engineer.",
      technical: "Built Rust unit tests for encryption and key management modules and integrated them into CI/CD pipelines.",
      story: "A transition year — from academic learning to real-world engineering across security systems and enterprise data platforms."
    },
    impact: { metric: "35%", label: "Test Coverage Increase" },
    techStack: ["Rust", "Docker", "GitHub Actions", "CI/CD"],
    expanded: {
      details: "Improved reliability of encryption modules through automated testing and integrated secure build pipelines for production workflows.",
      highlights: [
        "Rust systems programming",
        "Confidential computing exposure",
        "Entry into enterprise data engineering"
      ]
    }
  },
  {
    year: 2024,
    title: "Data Engineer I",
    subtitle: "Providence · Healthcare Workforce Systems",
    domain: "Healthcare Operations Data",
    description: {
      impact: "Re-engineered workforce scheduling system used for 6k+ clinicians, reducing processing runtime by 92%.",
      technical: "Built Snowflake SQL pipelines and Control-M workflows for operational healthcare data involving labor, staffing, and scheduling datasets.",
      story: "First year owning production healthcare systems — where reliability directly affects real operational decisions."
    },
    impact: { metric: "92%", label: "Runtime Reduction" },
    techStack: ["Snowflake", "SQL", "Oracle", "Control-M"],
    expanded: {
      details: "Redesigned scheduling logic for Mandatory Days Off system and led migration of time-entry datasets across multiple schemas.",
      highlights: [
        "End-to-end system ownership",
        "Healthcare workforce analytics",
        "Operational data modeling"
      ]
    }
  },
  {
    year: 2025,
    title: "Data Engineer II",
    subtitle: "Providence · Healthcare & Financial Data Systems",
    domain: "Enterprise Data Platforms",
    description: {
      impact: "Built financial reconciliation pipelines processing 1B+ records daily and led platform automation initiatives.",
      technical: "Worked across Snowflake, Azure Data Factory, and Control-M to build large-scale pipelines integrating financial and operational datasets.",
      story: "This phase moved from pipeline engineering to system architecture — building data platforms that multiple teams depend on."
    },
    impact: { metric: "1B+", label: "Records Processed Daily" },
    techStack: ["Snowflake", "Azure Data Factory", "Python", "Streamlit"],
    expanded: {
      details: "Led migration of Databricks pipelines to Snowflake, converted 400+ PySpark notebooks, and built AI-assisted test automation framework.",
      highlights: [
        "400+ pipeline migration",
        "Data platform modernization",
        "Engineering automation systems"
      ]
    }
  },
  {
    year: 2026,
    title: "Data Platform Engineering",
    subtitle: "Providence · Current Work",
    domain: "Healthcare + Financial Analytics",
    description: {
      impact: "Building decision support systems combining clinical and financial data to support cost and care optimization.",
      technical: "Developing Snowflake-based analytics pipelines integrating healthcare operations, workforce data, and financial reporting systems.",
      story: "Working at the intersection of healthcare operations, finance, and data platforms — building the infrastructure behind large-scale decision systems."
    },
    impact: { metric: "Multi-TB", label: "Enterprise Data Systems" },
    techStack: ["Snowflake", "SQL", "Python", "Azure"],
    expanded: {
      details: "Current work focuses on enterprise data platform modernization, financial reconciliation systems, and healthcare decision-support datasets.",
      highlights: [
        "Enterprise healthcare analytics",
        "Financial reconciliation platforms",
        "Cross-domain data systems"
      ]
    }
  }
];

// Export for use in app.js
if (typeof window !== 'undefined') {
  window.TIMELINE_DATA = TIMELINE_DATA;
}
