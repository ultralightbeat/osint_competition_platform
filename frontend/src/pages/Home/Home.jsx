import { useState, useEffect } from 'react'
import { tasksApi } from '../../api'
import Breadcrumbs from '../../components/Breadcrumbs'
import TagFilter from '../../components/TagFilter'
import TaskCard from '../../components/TaskCard'
import { TASK_TYPE_LABELS } from '../../constants/tags'
import styles from './Home.module.css'

export default function Home() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDifficulties, setSelectedDifficulties] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const res = await tasksApi.list()
      setTasks(res.data)
    } catch (err) {
      setError('Не удалось загрузить задачи')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (selectedDifficulties.length > 0 && !selectedDifficulties.includes(task.difficulty)) {
      return false
    }
    if (selectedTags.length > 0) {
      const taskTagValues = [
        ...(task.tags || []).map((tag) => tag.tag),
        TASK_TYPE_LABELS[task.task_type] || task.task_type
      ]
      if (!selectedTags.some((tag) => taskTagValues.includes(tag))) {
        return false
      }
    }
    return true
  })

  const clearFilters = () => {
    setSelectedDifficulties([])
    setSelectedTags([])
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Задачи' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />
        
        <div className={styles.header}>
          <h1 className={styles.title}>Каталог задач</h1>
          <p className={styles.subtitle}>
            Тренируйте навыки OSINT, решая задачи разной сложности
          </p>
        </div>

        <TagFilter
          selectedDifficulties={selectedDifficulties}
          selectedTags={selectedTags}
          onDifficultyChange={setSelectedDifficulties}
          onTagChange={setSelectedTags}
          onClear={clearFilters}
        />

        {loading ? (
          <div className={styles.loading}>
            <div className="spinner spinner-lg" />
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⚠️</div>
            <p>{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3>Задачи не найдены</h3>
            <p>Попробуйте изменить фильтры</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
