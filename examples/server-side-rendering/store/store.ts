import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { atomsReducer, getAtomMiddleware } from 'atomic-redux-state';
import { AtomMiddlewareSliceState } from 'atomic-redux-state/out/atomic-redux-state/atom-middleware-slice';

const rootReducer = combineReducers({
    atoms: atomsReducer
})

export type StoreState = ReturnType<typeof rootReducer>

export const createStore = (preloadedState?: StoreState, atomState?: AtomMiddlewareSliceState) => configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: [
        getAtomMiddleware(atomState)
    ]
});