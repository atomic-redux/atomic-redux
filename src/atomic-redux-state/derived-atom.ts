import { Atom, WritableAtom } from './atom-types';
import { AsyncAtomValue, AtomValue, DefaultValue, GetOptions, SetOptions } from './getter-setter-utils';

type SyncGetType<T> = (args: GetOptions) => T;
type AsyncGetType<T> = (args: GetOptions) => Promise<T>;
type GetType<T> = SyncGetType<T> | AsyncGetType<T>

interface BaseDerivedAtomInitialiser<T, G extends GetType<T>> {
    key: string;
    get: G;
}

interface WritableDerivedAtomInitialiser<T, G extends GetType<T>> extends BaseDerivedAtomInitialiser<T, G> {
    set: (args: SetOptions, value: T | DefaultValue) => void;
}

type DerivedAtomInitialiser<T, G extends GetType<T>> = BaseDerivedAtomInitialiser<T, G> | WritableDerivedAtomInitialiser<T, G>;

export function derivedAtom<T>(initialiser: WritableDerivedAtomInitialiser<T, AsyncGetType<T>>): WritableAtom<T, AsyncAtomValue<T>>;
export function derivedAtom<T>(initialiser: WritableDerivedAtomInitialiser<T, SyncGetType<T>>): WritableAtom<T, AtomValue<T>>;
export function derivedAtom<T>(initialiser: BaseDerivedAtomInitialiser<T, AsyncGetType<T>>): Atom<T, AsyncAtomValue<T>>;
export function derivedAtom<T>(initialiser: BaseDerivedAtomInitialiser<T, SyncGetType<T>>): Atom<T, AtomValue<T>>;
export function derivedAtom<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G>): Atom<T, G> | WritableAtom<T, G> {
    if (isWritableInitialiser(initialiser)) {
        return {
            key: initialiser.key,
            get: initialiser.get,
            set: initialiser.set
        }
    }
    return {
        key: initialiser.key,
        get: initialiser.get,
    }
}

function isWritableInitialiser<T, G extends GetType<T>>(initialiser: BaseDerivedAtomInitialiser<T, G>): initialiser is WritableDerivedAtomInitialiser<T, G> {
    return (initialiser as WritableDerivedAtomInitialiser<T, G>).set !== undefined;
}
