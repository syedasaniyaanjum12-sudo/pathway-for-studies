import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_LINKS = [
  { to: '/sql-practice', label: 'SQL Practice' },
  { to: '/data-analytics', label: 'Data Analytics' },
  { to: '/ai-projects', label: 'AI Engineer Projects' },
]

// Shared shell for every page: top nav + a slot (<Outlet />) for the active
// route's content. Keeping this separate from App.tsx means adding a new
// page never requires touching the nav again.
function Layout() {
  const { user, loading, logout } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            Pathway for Studies
          </NavLink>
          <div className="flex flex-1 gap-4 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive ? 'text-indigo-600' : 'text-slate-600 hover:text-slate-900'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </div>
          {!loading && (
            <div className="text-sm">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-600">{user.email}</span>
                  <button
                    type="button"
                    onClick={logout}
                    className="font-medium text-slate-500 hover:text-slate-900"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <NavLink to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign in
                </NavLink>
              )}
            </div>
          )}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
