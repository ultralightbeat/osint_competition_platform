import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { tasksApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Breadcrumbs from '../../components/Breadcrumbs'
import { TASK_TAG_OPTIONS, TASK_TYPE_BY_LABEL, DIFFICULTY_COLORS } from '../../constants/tags'
import styles from './CreateTask.module.css'

const DIFFICULTIES = [
  { value: 'easy', label: 'Легкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'hard', label: 'Сложный' }
]

const MAX_IMAGES = 3

const toDateTimeLocalValue = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const resolveTaskType = (selectedTags) => {
  const selectedTypeTags = selectedTags
    .map((tag) => TASK_TYPE_BY_LABEL[tag])
    .filter(Boolean)
  if (selectedTypeTags.includes('image_search')) return 'image_search'
  if (selectedTypeTags.includes('social_media')) return 'social_media'
  if (selectedTypeTags.includes('text')) return 'text'
  return 'text'
}

export default function CreateTask() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, isAuthenticated } = useAuth()
  const isEditMode = Boolean(id)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    points: 100,
    correct_answer: '',
    images: [],
    uploadedImages: [],
    hint1: '',
    hint2: '',
    hint3: '',
    tags: [],
    mode: 'task',
    tournament_end_at: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [loadingTask, setLoadingTask] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAuthenticated) navigate('/login')
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isEditMode || !id || !isAuthenticated) return
    let isMounted = true
    const loadTask = async () => {
      try {
        setLoadingTask(true)
        setError('')
        const res = await tasksApi.getEditById(id)
        const task = res.data
        if (!isMounted) return
        if (user?.id && String(task.author_id) !== String(user.id)) {
          setError('Вы можете редактировать только свои задачи')
          return
        }
        const hints = Array.isArray(task.hints) ? task.hints : []
        let uploadedImages = []
        if (Array.isArray(task.content?.images)) {
          uploadedImages = task.content.images.map((image) => ({
            key: image.key,
            mime_type: image.mime_type || 'image/jpeg',
            size: image.size || 0,
            original_name: image.original_name || image.key,
            url: image.url
          }))
        } else if (task.content?.image?.key) {
          uploadedImages = [{
            key: task.content.image.key,
            mime_type: task.content.image.mime_type || 'image/jpeg',
            size: task.content.image.size || 0,
            original_name: task.content.image.original_name || task.content.image.key,
            url: task.content.image.url || task.content.image_url
          }]
        }
        setFormData({
          title: task.title || '',
          description: task.description || '',
          difficulty: task.difficulty || 'medium',
          points: task.points || 100,
          correct_answer: task.correct_answer || '',
          images: [],
          uploadedImages,
          hint1: hints[0] || '',
          hint2: hints[1] || '',
          hint3: hints[2] || '',
          tags: Array.isArray(task.tags) ? task.tags.map((tag) => tag.tag).filter(Boolean) : [],
          mode: task.is_tournament ? 'tournament' : 'task',
          tournament_end_at: toDateTimeLocalValue(task.close_at)
        })
      } catch (err) {
        console.error(err)
        if (!isMounted) return
        setError('Не удалось загрузить задачу для редактирования')
      } finally {
        if (isMounted) setLoadingTask(false)
      }
    }
    loadTask()
    return () => {
      isMounted = false
    }
  }, [id, isEditMode, isAuthenticated, user?.id])

  useEffect(() => {
    return () => {
      for (const image of formData.images) {
        if (image.previewUrl) URL.revokeObjectURL(image.previewUrl)
      }
    }
  }, [formData.images])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value, 10) || 0 : value
    }))
  }

  const handleDifficultySelect = (difficulty) => {
    setFormData((prev) => ({ ...prev, difficulty }))
  }

  const toggleTag = (tagValue) => {
    setFormData((prev) => {
      const hasTag = prev.tags.includes(tagValue)
      return {
        ...prev,
        tags: hasTag ? prev.tags.filter((tag) => tag !== tagValue) : [...prev.tags, tagValue]
      }
    })
  }

  const isImageTask = useMemo(() => formData.tags.includes('Изображение'), [formData.tags])

  const handleImageFilesChange = (e) => {
    const nextFiles = Array.from(e.target.files || []).slice(0, MAX_IMAGES)
    for (const image of formData.images) {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl)
    }
    const prepared = nextFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      name: file.name,
      size: file.size
    }))
    setFormData((prev) => ({
      ...prev,
      images: prepared,
      uploadedImages: []
    }))
  }

  const handleUploadImages = async () => {
    if (formData.images.length === 0) {
      setError('Сначала выберите изображения')
      return
    }

    setError('')
    setUploadingImages(true)
    try {
      const uploaded = []
      for (const image of formData.images) {
        const file = image.file
        const uploadRes = await tasksApi.getImageUploadUrl({
          filename: file.name,
          content_type: file.type,
          size: file.size
        })
        const { upload_url: uploadUrl, key, fields = {}, method } = uploadRes.data
        const form = new FormData()
        Object.entries(fields).forEach(([fieldKey, fieldValue]) => {
          form.append(fieldKey, fieldValue)
        })
        form.append('file', file)
        const uploadMethod = method || 'POST'
        const postRes = await fetch(uploadUrl, {
          method: uploadMethod,
          body: form
        })
        if (!postRes.ok) {
          throw new Error(`Не удалось загрузить файл: ${file.name}`)
        }
        uploaded.push({
          key,
          mime_type: file.type,
          size: file.size,
          original_name: file.name
        })
      }
      if (uploaded.length === 0) throw new Error('Сервер не вернул загруженные изображения')
      setFormData((prev) => ({
        ...prev,
        uploadedImages: uploaded
      }))
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || err.message || 'Ошибка загрузки изображений')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.title.trim()) return setError('Введите название задачи')
    if (!formData.description.trim()) return setError('Введите описание задачи')
    if (!formData.correct_answer.trim()) return setError('Введите правильный ответ')
    if (formData.points < 10 || formData.points > 1000) return setError('Очки должны быть от 10 до 1000')
    if (isImageTask && formData.uploadedImages.length === 0) return setError('Загрузите от 1 до 3 изображений')
    if (formData.mode === 'tournament' && !formData.tournament_end_at) return setError('Укажите дату и время окончания турнира')

    setSubmitting(true)
    try {
      const hints = [formData.hint1, formData.hint2, formData.hint3].map((hint) => hint.trim()).filter(Boolean)
      const taskType = resolveTaskType(formData.tags)
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        task_type: taskType,
        difficulty: formData.difficulty,
        points: formData.points,
        correct_answer: formData.correct_answer.trim(),
        content: isImageTask ? { images: formData.uploadedImages } : {},
        hints,
        tags: formData.tags,
        is_tournament: formData.mode === 'tournament',
        close_at: formData.mode === 'tournament' ? new Date(formData.tournament_end_at).toISOString() : null
      }
      const res = isEditMode ? await tasksApi.update(id, taskData) : await tasksApi.create(taskData)
      navigate(`/tasks/${res.data.id}`)
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        (isEditMode ? 'Ошибка при сохранении задачи' : 'Ошибка при создании задачи')
      )
    } finally {
      setSubmitting(false)
    }
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Задачи', href: '/tasks' },
    { label: isEditMode ? 'Редактировать задачу' : 'Создать задачу' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <h1 className={styles.title}>{isEditMode ? 'Редактировать задачу' : 'Создать задачу'}</h1>
          <p className={styles.subtitle}>
            {isEditMode
              ? 'Измените поля задачи и сохраните обновления'
              : 'Создайте новую OSINT задачу для сообщества'}
          </p>
        </div>

        {loadingTask ? (
          <div className={styles.loading}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && (
            <div className={styles.error}>
              <span className={styles.errorIcon}>⚠️</span>
              {error}
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Основная информация</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="title">Название задачи</label>
              <input type="text" id="title" name="title" className={styles.input} placeholder="Например: Найдите местоположение по фото" value={formData.title} onChange={handleChange} maxLength={200} />
              <span className={styles.hint}>{formData.title.length}/200 символов</span>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="description">Описание задачи</label>
              <textarea id="description" name="description" className={styles.textarea} placeholder="Подробно опишите задачу, что нужно найти и какие подсказки даны..." value={formData.description} onChange={handleChange} rows={6} maxLength={2000} />
              <span className={styles.hint}>{formData.description.length}/2000 символов</span>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Тип</label>
              <div className={styles.tagsGrid}>
                <button
                  type="button"
                  className={`${styles.tagPill} ${formData.mode === 'task' ? styles.tagPillActive : ''}`}
                  style={{ '--tag-color': '#60a5fa', '--tag-bg': '#60a5fa20' }}
                  onClick={() => setFormData((prev) => ({ ...prev, mode: 'task', tournament_end_at: '' }))}
                >
                  Задача
                </button>
                <button
                  type="button"
                  className={`${styles.tagPill} ${formData.mode === 'tournament' ? styles.tagPillActive : ''}`}
                  style={{ '--tag-color': '#f59e0b', '--tag-bg': '#f59e0b20' }}
                  onClick={() => setFormData((prev) => ({ ...prev, mode: 'tournament' }))}
                >
                  Турнир
                </button>
              </div>
            </div>

            {formData.mode === 'tournament' && (
              <div className={styles.field}>
                <label className={styles.label} htmlFor="tournament_end_at">Окончание турнира</label>
                <input
                  type="datetime-local"
                  id="tournament_end_at"
                  name="tournament_end_at"
                  className={styles.input}
                  value={formData.tournament_end_at}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

          {isImageTask && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Изображения (до 3)</h2>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="image_files">Файлы изображений</label>
                <input type="file" id="image_files" name="image_files" className={styles.input} accept="image/png,image/jpeg,image/webp" multiple onChange={handleImageFilesChange} />
                <button type="button" className={`btn btn-secondary ${styles.uploadButton}`} onClick={handleUploadImages} disabled={formData.images.length === 0 || uploadingImages}>
                  {uploadingImages ? 'Загрузка...' : 'Загрузить изображения'}
                </button>
                <span className={styles.hint}>Выберите до 3 файлов JPG/PNG/WEBP и загрузите.</span>
                {formData.uploadedImages.length > 0 && <span className={styles.uploadSuccess}>✓ Загружено: {formData.uploadedImages.length}</span>}
              </div>
              {formData.images.length > 0 && (
                <div className={styles.imageGrid}>
                  {formData.images.map((image) => (
                    <div key={`${image.name}-${image.size}`} className={styles.imagePreview}>
                      <img src={image.previewUrl} alt={image.name} />
                    </div>
                  ))}
                </div>
              )}
              {formData.images.length === 0 && formData.uploadedImages.length > 0 && (
                <div className={styles.imageGrid}>
                  {formData.uploadedImages.map((image) => (
                    <div key={image.key} className={styles.imagePreview}>
                      <img src={image.url} alt={image.original_name || 'task image'} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Сложность</h2>
            <div className={styles.tagsGrid}>
              {DIFFICULTIES.map((diff) => (
                <button
                  key={diff.value}
                  type="button"
                  className={`${styles.tagPill} ${formData.difficulty === diff.value ? styles.tagPillActive : ''}`}
                  style={{ '--tag-color': DIFFICULTY_COLORS[diff.value], '--tag-bg': `${DIFFICULTY_COLORS[diff.value]}20` }}
                  onClick={() => handleDifficultySelect(diff.value)}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Теги</h2>
            <div className={styles.tagsGrid}>
              {TASK_TAG_OPTIONS.map((tag) => {
                const selected = formData.tags.includes(tag.value)
                return (
                  <button
                    key={tag.value}
                    type="button"
                    className={`${styles.tagPill} ${selected ? styles.tagPillActive : ''}`}
                    style={{ '--tag-color': tag.color, '--tag-bg': `${tag.color}20` }}
                    onClick={() => toggleTag(tag.value)}
                  >
                    {tag.value}
                  </button>
                )
              })}
            </div>
            <span className={styles.hint}>Выберите один или несколько тегов для задачи</span>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Награда</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="points">Очки за решение</label>
              <div className={styles.pointsSliderRow}>
                <input
                  type="range"
                  id="points_slider"
                  name="points"
                  className={styles.pointsSlider}
                  min={10}
                  max={1000}
                  step={10}
                  value={formData.points}
                  onChange={handleChange}
                />
                <span className={styles.pointsValue}>{formData.points}</span>
              </div>
              <div className={styles.pointsInput}>
                <input type="number" id="points" name="points" className={styles.input} min={10} max={1000} step={10} value={formData.points} onChange={handleChange} />
                <span className={styles.pointsLabel}>очков</span>
              </div>
              <span className={styles.hint}>От 10 до 1000. Рекомендуется: легкий — 50-100, средний — 100-200, сложный — 200-500</span>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Ответ</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="correct_answer">Правильный ответ</label>
              <input type="text" id="correct_answer" name="correct_answer" className={styles.input} placeholder="Точный ответ, который должен ввести участник" value={formData.correct_answer} onChange={handleChange} />
              <span className={styles.hint}>Ответ будет проверяться без учета регистра</span>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Подсказки (до 3)</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="hint1">Подсказка 1 (опционально)</label>
              <input type="text" id="hint1" name="hint1" className={styles.input} placeholder="Например: Используйте обратный поиск изображений" value={formData.hint1} onChange={handleChange} maxLength={300} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="hint2">Подсказка 2 (опционально)</label>
              <input type="text" id="hint2" name="hint2" className={styles.input} placeholder="Дополнительная подсказка" value={formData.hint2} onChange={handleChange} maxLength={300} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="hint3">Подсказка 3 (опционально)</label>
              <input type="text" id="hint3" name="hint3" className={styles.input} placeholder="Последняя подсказка" value={formData.hint3} onChange={handleChange} maxLength={300} />
            </div>
            <span className={styles.hint}>Пустые подсказки не сохраняются. Если не заполнено ни одной — задача будет без подсказок.</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/tasks')} disabled={submitting}>Отмена</button>
            <button type="submit" className={`btn btn-primary ${styles.submitButton}`} disabled={submitting || uploadingImages}>
              {submitting ? (
                <>
                  <span className="spinner" />
                  {isEditMode ? 'Сохранение...' : 'Создание...'}
                </>
              ) : (
                <>{isEditMode ? 'Сохранить' : 'Создать задачу'}</>
              )}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
