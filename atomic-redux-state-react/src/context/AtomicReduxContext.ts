import { Atom, SyncOrAsyncValue } from 'atomic-redux-state';
import { createContext } from 'react';

/** @internal */
export interface AtomicReduxContextValue {
    atomsToInitialise: Atom<unknown, SyncOrAsyncValue<unknown>>[];
}

/** @internal */
export const AtomicReduxContext = createContext<AtomicReduxContextValue>({
    atomsToInitialise: []
});
AtomicReduxContext.displayName = 'Atomic Redux';
