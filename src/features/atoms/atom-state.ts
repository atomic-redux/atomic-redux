import { AtomValue, InternalAtomUpdateFunction } from "./getter-setter-utils";

export enum AtomTypes {
    Atom,
    Derived
}

export interface AtomState<T> {
    key: string;
    defaultOrGetter: AtomValue<T>;
    type: AtomTypes;
}

export interface WritableAtomState<T> extends AtomState<T> {
    set: InternalAtomUpdateFunction<T>;
}

export function isWritableAtom<T>(atom: AtomState<T>): atom is WritableAtomState<T> {
    return (atom as WritableAtomState<T>).set !== undefined;
}