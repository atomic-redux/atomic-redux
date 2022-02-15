import { useAtomicState, useResetAtomicState } from '../atoms/hooks/atomic-hooks';
import { equationAtom } from './counter-atom';
import styles from './Counter.module.css';

export function CounterC() {
    const [equationResult, setEquationResult] = useAtomicState(equationAtom);
    const resetEquation = useResetAtomicState(equationAtom);

    return (<>
        <div className={styles.row}>A*2 + B</div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement value"
                onClick={() => setEquationResult(x => x - 1)}
            >
                -
            </button>
            <span className={styles.value}>{equationResult}</span>
            <button
                className={styles.button}
                aria-label="Increment value"
                onClick={() => setEquationResult(x => x + 1)}
            >
                +
            </button>
        </div>
        <div className={styles.row}>
            <button className={styles.button} onClick={resetEquation}>Reset</button>
        </div>
    </>);
}
