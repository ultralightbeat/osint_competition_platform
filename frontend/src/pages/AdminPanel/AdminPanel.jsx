import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usersApi } from '../../api'
import Breadcrumbs from '../../components/Breadcrumbs'
import styles from './AdminPanel.module.css'

const initialStats = {
  total_users: 0,
  creators_count: 0,
  tasks_count: 0,
  tournaments_count: 0,
  solved_tasks_count: 0,
  solved_tournaments_count: 0
}

export default function AdminPanel() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [creatorUpdatingId, setCreatorUpdatingId] = useState(null)
  const [stats, setStats] = useState(initialStats)
  const [users, setUsers] = useState([])

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const loadData = async (activeSearch) => {
    setLoading(true)
    try {
      const res = await usersApi.adminDashboard(activeSearch)
      setStats(res.data?.stats || initialStats)
      setUsers(res.data?.users || [])
    } catch (err) {
      console.error(err)
      setStats(initialStats)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !isAuthenticated || !currentUser?.is_admin) {
      setLoading(false)
      return
    }
    loadData(search)
  }, [authLoading, isAuthenticated, currentUser?.is_admin, search])

  const handleDeleteUser = async (id, username) => {
    if (!window.confirm(`Удалить пользователя ${username}?`)) return
    setDeletingId(id)
    try {
      await usersApi.adminDeleteUser(id)
      await loadData(search)
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.error || 'Не удалось удалить пользователя')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreatorToggle = async (userItem) => {
    setCreatorUpdatingId(userItem.id)
    try {
      await usersApi.adminSetCreatorRole(userItem.id, !userItem.is_creator)
      await loadData(search)
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.error || 'Не удалось изменить роль создателя')
    } finally {
      setCreatorUpdatingId(null)
    }
  }

  const breadcrumbs = useMemo(
    () => [
      { label: 'Главная', href: '/' },
      { label: 'Панель администратора' }
    ],
    []
  )

  if (authLoading) {
    return (
      <div className={styles.loading}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.notAllowed}>
        <h2>Войдите в аккаунт</h2>
        <p className="text-muted mb-lg">Доступ к панели администратора требует авторизации</p>
        <Link to="/login" className="btn btn-primary">Войти</Link>
      </div>
    )
  }

  if (!currentUser?.is_admin) {
    return (
      <div className={styles.notAllowed}>
        <h2>Нет доступа</h2>
        <p className="text-muted mb-lg">Эта страница доступна только администраторам</p>
        <Link to="/" className="btn btn-primary">На главную</Link>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <h1 className={styles.title}>Панель администратора</h1>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.total_users}</div><div className={styles.statLabel}>Всего пользователей</div></div>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.creators_count}</div><div className={styles.statLabel}>Создателей задач</div></div>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.tasks_count}</div><div className={styles.statLabel}>Количество задач</div></div>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.tournaments_count}</div><div className={styles.statLabel}>Количество турниров</div></div>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.solved_tasks_count}</div><div className={styles.statLabel}>Решенных задач</div></div>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.solved_tournaments_count}</div><div className={styles.statLabel}>Решеных турниров</div></div>
        </div>

        <section className={styles.usersBlock}>
          <div className={styles.usersHeader}>
            <h2>Пользователи</h2>
            <input
              className={`input ${styles.searchInput}`}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Поиск по username, email, стране"
            />
          </div>

          {loading ? (
            <div className={styles.loadingInline}><div className="spinner" /></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th />
                    <th>Username</th>
                    <th>Email</th>
                    <th>ID</th>
                    <th>Роль</th>
                    <th>Рейтинг</th>
                    <th>Ранг</th>
                    <th>Решено задач</th>
                    <th>Побед в турнирах</th>
                    <th>Побед в дуэлях</th>
                    <th>Страна</th>
                    <th>Avatar URL</th>
                    <th>OAuth</th>
                    <th>О себе</th>
                    <th>Создан</th>
                    <th>Последний вход</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <button
                          className={`btn btn-danger ${styles.deleteBtn}`}
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          disabled={deletingId === u.id}
                        >
                          {deletingId === u.id ? '...' : 'Удалить'}
                        </button>
                        <button
                          className={`btn btn-secondary ${styles.creatorBtn}`}
                          onClick={() => handleCreatorToggle(u)}
                          disabled={creatorUpdatingId === u.id}
                        >
                          {creatorUpdatingId === u.id
                            ? '...'
                            : u.is_creator
                              ? 'Снять Creator'
                              : 'Выдать Creator'}
                        </button>
                      </td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td className={styles.idCell}>{u.id}</td>
                      <td>
                        {u.is_admin ? 'Админ' : 'Пользователь'}
                        {u.is_creator ? ' / Creator' : ''}
                      </td>
                      <td>{u.rating ?? 0}</td>
                      <td>{u.rank || '-'}</td>
                      <td>{u.tasks_solved ?? 0}</td>
                      <td>{u.tournaments_won ?? 0}</td>
                      <td>{u.rooms_won ?? 0}</td>
                      <td>{u.country || '-'}</td>
                      <td className={styles.bioCell}>{u.avatar_url || '-'}</td>
                      <td>{u.oauth_provider || '-'}</td>
                      <td className={styles.bioCell}>{u.bio || '-'}</td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                      <td>{u.last_login ? new Date(u.last_login).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan="16" className={styles.empty}>Пользователи не найдены</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
