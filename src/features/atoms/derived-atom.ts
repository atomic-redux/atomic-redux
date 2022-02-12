import { AtomState, AtomTypes, WritableAtomState } from './atom-state';
import { AsyncAtomValue, AtomValue, GetOptions, SetOptions } from './getter-setter-utils';

type SyncGetType<T> = (args: GetOptions) => T;
type AsyncGetType<T> = (args: GetOptions) => Promise<T>;
type GetType<T> = SyncGetType<T> | AsyncGetType<T>

export interface DerivedAtomInitialiser<T, G extends GetType<T>> {
    key: string;
    get: G;
}

export interface WritableDerivedAtomInitialiser<T, G extends GetType<T>> extends DerivedAtomInitialiser<T, G> {
    set: (args: SetOptions, value: T) => void;
}

export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T, AsyncGetType<T>>): AtomState<T, AsyncAtomValue<T>>;
export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T, SyncGetType<T>>): AtomState<T, AtomValue<T>>;
export function derivedAtom<T>(initialiser: WritableDerivedAtomInitialiser<T, AsyncGetType<T>>): WritableAtomState<T, AsyncAtomValue<T>>;
export function derivedAtom<T>(initialiser: WritableDerivedAtomInitialiser<T, SyncGetType<T>>): WritableAtomState<T, AtomValue<T>>;
export function derivedAtom<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G> | WritableDerivedAtomInitialiser<T, G>): AtomState<T, G> | WritableAtomState<T, G> {
    if (isWritableInitialiser(initialiser)) {
        return {
            type: AtomTypes.Derived,
            key: initialiser.key,
            get: initialiser.get,
            set: initialiser.set
        }
    }
    return {
        type: AtomTypes.Derived,
        key: initialiser.key,
        get: initialiser.get,
    }
}

function isWritableInitialiser<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G>): initialiser is WritableDerivedAtomInitialiser<T, G> {
    return (initialiser as WritableDerivedAtomInitialiser<T, G>).set !== undefined;
}
