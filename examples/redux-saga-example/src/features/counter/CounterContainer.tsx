import { Counter } from './Counter';
import styles from './Counter.module.css';

const CounterContainer = () => {
    return (
        <div className={styles.columns}>
            <div className={styles.column}>
                <Counter />
            </div>
        </div>
    )
};

export default CounterContainer;
