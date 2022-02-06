import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";
import { AtomGetter } from './getter-setter-utils';

export type SliceState = {
    values: Record<string, any>;
    derivedValues: Record<string, any>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {},
    derivedValues: {}
}

export type SetAtomPayload<T> = {
    atom: AtomState<T, SyncOrAsyncValue<T>>;
    value: T;
}

const setAtomActionName = 'atoms/setAtom';
export function setAtom<T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>, value: T): PayloadAction<SetAtomPayload<T>> {
    return {
        type: setAtomActionName,
        payload: { atom, value }
    }
}
setAtom.type = setAtomActionName;
setAtom.toString = () => setAtomActionName;

export const atomsSlice = createSlice({
    name: 'atoms',
    initialState,
    reducers: {
        internalSet: (state, action: PayloadAction<{ atomKey: string, value: unknown }>) => {
            state.values[action.payload.atomKey] = action.payload.value;
        },
        internalDerivedSet: (state, action: PayloadAction<{ atomKey: string, value: unknown }>) => {
            state.derivedValues[action.payload.atomKey] = action.payload.value;
        },
        resetAtom: (state, action: PayloadAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>) => {
            state.values[action.payload.key] = action.payload.defaultOrGetter;
        }
    }
});

export const getAtomValueFromStore = <T>(store: Store<AtomicStoreState>, atom: AtomState<T, SyncOrAsyncValue<T>>): T | undefined => {
    const state = store.getState();
    return getAtomValueFromState(state, atom);
}

export const getAtomValueFromState = <T>(state: AtomicStoreState, atom: AtomState<T, SyncOrAsyncValue<T>>): T | undefined => {
    if (!(atom.key in state.atoms.values)) {
        return getValueFromGetter(atom, state, atom => getAtomValueFromState(state, atom));
    }

    return state.atoms.values[atom.key];
}

const getValueFromGetter = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>, state: AtomicStoreState, get: AtomGetter): T | undefined => {
    if (atom.defaultOrGetter instanceof Function) {
        const result = atom.defaultOrGetter({ get });
        return isPromise(result)
            ? state.atoms.values[atom.key]
            : result;
    }
    return atom.defaultOrGetter;
}

function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}

export const { internalSet, internalDerivedSet, resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;