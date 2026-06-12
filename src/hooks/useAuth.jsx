import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

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

  const login = useCallback(async (username) => {
    const trimmed = username.trim()
    if (trimmed.length < 3) {
      throw new Error('Логин должен быть минимум 3 символа')
    }

    let { data, error } = await supabase
      .from('users')
      .select('id, username, created_at')
      .eq('username', trimmed)
      .maybeSingle()

    if (error) {
      throw new Error('Ошибка при входе')
    }

    if (!data) {
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ username: trimmed })
        .select('id, username, created_at')
        .single()

      if (createError) {
        if (createError.code === '23505') {
          throw new Error('Этот логин уже занят (попробуйте другой)')
        }
        throw new Error('Ошибка при регистрации')
      }
      data = newUser
    }

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
