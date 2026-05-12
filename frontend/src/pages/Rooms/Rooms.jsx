import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { roomsApi, tasksApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Breadcrumbs from '../../components/Breadcrumbs'
import styles from './Rooms.module.css'

const formatDate = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('ru-RU')
}

export default function Rooms() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [tasksMap, setTasksMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const [roomsRes, tasksRes] = await Promise.all([roomsApi.list(), tasksApi.list()])
      const nextRooms = roomsRes.data || []
      const tasks = tasksRes.data || []
      const map = tasks.reduce((acc, task) => {
        acc[task.id] = task.title
        return acc
      }, {})
      setRooms(nextRooms)
      setTasksMap(map)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить список комнат')
    } finally {
      setLoading(false)
    }
  }

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)),
    [rooms]
  )

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Комнаты' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Комнаты</h1>
            <p className={styles.subtitle}>Список созданных комнат 1 на 1</p>
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={loadData}>
              Обновить
            </button>
            {isAuthenticated && (
              <Link to="/rooms/create" className="btn btn-primary">
                Создать комнату
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className="spinner spinner-lg" />
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : sortedRooms.length === 0 ? (
          <div className={styles.empty}>Комнат пока нет</div>
        ) : (
          <div className={styles.grid}>
            {sortedRooms.map((room) => {
              const taskTitle = tasksMap[room.selected_task_id] || 'Задача не найдена'
              const isParticipant = user && [room.player1_id, room.player2_id].some((id) => String(id) === String(user.id))
              return (
                <button
                  key={room.id}
                  type="button"
                  className={styles.card}
                  onClick={() => navigate(`/rooms/${room.id}`)}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.status}>{room.status}</span>
                    <span className={styles.createdAt}>{formatDate(room.created_at)}</span>
                  </div>
                  <div className={styles.taskTitle}>{taskTitle}</div>
                  <div className={styles.meta}>
                    <span>Игроки: {room.player2_id ? '2/2' : '1/2'}</span>
                    <span>Готовность: {room.player1_ready ? '1' : '0'} / {room.player2_ready ? '1' : '0'}</span>
                  </div>
                  {isParticipant && <div className={styles.participant}>Вы в этой комнате</div>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
