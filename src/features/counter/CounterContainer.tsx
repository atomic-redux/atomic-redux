import React from 'react';
import styles from './Counter.module.css';
import { CounterA } from './CounterA';
import { CounterB } from './CounterB';
import { CounterC } from './CounterC';

const CounterContainer = () => {
    return (
        <div className={styles.columns}>
            <div className={styles.column}>
                <CounterA />
            </div>
            <div className={styles.column}>
                <CounterB />
            </div>
            <div className={styles.column}>
                <CounterC />
            </div>
        </div>
    )
};

export default CounterContainer;
