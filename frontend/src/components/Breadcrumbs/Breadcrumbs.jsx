import { Link } from 'react-router-dom'
import styles from './Breadcrumbs.module.css'
import { SlArrowRight } from "react-icons/sl";

export default function Breadcrumbs({ items, compact = false }) {
  return (
    <nav className={`${styles.breadcrumbs} ${compact ? styles.breadcrumbsCompact : ''}`}>
      {items.map((item, index) => (
        <span key={index} className={styles.part}>
          {index > 0 && <span className={styles.separator}><SlArrowRight /></span>}
          {item.href ? (
            <Link to={item.href} className={styles.item}>
              {item.label}
            </Link>
          ) : (
            <span className={styles.current}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
