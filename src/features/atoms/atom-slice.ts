import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState } from "./atom-state";

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
            state.values[action.payload.key] = action.payload.default;
        }
    }
});

export const getAtomValue = <T>(store: Store<AtomicStoreState>, atom: AtomState<T>): T => store.getState().atoms.values[atom.key] as T;

export const { setAtom, resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;