import { createAction, createSlice, Dispatch, PayloadAction, Store } from '@reduxjs/toolkit';
import { Immutable } from 'immer';
import { Atom, SyncOrAsyncValue, WritableAtom } from './atom-types';
import { AsyncAtomValue, AtomValue, GetAtomResult, LoadingAtom, ValueOrSetter } from './getter-setter-utils';
import { SafeRecord } from './util-types';

type InternalAtomState = {
    value: unknown,
    loading: boolean
}

export type SliceState = {
    states: SafeRecord<string, InternalAtomState>;
    graph: {
        dependencies: SafeRecord<string, string[]>;
        dependants: SafeRecord<string, string[]>;
    }
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    states: {},
    graph: {
        dependencies: {},
        dependants: {}
    }
};

export type SetAtomPayload<T> = {
    atom: Atom<T, SyncOrAsyncValue<T>>;
    value: ValueOrSetter<T>;
}

export const internalInitialiseAtom = createAction<Atom<unknown, SyncOrAsyncValue<unknown>>>(
    'atoms/internalInitialiseAtom'
);

const setAtomActionName = 'atoms/setAtom';
export function setAtom<T>(
    atom: WritableAtom<T, SyncOrAsyncValue<T>>,
    value: ValueOrSetter<T>
): PayloadAction<SetAtomPayload<T>> {
    return {
        type: setAtomActionName,
        payload: { atom, value }
    };
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
        internalSetLoading: (state, action: PayloadAction<{ atomKey: string, loading: boolean }>) => {
            const currentState = state.states[action.payload.atomKey];
            if (currentState !== undefined) {
                currentState.loading = action.payload.loading;
            }
        },
        internalAddNodeToGraph: (state, action: PayloadAction<string>) => {
            if (state.graph.dependants[action.payload] === undefined) {
                state.graph.dependants[action.payload] = [];
            }

            if (state.graph.dependencies[action.payload] === undefined) {
                state.graph.dependencies[action.payload] = [];
            }
        },
        internalAddGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            if (fromAtomKey === toAtomKey) {
                return;
            }

            if (state.graph.dependants[fromAtomKey] === undefined) {
                state.graph.dependants[fromAtomKey] = [];
            }

            if (state.graph.dependencies[toAtomKey] === undefined) {
                state.graph.dependencies[toAtomKey] = [];
            }

            if (!state.graph.dependants[fromAtomKey]?.includes(toAtomKey)) {
                state.graph.dependants[fromAtomKey]?.push(toAtomKey);
            }

            if (!state.graph.dependencies[toAtomKey]?.includes(fromAtomKey)) {
                state.graph.dependencies[toAtomKey]?.push(fromAtomKey);
            }
        },
        internalResetGraphNodeDependencies: (state, action: PayloadAction<string>) => {
            state.graph.dependencies[action.payload] = [];
        },
        internalRemoveGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            state.graph.dependants[fromAtomKey] = state.graph.dependants[fromAtomKey]?.filter(d => d !== toAtomKey);
            state.graph.dependencies[toAtomKey] = state.graph.dependencies[toAtomKey]?.filter(d => d !== fromAtomKey);
        }
    }
});

// eslint-disable-next-line max-len
export function initialiseAtomFromStore<T>(store: Store<AtomicStoreState>, atom: Atom<T, AsyncAtomValue<T>>): GetAtomResult<T, AsyncAtomValue<T>>;
// eslint-disable-next-line max-len
export function initialiseAtomFromStore<T>(store: Store<AtomicStoreState>, atom: Atom<T, AtomValue<T>>): GetAtomResult<T, AtomValue<T>>;
// eslint-disable-next-line max-len
export function initialiseAtomFromStore<T>(store: Store<AtomicStoreState>, atom: Atom<T, SyncOrAsyncValue<T>>): GetAtomResult<T, SyncOrAsyncValue<T>> {
    const state = store.getState();
    const dispatch = store.dispatch;
    return initialiseAtomFromState(state, dispatch, atom);
}

// eslint-disable-next-line max-len
export function initialiseAtomFromState<T>(state: AtomicStoreState, dispatch: Dispatch<any>, atom: Atom<T, AsyncAtomValue<T>>): GetAtomResult<T, AsyncAtomValue<T>>;
// eslint-disable-next-line max-len
export function initialiseAtomFromState<T>(state: AtomicStoreState, dispatch: Dispatch<any>, atom: Atom<T, AtomValue<T>>): GetAtomResult<T, AtomValue<T>>;
// eslint-disable-next-line max-len
export function initialiseAtomFromState<T>(state: AtomicStoreState, dispatch: Dispatch<any>, atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom
export function initialiseAtomFromState<T>(
    state: AtomicStoreState,
    dispatch: Dispatch<any>,
    atom: Atom<T, SyncOrAsyncValue<T>>
): Immutable<T> | LoadingAtom {
    if (state.atoms.graph.dependencies[atom.key] === undefined) {
        return dispatch(internalInitialiseAtom(atom)) as unknown as Immutable<T> | LoadingAtom;
    }

    const atomState = state.atoms.states[atom.key];
    return atomState !== undefined
        ? atomState.value as T
        : new LoadingAtom();
}

export const getAtomValueFromState = <T, U extends SyncOrAsyncValue<T>>(
    state: AtomicStoreState,
    atom: Atom<T, U>
): GetAtomResult<T, U> => {
    const atomState = state.atoms.states[atom.key];
    const result = atomState !== undefined
        ? atomState.value as T
        : new LoadingAtom();
    return result as GetAtomResult<T, U>;
};

export const isAtomUpdating = <T>(state: AtomicStoreState, atom: Atom<T, SyncOrAsyncValue<T>>): boolean => {
    const atomState = state.atoms.states[atom.key];
    return atomState !== undefined && atomState.loading;
};

export const {
    internalSet,
    internalSetLoading,
    internalAddNodeToGraph,
    internalAddGraphConnection,
    internalResetGraphNodeDependencies,
    internalRemoveGraphConnection
} = atomsSlice.actions;
export default atomsSlice.reducer;
