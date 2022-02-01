import { AtomValue, InternalAtomUpdateFunction } from "./getter-setter-utils";

export interface AtomState<T> {
    key: string;
    get: AtomValue<T>;
    set?: InternalAtomUpdateFunction<T>;
}