import { WritableAtom } from "./atom-types";
import { AtomValue, DefaultValue } from './getter-setter-utils';

export type AtomInitialiser<T> = {
    key: string;
    default: T;
}

export function atom<T>(initialiser: AtomInitialiser<T>): WritableAtom<T, AtomValue<T>> {
    return {
        key: initialiser.key,
        get: (_, state) => {
            const atomState = state.atoms.states[initialiser.key];
            return atomState !== undefined
                ? atomState.value as T
                : initialiser.default;
        },
        set: (_, value, setAtomValue) => {
            if (value instanceof DefaultValue) {
                setAtomValue(initialiser.default);
                return;
            }

            setAtomValue(value);
        }
    }
}
