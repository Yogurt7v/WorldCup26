import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useMatchesContext } from '../lib/MatchesContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { syncing, refresh } = useMatchesContext()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <header className="layout-header">
        <div className="container">
          <NavLink to="/" className="logo">
            ⚽ ЧМ-2026
          </NavLink>
          <button
            className={`btn-refresh${syncing ? ' spinning' : ''}`}
            onClick={refresh}
            disabled={syncing}
            title="Обновить данные"
          >
            ↻
          </button>
          <div className="nav">
            <span className="username">👤 {user?.username}</span>
            <NavLink to="/" end>Матчи</NavLink>
            <NavLink to="/leaderboard">Таблица</NavLink>
            <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              Выйти
            </button>
          </div>
        </div>
      </header>
      <main className="layout-main">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </>
  )
}
