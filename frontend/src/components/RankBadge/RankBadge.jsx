import { DEFAULT_RANK, RANK_META } from '../../constants/ranks'
import styles from './RankBadge.module.css'

const RANK_CLASSES = {
  Student: styles.student,
  Chunin: styles.chunin,
  Ninja: styles.ninja,
  Samurai: styles.samurai,
  Ronin: styles.ronin,
  Monk: styles.monk,
  Delighted: styles.delighted,
  Archangel: styles.archangel
}

export default function RankBadge({ rank, compact = false }) {
  const normalizedRank = rank && RANK_META[rank] ? rank : DEFAULT_RANK
  const rankMeta = RANK_META[normalizedRank]
  const Icon = rankMeta.Icon

  return (
    <span className={`${styles.badge} ${compact ? styles.compact : ''} ${RANK_CLASSES[normalizedRank] || ''}`}>
      <Icon className={styles.icon} />
      <span>{rankMeta.label}</span>
    </span>
  )
}
