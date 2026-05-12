export const TYPE_TAG_OPTIONS = [
  { value: 'Текст', taskType: 'text', color: '#3b82f6' },
  { value: 'Изображение', taskType: 'image_search', color: '#8b5cf6' },
  { value: 'Соцсети', taskType: 'social_media', color: '#ec4899' }
]

export const CATEGORY_TAG_OPTIONS = [
  { value: 'Геолокация', color: '#0ea5e9' },
  { value: 'Человек', color: '#22c55e' },
  { value: 'Организация', color: '#f59e0b' },
  { value: 'Логика', color: '#8b5cf6' },
  { value: 'Место', color: '#ef4444' }
]

export const TASK_TAG_OPTIONS = [...TYPE_TAG_OPTIONS, ...CATEGORY_TAG_OPTIONS]

export const TAG_COLORS = TASK_TAG_OPTIONS.reduce((acc, tag) => {
  acc[tag.value] = tag.color
  return acc
}, {})

export const TASK_TYPE_LABELS = TYPE_TAG_OPTIONS.reduce((acc, tag) => {
  acc[tag.taskType] = tag.value
  return acc
}, {})

export const TASK_TYPE_BY_LABEL = TYPE_TAG_OPTIONS.reduce((acc, tag) => {
  acc[tag.value] = tag.taskType
  return acc
}, {})

export const DIFFICULTY_COLORS = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
  expert: '#dc2626'
}
