import { AtomState, AtomTypes, WritableAtomState } from './atom-state';
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

export function derivedAtom<T, G extends GetType<T>>(initialiser: WritableDerivedAtomInitialiser<T, G>): WritableAtomState<T, G extends AsyncGetType<T> ? AsyncAtomValue<T> : AtomValue<T>>;
export function derivedAtom<T, G extends GetType<T>>(initialiser: BaseDerivedAtomInitialiser<T, G>): AtomState<T, G extends AsyncGetType<T> ? AsyncAtomValue<T> : AtomValue<T>>;
export function derivedAtom<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G>): AtomState<T, G> | WritableAtomState<T, G> {
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

function isWritableInitialiser<T, G extends GetType<T>>(initialiser: BaseDerivedAtomInitialiser<T, G>): initialiser is WritableDerivedAtomInitialiser<T, G> {
    return (initialiser as WritableDerivedAtomInitialiser<T, G>).set !== undefined;
}
