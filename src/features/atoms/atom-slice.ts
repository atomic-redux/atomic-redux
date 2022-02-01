import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState, WritableAtomState } from "./atom-state";
import { getValueFromGetter } from "./getter-setter-utils";

export type SliceState = {
    values: Record<string, any>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {}
}

export type SetAtomPayload<T> = {
    atom: AtomState<T>;
    value: T;
}

const setAtomActionName = 'atoms/setAtom';
export function setAtom<T>(atom: WritableAtomState<T>, value: T): PayloadAction<SetAtomPayload<T>> {
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
        internalSet: (state, action: PayloadAction<{ atomKey: string, value: any }>) => {
            state.values[action.payload.atomKey] = action.payload.value;
        },
        resetAtom: (state, action: PayloadAction<AtomState<any>>) => {
            state.values[action.payload.key] = action.payload.get;
        }
    }
});

export const getAtomValueFromStore = <T>(store: Store<AtomicStoreState>, atom: AtomState<T>): T => {
    const state = store.getState();
    return getAtomValueFromState(state, atom);
}

export const getAtomValueFromState = <T>(state: AtomicStoreState, atom: AtomState<T>): T => {
    if (!(atom.key in state.atoms.values)) {
        return getValueFromGetter(atom.get, atom => getAtomValueFromState(state, atom));
    }

    return state.atoms.values[atom.key];
}

export const { internalSet, resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;