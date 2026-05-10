import styles from "./Game.module.css";

export default function GameInfo({onJoinGame}) {
    return (
<>
      <div className={styles.problemPanel}></div>

      <div className={styles.opponentPanel}></div>
</>
    )
}