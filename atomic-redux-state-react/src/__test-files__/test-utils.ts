import { combineReducers, configureStore, createAction, PayloadAction, Reducer, Store } from '@reduxjs/toolkit';
import { AtomicStoreState, AtomSliceState, atomsReducer, getAtomMiddleware } from 'atomic-redux-state';
import { AtomLoadingState } from 'atomic-redux-state/out/atomic-redux-state/atom-loading-state';

type SetAtomUpdatingPayload = {
    atomKey: string,
    loadingState: AtomLoadingState
};

/** @internal */
export const setAtomUpdating = createAction<SetAtomUpdatingPayload>('atoms/setAtomUpdating');

/** @internal */
export const testAtomReducer: Reducer<AtomSliceState, PayloadAction<SetAtomUpdatingPayload>> = (
    state,
    action
) => {
    switch (action.type) {
        case setAtomUpdating.toString():
            return {
                ...state,
                states: {
                    ...state?.states,
                    [action.payload.atomKey]: {
                        ...state?.states?.[action.payload.atomKey],
                        loadingState: action.payload.loadingState
                    }
                }
            } as AtomSliceState;
        default:
            return atomsReducer(state, action);
    }
};

/** @internal */
export function createTestStore(): Store<AtomicStoreState> {
    return configureStore({
        reducer: combineReducers({
            atoms: testAtomReducer
        }),
        middleware: [getAtomMiddleware()]
    });
}
