import type {
  SqlQuestion,
  DataAnalyticsExercise,
  AiProject,
  AuthResponse,
  AuthUser,
  ProgressSummary,
  ProjectStatus,
  SubmissionResult,
} from '../../../shared/types'
import { getToken } from './authStorage'

// In dev, requests go through /api/..., proxied by Vite (see
// vite.config.ts) to the Express server — VITE_API_BASE_URL is unset, so
// this resolves to '' and paths stay relative. A split production
// deployment (client on Vercel, server on Render — see docs/DEPLOY.md) has
// no such proxy, since the two are on different origins; setting
// VITE_API_BASE_URL to the deployed API's URL at build time is what makes
// the same relative-path code work there too. Read directly from
// import.meta.env (not layered behind a helper) since Vite only
// statically replaces exact `import.meta.env.VITE_*` expressions at build
// time — wrapping it in a function would prevent that replacement.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
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

// Both submit functions return a SubmissionResult so the UI can tell
// whether the server independently re-graded the attempt (gradedBy:
// 'server', Interview-tier questions — Phase 6) or just recorded the
// client's own grading result (gradedBy: 'client', everything else).
export function submitSqlQuestion(
  questionId: string,
  submittedQuery: string,
  isCorrect: boolean,
): Promise<SubmissionResult> {
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
): Promise<SubmissionResult> {
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
