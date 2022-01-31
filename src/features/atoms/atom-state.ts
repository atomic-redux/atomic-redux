import { AtomValue } from "./getter-setter-utils";

export interface AtomState<T> {
    key: string;
    get: AtomValue<T>;
}