import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as taskAttemptService from '../../hooks/taskAttemptService'
import { DIFFICULTY_COLORS, TAG_COLORS, TASK_TYPE_LABELS } from '../../constants/tags'
import styles from './TaskCard.module.css'

const TYPE_ICONS = {
  text: '📝',
  image_search: '🖼️',
  social_media: '👥'
}

export default function TaskCard({ task, onCardClick, showActions = false, onEdit, onDelete }) {
  const navigate = useNavigate()
  const isSolved = taskAttemptService.isSolved(task.id)
  const [expanded, setExpanded] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const actionsRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])
  
  const handleClick = () => {
    if (typeof onCardClick === 'function') {
      onCardClick(task)
      return
    }
    navigate(`/tasks/${task.id}`)
  }

  const getTypeIcon = (type) => TYPE_ICONS[type] || '📋'
  const getTagColor = (tag) => TAG_COLORS[tag] || '#64748b'
  const difficultyLabel = task.difficulty === 'easy' ? 'Легкая' : task.difficulty === 'medium' ? 'Средняя' : task.difficulty === 'hard' ? 'Сложная' : task.difficulty
  const previewImage = task.content?.image_url || task.content?.image_urls?.[0] || task.content?.images?.[0]?.url
  const solvedCount = task.times_solved || 0
  const attemptsCount = task.times_attempted || 0
  const successRate = attemptsCount > 0 ? Math.round((solvedCount / attemptsCount) * 100) : 0

  const allTags = [
    ...(task.tags || []).map((t, i) => ({
      key: `${t.tag}-${i}`,
      label: t.tag,
      color: getTagColor(t.tag)
    })),
    {
      key: `difficulty-${task.difficulty}`,
      label: difficultyLabel,
      color: DIFFICULTY_COLORS[task.difficulty] || '#64748b'
    }
  ]

  if (!(task.tags || []).some((t) => t.tag === TASK_TYPE_LABELS[task.task_type])) {
    allTags.push({
      key: `type-${task.task_type}`,
      label: TASK_TYPE_LABELS[task.task_type] || task.task_type,
      color: TAG_COLORS[TASK_TYPE_LABELS[task.task_type]] || '#64748b'
    })
  }

  const visibleTags = expanded ? allTags : allTags.slice(0, 2)
  const hasHiddenTags = allTags.length > 2

  return (
    <div className={styles.card} onClick={handleClick}>
      {isSolved && (
        <div className={styles.solvedBadge}>
          ✓ Решено
        </div>
      )}
      <div className={styles.imageWrapper}>
        {previewImage ? (
          <img 
            src={previewImage} 
            alt={task.title} 
            className={styles.image}
          />
        ) : (
          <div className={styles.placeholder}>
            {getTypeIcon(task.task_type)}
          </div>
        )}
        <div className={styles.points}>+{task.points}</div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{task.title}</h3>
          {showActions && (
            <div className={styles.actionsWrap} ref={actionsRef}>
              <button
                type="button"
                className={styles.actionsButton}
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen((prev) => !prev)
                }}
                aria-label="Действия с задачей"
              >
                ⋯
              </button>
              {menuOpen && (
                <div className={styles.actionsMenu} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className={styles.actionsMenuItem}
                    onClick={() => {
                      setMenuOpen(false)
                      onEdit?.(task)
                    }}
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    className={`${styles.actionsMenuItem} ${styles.actionsMenuDanger}`}
                    onClick={() => {
                      setMenuOpen(false)
                      onDelete?.(task)
                    }}
                  >
                    Удалить
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.tags}>
          {visibleTags.map((tag) => (
            <span
              key={tag.key}
              className={styles.tagPill}
              style={{ '--tag-color': tag.color, '--tag-bg': `${tag.color}20` }}
            >
              {tag.label}
            </span>
          ))}
          {hasHiddenTags && (
            <button
              type="button"
              className={styles.expandButton}
              onClick={(e) => {
                e.stopPropagation()
                setExpanded((prev) => !prev)
              }}
              aria-label={expanded ? 'Свернуть теги' : 'Показать все теги'}
            >
              {expanded ? '▲' : '▼'}
            </button>
          )}
        </div>

        <div className={styles.stats}>
          <span className={styles.stat}>
            ✓ {solvedCount} решено
          </span>
          <span className={styles.stat}>
            👁 {attemptsCount} попыток
          </span>
        </div>
      </div>
    </div>
  )
}
