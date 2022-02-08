import { AtomicStoreState } from './atom-slice';
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";

export type GetAtomResult<T, U extends SyncOrAsyncValue<T>> = U extends AsyncAtomValue<T> ? T | undefined : T;
export type AtomGetter = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U> | WritableAtomState<T, U>) => GetAtomResult<T, U>;
export type AtomSetter = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>, value: T) => void;

export type GetOptions = {
    get: AtomGetter;
}

export type SetOptions = {
    get: AtomGetter;
    set: AtomSetter;
}

export type AtomValue<T> = (args: GetOptions, state: AtomicStoreState) => T;
export type AsyncAtomValue<T> = (args: GetOptions, state: AtomicStoreState) => Promise<T>;
export type AtomUpdateFunction<T> = (value: T, args: SetOptions) => void;
export type InternalAtomUpdateFunction<T> = (value: T, args: SetOptions, setReduxState: (value: T) => void) => void;

export type ValueOrSetter<T> = T | ((state: T | undefined) => T);