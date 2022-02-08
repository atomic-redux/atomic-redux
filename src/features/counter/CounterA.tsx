import { useAtomicState } from '../atoms/hooks/use-atomic-state';
import { counterAtomA, multipliedAtomA } from './counter-atom';
import styles from './Counter.module.css';

export function CounterA() {
    const [countA, setCountA] = useAtomicState(counterAtomA);
    const [multipliedCountA, setMultipliedCountA] = useAtomicState(multipliedAtomA);

    return (<>
        <div className={styles.row}>A</div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement value"
                onClick={() => setCountA(x => (x ?? 0) - 1)}
            >
                -
            </button>
            <span className={styles.value}>{countA}</span>
            <button
                className={styles.button}
                aria-label="Increment value"
                onClick={() => setCountA(x => (x ?? 0) + 1)}
            >
                +
            </button>
        </div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement value"
                onClick={() => setMultipliedCountA(x => (x ?? 0) - 1)}
            >
                -
            </button>
            <span className={styles.value}>x2: {multipliedCountA}</span>
            <button
                className={styles.button}
                aria-label="Increment value"
                onClick={() => setMultipliedCountA(x => (x ?? 0) + 1)}
            >
                +
            </button>
        </div>
    </>);
}
