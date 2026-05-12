import { createContext, useContext, useState, useEffect } from 'react'
import api, { submissionsApi } from '../api'
import * as taskAttemptService from '../hooks/taskAttemptService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me')
      setUser(res.data)
      
      // Sync solved tasks from server
      try {
        const solvedRes = await submissionsApi.getSolved()
        if (solvedRes.data?.solved_tasks) {
          taskAttemptService.syncSolvedTasks(solvedRes.data.solved_tasks)
        }
      } catch (err) {
        console.error('Error syncing solved tasks:', err)
      }
    } catch (err) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const { access_token, refresh_token } = res.data
    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    await fetchUser()
    return res.data
  }

  const register = async (username, email, password) => {
    const res = await api.post('/auth/register', { username, email, password })
    return res.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    delete api.defaults.headers.common['Authorization']
    
    // Clear task attempts and solved tasks
    taskAttemptService.clearAllAttempts()
    taskAttemptService.clearAllSolved()
    
    setUser(null)
  }

  const refreshToken = async () => {
    const refresh = localStorage.getItem('refresh_token')
    if (!refresh) throw new Error('No refresh token')
    
    const res = await api.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refresh}` }
    })
    const { access_token } = res.data
    localStorage.setItem('access_token', access_token)
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
    return access_token
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshToken,
    fetchUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext
