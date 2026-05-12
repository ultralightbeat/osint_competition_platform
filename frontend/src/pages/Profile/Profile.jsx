import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usersApi } from '../../api'
import Breadcrumbs from '../../components/Breadcrumbs'
import RankBadge from '../../components/RankBadge/RankBadge'
import styles from './Profile.module.css'

export default function Profile() {
  const { user: currentUser, isAuthenticated, loading: authLoading, fetchUser } = useAuth()
  const { userId } = useParams()
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    avatar_url: '',
    bio: '',
    country: ''
  })

  const isOwnProfile = !userId || (currentUser && currentUser.id === userId)

  useEffect(() => {
    loadUserProfile()
  }, [userId, currentUser])

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      let userData
      
      if (isOwnProfile && currentUser) {
        userData = currentUser
      } else if (userId) {
        const res = await usersApi.getById(userId)
        userData = res.data
      } else {
        if (!isAuthenticated && authLoading === false) {
          return
        }
        userData = currentUser
      }
      
      setUser(userData)
      if (isOwnProfile) {
        setFormData({
          avatar_url: userData?.avatar_url || '',
          bio: userData?.bio || '',
          country: userData?.country || ''
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await usersApi.update(formData)
      await fetchUser()
      setEditing(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      avatar_url: user?.avatar_url || '',
      bio: user?.bio || '',
      country: user?.country || ''
    })
    setEditing(false)
  }

  const getInitials = (name) => name?.charAt(0).toUpperCase() || '?'

  if (loading || authLoading) {
    return (
      <div className={styles.loading}>
        <div className="spinner spinner-lg" />
      </div>
    )
  }

  if (isOwnProfile && !isAuthenticated) {
    return (
      <div className={styles.notLoggedIn}>
        <h2>Войдите в аккаунт</h2>
        <p className="text-muted mb-lg">
          Чтобы просмотреть свой профиль, необходимо войти в систему
        </p>
        <Link to="/login" className="btn btn-primary">
          Войти
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.notLoggedIn}>
        <h2>Профиль не найден</h2>
        <p className="text-muted mb-lg">
          Пользователь с таким ID не существует
        </p>
        <Link to="/" className="btn btn-primary">
          На главную
        </Link>
      </div>
    )
  }

  const breadcrumbs = [
    { label: 'Главная', href: '/' },
    { label: isOwnProfile ? 'Профиль' : `Профиль ${user.username}` }
  ]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <div className={styles.header}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarLarge}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt={user.username} />
              ) : (
                getInitials(user.username)
              )}
            </div>
            {user.is_creator && (
              <span className={styles.creatorBadge}>✨ Creator</span>
            )}
          </div>

          <div className={styles.userInfo}>
            <h1 className={styles.username}>{user.username}</h1>
            {user.bio && <p className={styles.bio}>{user.bio}</p>}
            {user.country && (
              <div className={styles.location}>
                📍 {user.country}
              </div>
            )}
            
            <div className={styles.ratingInfo}>
              <span className={styles.ratingValue}>{user.rating}</span>
              <RankBadge rank={user.rank} />
            </div>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.tasks_solved || 0}</div>
            <div className={styles.statLabel}>Задач решено</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.tournaments_won || 0}</div>
            <div className={styles.statLabel}>Турниров выиграно</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.rooms_won || 0}</div>
            <div className={styles.statLabel}>Дуэлей выиграно</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.rating || 0}</div>
            <div className={styles.statLabel}>Текущий рейтинг</div>
          </div>
        </div>

        {isOwnProfile && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              {editing ? 'Редактирование профиля' : 'Настройки профиля'}
            </h2>
            
            {editing ? (
              <form className={styles.editForm} onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="label">URL аватара</label>
                  <input
                    type="url"
                    name="avatar_url"
                    className="input"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>

                <div className="form-group">
                  <label className="label">О себе</label>
                  <textarea
                    name="bio"
                    className="input"
                    rows="3"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Расскажите о себе..."
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Страна</label>
                  <input
                    type="text"
                    name="country"
                    className="input"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Россия"
                  />
                </div>

                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={saving}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCancel}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <button 
                className="btn btn-secondary"
                onClick={() => setEditing(true)}
              >
                ✏️ Редактировать профиль
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
