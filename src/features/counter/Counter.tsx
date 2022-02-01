import React, { useState } from 'react';
import { useAtomicState } from '../atoms/hooks/use-atomic-state';
import { counterAtom, multipliedAtom } from './counter-atom';
import styles from './Counter.module.css';

export function Counter() {
  const [count, setCount] = useAtomicState(counterAtom);
  const [multipliedCount, setMultipliedCount] = useAtomicState(multipliedAtom);
  const [incrementAmount, setIncrementAmount] = useState('2');

  const incrementValue = Number(incrementAmount) || 0;

  return (
    <div>
      <div className={styles.row}>
        <button
          className={styles.button}
          aria-label="Decrement value"
          onClick={() => setCount(x => x - 1)}
        >
          -
        </button>
        <span className={styles.value}>{count}</span>
        <button
          className={styles.button}
          aria-label="Increment value"
          onClick={() => setCount(x => x + 1)}
        >
          +
        </button>
      </div>
      <div className={styles.row}>
        <button
          className={styles.button}
          aria-label="Decrement value"
          onClick={() => setMultipliedCount(x => x - 1)}
        >
          -
        </button>
        <span className={styles.value}>x2: {multipliedCount}</span>
        <button
          className={styles.button}
          aria-label="Increment value"
          onClick={() => setMultipliedCount(x => x + 1)}
        >
          +
        </button>
      </div>
      <div className={styles.row}>
        <input
          className={styles.textbox}
          aria-label="Set increment amount"
          value={incrementAmount}
          onChange={(e) => setIncrementAmount(e.target.value)}
        />
        <button
          className={styles.button}
          onClick={() => setCount(count => count + incrementValue)}
        >
          Add Amount
        </button>
      </div>
    </div>
  );
}
