import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { roomsApi, submissionsApi, tasksApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Breadcrumbs from '../../components/Breadcrumbs'
import RankBadge from '../../components/RankBadge/RankBadge'
import styles from './RoomBattle.module.css'

const POLL_INTERVAL_MS = 3000
const ACTIVE_ROOM_STORAGE_KEY = 'active_room_id'
const isSameUser = (id1, id2) => String(id1 || '') === String(id2 || '')

function PlayerCard({ player, ready, isCurrentUser, isRoomActive, isWinner, onToggleReady }) {
  if (!player) {
    return <div className={styles.playerPlaceholder}>Ожидание игрока</div>
  }

  const initials = player.username?.charAt(0)?.toUpperCase() || '?'
  const canToggle = isCurrentUser && !isRoomActive
  const readyText = ready ? 'Готов' : 'Не готов'

  return (
    <div className={`${styles.playerCard} ${isWinner ? styles.winnerCard : ''}`}>
      <div className={styles.playerTop}>
        <div className={styles.playerIdentity}>
          <div className={`${styles.playerAvatar} ${isWinner ? styles.winnerAvatar : ''}`}>
            {player.avatar_url ? <img src={player.avatar_url} alt={player.username} /> : initials}
          </div>
          <div className={styles.playerInfo}>
            <div className={styles.playerNameRow}>
              <div className={styles.playerName}>{player.username}</div>
              {isWinner && <span className={styles.winnerBadge}>Победитель</span>}
            </div>
            <div className={styles.playerMeta}>
              <RankBadge rank={player.rank} compact />
              <span className={styles.playerRating}>{player.rating || 0} MMR</span>
            </div>
          </div>
        </div>
        {canToggle ? (
          <button
            type="button"
            className={`${styles.readyBadge} ${ready ? styles.readyBadgeReady : styles.readyBadgeNotReady}`}
            onClick={onToggleReady}
          >
            {readyText}
          </button>
        ) : (
          <span className={`${styles.readyBadge} ${ready ? styles.readyBadgeReady : styles.readyBadgeNotReady}`}>
            {readyText}
          </span>
        )}
      </div>
    </div>
  )
}

export default function RoomBattle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()

  const [room, setRoom] = useState(null)
  const [task, setTask] = useState(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadRoom()
  }, [id, isAuthenticated, authLoading, navigate])

  useEffect(() => {
    if (authLoading || !isAuthenticated) return undefined
    const timer = setInterval(loadRoom, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [id, isAuthenticated, authLoading])

  useEffect(() => {
    if (!isAuthenticated || !id) return
    localStorage.setItem(ACTIVE_ROOM_STORAGE_KEY, String(id))
  }, [id, isAuthenticated])

  useEffect(() => {
    if (!['Вы присоединились к комнате', 'Неправильный ответ, попробуйте ещё раз.'].includes(message)) {
      return undefined
    }
    const timer = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [message])

  useEffect(() => {
    if (room?.selected_task_id) {
      loadTask(room.selected_task_id)
    }
  }, [room?.selected_task_id])

  const loadRoom = async () => {
    try {
      const res = await roomsApi.getById(id)
      setRoom(res.data)
      setError('')
    } catch (err) {
      if (err.response?.status === 404 || err.response?.status === 410) {
        if (localStorage.getItem(ACTIVE_ROOM_STORAGE_KEY) === String(id)) {
          localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY)
        }
        navigate('/rooms')
        return
      }
      console.error(err)
      setError('Не удалось загрузить комнату')
    } finally {
      setLoading(false)
    }
  }

  const loadTask = async (taskId) => {
    try {
      const res = await tasksApi.getById(taskId)
      setTask(res.data)
    } catch (err) {
      console.error(err)
      setError('Не удалось загрузить задачу комнаты')
    }
  }

  const myUserId = user?.id
  const isPlayer1 = useMemo(() => isSameUser(room?.player1_id, myUserId), [room?.player1_id, myUserId])
  const isPlayer2 = useMemo(() => isSameUser(room?.player2_id, myUserId), [room?.player2_id, myUserId])
  const isParticipant = isPlayer1 || isPlayer2
  const canJoin = room && !isParticipant && !room.player2_id && room.status === 'waiting'
  const canSubmit = isParticipant && room?.status === 'active' && !room?.winner_id
  const isGameStarted = room?.status === 'active' || Boolean(room?.winner_id)
  const elapsedSeconds = room?.started_at ? Math.max(0, Math.floor((Date.now() - new Date(room.started_at).getTime()) / 1000)) : 0

  const handleJoin = async () => {
    try {
      await roomsApi.join(id)
      setMessage('Вы присоединились к комнате')
      await loadRoom()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Не удалось присоединиться')
    }
  }

  const handleToggleReady = async () => {
    const isReady = (isPlayer1 && room?.player1_ready) || (isPlayer2 && room?.player2_ready)
    try {
      await roomsApi.ready(id, { ready: !isReady })
      await loadRoom()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Не удалось изменить готовность')
    }
  }

  const handleLeave = async () => {
    try {
      await roomsApi.leave(id)
      localStorage.removeItem(ACTIVE_ROOM_STORAGE_KEY)
      navigate('/rooms')
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Не удалось выйти из комнаты')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || !answer.trim() || submitting) return
    try {
      setSubmitting(true)
      setError('')
      setMessage('')
      const res = await submissionsApi.submit({
        task_id: room.selected_task_id,
        room_id: id,
        answer: answer.trim(),
        elapsed_time_spent: elapsedSeconds,
        used_hints_count: 0
      })
      setAnswer('')
      if (res.data.is_correct) {
        setMessage('')
      } else {
        setMessage('Неправильный ответ, попробуйте ещё раз.')
      }
      await loadRoom()
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Ошибка отправки ответа')
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Комнаты', href: '/rooms' },
    { label: 'Игра' }
  ]

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className={styles.page}>
        <div className="container">
          <Breadcrumbs items={breadcrumbs} compact />
          <div className={styles.error}>Комната не найдена</div>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className={styles.loading}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  const previewImage = task.content?.image_url || task.content?.image_urls?.[0] || task.content?.images?.[0]?.url
  const hasWinner = Boolean(room.winner_id)
  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <h1 className={styles.title}>{task.title}</h1>
          <div className={styles.headerActions}>
            {canJoin && (
              <button type="button" className="btn btn-primary" onClick={handleJoin}>
                Присоединиться
              </button>
            )}
            {isParticipant && (
              <button type="button" className="btn btn-danger" onClick={handleLeave}>
                Выйти из комнаты
              </button>
            )}
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.message}>{message}</div>}

        <div className={styles.layout}>
          <section className={styles.taskBlock}>
            {previewImage && (
              <img src={previewImage} alt={task.title} className={styles.taskImage} />
            )}
            {isGameStarted ? (
              <div className={styles.taskDescription}>{task.description}</div>
            ) : (
              <div className={styles.taskSpoiler}>Описание откроется после готовности всех игроков</div>
            )}
          </section>

          <aside className={styles.sidebar}>
            <div className={styles.playersBlock}>
              <h3 className={styles.sidebarTitle}>Игроки</h3>
              <PlayerCard
                player={room.player1}
                ready={room.player1_ready}
                isCurrentUser={isPlayer1}
                isRoomActive={room.status === 'active'}
                isWinner={isSameUser(room.winner_id, room.player1?.id)}
                onToggleReady={handleToggleReady}
              />
              <PlayerCard
                player={room.player2}
                ready={room.player2_ready}
                isCurrentUser={isPlayer2}
                isRoomActive={room.status === 'active'}
                isWinner={isSameUser(room.winner_id, room.player2?.id)}
                onToggleReady={handleToggleReady}
              />
            </div>

            <div className={styles.answerBlock}>
              <h3 className={styles.sidebarTitle}>Ответ</h3>
              {canSubmit ? (
                <form className={styles.form} onSubmit={handleSubmit}>
                  <input
                    className="input"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Введите ответ"
                  />
                  <button type="submit" className="btn btn-primary" disabled={submitting || !answer.trim()}>
                    {submitting ? 'Проверка...' : 'Отправить ответ'}
                  </button>
                </form>
              ) : (
                <div className={styles.answerHint}>
                  {hasWinner
                    ? 'Игра завершена.'
                    : 'Отправка ответа станет доступна после старта игры.'}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
