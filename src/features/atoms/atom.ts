import { AtomState } from "./atom-state";

export type AtomInitialiser<T> = {
    key: string;
    default: T;
}

export function atom<T>(initialiser: AtomInitialiser<T>): AtomState<T> {
    return {
        key: initialiser.key,
        get: initialiser.default,
        set: (value, args, updateReduxState) => {
            updateReduxState(value);
        }
    }
}
