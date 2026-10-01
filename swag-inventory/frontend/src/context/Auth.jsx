import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken, setUnauthorizedHandler } from '../lib/api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const logout = useCallback(() => { setToken(null); setUser(null) }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    if (!getToken()) { setReady(true); return }
    api('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true))
  }, [logout])

  const login = useCallback(async (email, password) => {
    const r = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(r.token)
    setUser(r.user)
  }, [])

  const refreshMe = useCallback(() => api('/auth/me').then(setUser).catch(() => {}), [])

  return <AuthCtx.Provider value={{ user, ready, login, logout, refreshMe }}>{children}</AuthCtx.Provider>
}
export const useAuth = () => useContext(AuthCtx)
