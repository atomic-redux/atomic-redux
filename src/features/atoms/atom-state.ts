import { AsyncAtomValue, AtomValue, InternalAtomUpdateFunction } from "./getter-setter-utils";

export enum AtomTypes {
    Atom,
    Derived
}

export type SyncOrAsyncValue<T> = AtomValue<T> | AsyncAtomValue<T>;

export interface AtomState<T, U extends SyncOrAsyncValue<T>> {
    key: string;
    get: U;
    type: AtomTypes;
}

export interface WritableAtomState<T, U extends SyncOrAsyncValue<T>> extends AtomState<T, U> {
    set: InternalAtomUpdateFunction<T>;
}

export function isWritableAtom<T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U>): atom is WritableAtomState<T, U> {
    return (atom as WritableAtomState<T, U>).set !== undefined;
}