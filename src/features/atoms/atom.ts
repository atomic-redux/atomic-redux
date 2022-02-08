import { AtomTypes, WritableAtomState } from "./atom-state";
import { AtomValue } from './getter-setter-utils';

export type AtomInitialiser<T> = {
    key: string;
    default: T;
}

export function atom<T>(initialiser: AtomInitialiser<T>): WritableAtomState<T, AtomValue<T>> {
    return {
        type: AtomTypes.Atom,
        key: initialiser.key,
        get: (_, state) => state.atoms.values[initialiser.key] as T | undefined ?? initialiser.default,
        set: (value, args, updateReduxState) => {
            updateReduxState(value);
        }
    }
}
