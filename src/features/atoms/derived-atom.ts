import { AtomState, WritableAtomState } from './atom-state';
import { GetOptions, SetOptions } from './getter-setter-utils';

export interface DerivedAtomInitialiser<T> {
    key: string;
    get: (args: GetOptions) => T;
}

export interface WritableDerivedAtomInitialiser<T> extends DerivedAtomInitialiser<T> {
    set: (value: T, args: SetOptions) => void;
}

export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T>): AtomState<T>;
export function derivedAtom<T>(initialiser: WritableDerivedAtomInitialiser<T>): WritableAtomState<T>;
export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T> | WritableDerivedAtomInitialiser<T>): AtomState<T> | WritableAtomState<T> {
    if (isWritableInitialiser(initialiser)) {
        return {
            key: initialiser.key,
            defaultOrGetter: initialiser.get,
            set: initialiser.set
        }
    }
    return {
        key: initialiser.key,
        defaultOrGetter: initialiser.get,
    }
}

function isWritableInitialiser<T>(initialiser: DerivedAtomInitialiser<T>): initialiser is WritableDerivedAtomInitialiser<T> {
    return (initialiser as WritableDerivedAtomInitialiser<T>).set !== undefined;
}