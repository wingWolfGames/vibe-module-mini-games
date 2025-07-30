'use client'

import GameCanvas from './game/gameCanvas';
import styles from '../styles/home.module.css'

export default function Home() {
  return (
    <main className={styles.main}>
      <GameCanvas />
    </main>
  );
}
