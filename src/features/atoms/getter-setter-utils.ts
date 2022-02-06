import { AtomState } from "./atom-state";

export type AtomGetter = <T>(atom: AtomState<T>) => T | undefined;
export type AtomSetter = <T>(atom: AtomState<T>, value: T) => void;

export type GetOptions = {
    get: AtomGetter;
}

export type SetOptions = {
    get: AtomGetter;
    set: AtomSetter;
}

export type AtomValue<T> = T | ((args: GetOptions) => T);
export type AtomUpdateFunction<T> = (value: T, args: SetOptions) => void;
export type InternalAtomUpdateFunction<T> = (value: T, args: SetOptions, setReduxState: (value: T) => void) => void;

export type ValueOrSetter<T> = T | ((state: T | undefined) => T);