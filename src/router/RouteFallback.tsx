import styles from "./RouteFallback.module.css";

export default function RouteFallback() {
  return <main className={styles.page} aria-busy="true" aria-label="Đang mở Trip Note">
    <header className={styles.header}>
      <span className={`${styles.block} ${styles.brand}`} />
      <span className={`${styles.block} ${styles.avatar}`} />
    </header>
    <section className={styles.intro} aria-hidden="true">
      <span className={`${styles.block} ${styles.eyebrow}`} />
      <span className={`${styles.block} ${styles.title}`} />
      <span className={`${styles.block} ${styles.subtitle}`} />
    </section>
    <section className={styles.featured} aria-hidden="true">
      <span className={`${styles.block} ${styles.sectionTitle}`} />
      <div className={styles.cards}>
        <span className={`${styles.block} ${styles.card}`} />
        <span className={`${styles.block} ${styles.card}`} />
      </div>
    </section>
    <div className={styles.grid} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => <span className={`${styles.block} ${styles.tile}`} key={index} />)}
    </div>
    <nav className={styles.dock} aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => <span className={styles.navItem} key={index}><i className={styles.block} /></span>)}
    </nav>
  </main>;
}
