import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { roomsApi, tasksApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Breadcrumbs from '../../components/Breadcrumbs'
import TaskCard from '../../components/TaskCard'
import styles from './RoomCreate.module.css'

export default function RoomCreate() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadTasks()
  }, [isAuthenticated, navigate])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await tasksApi.list()
      setTasks(res.data || [])
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить задачи')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (task) => {
    if (!task?.id || submitting) return
    try {
      setSubmitting(true)
      setError('')
      const res = await roomsApi.create({ task_id: task.id })
      navigate(`/rooms/${res.data.id}`)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Не удалось создать комнату')
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Задачи', href: '/tasks' },
    { label: 'Создать комнату' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <h1 className={styles.title}>Создать комнату 1 на 1</h1>
          <p className={styles.subtitle}>
            Выберите задачу кликом по карточке. В комнате подсказки отключены, победные очки не начисляются.
          </p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {submitting && <div className={styles.info}>Создаём комнату…</div>}

        {loading ? (
          <div className={styles.loading}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <div className={styles.grid}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onCardClick={handleCreateRoom} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
