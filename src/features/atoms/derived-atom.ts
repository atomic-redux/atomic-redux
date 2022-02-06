import { AtomState, AtomTypes, WritableAtomState } from './atom-state';
import { AsyncAtomValue, AtomValue, GetOptions, SetOptions } from './getter-setter-utils';

type GetTypeSync<T> = (args: GetOptions) => T;
type GetTypeAsync<T> = (args: GetOptions) => Promise<T>;
type GetType<T> = GetTypeSync<T> | GetTypeAsync<T>

export interface DerivedAtomInitialiser<T, G extends GetType<T>> {
    key: string;
    get: G;
}

export interface WritableDerivedAtomInitialiser<T, G extends GetType<T>> extends DerivedAtomInitialiser<T, G> {
    set: (value: T, args: SetOptions) => void;
}

type IsAsyncronous<T, G extends GetType<T>> = G extends GetTypeAsync<T> ? AsyncAtomValue<T> : AtomValue<T>

export function derivedAtom<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G>): AtomState<T, IsAsyncronous<T, G>>;
export function derivedAtom<T, G extends GetType<T>>(initialiser: WritableDerivedAtomInitialiser<T, G>): WritableAtomState<T, IsAsyncronous<T, G>>;
export function derivedAtom<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G> | WritableDerivedAtomInitialiser<T, G>): AtomState<T, G> | WritableAtomState<T, G> {
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

function isWritableInitialiser<T, G extends GetType<T>>(initialiser: DerivedAtomInitialiser<T, G>): initialiser is WritableDerivedAtomInitialiser<T, G> {
    return (initialiser as WritableDerivedAtomInitialiser<T, G>).set !== undefined;
}