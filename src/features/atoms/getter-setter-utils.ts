import { Draft, Immutable } from 'immer';
import { AtomicStoreState } from './atom-slice';
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";

export type GetAtomResult<T, U extends SyncOrAsyncValue<T>> = U extends AsyncAtomValue<T> ? Immutable<T> | LoadingAtom : Immutable<T>;
export type AtomGetter = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U> | WritableAtomState<T, U>) => GetAtomResult<T, U>;
export type AtomSetter = <T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>, value: ValueOrSetter<T>) => void;
export type ResetAtom = <T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>) => void;

export type GetOptions = {
    get: AtomGetter;
}

export type SetOptions = {
    get: AtomGetter;
    set: AtomSetter;
    reset: ResetAtom;
}

export class DefaultValue { }
export class LoadingAtom { }

export type AtomValue<T> = (args: GetOptions, state: AtomicStoreState) => T;
export type AsyncAtomValue<T> = (args: GetOptions, state: AtomicStoreState) => Promise<T>;
export type AtomUpdateFunction<T> = (value: T | DefaultValue, args: SetOptions) => void;
export type InternalAtomUpdateFunction<T> = (args: SetOptions, value: T | DefaultValue, setAtomValue: (value: T) => void) => void;

export type ValueOrSetter<T> = T | ((state: Draft<T>) => void);