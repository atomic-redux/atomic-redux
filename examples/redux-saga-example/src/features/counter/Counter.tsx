import { useAtomicValue, useResetAtomicState } from 'atomic-redux-state-react';
import { useDispatch } from 'react-redux';
import { counterAtom, multipliedAtom } from './counter-atom';
import styles from './Counter.module.css';
import { consoleLogCounter, decrementCounter, incrementCounter } from './counterSaga';

export function Counter() {
    const countA = useAtomicValue(counterAtom);
    const multipliedCountA = useAtomicValue(multipliedAtom);
    const resetA = useResetAtomicState(counterAtom);

    const dispatch = useDispatch();

    return (<>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement value"
                onClick={() => dispatch(decrementCounter())}
            >
                -
            </button>
            <span className={styles.value}>{countA}</span>
            <button
                className={styles.button}
                aria-label="Increment value"
                onClick={() => dispatch(incrementCounter())}
            >
                +
            </button>
        </div>
        <div className={styles.row}>
            <span className={styles.value}>x2:{multipliedCountA}</span>
        </div>
        <div className={styles.row}>
            <button className={styles.button} onClick={resetA}>Reset</button>
            <button className={styles.button} onClick={() => dispatch(consoleLogCounter())}>Console Log Value</button>
        </div>
    </>);
}