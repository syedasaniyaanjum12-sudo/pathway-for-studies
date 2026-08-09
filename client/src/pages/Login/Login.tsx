import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-xl font-semibold text-slate-900">
        {mode === 'login' ? 'Sign in' : 'Create an account'}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Signing in saves your progress across SQL Practice, Data Analytics, and AI Projects.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {mode === 'register' && (
            <p className="mt-1 text-xs text-slate-400">At least 8 characters.</p>
          )}
        </div>

        {error && (
          <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setError(null)
        }}
        className="mt-4 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

export default Login
