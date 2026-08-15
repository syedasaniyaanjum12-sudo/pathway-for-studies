// Phase 9 (Gamification Phase 2): the World Map. Groups the same content
// used by the three track pages (shared/data/sqlQuestions.ts,
// dataAnalyticsExercises.ts, aiProjects.ts) into themed "Worlds" ordered
// into a career-progression path, each advisory-gated behind a Level (see
// shared/data/levels.ts) — no new content, just a new lens on existing
// content. See docs/PLAN.md's "Gamification plan" for the full design.
import type { ProjectLevel } from '../types.js'

export type WorldTrack = 'sql' | 'data-analytics' | 'ai-projects'

export interface WorldDef {
  id: string
  title: string
  icon: string
  description: string
  track: WorldTrack
  /** SQL Practice / Data Analytics worlds: matches SqlQuestion.topic /
   * DataAnalyticsExercise.topic (OR'd together — a question belongs to
   * this world if its topic is any of these). */
  topics?: string[]
  /** AI Projects worlds: matches AiProject.level. */
  projectLevel?: ProjectLevel
  /** The Level (0-10, see shared/data/levels.ts) a learner should have
   * reached before this world counts as "unlocked" on the World Map.
   * Advisory only, never enforced: every question/exercise/project stays
   * directly reachable from its own track page regardless of lock state —
   * see docs/PLAN.md's Phase 2 note on why this is a soft gate. */
  unlockLevel: number
}

// Ordered as a career path: SQL fundamentals -> data wrangling -> SQL
// patterns/cleaning in parallel -> EDA/viz -> advanced SQL alongside first
// AI builds -> increasingly senior AI Engineer work -> portfolio capstones.
export const WORLDS: WorldDef[] = [
  {
    id: 'sql-foundations',
    title: 'SQL Foundations',
    icon: '🗺️',
    description: 'SELECT, WHERE, ORDER BY — the basics every query builds on.',
    track: 'sql',
    topics: ['Basics', 'Filtering', 'Sorting & Limiting'],
    unlockLevel: 0,
  },
  {
    id: 'sql-aggregates-joins',
    title: 'Joins & Aggregates',
    icon: '🔗',
    description: 'Combine tables and summarize rows with GROUP BY.',
    track: 'sql',
    topics: ['Aggregation', 'Joins'],
    unlockLevel: 1,
  },
  {
    id: 'da-numpy-pandas',
    title: 'NumPy & Pandas Basics',
    icon: '🐼',
    description: 'Arrays, DataFrames, and the Python data-analysis toolkit.',
    track: 'data-analytics',
    topics: ['NumPy', 'Pandas'],
    unlockLevel: 2,
  },
  {
    id: 'sql-patterns',
    title: 'SQL Patterns & Text/Date Handling',
    icon: '🧩',
    description: 'Subqueries, CASE WHEN, string and date functions.',
    track: 'sql',
    topics: ['Subqueries', 'CASE WHEN', 'String Functions', 'Date Functions'],
    unlockLevel: 3,
  },
  {
    id: 'da-cleaning',
    title: 'Data Cleaning',
    icon: '🧹',
    description: 'Handle messy data and missing values before analysis.',
    track: 'data-analytics',
    topics: ['Data Cleaning', 'Missing Values'],
    unlockLevel: 3,
  },
  {
    id: 'da-eda-viz',
    title: 'EDA & Visualization',
    icon: '📊',
    description: 'Explore datasets and communicate findings with charts.',
    track: 'data-analytics',
    topics: ['EDA', 'Data Visualization'],
    unlockLevel: 4,
  },
  {
    id: 'sql-advanced',
    title: 'Advanced SQL Engineering',
    icon: '🏛️',
    description: 'Window functions, views, and query performance.',
    track: 'sql',
    topics: ['Window Functions', 'Views', 'Indexes & Query Optimization'],
    unlockLevel: 5,
  },
  {
    id: 'ai-beginner',
    title: 'AI Engineer: First Builds',
    icon: '🤖',
    description: 'Ship your first small AI-powered tools.',
    track: 'ai-projects',
    projectLevel: 'Beginner',
    unlockLevel: 5,
  },
  {
    id: 'ai-intermediate',
    title: 'AI Systems Building',
    icon: '⚙️',
    description: 'RAG, semantic search, and agents with tools and memory.',
    track: 'ai-projects',
    projectLevel: 'Intermediate',
    unlockLevel: 6,
  },
  {
    id: 'ai-advanced',
    title: 'Advanced AI Engineering',
    icon: '🧠',
    description: 'Fine-tuning, multi-agent systems, production pipelines.',
    track: 'ai-projects',
    projectLevel: 'Advanced',
    unlockLevel: 8,
  },
  {
    id: 'ai-portfolio',
    title: 'Portfolio & Job-Ready',
    icon: '🏆',
    description: 'Capstone projects built to show employers.',
    track: 'ai-projects',
    projectLevel: 'Portfolio',
    unlockLevel: 10,
  },
]

export function getWorldById(id: string): WorldDef | undefined {
  return WORLDS.find((w) => w.id === id)
}
