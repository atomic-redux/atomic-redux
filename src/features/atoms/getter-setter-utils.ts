import { AtomState, SyncOrAsyncValue } from "./atom-state";

export type AtomGetter = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>) => T | undefined;
export type AtomSetter = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>, value: T) => void;

export type GetOptions = {
    get: AtomGetter;
}

export type SetOptions = {
    get: AtomGetter;
    set: AtomSetter;
}

export type AtomValue<T> = T | ((args: GetOptions) => T);
export type AsyncAtomValue<T> = (args: GetOptions) => Promise<T>;
export type AtomUpdateFunction<T> = (value: T, args: SetOptions) => void;
export type InternalAtomUpdateFunction<T> = (value: T, args: SetOptions, setReduxState: (value: T) => void) => void;

export type ValueOrSetter<T> = T | ((state: T | undefined) => T);