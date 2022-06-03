import { LoadingAtom } from 'atomic-redux-state';
import { useAtomicState, useAtomicValue, useIsAtomUpdating } from 'atomic-redux-state-react';
import { SyncLoader } from 'react-spinners';
import { counterAtomB, multipliedAtomB } from './counter-atom';
import styles from './Counter.module.css';

export function CounterB() {
    const [countB, setCountB] = useAtomicState(counterAtomB);
    const multipliedCountB = useAtomicValue(multipliedAtomB);
    const bUpdating = useIsAtomUpdating(multipliedAtomB);

    return (
        <>
            <div className={styles.row}>B</div>
            <div className={styles.row}>
                <button
                    className={styles.button}
                    aria-label="Decrement value"
                    onClick={() => setCountB(x => x - 1)}
                >
                    -
                </button>
                <span className={styles.value}>{countB}</span>
                <button
                    className={styles.button}
                    aria-label="Increment value"
                    onClick={() => setCountB(x => x + 1)}
                >
                    +
                </button>
            </div>
            <div className={styles.row}>
                {multipliedCountB instanceof LoadingAtom || bUpdating
                    ? <SyncLoader />
                    : <span className={styles.value}>x2<span className={styles.small}>(async)</span>:{multipliedCountB}</span>
                }
            </div>
        </>
    );
}
