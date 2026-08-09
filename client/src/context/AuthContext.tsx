import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AuthUser } from '../../../shared/types'
import { getToken, setToken, clearToken } from '../lib/authStorage'
import { login as apiLogin, register as apiRegister, fetchMe } from '../lib/api'

interface AuthContextValue {
  user: AuthUser | null
  /** True until the initial "is there a valid stored token" check resolves —
   * lets the UI avoid flashing a "signed out" state on page load. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On first load, a stored token might still be valid (or might have
  // expired/been revoked) — fetchMe() is the source of truth either way.
  useEffect(() => {
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    fetchMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    const response = await apiLogin(email, password)
    setToken(response.token)
    setUser(response.user)
  }

  async function register(email: string, password: string) {
    const response = await apiRegister(email, password)
    setToken(response.token)
    setUser(response.user)
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
