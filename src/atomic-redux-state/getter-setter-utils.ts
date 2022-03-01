/* eslint-disable max-classes-per-file */
import { Draft, Immutable } from 'immer';
import { AtomicStoreState } from './atom-slice';
import { Atom, SyncOrAsyncValue, WritableAtom } from './atom-types';

export type GetAtomResult<T, U extends SyncOrAsyncValue<T>> =
    U extends AsyncAtomValue<T> ? Immutable<T> | LoadingAtom : Immutable<T>;
export type AtomGetter =
    <T, U extends SyncOrAsyncValue<T>>(atom: Atom<T, U> | WritableAtom<T, U>) => GetAtomResult<T, U>;
export type AsyncAtomGetter =
    <T, U extends SyncOrAsyncValue<T>>(atom: Atom<T, U> | WritableAtom<T, U>) => Promise<T>;
export type AtomSetter = <T>(atom: WritableAtom<T, SyncOrAsyncValue<T>>, value: ValueOrSetter<T>) => void;
export type ResetAtom = <T>(atom: WritableAtom<T, SyncOrAsyncValue<T>>) => void;

export type GetOptions = {
    get: AtomGetter;
    getAsync: AsyncAtomGetter;
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
export type InternalAtomUpdateFunction<T> = (
    args: SetOptions,
    value: T | DefaultValue,
    setAtomValue: (newValue: T) => void)
    => void;

export type AtomUpdateCallback<T> = ((state: Draft<T>) => void);
export type ValueOrSetter<T> = T | AtomUpdateCallback<T>;
