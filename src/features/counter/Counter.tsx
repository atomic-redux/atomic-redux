import { useAtomicState, useAtomicValue } from '../atoms/hooks/use-atomic-state';
import { counterAtomA, counterAtomB, equationAtom, multipliedAtomA, multipliedAtomB } from './counter-atom';
import styles from './Counter.module.css';

export function Counter() {
  const [countA, setCountA] = useAtomicState(counterAtomA);
  const [multipliedCountA, setMultipliedCountA] = useAtomicState(multipliedAtomA);
  const [countB, setCountB] = useAtomicState(counterAtomB);
  const multipliedCountB = useAtomicValue(multipliedAtomB);
  const [equationResult, setEquationResult] = useAtomicState(equationAtom);

  return (
    <div className={styles.columns}>
      <div className={styles.column}>
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
            aria-label="Decrement value"
            onClick={() => setMultipliedCountA(x => x - 1)}
          >
            -
          </button>
          <span className={styles.value}>x2: {multipliedCountA}</span>
          <button
            className={styles.button}
            aria-label="Increment value"
            onClick={() => setMultipliedCountA(x => x + 1)}
          >
            +
          </button>
        </div>
      </div>
      <div className={styles.column}>
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
          <span className={styles.value}>x2: {multipliedCountB}</span>
        </div>
      </div>
      <div className={styles.column}>
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
      </div>
    </div>
  );
}
