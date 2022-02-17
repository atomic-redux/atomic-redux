import { useAtomicState } from 'atomic-redux-state-react';
import { useState } from 'react';
import { personAtom } from './counter-atom';
import styles from './Counter.module.css';

export function Person() {
    const [activePerson, setActivePerson] = useState(0);
    const [person, setPerson] = useAtomicState(personAtom(activePerson));

    return (<>
        <div className={styles.row}>Person</div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Previous person"
                onClick={() => setActivePerson(x => x - 1)}
            >
                {'<'}
            </button>
            <span className={styles.value}>{person.name}</span>
            <button
                className={styles.button}
                aria-label="Next person"
                onClick={() => setActivePerson(x => x + 1)}
            >
                {'>'}
            </button>
        </div>
        <div className={styles.row}>
            <button
                className={styles.button}
                aria-label="Decrement age"
                onClick={() => setPerson(p => { p.age -= 1 })}
            >
                -
            </button>
            <span className={styles.value}>Age:{person.age}</span>
            <button
                className={styles.button}
                aria-label="Increment age"
                onClick={() => setPerson(p => { p.age += 1 })}
            >
                +
            </button>
        </div>
    </>);
}