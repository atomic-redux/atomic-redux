import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { atomsReducer, getAtomMiddleware } from 'atomic-redux-state';
import { AtomMiddlewareSliceState } from 'atomic-redux-state/out/atomic-redux-state/atom-middleware-slice';

const rootReducer = combineReducers({
    atoms: atomsReducer
})

export type StoreState = ReturnType<typeof rootReducer>

export const createStore = (preloadedState?: StoreState, atomState?: AtomMiddlewareSliceState) => {
    const atomMiddleware = getAtomMiddleware(atomState);
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: [
            atomMiddleware
        ]
    });

    return { store, atomMiddleware }
}