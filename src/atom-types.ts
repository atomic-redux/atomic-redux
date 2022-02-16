import { AsyncAtomValue, AtomValue, InternalAtomUpdateFunction } from "./getter-setter-utils";

export type SyncOrAsyncValue<T> = AtomValue<T> | AsyncAtomValue<T>;

export interface Atom<T, U extends SyncOrAsyncValue<T>> {
    key: string;
    get: U;
}

export interface WritableAtom<T, U extends SyncOrAsyncValue<T>> extends Atom<T, U> {
    set: InternalAtomUpdateFunction<T>;
}

export function isWritableAtom<T, U extends SyncOrAsyncValue<T>>(atom: Atom<T, U>): atom is WritableAtom<T, U> {
    return (atom as WritableAtom<T, U>).set !== undefined;
}