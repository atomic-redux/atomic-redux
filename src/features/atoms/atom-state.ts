import { ValueOrGetter } from "./getter-setter-utils";

export interface AtomState<T> {
    key: string;
    get: ValueOrGetter<T>;
}