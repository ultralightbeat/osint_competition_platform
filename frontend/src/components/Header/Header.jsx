import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import styles from './Header.module.css'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    navigate('/')
  }

  const getInitials = (name) => {
    return name?.charAt(0).toUpperCase() || '?'
  }

  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Link to="/" className={styles.logo}>
          <span>OSINT Arena</span>
        </Link>

        <nav className={styles.nav}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Главная
          </NavLink>
          <NavLink 
            to="/tasks" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Задачи
          </NavLink>
          <NavLink 
            to="/leaderboard" 
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Рейтинг
          </NavLink>
          <NavLink
            to="/rooms"
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            Комнаты
          </NavLink>
        </nav>

        <div className={styles.authButtons}>
          {isAuthenticated ? (
            <div className={styles.userMenu} ref={dropdownRef}>
              <button 
                className={styles.userButton}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="avatar avatar-sm">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} />
                  ) : (
                    getInitials(user?.username)
                  )}
                </div>
                <span className={styles.username}>{user?.username}</span>
              </button>

              <div className={`${styles.userDropdown} ${dropdownOpen ? styles.open : ''}`}>
                <div className={styles.dropdownHeader}>
                  <div className={styles.dropdownName}>{user?.username}</div>
                  <div className={styles.dropdownEmail}>{user?.email}</div>
                </div>
                
                <Link 
                  to="/profile" 
                  className={styles.dropdownItem}
                  onClick={() => setDropdownOpen(false)}
                >
                  👤 Профиль
                </Link>

                {user?.is_admin && (
                  <Link
                    to="/admin"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    🛡️ Панель администратора
                  </Link>
                )}
                 
                {user?.is_creator && (
                  <Link
                    to="/my-tasks"
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    📚 Мои задачи
                  </Link>
                )}

                {user?.is_creator && (
                  <Link 
                    to="/tasks/create" 
                    className={styles.dropdownItem}
                    onClick={() => setDropdownOpen(false)}
                  >
                    ➕ Создать задачу
                  </Link>
                )}
                
                <div className={styles.dropdownDivider} />
                
                <button 
                  className={`${styles.dropdownItem} ${styles.logoutItem}`}
                  onClick={handleLogout}
                >
                  🚪 Выйти
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Войти
              </Link>
              <Link to="/register" className="btn btn-primary">
                Регистрация
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
