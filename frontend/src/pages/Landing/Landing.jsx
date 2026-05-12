import { Link } from 'react-router-dom'
import Breadcrumbs from '../../components/Breadcrumbs'
import styles from './Landing.module.css'

const STEPS = [
  {
    title: 'Откройте каталог задач',
    text: 'Перейдите в раздел задач, выберите интересную тему и подходящую сложность.'
  },
  {
    title: 'Запустите решение',
    text: 'На странице задачи нажмите «Начать решение», чтобы открыть описание и запустить таймер.'
  },
  {
    title: 'Проверяйте гипотезы',
    text: 'Собирайте факты, сопоставляйте источники и отправляйте ответы. Каждая отправка — попытка.'
  },
  {
    title: 'Получайте результат',
    text: 'Правильный ответ фиксирует решение, обновляет статистику и позицию в рейтинге.'
  }
]

const EXAMPLE_STEPS = [
  'Задача: определить город по фото с мостом и вывеской.',
  'Ищем вывеску по фразе, находим язык и возможный регион.',
  'Сверяем форму моста и береговую линию через карты.',
  'Проверяем совпадение по панорамам и отправляем ответ.'
]

export default function Landing() {
  const breadcrumbs = [{ label: 'Главная' }]

  return (
    <div className={styles.page}>
      <div className="container">
        <Breadcrumbs items={breadcrumbs} compact />

        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.title}>OSINT Arena</h1>
            <p className={styles.subtitle}>
              Тренируйте аналитическое мышление на практических заданиях и
              прокачивайте OSINT-навыки шаг за шагом.
            </p>
            <div className={styles.heroActions}>
              <Link to="/tasks" className="btn btn-primary btn-lg">
                Перейти к задачам
              </Link>
              <Link to="/leaderboard" className="btn btn-secondary btn-lg">
                Смотреть рейтинг
              </Link>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Как работать с задачами</h2>
          <div className={styles.stepsGrid}>
            {STEPS.map((step, index) => (
              <article key={step.title} className={styles.stepCard}>
                <span className={styles.stepNumber}>0{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Пример решения простой задачи</h2>
          <div className={styles.exampleCard}>
            {EXAMPLE_STEPS.map((step, index) => (
              <div key={step} className={styles.exampleRow}>
                <span className={styles.exampleIndex}>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
