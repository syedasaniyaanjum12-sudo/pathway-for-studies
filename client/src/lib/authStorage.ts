// A thin wrapper around localStorage rather than scattering the key name
// and JSON-vs-string handling across the app. Storing the JWT in
// localStorage (not an httpOnly cookie) is the simplest option for a
// learning app with no other session infra yet — the trade-off is that a
// successful XSS attack could read it. Worth revisiting if this app ever
// handles real user data.
const TOKEN_KEY = 'pathway.authToken'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}
