import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState } from "./atom-state";
import { getValueFromGetter, ValueOrGetter } from "./getter-setter-utils";

export type SliceState = {
    values: Record<string, ValueOrGetter<any>>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {}
}

type SetAtomPayload<T> = {
    atom: AtomState<T>;
    value: T;
}

export const atomsSlice = createSlice({
    name: 'atoms',
    initialState,
    reducers: {
        setAtom: {
            reducer: (state, action: PayloadAction<SetAtomPayload<any>>) => {
                state.values[action.payload.atom.key] = action.payload.value;
            },
            prepare: <T>(atom: AtomState<T>, value: T) => {
                return {
                    payload: { atom, value }
                }
            }
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

    return getValueFromGetter(state.atoms.values[atom.key], atom => getAtomValueFromState(state, atom));
}

export const { setAtom, resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;