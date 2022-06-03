import { combineReducers, configureStore, Store } from '@reduxjs/toolkit';
import { AtomicStoreState, atomsReducer, getAtomMiddleware } from 'atomic-redux-state';

export function createTestStore(): Store<AtomicStoreState> {
    return configureStore({
        reducer: combineReducers({
            atoms: atomsReducer
        }),
        middleware: [getAtomMiddleware()]
    });
}
