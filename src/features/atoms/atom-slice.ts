import { createAction, createSlice, Dispatch, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";
import { GetAtomResult, LoadingAtom, ValueOrSetter } from './getter-setter-utils';
import { SafeRecord } from './util-types';

type InternalAtomState = {
    value: unknown,
    loading: boolean
}

export type SliceState = {
    states: SafeRecord<string, InternalAtomState>;
    graph: SafeRecord<string, string[]>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    states: {},
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
            const currentState = state.states[action.payload.atomKey];
            if (currentState !== undefined) {
                currentState.value = action.payload.value;
                return;
            }

            state.states[action.payload.atomKey] = {
                value: action.payload.value,
                loading: false
            };
        },
        internalDelete: (state, action: PayloadAction<string>) => {
            delete state.states[action.payload];
        },
        internalSetLoading: (state, action: PayloadAction<{ atomKey: string, loading: boolean }>) => {
            const currentState = state.states[action.payload.atomKey];
            if (currentState !== undefined) {
                currentState.loading = action.payload.loading;
            }
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

            if (!state.graph[fromAtomKey]?.includes(toAtomKey)) {
                state.graph[fromAtomKey]?.push(toAtomKey);
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

    const atomState = state.atoms.states[atom.key];
    const result = atomState !== undefined
        ? atomState.value as T
        : new LoadingAtom();
    return result as GetAtomResult<T, U>;
}

export const isAtomUpdating = <T>(state: AtomicStoreState, atom: AtomState<T, SyncOrAsyncValue<T>>): boolean => {
    const atomState = state.atoms.states[atom.key];
    return atomState !== undefined && atomState.loading;
}

export const { internalSet, internalDelete, internalSetLoading, internalAddNodeToGraph, internalAddGraphConnection } = atomsSlice.actions;
export default atomsSlice.reducer;