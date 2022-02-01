import { ReadonlyAtomState } from "./atom-state";

export type AtomGetter = <T>(atom: ReadonlyAtomState<T>) => T;
export type AtomSetter = <T>(atom: ReadonlyAtomState<T>, value: T) => void;

export type GetOptions = {
    get: AtomGetter;
}

export type SetOptions = {
    set: AtomSetter;
}

export type AtomValue<T> = T | ((args: GetOptions) => T);
export type AtomUpdateFunction<T> = (value: T, args: SetOptions) => void;
export type InternalAtomUpdateFunction<T> = (value: T, args: SetOptions, setReduxState: (value: T) => void) => void;

export const getValueFromGetter = <T>(value: AtomValue<T>, get: AtomGetter): T => {
    if (value instanceof Function) {
        return value({ get }) as T;
    }
    return value as T;
}

export type ValueOrSetter<T> = T | ((state: T) => T);