import { useAtomicState, useAtomicValue } from '../atoms/hooks/use-atomic-state';
import { counterAtomB, multipliedAtomB } from './counter-atom';
import styles from './Counter.module.css';

export function CounterB() {
    const [countB, setCountB] = useAtomicState(counterAtomB);
    const multipliedCountB = useAtomicValue(multipliedAtomB);

    return (
        <>
            <div className={styles.row}>A</div>
            <div className={styles.row}>
                <button
                    className={styles.button}
                    aria-label="Decrement value"
                    onClick={() => setCountB(x => (x ?? 0) - 1)}
                >
                    -
                </button>
                <span className={styles.value}>{countB}</span>
                <button
                    className={styles.button}
                    aria-label="Increment value"
                    onClick={() => setCountB(x => (x ?? 0) + 1)}
                >
                    +
                </button>
            </div>
            <div className={styles.row}>
                <span className={styles.value}>x2: {multipliedCountB}</span>
            </div>
        </>
    );
}
