import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { tasksApi } from '../../api'
import Breadcrumbs from '../../components/Breadcrumbs'
import styles from './Leaderboard.module.css'

export default function TaskLeaderboard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load task info
      const taskRes = await tasksApi.getById(id)
      setTask(taskRes.data)
      
      // Load leaderboard
      const lbRes = await fetch(`/api/tasks/${id}/leaderboard`)
      if (lbRes.ok) {
        const lbData = await lbRes.json()
        setLeaderboard(lbData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRankClass = (position) => {
    if (position === 1) return styles.rank1
    if (position === 2) return styles.rank2
    if (position === 3) return styles.rank3
    return ''
  }

  const getInitials = (name) => name?.charAt(0).toUpperCase() || '?'

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (!task && !loading) {
    return (
      <div className={styles.page}>
        <div className="container">
          <div className={styles.notFound}>
            <h2>Задача не найдена</h2>
            <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
              К списку задач
            </button>
          </div>
        </div>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Задачи', href: '/tasks' },
    { label: task?.title || 'Загрузка...', href: `/tasks/${id}` },
    { label: 'Рейтинг' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <h1 className={styles.title}>Рейтинг по скорости решения</h1>
          {task && (
            <div className={styles.taskInfo}>
              <Link to={`/tasks/${id}`} className={styles.taskLink}>
                ← Вернуться к задаче "{task.title}"
              </Link>
            </div>
          )}
        </div>

        <div className={styles.card}>
          {loading ? (
            <div className={styles.loading}>
              <div className="spinner spinner-lg" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className={styles.empty}>
              <p>Пока никто не решил эту задачу</p>
              <Link to={`/tasks/${id}`} className="btn btn-primary mt-md">
                Стать первым!
              </Link>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Игрок</th>
                    <th style={{ width: '120px' }}>Время</th>
                    <th style={{ width: '180px' }}>Дата решения</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user_id}>
                      <td className={`${styles.rank} ${getRankClass(index + 1)}`}>
                        {index + 1 === 1 && <span style={{ fontSize: '1.5rem' }}>🥇</span>}
                        {index + 1 === 2 && <span style={{ fontSize: '1.5rem' }}>🥈</span>}
                        {index + 1 === 3 && <span style={{ fontSize: '1.5rem' }}>🥉</span>}
                        {index + 1 > 3 && (index + 1)}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className="avatar">
                            {entry.user?.avatar_url ? (
                              <img src={entry.user.avatar_url} alt={entry.user.username} />
                            ) : (
                              getInitials(entry.user?.username)
                            )}
                          </div>
                          <Link to={`/users/${entry.user_id}`} className={styles.username}>
                            {entry.user?.username || 'Unknown'}
                          </Link>
                        </div>
                      </td>
                      <td className={styles.rating}>
                        <strong>{formatTime(entry.time_spent)}</strong>
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                        {formatDate(entry.solved_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
