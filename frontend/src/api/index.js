import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const res = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )
          const { access_token } = res.data
          localStorage.setItem('access_token', access_token)
          api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
          originalRequest.headers.Authorization = `Bearer ${access_token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// API methods
export const authApi = {
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, email, password) => api.post('/auth/register', { username, email, password }),
  logout: () => api.post('/auth/logout'),
  refresh: () => api.post('/auth/refresh'),
  changePassword: (oldPassword, newPassword) => 
    api.post('/auth/password/change', { old_password: oldPassword, new_password: newPassword })
}

export const usersApi = {
  me: () => api.get('/users/me'),
  update: (data) => api.put('/users/me', data),
  getById: (id) => api.get(`/users/${id}`),
  adminDashboard: (search = '') => api.get('/users/admin/dashboard', { params: { search } }),
  adminDeleteUser: (id) => api.delete(`/users/admin/users/${id}`)
}

export const tasksApi = {
  list: () => api.get('/tasks'),
  getById: (id) => api.get(`/tasks/${id}`),
  getEditById: (id) => api.get(`/tasks/${id}/edit-data`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  getTypes: () => api.get('/tasks/types'),
  getDifficulties: () => api.get('/tasks/difficulties'),
  getRandom: () => api.get('/tasks/random'),
  getImageUploadUrl: (data) => api.post('/tasks/image/upload-url', data)
}

export const submissionsApi = {
  submit: (data) => api.post('/submissions', data),
  getById: (id) => api.get(`/submissions/${id}`),
  getByTask: (taskId) => api.get(`/submissions/task/${taskId}`),
  getSolved: () => api.get('/submissions/solved')
}

export const ratingsApi = {
  leaderboard: () => api.get('/ratings/leaderboard'),
  userHistory: (id) => api.get(`/ratings/user/${id}`),
  ranks: () => api.get('/ratings/ranks')
}

export const metricsApi = {
  user: (id) => api.get(`/metrics/user/${id}`),
  platform: () => api.get('/metrics/platform')
}

export const tournamentsApi = {
  list: () => api.get('/tournaments'),
  getById: (id) => api.get(`/tournaments/${id}`),
  create: (data) => api.post('/tournaments', data),
  update: (id, data) => api.put(`/tournaments/${id}`, data),
  delete: (id) => api.delete(`/tournaments/${id}`),
  join: (id) => api.post(`/tournaments/${id}/join`),
  leave: (id) => api.post(`/tournaments/${id}/leave`)
}

export const roomsApi = {
  list: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  join: (id) => api.post(`/rooms/${id}/join`),
  leave: (id) => api.post(`/rooms/${id}/leave`),
  ready: (id, data = {}) => api.post(`/rooms/${id}/ready`, data),
  startMatchmaking: () => api.post('/rooms/matchmaking'),
  cancelMatchmaking: () => api.delete('/rooms/matchmaking')
}

export default api
