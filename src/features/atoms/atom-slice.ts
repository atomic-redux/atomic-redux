import { createAction, createSlice, Dispatch, PayloadAction, Store } from "@reduxjs/toolkit";
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "./atom-state";
import { AsyncAtomValue, AtomGetter } from './getter-setter-utils';

export type SliceState = {
    values: Record<string, unknown>;
    derivedValues: Record<string, unknown>;
    graph: Record<string, string[]>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    values: {},
    derivedValues: {},
    graph: {}
}

export type SetAtomPayload<T> = {
    atom: AtomState<T, SyncOrAsyncValue<T>>;
    value: T;
}

export const internalInitialiseAtom = createAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>('atoms/internalInitialiseAtom');

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
        },
        resetAtom: (state, action: PayloadAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>) => {
            state.values[action.payload.key] = action.payload.defaultOrGetter;
        }
    }
});

type GetAtomResult<T, U extends SyncOrAsyncValue<T>> = U extends AsyncAtomValue<T> ? T | undefined : T;

export const getAtomValueFromStore = <T, U extends SyncOrAsyncValue<T>>(store: Store<AtomicStoreState>, atom: AtomState<T, U>): GetAtomResult<T, U> => {
    const state = store.getState();
    const dispatch = store.dispatch;
    return getAtomValueFromState(state, dispatch, atom);
}

export const getAtomValueFromState = <T, U extends SyncOrAsyncValue<T>>(state: AtomicStoreState, dispatch: Dispatch<any>, atom: AtomState<T, U>): GetAtomResult<T, U> => {
    if (state.atoms.graph[atom.key] === undefined) {
        dispatch(internalInitialiseAtom(atom));
    }

    const atomGetter: AtomGetter = nextAtom => {
        if (state.atoms.graph[nextAtom.key] === undefined || !state.atoms.graph[nextAtom.key].includes(atom.key)) {
            dispatch(internalInitialiseAtom(nextAtom));
            dispatch(internalAddGraphConnection({
                fromAtomKey: nextAtom.key,
                toAtomKey: atom.key
            }));
        }

        return getAtomValueFromState(state, dispatch, nextAtom);
    }

    if (!(atom.key in state.atoms.values)) {
        return getValueFromGetter(atom, state, atomGetter);
    }

    return state.atoms.values[atom.key] as GetAtomResult<T, U>;
}

const getValueFromGetter = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, SyncOrAsyncValue<T>>, state: AtomicStoreState, get: AtomGetter): U extends AsyncAtomValue<T> ? T | undefined : T => {
    if (atom.defaultOrGetter instanceof Function) {
        const result = atom.defaultOrGetter({ get });
        return (isPromise(result)
            ? state.atoms.derivedValues[atom.key]
            : result) as GetAtomResult<T, U>;
    }

    return atom.defaultOrGetter as any;
}

function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}

export const { internalSet, internalAddNodeToGraph, internalAddGraphConnection, resetAtom } = atomsSlice.actions;
export default atomsSlice.reducer;