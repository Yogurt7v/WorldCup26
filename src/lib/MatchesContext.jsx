import { createContext, useContext } from 'react'
import { useMatches } from '../hooks/useMatches'

const MatchesContext = createContext(null)

export function MatchesProvider({ children }) {
  const value = useMatches()
  return <MatchesContext.Provider value={value}>{children}</MatchesContext.Provider>
}

export function useMatchesContext() {
  const ctx = useContext(MatchesContext)
  if (!ctx) throw new Error('useMatchesContext must be used within MatchesProvider')
  return ctx
}
