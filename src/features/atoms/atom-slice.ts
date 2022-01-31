import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState } from "./atom-state";
import { getValueFromGetter } from "./getter-setter-utils";

export type SliceState = {
    values: Record<string, any>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {}
}

type SetAtomPayload<T> = {
    atom: AtomState<T>;
    value: T;
}

const setAtomActionName = 'atoms/setAtom';
export function setAtom<T>(atom: AtomState<T>, value: T): PayloadAction<SetAtomPayload<T>> {
    return {
        type: setAtomActionName,
        payload: { atom, value }
    }
}
setAtom.type = setAtomActionName;

export const atomsSlice = createSlice({
    name: 'atoms',
    initialState,
    reducers: {
        resetAtom: (state, action: PayloadAction<AtomState<any>>) => {
            state.values[action.payload.key] = action.payload.get;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(setAtom, (state, action) => {
            state.values[action.payload.atom.key] = action.payload.value;
        })
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

export const { resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;