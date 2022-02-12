import { createAction, createSlice, Dispatch, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";
import { GetAtomResult, ValueOrSetter } from './getter-setter-utils';

export type SliceState = {
    values: Record<string, unknown>;
    graph: Record<string, string[]>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {},
    graph: {}
}

export type SetAtomPayload<T> = {
    atom: AtomState<T, SyncOrAsyncValue<T>>;
    value: ValueOrSetter<T>;
}

export const internalInitialiseAtom = createAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>('atoms/internalInitialiseAtom');

const setAtomActionName = 'atoms/setAtom';
export function setAtom<T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>, value: ValueOrSetter<T>): PayloadAction<SetAtomPayload<T>> {
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
        internalDelete: (state, action: PayloadAction<string>) => {
            delete state.values[action.payload];
        },
        internalAddNodeToGraph: (state, action: PayloadAction<string>) => {
            if (state.graph[action.payload] !== undefined) {
                return;
            }

            state.graph[action.payload] = [];
        },
        internalAddGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            if (state.graph[fromAtomKey] === undefined) {
                state.graph[fromAtomKey] = [];
            }

            if (!state.graph[fromAtomKey].includes(toAtomKey)) {
                state.graph[fromAtomKey].push(toAtomKey);
            }
        }
    }
});

export const getAtomValueFromStore = <T, U extends SyncOrAsyncValue<T>>(store: Store<AtomicStoreState>, atom: AtomState<T, U>): GetAtomResult<T, U> => {
    const state = store.getState();
    const dispatch = store.dispatch;
    return getAtomValueFromState(state, dispatch, atom);
}

export const getAtomValueFromState = <T, U extends SyncOrAsyncValue<T>>(state: AtomicStoreState, dispatch: Dispatch<any>, atom: AtomState<T, U>): GetAtomResult<T, U> => {
    if (state.atoms.graph[atom.key] === undefined) {
        return dispatch(internalInitialiseAtom(atom)) as unknown as GetAtomResult<T, U>;
    }

    return state.atoms.values[atom.key] as GetAtomResult<T, U>;
}

export const { internalSet, internalDelete, internalAddNodeToGraph, internalAddGraphConnection } = atomsSlice.actions;
export default atomsSlice.reducer;