import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import usersData from '../data/users.json'

const AuthContext = createContext(null)

const STORAGE_KEY = 'wc26_user'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((username) => {
    const trimmed = username.trim()
    if (trimmed.length < 3) {
      throw new Error('Логин должен быть минимум 3 символа')
    }

    const found = usersData.find(
      (u) => u.username.toLowerCase() === trimmed.toLowerCase()
    )

    if (!found) {
      throw new Error('Пользователь не найден')
    }

    const data = { id: found.id, username: found.username, created_at: found.created_at }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    setUser(data)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
