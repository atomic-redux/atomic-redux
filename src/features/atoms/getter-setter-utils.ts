import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";

export type AtomGetter = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U> | WritableAtomState<T, U>) => U extends AsyncAtomValue<T> ? T | undefined : T;
export type AtomSetter = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>, value: T) => void;

export type GetOptions = {
    get: AtomGetter;
}

export type SetOptions = {
    get: AtomGetter;
    set: AtomSetter;
}

export type AtomValue<T> = (args: GetOptions) => T;
export type AsyncAtomValue<T> = (args: GetOptions) => Promise<T>;
export type AtomUpdateFunction<T> = (value: T, args: SetOptions) => void;
export type InternalAtomUpdateFunction<T> = (value: T, args: SetOptions, setReduxState: (value: T) => void) => void;

export type ValueOrSetter<T> = T | ((state: T | undefined) => T);