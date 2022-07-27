import { Atom, SyncOrAsyncValue } from 'atomic-redux-state';
import { createContext } from 'react';

/** @internal */
export interface AtomicReduxContextValue {
    atomsToInitialise: Atom<unknown, SyncOrAsyncValue<unknown>>[];
    valueCache: Record<string, unknown>;
}

/** @internal */
export const AtomicReduxContext = createContext<AtomicReduxContextValue>({
    atomsToInitialise: [],
    valueCache: {}
});
AtomicReduxContext.displayName = 'Atomic Redux';
