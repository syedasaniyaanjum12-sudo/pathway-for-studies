import type { AiProject } from '../types.js'

// 20 projects (5 per level) spanning the AI engineering skill progression:
// calling LLM APIs → RAG/tool-use/evaluation → agents/fine-tuning/deployment
// → full, showcase-ready products.
export const aiProjects: AiProject[] = [
  // Beginner — fundamentals of working with an LLM API
  {
    id: 'cli-chatbot',
    title: 'Command-Line Chatbot',
    level: 'Beginner',
    description:
      'Build a terminal chatbot that calls an LLM API and keeps conversation history across turns.',
    techStack: ['Python', 'LLM API'],
    skills: ['API calls', 'message history', 'basic prompt design'],
  },
  {
    id: 'prompting-playground',
    title: 'Prompt Engineering Playground',
    level: 'Beginner',
    description:
      'A script that runs the same task through zero-shot, few-shot, and chain-of-thought prompts so you can compare output quality side by side.',
    techStack: ['Python', 'LLM API'],
    skills: ['prompt design', 'output comparison'],
  },
  {
    id: 'text-summarizer-cli',
    title: 'Text Summarizer CLI',
    level: 'Beginner',
    description:
      'A tool that summarizes a pasted article or file into bullet points, with an adjustable target length.',
    techStack: ['Python', 'LLM API'],
    skills: ['system prompts', 'output formatting'],
  },
  {
    id: 'sentiment-classifier',
    title: 'Sentiment Analysis Script',
    level: 'Beginner',
    description:
      'Classify short review snippets as positive/negative/neutral with a zero-shot LLM classifier, then measure accuracy against a small hand-labeled test set.',
    techStack: ['Python', 'LLM API', 'Pandas'],
    skills: ['zero-shot classification', 'basic evaluation'],
  },
  {
    id: 'structured-data-extractor',
    title: 'Structured Data Extractor',
    level: 'Beginner',
    description:
      'Pull structured JSON (name, date, amount) out of unstructured text like receipts or emails, and validate it against a schema.',
    techStack: ['Python', 'LLM API (JSON mode / function calling)'],
    skills: ['structured outputs', 'schema validation'],
  },

  // Intermediate — retrieval, tool use, evaluation
  {
    id: 'rag-document-qa',
    title: 'Document Q&A with RAG',
    level: 'Intermediate',
    description:
      'Answer questions about a set of PDFs or docs by chunking them, embedding the chunks, retrieving the most relevant ones, and grounding the LLM answer in them.',
    techStack: ['Python', 'Embeddings API', 'Vector store (Chroma/FAISS)', 'LLM API'],
    skills: ['chunking', 'embeddings', 'retrieval', 'grounded answers'],
  },
  {
    id: 'function-calling-agent',
    title: 'Function-Calling Utility Agent',
    level: 'Intermediate',
    description:
      'An assistant that uses tool/function calling to reach for a calculator or a mock weather lookup only when it actually needs to.',
    techStack: ['Python', 'LLM API function calling'],
    skills: ['tool schemas', 'multi-step tool use'],
  },
  {
    id: 'semantic-search-engine',
    title: 'Semantic Search Engine',
    level: 'Intermediate',
    description:
      'Build semantic search over a dataset (FAQ articles, movie plots) using embeddings and cosine similarity, with a small web UI.',
    techStack: ['Python or JS', 'Embeddings', 'Vector similarity'],
    skills: ['embeddings', 'ranking', 'basic UI'],
  },
  {
    id: 'llm-eval-harness',
    title: 'LLM Evaluation Harness',
    level: 'Intermediate',
    description:
      'A small framework that runs a fixed set of test prompts through a model and scores the outputs — exact match for some, an LLM-as-judge rubric for others.',
    techStack: ['Python'],
    skills: ['eval design', 'LLM-as-judge', 'prompt regression testing'],
  },
  {
    id: 'support-bot-with-memory',
    title: 'Multi-Turn Support Bot with Memory',
    level: 'Intermediate',
    description:
      'A chatbot that tracks conversation state across turns, handles topic switches, and knows when to say "I\'m not sure" instead of guessing.',
    techStack: ['Python or JS', 'LLM API'],
    skills: ['conversation design', 'guardrails', 'fallback handling'],
  },

  // Advanced — agents, fine-tuning, deployment
  {
    id: 'multi-agent-research-assistant',
    title: 'Multi-Agent Research Assistant',
    level: 'Advanced',
    description:
      'Specialized agents (researcher, summarizer, critic) collaborate under an orchestrator to answer a complex, multi-part question.',
    techStack: ['Python', 'LLM API', 'Agent orchestration'],
    skills: ['agent orchestration', 'role specialization', 'inter-agent communication'],
  },
  {
    id: 'fine-tune-small-model',
    title: 'Fine-Tuning a Small Model',
    level: 'Advanced',
    description:
      'Fine-tune an open-source small model with LoRA on a custom task (e.g. a niche classification or style-transfer dataset), then compare it against the base model.',
    techStack: ['Python', 'Hugging Face Transformers', 'PEFT/LoRA'],
    skills: ['fine-tuning', 'LoRA', 'before/after evaluation'],
  },
  {
    id: 'sandboxed-coding-agent',
    title: 'Autonomous Coding Agent (Sandboxed)',
    level: 'Advanced',
    description:
      'An agent that reads a small codebase, proposes a fix for a failing test, applies it, and re-runs the tests — inside a sandbox, never against a real system.',
    techStack: ['Python', 'LLM API tool use', 'Sandboxed execution'],
    skills: ['code-editing agents', 'safety sandboxing', 'iterative agent loops'],
  },
  {
    id: 'production-rag-pipeline',
    title: 'Production RAG Pipeline',
    level: 'Advanced',
    description:
      'Extend a RAG project into something production-shaped: an ingestion pipeline, retrieval quality metrics, caching, and basic content-safety guardrails.',
    techStack: ['Python', 'Vector DB', 'LLM API'],
    skills: ['pipeline design', 'observability', 'guardrails'],
  },
  {
    id: 'deploy-llm-api',
    title: 'Deploy an LLM App Behind an API',
    level: 'Advanced',
    description:
      'Wrap an earlier project (e.g. the RAG Q&A app) behind a REST API with auth, rate limiting, and request logging, then deploy it.',
    techStack: ['FastAPI or Express', 'Docker', 'Cloud hosting'],
    skills: ['API design', 'rate limiting', 'deployment', 'observability'],
  },

  // Portfolio — capstone-scale, showcase-ready
  {
    id: 'domain-assistant-product',
    title: 'End-to-End Domain-Specific Assistant',
    level: 'Portfolio',
    description:
      'Pick a real domain — study planning, recipe assistance, legal doc review — and build the full thing: ingestion, RAG, tool-using agent, polished UI, and deployment.',
    techStack: ['Full stack', 'LLM APIs', 'Vector DB'],
    skills: ['end-to-end product thinking', 'UX for AI', 'deployment'],
  },
  {
    id: 'data-analysis-copilot',
    title: 'AI-Powered Data Analysis Copilot',
    level: 'Portfolio',
    description:
      'Upload a CSV, ask natural-language questions, and have an LLM agent write and run the Pandas code to answer them — charts included. Pairs naturally with the Data Analytics track.',
    techStack: ['Python', 'Pandas', 'LLM code generation', 'Sandboxed execution', 'Matplotlib'],
    skills: ['code-generation agents', 'sandboxing', 'data visualization'],
  },
  {
    id: 'multimodal-assistant',
    title: 'Multi-Modal Assistant (Text + Image)',
    level: 'Portfolio',
    description:
      'An assistant that reasons over both text and images — receipts, screenshots, diagrams — using a multi-modal model.',
    techStack: ['Python or JS', 'Multi-modal LLM API'],
    skills: ['multi-modal prompting', 'image handling'],
  },
  {
    id: 'oss-contribution',
    title: 'Open-Source AI Tool Contribution',
    level: 'Portfolio',
    description:
      'Ship a real feature, bug fix, or eval improvement to an existing open-source AI tool — agent framework, eval library, whatever fits — with tests and docs.',
    techStack: ['Whatever the project uses'],
    skills: ['reading unfamiliar codebases', 'OSS collaboration', 'PR etiquette'],
  },
  {
    id: 'ai-portfolio-site',
    title: 'Personal AI Portfolio Site with Live Demos',
    level: 'Portfolio',
    description:
      'A site — like this one — that showcases your 3-4 best AI projects with live, embedded demos and write-ups of the design decisions and evaluation results behind each.',
    techStack: ['React or Next.js', 'Deployed demos'],
    skills: ['technical writing', 'product polish', 'self-presentation'],
  },
]
