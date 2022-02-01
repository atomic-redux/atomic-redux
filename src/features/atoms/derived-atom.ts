import { AtomState } from './atom-state';
import { GetOptions, SetOptions } from './getter-setter-utils';

export type DerivedAtomInitialiser<T> = {
    key: string;
    get: (args: GetOptions) => T;
    set?: (value: T, args: SetOptions) => void;
}

export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T>): AtomState<T> {
    return {
        key: initialiser.key,
        get: initialiser.get,
        set: initialiser.set
    }
}
