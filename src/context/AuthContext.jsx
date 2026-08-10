import { createContext, useContext, useEffect, useState } from 'react'
import * as authApi from '../api/auth.api'
import { TOKEN_KEY } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false))
  }, [])

  async function login(credentials) {
    const data = await authApi.login(credentials)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  async function register(payload) {
    const data = await authApi.register(payload)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
