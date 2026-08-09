import type { SqlQuestion, DataAnalyticsExercise, AiProject } from '../../../shared/types'

// Every request goes through /api/..., proxied by Vite (see vite.config.ts)
// to the Express server in dev, and by the same reverse proxy in production
// (Phase 6+) — so this file never needs an absolute host/port.
async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`${path} responded with ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function fetchSqlQuestions(): Promise<SqlQuestion[]> {
  return getJson('/api/sql-questions')
}

export function fetchDataAnalyticsExercises(): Promise<DataAnalyticsExercise[]> {
  return getJson('/api/data-analytics-exercises')
}

export function fetchAiProjects(): Promise<AiProject[]> {
  return getJson('/api/ai-projects')
}
