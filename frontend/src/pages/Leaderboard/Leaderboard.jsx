import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ratingsApi } from '../../api'
import Breadcrumbs from '../../components/Breadcrumbs'
import RankBadge from '../../components/RankBadge/RankBadge'
import styles from './Leaderboard.module.css'

export default function Leaderboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
  }, [])

  const loadLeaderboard = async () => {
    try {
      setLoading(true)
      const res = await ratingsApi.leaderboard()
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRankClass = (position) => {
    if (position === 1) return styles.rank1
    if (position === 2) return styles.rank2
    if (position === 3) return styles.rank3
    return ''
  }

  const getInitials = (name) => name?.charAt(0).toUpperCase() || '?'

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: 'Рейтинг' }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <h1 className={styles.title}>Рейтинг игроков</h1>
          <p className={styles.subtitle}>Топ-100 лучших участников платформы</p>
        </div>

        <div className={styles.card}>
          {loading ? (
            <div className={styles.loading}>
              <div className="spinner spinner-lg" />
            </div>
          ) : users.length === 0 ? (
            <div className={styles.empty}>
              <p>Пока нет участников в рейтинге</p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Игрок</th>
                    <th>Рейтинг</th>
                    <th className={styles.rankColumn}>Ранг</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id}>
                      <td className={`${styles.rank} ${getRankClass(index + 1)}`}>
                        {index + 1}
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className="avatar">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt={user.username} />
                            ) : (
                              getInitials(user.username)
                            )}
                          </div>
                          <Link to={`/users/${user.id}`} className={styles.username}>
                            {user.username}
                          </Link>
                        </div>
                      </td>
                      <td className={styles.rating}>{user.rating}</td>
                      <td className={styles.rankColumn}>
                        <RankBadge rank={user.rank} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
