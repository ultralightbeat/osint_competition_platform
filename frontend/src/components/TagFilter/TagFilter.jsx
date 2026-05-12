import { useEffect, useRef, useState } from 'react'
import { TASK_TAG_OPTIONS } from '../../constants/tags'
import styles from './TagFilter.module.css'

const DIFFICULTIES = [
  { value: 'easy', label: 'Легкая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'hard', label: 'Сложная' },
  { value: 'expert', label: 'Эксперт' }
]

export default function TagFilter({ 
  selectedDifficulties = [],
  selectedTags = [],
  onDifficultyChange,
  onTagChange,
  onClear
}) {
  const [openDropdown, setOpenDropdown] = useState(null)
  const filtersRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filtersRef.current && !filtersRef.current.contains(event.target)) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleDifficulty = (diff) => {
    if (selectedDifficulties.includes(diff)) {
      onDifficultyChange(selectedDifficulties.filter(d => d !== diff))
    } else {
      onDifficultyChange([...selectedDifficulties, diff])
    }
  }

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter((t) => t !== tag))
    } else {
      onTagChange([...selectedTags, tag])
    }
  }

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown((prev) => (prev === dropdownName ? null : dropdownName))
  }

  const hasFilters = selectedDifficulties.length > 0 || selectedTags.length > 0

  return (
    <div className={styles.filters} ref={filtersRef}>
      <div className={styles.dropdown}>
        <button
          type="button"
          className={`${styles.dropdownTrigger} ${openDropdown === 'difficulties' ? styles.dropdownTriggerOpen : ''}`}
          onClick={() => toggleDropdown('difficulties')}
        >
          Сложность {selectedDifficulties.length > 0 ? `(${selectedDifficulties.length})` : ''}
        </button>
        <div className={`${styles.dropdownMenu} ${openDropdown === 'difficulties' ? styles.dropdownMenuOpen : ''}`}>
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff.value}
              type="button"
              className={`${styles.optionItem} ${selectedDifficulties.includes(diff.value) ? styles.optionItemSelected : ''}`}
              onClick={() => toggleDifficulty(diff.value)}
              role="menuitemcheckbox"
              aria-checked={selectedDifficulties.includes(diff.value)}
            >
              <span>{diff.label}</span>
              <span className={`${styles.checkmark} ${selectedDifficulties.includes(diff.value) ? styles.checkmarkVisible : ''}`}>
                ✓
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.dropdown}>
        <button
          type="button"
          className={`${styles.dropdownTrigger} ${openDropdown === 'tags' ? styles.dropdownTriggerOpen : ''}`}
          onClick={() => toggleDropdown('tags')}
        >
          Теги {selectedTags.length > 0 ? `(${selectedTags.length})` : ''}
        </button>
        <div className={`${styles.dropdownMenu} ${openDropdown === 'tags' ? styles.dropdownMenuOpen : ''}`}>
          {TASK_TAG_OPTIONS.map((tag) => (
            <button
              key={tag.value}
              type="button"
              className={`${styles.optionItem} ${selectedTags.includes(tag.value) ? styles.optionItemSelected : ''}`}
              onClick={() => toggleTag(tag.value)}
              role="menuitemcheckbox"
              aria-checked={selectedTags.includes(tag.value)}
            >
              <span>{tag.value}</span>
              <span className={`${styles.checkmark} ${selectedTags.includes(tag.value) ? styles.checkmarkVisible : ''}`}>
                ✓
              </span>
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button type="button" className={styles.clearButton} onClick={onClear}>
          Сбросить
        </button>
      )}
    </div>
  )
}
