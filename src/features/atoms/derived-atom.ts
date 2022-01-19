import { AtomState } from './atom-state';
import { GetOptions } from './getter-setter-utils';

export type DerivedAtomInitialiser<T> = {
    key: string;
    get: (args: GetOptions) => T;
}

export function derivedAtom<T>(initialiser: DerivedAtomInitialiser<T>): AtomState<T> {
    return {
        key: initialiser.key,
        get: initialiser.get
    }
}
