import { createAction, createSlice, Dispatch, PayloadAction, Store } from '@reduxjs/toolkit';
import { Immutable } from 'immer';
import { Atom, SyncOrAsyncValue, WritableAtom } from './atom-types';
import { AsyncAtomValue, AtomValue, GetAtomResult, LoadingAtom, ValueOrSetter } from './getter-setter-utils';
import { isPromise, SafeRecord } from './util-types';

type InternalAtomState = {
    value: unknown,
    loading: boolean
}

export type SliceState = {
    states: SafeRecord<string, InternalAtomState>;
}

export type AtomicStoreState = { atoms: SliceState };

const initialState: SliceState = {
    states: {}
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
    dispatch(internalInitialiseAtom(atom));
    return getAtomValueFromState(state, atom);
}

function getAtomValue<T>(atom: Atom<T, AsyncAtomValue<T>>, state: AtomicStoreState): Promise<T>;
function getAtomValue<T>(atom: Atom<T, AtomValue<T>>, state: AtomicStoreState): T;
function getAtomValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>, state: AtomicStoreState): T | Promise<T>;
function getAtomValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>, state: AtomicStoreState): T | Promise<T> {
    return atom.get({
        get: <U, V extends SyncOrAsyncValue<U>>(nextAtom: Atom<U, V>) =>
            (getAtomValueFromState(state, nextAtom) as GetAtomResult<U, V>),
        getAsync: nextAtom => Promise.resolve(getAtomValue(nextAtom, state))
    }, state);
}

// eslint-disable-next-line max-len
export function getAtomValueFromState<T, U extends AsyncAtomValue<T>>(state: AtomicStoreState, atom: Atom<T, U>): T | LoadingAtom;
// eslint-disable-next-line max-len
export function getAtomValueFromState<T, U extends AtomValue<T>>(state: AtomicStoreState, atom: Atom<T, U>): T;
// eslint-disable-next-line max-len
export function getAtomValueFromState<T, U extends SyncOrAsyncValue<T>>(state: AtomicStoreState, atom: Atom<T, U>): T | LoadingAtom;
export function getAtomValueFromState <T, U extends SyncOrAsyncValue<T>>(
    state: AtomicStoreState,
    atom: Atom<T, U>
): T | LoadingAtom {
    const atomState = state.atoms.states[atom.key];
    const result = atomState !== undefined
        ? atomState.value as T
        : getAtomValue(atom, state);

    return isPromise(result)
        ? new LoadingAtom()
        : result;
}

export const isAtomUpdating = <T>(state: AtomicStoreState, atom: Atom<T, SyncOrAsyncValue<T>>): boolean => {
    const atomState = state.atoms.states[atom.key];
    return atomState !== undefined && atomState.loading;
};

export const {
    internalSet,
    internalSetLoading
} = atomsSlice.actions;
export default atomsSlice.reducer;
