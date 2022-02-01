import { AtomValue, InternalAtomUpdateFunction } from "./getter-setter-utils";

export interface ReadonlyAtomState<T> {
    key: string;
    get: AtomValue<T>;
}

export interface WritableAtomState<T> extends ReadonlyAtomState<T> {
    set: InternalAtomUpdateFunction<T>;
}

export function isWritableAtom<T>(atom: ReadonlyAtomState<T>): atom is WritableAtomState<T> {
    return (atom as WritableAtomState<T>).set !== undefined;
}