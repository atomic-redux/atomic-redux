import { createSlice, PayloadAction, Store } from "@reduxjs/toolkit";
import { isWritableAtom, ReadonlyAtomState, WritableAtomState } from "./atom-state";
import { getValueFromGetter } from "./getter-setter-utils";

export type SliceState = {
    values: Record<string, any>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {}
}

type SetAtomPayload<T> = {
    atom: ReadonlyAtomState<T>;
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

export const atomsSlice = createSlice({
    name: 'atoms',
    initialState,
    reducers: {
        resetAtom: (state, action: PayloadAction<ReadonlyAtomState<any>>) => {
            state.values[action.payload.key] = action.payload.get;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(setAtom, (state, action) => {
                const atom = action.payload.atom;
                if (!isWritableAtom(atom)) {
                    return;
                }

                const atomSetterGenerator = (atomKey: string) => (value: unknown) => {
                    state.values[atomKey] = value;
                }

                const setAtomValue = <T>(atomState: ReadonlyAtomState<T>, value: T) => {
                    if (!isWritableAtom(atomState)) {
                        return;
                    }

                    atomState.set(value, setAtomArgs, atomSetterGenerator(atomState.key));
                }

                const setAtomArgs = { set: setAtomValue };

                atom.set(action.payload.value, setAtomArgs, atomSetterGenerator(atom.key))
            });
    }
});

export const getAtomValueFromStore = <T>(store: Store<AtomicStoreState>, atom: ReadonlyAtomState<T>): T => {
    const state = store.getState();
    return getAtomValueFromState(state, atom);
}

export const getAtomValueFromState = <T>(state: AtomicStoreState, atom: ReadonlyAtomState<T>): T => {
    if (!(atom.key in state.atoms.values)) {
        return getValueFromGetter(atom.get, atom => getAtomValueFromState(state, atom));
    }

    return state.atoms.values[atom.key];
}

export const { resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;