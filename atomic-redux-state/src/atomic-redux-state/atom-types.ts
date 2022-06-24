import { AsyncAtomValue, AtomUpdateFunction, AtomValue } from './getter-setter-utils';

export type SyncOrAsyncValue<T> = AtomValue<T> | AsyncAtomValue<T>;

export interface Atom<T, U extends SyncOrAsyncValue<T>> {
    key: string;
    get: U;
    toReadonly(): Atom<T, U>;
}

/** @internal */
export class ReadOnlyAtom<T, U extends SyncOrAsyncValue<T>> implements Atom<T, U> {
    constructor(public key: string, public get: U) {}

    toReadonly(): Atom<T, U> {
        return this;
    }
}

export interface WritableAtom<T, U extends SyncOrAsyncValue<T>> extends Atom<T, U> {
    set: AtomUpdateFunction<T>;
}

/** @internal */
export class ReadWriteAtom<T, U extends SyncOrAsyncValue<T>> extends ReadOnlyAtom<T, U> implements WritableAtom<T, U> {
    constructor(key: string, get: U, public set: AtomUpdateFunction<T>) {
        super(key, get);
    }

    toReadonly(): Atom<T, U> {
        return new ReadOnlyAtom(this.key, this.get);
    }
}

export function isWritableAtom<T, U extends SyncOrAsyncValue<T>>(atom: Atom<T, U>): atom is WritableAtom<T, U> {
    return (atom as WritableAtom<T, U>).set !== undefined;
}
