import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMatchesContext } from "../lib/MatchesContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { syncing, refresh } = useMatchesContext();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      <header className="layout-header">
        <div className="container">
          <div style={{ gap: "1rem", display: "flex", alignItems: "center" }}>
            <NavLink to="/" className="logo">
              <img src="/icons/96x96.png" alt="" className="logo-icon" />
            </NavLink>
            <button
              className={`btn-refresh${syncing ? " spinning" : ""}`}
              onClick={refresh}
              disabled={syncing}
              title="Обновить данные"
            >
              ↻
            </button>
          </div>
          <div className="nav">
            <span className="username">👤 {user?.username}</span>
            <NavLink to="/" end>
              Матчи
            </NavLink>
            <NavLink to="/groups">Группы</NavLink>
            <NavLink to="/leaderboard">Таблица</NavLink>
            <button
              onClick={handleLogout}
              className="btn-outline btn-logout"
              title="Выйти"
            >
              ✕
            </button>
          </div>
        </div>
      </header>
      <main className="layout-main">
        <div className="container">
          <Outlet />
        </div>
      </main>

      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <p className="modal-text">Вы уверены, что хотите выйти?</p>
            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowLogoutConfirm(false)}>
                Отмена
              </button>
              <button className="btn btn-primary" onClick={confirmLogout}>
                Выйти
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
