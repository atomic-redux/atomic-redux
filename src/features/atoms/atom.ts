import { AtomTypes, WritableAtomState } from "./atom-state";
import { AtomValue, DefaultValue } from './getter-setter-utils';

export type AtomInitialiser<T> = {
    key: string;
    default: T;
}

export function atom<T>(initialiser: AtomInitialiser<T>): WritableAtomState<T, AtomValue<T>> {
    return {
        type: AtomTypes.Atom,
        key: initialiser.key,
        get: (_, state) => {
            const atomState = state.atoms.states[initialiser.key];
            return atomState !== undefined
                ? atomState.value as T
                : initialiser.default;
        },
        set: (args, value, setAtomValue) => {
            if (value instanceof DefaultValue) {
                setAtomValue(initialiser.default);
                return;
            }

            setAtomValue(value);
        }
    }
}
