import { useAtomicState, useResetAtomicState } from '../atoms/hooks/atomic-hooks';
import { counterAtomA, multipliedAtomA } from './counter-atom';
import styles from './Counter.module.css';

export function CounterA() {
    const [countA, setCountA] = useAtomicState(counterAtomA);
    const [multipliedCountA, setMultipliedCountA] = useAtomicState(multipliedAtomA);
    const resetA = useResetAtomicState(counterAtomA);

    return (<>
        <div className={styles.row}>A</div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement value"
                onClick={() => setCountA(x => x - 1)}
            >
                -
            </button>
            <span className={styles.value}>{countA}</span>
            <button
                className={styles.button}
                aria-label="Increment value"
                onClick={() => setCountA(x => x + 1)}
            >
                +
            </button>
        </div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement multiplied value"
                onClick={() => setMultipliedCountA(x => x - 1)}
            >
                -
            </button>
            <span className={styles.value}>x2:{multipliedCountA}</span>
            <button
                className={styles.button}
                aria-label="Increment multiplied value"
                onClick={() => setMultipliedCountA(x => x + 1)}
            >
                +
            </button>
        </div>
        <div className={styles.row}>
            <button className={styles.button} onClick={resetA}>Reset</button>
        </div>
    </>);
}
