import { AtomState } from "./atom-state";

export type AtomGetter = <T>(atom: AtomState<T>) => T;

export type GetOptions = {
    get: AtomGetter;
}

export type AtomValue<T> = T | ((args: GetOptions) => T);

export const getValueFromGetter = <T>(value: AtomValue<T>, get: AtomGetter): T => {
    if (value instanceof Function) {
        return value({ get }) as T;
    }
    return value as T;
}

export type ValueOrSetter<T> = T | ((state: T) => T);