import styles from './Timer.module.css'

export default function Timer({ time, isRunning, large = false, penaltyTime = 0 }) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={`${styles.timer} ${large ? styles.timerLarge : ''} ${isRunning ? styles.running : styles.stopped}`}>
      <div className={styles.mainRow}>
        <span className={styles.icon}>⏱</span>
        <span>{formatTime(time)}</span>
      </div>
      {penaltyTime > 0 && (
        <span className={styles.penaltyText}>+{formatTime(penaltyTime)} ко времени</span>
      )}
    </div>
  )
}
