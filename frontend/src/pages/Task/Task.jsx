import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { tasksApi, submissionsApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { usePersistentTimer } from '../../hooks/usePersistentTimer'
import * as taskAttemptService from '../../hooks/taskAttemptService'
import Breadcrumbs from '../../components/Breadcrumbs'
import Timer from '../../components/Timer'
import { SlArrowRight } from 'react-icons/sl'
import { DIFFICULTY_COLORS, TAG_COLORS, TASK_TYPE_LABELS } from '../../constants/tags'
import styles from './Task.module.css'

const getHintsStorageKey = (taskId) => `task_hints_opened_${taskId}`
const getDescriptionUnlockedStorageKey = (taskId) => `task_description_unlocked_${taskId}`
const HINT_PENALTY_PERCENT_PER_HINT = 10
const HINT_TIME_PENALTY_SECONDS = 10
const MAX_HINTS_PER_TASK = 3

export default function Task() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSolved, setIsSolved] = useState(false)
  const [leaderboardRank, setLeaderboardRank] = useState(null)
  const [solvedTime, setSolvedTime] = useState(null)
  const [openedHintsCount, setOpenedHintsCount] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isDescriptionUnlocked, setIsDescriptionUnlocked] = useState(false)

  const { time, isRunning, hasStarted, start, stop, complete, formatTime } = usePersistentTimer(id)

  useEffect(() => {
    loadTask()
    checkIfSolved()
  }, [id])

  useEffect(() => {
    if (!id) return
    const saved = parseInt(localStorage.getItem(getHintsStorageKey(id)) || '0', 10)
    if (Number.isNaN(saved) || saved < 0) {
      setOpenedHintsCount(0)
      return
    }
    setOpenedHintsCount(saved)
  }, [id])

  useEffect(() => {
    if (!id) return
    const saved = localStorage.getItem(getDescriptionUnlockedStorageKey(id))
    setIsDescriptionUnlocked(saved === '1')
  }, [id])

  useEffect(() => {
    if (!id || !hasStarted) return
    setIsDescriptionUnlocked(true)
    localStorage.setItem(getDescriptionUnlockedStorageKey(id), '1')
  }, [hasStarted, id])

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [task?.id])

  const checkIfSolved = async () => {
    // Check localStorage first
    if (taskAttemptService.isSolved(id)) {
      setIsSolved(true)
      // Try to fetch leaderboard position
      try {
        const res = await tasksApi.getById(id)
        // Get leaderboard to find user's rank
        const lbRes = await fetch(`/api/tasks/${id}/leaderboard`)
        if (lbRes.ok) {
          const lbData = await lbRes.json()
          const userEntry = lbData.find(entry => entry.user_id === isAuthenticated)
          if (userEntry) {
            setLeaderboardRank(userEntry.rank)
            setSolvedTime(userEntry.time_spent)
          }
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
      }
    }
  }

  const loadTask = async () => {
    try {
      setLoading(true)
      const res = await tasksApi.getById(id)
      setTask(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (isTournamentEnded) return
    start()
    setIsDescriptionUnlocked(true)
    localStorage.setItem(getDescriptionUnlockedStorageKey(id), '1')
  }

  const handleShowNextHint = () => {
    if (!hasStarted) return
    setOpenedHintsCount((prev) => {
      const next = Math.min(prev + 1, taskHints.length)
      localStorage.setItem(getHintsStorageKey(id), String(next))
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim() || submitting) return

    setSubmitting(true)
    setErrorMessage('') // Clear previous error

    try {
      const availableHintsCount = Math.min(
        MAX_HINTS_PER_TASK,
        Array.isArray(task?.hints) ? task.hints.filter(Boolean).length : 0
      )
      const usedHintsCount = Math.min(openedHintsCount, availableHintsCount)

      const res = await submissionsApi.submit({
        task_id: id,
        answer: answer.trim(),
        elapsed_time_spent: time,
        used_hints_count: usedHintsCount
      })

      // Check if submission was successful
      setTask((prev) => {
        if (!prev) return prev
        const nextAttempted = (prev.times_attempted || 0) + 1
        const nextSolved = res.data.is_correct ? (prev.times_solved || 0) + 1 : (prev.times_solved || 0)
        return {
          ...prev,
          times_attempted: nextAttempted,
          times_solved: nextSolved
        }
      })

      if (res.data.is_correct) {
        stop() // Stop timer only on correct answer
        complete() // Mark as completed in localStorage
        setIsSolved(true)
        setLeaderboardRank(res.data.rank)
        setSolvedTime(res.data.time_spent ?? totalTimeWithPenalty)
      } else {
        // Wrong answer - just show error, timer keeps running
        setErrorMessage('Неправильный ответ, попробуйте еще раз')
        setAnswer('') // Clear input for next try
        
        // Auto-hide error after 3 seconds
        setTimeout(() => setErrorMessage(''), 3000)
      }
      setSubmitting(false)
    } catch (err) {
      console.error(err)
      
      // Check if error is "already solved"
      if (err.response?.status === 400 && err.response?.data?.error?.includes('already solved')) {
        setIsSolved(true)
      } else {
        setErrorMessage('Ошибка при отправке ответа')
        setTimeout(() => setErrorMessage(''), 3000)
      }
      
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>🔍</div>
        <h2>Задача не найдена</h2>
        <button className="btn btn-primary mt-md" onClick={() => navigate('/tasks')}>
          К списку задач
        </button>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Задачи', href: '/tasks' },
    { label: task.title },
    { label: 'Рейтинг', href: `/tasks/${id}/leaderboard` }
  ]

  const taskHints = Array.isArray(task.hints) ? task.hints.filter(Boolean) : []
  const hasHints = taskHints.length > 0
  const normalizedOpenedHintsCount = Math.min(openedHintsCount, taskHints.length)
  const visibleHints = taskHints.slice(0, normalizedOpenedHintsCount)
  const hasMoreHints = normalizedOpenedHintsCount < taskHints.length
  const hintPenaltyPercent = normalizedOpenedHintsCount * HINT_PENALTY_PERCENT_PER_HINT
  const penaltyTimeSeconds = normalizedOpenedHintsCount * HINT_TIME_PENALTY_SECONDS
  const totalTimeWithPenalty = time + penaltyTimeSeconds
  const difficultyColor = DIFFICULTY_COLORS[task.difficulty] || '#64748b'
  const difficultyLabel = task.difficulty === 'easy' ? 'Легкая' : task.difficulty === 'medium' ? 'Средняя' : task.difficulty === 'hard' ? 'Сложная' : task.difficulty
  const taskTypeLabel = TASK_TYPE_LABELS[task.task_type] || task.task_type
  const hasTypeTag = (task.tags || []).some((t) => t.tag === taskTypeLabel)
  const imageUrls = (() => {
    if (Array.isArray(task.content?.image_urls) && task.content.image_urls.length > 0) {
      return task.content.image_urls.filter(Boolean)
    }
    if (Array.isArray(task.content?.images) && task.content.images.length > 0) {
      return task.content.images.map((image) => image?.url).filter(Boolean)
    }
    if (task.content?.image_url) return [task.content.image_url]
    return []
  })()
  const hasMultipleImages = imageUrls.length > 1
  const activeImageUrl = imageUrls[currentImageIndex] || imageUrls[0]
  const isDescriptionVisible = isDescriptionUnlocked || hasStarted
  const isTournament = Boolean(task.is_tournament)
  const isTournamentExpiredByTime = isTournament && task.close_at && Date.now() >= new Date(task.close_at).getTime()
  const isTournamentEnded = isTournament && (Boolean(task.tournament_ended) || task.status === 'archived' || isTournamentExpiredByTime)

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.taskHeader}>
          <div className={styles.taskInfo}>
            <h1 className={styles.title}>{task.title}</h1>
            <div className={styles.meta}>
              {(task.tags || []).map((t, i) => {
                const color = TAG_COLORS[t.tag] || '#64748b'
                return (
                  <span
                    key={`${t.tag}-${i}`}
                    className={styles.tagPill}
                    style={{ '--tag-color': color, '--tag-bg': `${color}20` }}
                  >
                    {t.tag}
                  </span>
                )
              })}
              {!hasTypeTag && (
                <span
                  className={styles.tagPill}
                  style={{ '--tag-color': TAG_COLORS[taskTypeLabel] || '#64748b', '--tag-bg': `${TAG_COLORS[taskTypeLabel] || '#64748b'}20` }}
                >
                  {taskTypeLabel}
                </span>
              )}
              <span
                className={styles.tagPill}
                style={{ '--tag-color': difficultyColor, '--tag-bg': `${difficultyColor}20` }}
              >
                {difficultyLabel}
              </span>
              {isTournament && (
                <span className={styles.tournamentBadge}>
                  {isTournamentEnded ? 'Турнир окончен' : 'Турнир'}
                </span>
              )}
              <span className={styles.points}>+{task.points} очков</span>
            </div>
          </div>

          <div className={styles.timerSection}>
            <Timer time={time} isRunning={isRunning} large penaltyTime={penaltyTimeSeconds} />
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.description}>
            <h2 className={styles.descriptionTitle}>Описание задачи</h2>
            <div className={`${styles.descriptionBody} ${!isDescriptionVisible ? styles.descriptionBodyLocked : ''}`}>
              <div className={styles.descriptionText}>
                {task.description}
              </div>
              
              {activeImageUrl && (
                <div className={styles.imageContent}>
                  <div className={styles.imageFrame}>
                    <img
                      src={activeImageUrl}
                      alt="Task content" 
                      className={styles.taskImage}
                    />
                    {hasMultipleImages && (
                      <>
                        <button
                          type="button"
                          className={`${styles.sliderButton} ${styles.sliderButtonLeft}`}
                          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length)}
                        >
                          <SlArrowRight className={`${styles.sliderIcon} ${styles.sliderIconLeft}`} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.sliderButton} ${styles.sliderButtonRight}`}
                          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length)}
                        >
                          <SlArrowRight className={styles.sliderIcon} />
                        </button>
                        <span className={styles.sliderCounter}>
                          {currentImageIndex + 1} / {imageUrls.length}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {!isDescriptionVisible && (
                <div className={styles.spoilerOverlay}>
                  <span className={styles.spoilerBadge}>Описание скрыто до начала решения</span>
                </div>
              )}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.answerSection}>
              <h3 className={styles.answerTitle}>Ваш ответ</h3>
              
              {isSolved ? (
                <div>
                  <div className={`${styles.result} ${styles.resultCorrect}`}>
                    ✓ Задача решена!
                  </div>
                  <p className="text-center text-secondary mt-md">
                    Время: {formatTime(solvedTime || totalTimeWithPenalty)}
                  </p>
                  {leaderboardRank && (
                    <p className="text-center mt-sm">
                      <strong>Место в рейтинге: #{leaderboardRank}</strong>
                    </p>
                  )}
                </div>
              ) : isTournamentEnded ? (
                <div className={styles.tournamentEndedBlock}>
                  <button className={`btn btn-secondary ${styles.startButton}`} disabled>
                    Турнир окончен
                  </button>
                </div>
              ) : !hasStarted ? (
                <button 
                  className={`btn btn-primary ${styles.startButton}`}
                  onClick={handleStart}
                >
                  Начать решение
                </button>
              ) : (
                <form className={styles.answerForm} onSubmit={handleSubmit}>
                  {errorMessage && (
                    <div className={`${styles.errorMessage}`}>
                      {errorMessage}
                    </div>
                  )}
                  <input
                    type="text"
                    className={styles.answerInput}
                    placeholder="Введите ответ..."
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={submitting}
                    autoFocus
                  />
                  <button 
                    type="submit"
                    className={`btn btn-primary ${styles.submitButton}`}
                    disabled={!answer.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner" />
                        Проверка...
                      </>
                    ) : (
                      'Отправить ответ'
                    )}
                  </button>
                </form>
              )}
            </div>

            {hasHints && (
              <div className={styles.hintsCard}>
                <div className={styles.hintsHeader}>
                  <h4 className={styles.hintsTitle}>Подсказки</h4>
                  <div className={styles.hintsInfo}>
                    <span className={styles.infoDot}>i</span>
                    <span className={styles.infoTooltip}>
                      Каждая подсказка добавляет +{formatTime(HINT_TIME_PENALTY_SECONDS)} ко времени решения.
                    </span>
                  </div>
                </div>

                <div className={styles.hintsBody}>
                  {hasMoreHints ? (
                    <button
                      type="button"
                      className={`btn btn-secondary ${styles.hintButton}`}
                      onClick={handleShowNextHint}
                      disabled={!hasStarted}
                      title={!hasStarted ? 'Начните решение, чтобы открыть подсказки' : 'Открыть подсказки'}
                    >
                      Открыть подсказку {normalizedOpenedHintsCount + 1}
                    </button>
                  ) : null}

                  {visibleHints.length > 0 ? (
                    <div className={styles.hintsList}>
                      {visibleHints.map((hint, index) => (
                        <div key={`${index}-${hint}`} className={styles.hintItem}>
                          <span className={styles.hintIndex}>{index + 1}</span>
                          <span>{hint}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            <div className={styles.statsCard}>
              <h4 className={styles.statsTitle}>Статистика</h4>
              <div className={styles.statsList}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Решено</span>
                  <span className={styles.statValue}>{task.times_solved || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Попыток</span>
                  <span className={styles.statValue}>{task.times_attempted || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Успешность</span>
                  <span className={styles.statValue}>
                    {task.times_attempted 
                      ? Math.round((task.times_solved / task.times_attempted) * 100) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
