import { createContext, useContext, useState, type ReactNode } from 'react'
import type { User, Admin } from '../types'

interface AuthContextValue {
  user: User | null
  admin: Admin | null
  loginUser: (userData: User, token: string) => void
  logoutUser: () => void
  loginAdmin: (adminData: Admin, token: string) => void
  logoutAdmin: () => void
  isAdminLoggedIn: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(localStorage.getItem('malo_current_user') || 'null') }
    catch { return null }
  })

  const [admin, setAdmin] = useState<Admin | null>(() => {
    try { return JSON.parse(localStorage.getItem('malo_admin_user') || 'null') }
    catch { return null }
  })

  const loginUser = (userData: User, token: string) => {
    localStorage.setItem('malo_token', token)
    localStorage.setItem('malo_current_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logoutUser = () => {
    localStorage.removeItem('malo_token')
    localStorage.removeItem('malo_current_user')
    setUser(null)
  }

  const loginAdmin = (adminData: Admin, token: string) => {
    localStorage.setItem('malo_admin_token', token)
    localStorage.setItem('malo_admin_user', JSON.stringify(adminData))
    setAdmin(adminData)
  }

  const logoutAdmin = () => {
    localStorage.removeItem('malo_admin_token')
    localStorage.removeItem('malo_admin_user')
    setAdmin(null)
  }

  const isAdminLoggedIn = !!localStorage.getItem('malo_admin_token')

  return (
    <AuthContext.Provider value={{ user, admin, loginUser, logoutUser, loginAdmin, logoutAdmin, isAdminLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext) as AuthContextValue
