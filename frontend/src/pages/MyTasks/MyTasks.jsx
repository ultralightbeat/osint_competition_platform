import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tasksApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Breadcrumbs from '../../components/Breadcrumbs'
import TaskCard from '../../components/TaskCard'
import styles from './MyTasks.module.css'

export default function MyTasks() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadTasks()
  }, [isAuthenticated, navigate, user?.id])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError('')
      const res = await tasksApi.list()
      const myTasks = (res.data || []).filter((task) => String(task.author_id) === String(user?.id))
      setTasks(myTasks)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить ваши задачи')
    } finally {
      setLoading(false)
    }
  }

  const sortedTasks = useMemo(
    () => [...tasks].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [tasks]
  )

  const handleEdit = (task) => {
    navigate(`/tasks/${task.id}/edit`)
  }

  const handleDelete = async (task) => {
    const confirmed = window.confirm(`Удалить задачу «${task.title}»? Это действие нельзя отменить.`)
    if (!confirmed) return
    try {
      await tasksApi.delete(task.id)
      setTasks((prev) => prev.filter((item) => item.id !== task.id))
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Не удалось удалить задачу')
    }
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Мои задачи' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <h1 className={styles.title}>Мои задачи</h1>
          <p className={styles.subtitle}>Задачи, созданные вами</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading ? (
          <div className={styles.loading}>
            <div className="spinner spinner-lg" />
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🗂️</div>
            <h3>У вас пока нет задач</h3>
            <p>Создайте первую задачу в разделе создания</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                showActions
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
