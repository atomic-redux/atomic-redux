import { ReadOnlyAtom, WritableAtom } from './atom-types';
import { AtomValue, DefaultValue } from './getter-setter-utils';

export type AtomInitialiser<T> = {
    key: string;
    default: T;
};

export function atom<T>(initialiser: AtomInitialiser<T>): WritableAtom<T, AtomValue<T>> {
    return {
        key: initialiser.key,
        get: (_, getState) => {
            const atomState = getState(initialiser.key);
            return atomState !== undefined
                ? atomState as T
                : initialiser.default;
        },
        set: (_, value, setAtomValue) => {
            if (value instanceof DefaultValue) {
                setAtomValue(initialiser.default);
                return;
            }

            setAtomValue(value);
        },
        toReadonly() {
            return new ReadOnlyAtom(initialiser.key, this.get);
        }
    };
}
