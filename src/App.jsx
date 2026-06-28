import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './components/Login'
import Home from './pages/Home'
import MatchDetails from './pages/MatchDetails'
import LeaderboardPage from './pages/LeaderboardPage'
import GroupsPage from './pages/GroupsPage'

const ResultsPage = lazy(() => import('./pages/ResultsPage'))

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <div className="spinner">Загрузка...</div>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()

  if (loading) {
    return <div className="spinner">Загрузка...</div>
  }

  return (
    <Suspense fallback={<div className="spinner">Загрузка...</div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="match/:id" element={<MatchDetails />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="results" element={<ResultsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
