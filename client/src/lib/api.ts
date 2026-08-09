import type {
  SqlQuestion,
  DataAnalyticsExercise,
  AiProject,
  AuthResponse,
  AuthUser,
  ProgressSummary,
  ProjectStatus,
} from '../../../shared/types'
import { getToken } from './authStorage'

// Every request goes through /api/..., proxied by Vite (see vite.config.ts)
// to the Express server in dev, and by the same reverse proxy in production
// (Phase 6+) — so this file never needs an absolute host/port.
async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {}
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(path, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `${path} responded with ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function fetchSqlQuestions(): Promise<SqlQuestion[]> {
  return request('/api/sql-questions')
}

export function fetchDataAnalyticsExercises(): Promise<DataAnalyticsExercise[]> {
  return request('/api/data-analytics-exercises')
}

export function fetchAiProjects(): Promise<AiProject[]> {
  return request('/api/ai-projects')
}

// --- Auth ---

export function register(email: string, password: string): Promise<AuthResponse> {
  return request('/api/auth/register', { method: 'POST', body: { email, password } })
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request('/api/auth/login', { method: 'POST', body: { email, password } })
}

export function fetchMe(): Promise<AuthUser> {
  return request('/api/auth/me', { auth: true })
}

// --- Progress tracking ---

export function fetchProgress(): Promise<ProgressSummary> {
  return request('/api/me/progress', { auth: true })
}

export function submitSqlQuestion(
  questionId: string,
  submittedQuery: string,
  isCorrect: boolean,
): Promise<void> {
  return request(`/api/sql-questions/${questionId}/submissions`, {
    method: 'POST',
    body: { submittedQuery, isCorrect },
    auth: true,
  })
}

export function submitDataAnalyticsExercise(
  exerciseId: string,
  submittedCode: string,
  isCorrect: boolean,
): Promise<void> {
  return request(`/api/data-analytics-exercises/${exerciseId}/submissions`, {
    method: 'POST',
    body: { submittedCode, isCorrect },
    auth: true,
  })
}

export function setProjectStatus(projectId: string, status: ProjectStatus): Promise<void> {
  return request(`/api/ai-projects/${projectId}/status`, {
    method: 'PUT',
    body: { status },
    auth: true,
  })
}
