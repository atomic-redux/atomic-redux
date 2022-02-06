import { AtomState, AtomTypes, WritableAtomState } from './atom-state';
import { AtomValue, GetOptions, SetOptions } from './getter-setter-utils';

export interface DerivedAtomInitialiser<T> {
    key: string;
    get: (args: GetOptions) => T;
}

export interface WritableDerivedAtomInitialiser<T> extends DerivedAtomInitialiser<T> {
    set: (value: T, args: SetOptions) => void;
}

export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T>): AtomState<T, AtomValue<T>>;
export function derivedAtom<T>(initialiser: WritableDerivedAtomInitialiser<T>): WritableAtomState<T, AtomValue<T>>;
export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T> | WritableDerivedAtomInitialiser<T>): AtomState<T, AtomValue<T>> | WritableAtomState<T, AtomValue<T>> {
    if (isWritableInitialiser(initialiser)) {
        return {
            type: AtomTypes.Derived,
            key: initialiser.key,
            defaultOrGetter: initialiser.get,
            set: initialiser.set
        }
    }
    return {
        type: AtomTypes.Derived,
        key: initialiser.key,
        defaultOrGetter: initialiser.get,
    }
}

function isWritableInitialiser<T>(initialiser: DerivedAtomInitialiser<T>): initialiser is WritableDerivedAtomInitialiser<T> {
    return (initialiser as WritableDerivedAtomInitialiser<T>).set !== undefined;
}