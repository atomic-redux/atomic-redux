import { createAction, createSelector, createSlice, Dispatch, PayloadAction, Store } from '@reduxjs/toolkit';
import { Immutable } from 'immer';
import { AtomLoadingState } from './atom-loading-state';
import { Atom, SyncOrAsyncValue, WritableAtom } from './atom-types';
import { AsyncAtomValue, AtomValue, GetAtomResult, LoadingAtom, ValueOrSetter } from './getter-setter-utils';
import { checkForDependencyLoop, isPromise, SafeRecord } from './utils';

type InternalAtomState = {
    value: unknown,
    loadingState: AtomLoadingState
};

export type AtomSliceState = {
    states: SafeRecord<string, InternalAtomState>;
};

export type AtomicStoreState = { atoms: AtomSliceState };

const initialState: AtomSliceState = {
    states: {}
};

export type SetAtomPayload<T> = {
    atom: Atom<T, SyncOrAsyncValue<T>>;
    value: ValueOrSetter<T>;
};

export const initialiseAtom = createAction<Atom<unknown, SyncOrAsyncValue<unknown>>>(
    'atoms/initialiseAtom'
);

export const batchInitialiseAtoms = createAction<Atom<unknown, SyncOrAsyncValue<unknown>>[]>(
    'atoms/batchInitialiseAtoms'
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

/** @internal */
export type AtomUpdate = {
    atomKey: string,
    value: unknown
};

/** @internal */
export type AtomLoadingStateUpdate = {
    atomKey: string,
    loadingState: AtomLoadingState
};

/** @internal */
export const atomsSlice = createSlice({
    name: 'atoms',
    initialState,
    reducers: {
        internalSet: (state, action: PayloadAction<AtomUpdate[]>) => {
            for (const change of action.payload) {
                if (state.states[change.atomKey] !== undefined) {
                    state.states[change.atomKey]!.value = change.value;
                    continue;
                }

                state.states[change.atomKey] = {
                    value: change.value,
                    loadingState: AtomLoadingState.Idle
                };
            }
        },
        internalSetLoadingState: (state, action: PayloadAction<AtomLoadingStateUpdate[]>) => {
            for (const change of action.payload) {
                if (state.states[change.atomKey] === undefined) {
                    state.states[change.atomKey] = {
                        value: undefined,
                        loadingState: change.loadingState
                    };
                    continue;
                }

                state.states[change.atomKey]!.loadingState = change.loadingState;
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
export function initialiseAtomFromState<T>(state: AtomicStoreState, dispatch: Dispatch<any>, atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom;
export function initialiseAtomFromState<T>(
    state: AtomicStoreState,
    dispatch: Dispatch<any>,
    atom: Atom<T, SyncOrAsyncValue<T>>
): Immutable<T> | LoadingAtom {
    dispatch(initialiseAtom(atom));
    return getAtomValueFromState(state, atom);
}

function getAtomValue<T>(atom: Atom<T, AsyncAtomValue<T>>, state: AtomicStoreState, atomStack: string[]): Promise<T>;
function getAtomValue<T>(atom: Atom<T, AtomValue<T>>, state: AtomicStoreState, atomStack: string[]): T;
// eslint-disable-next-line max-len
function getAtomValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>, state: AtomicStoreState, atomStack: string[]): T | Promise<T>;
// eslint-disable-next-line max-len
function getAtomValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>, state: AtomicStoreState, atomStack: string[]): T | Promise<T> {
    atomStack.push(atom.key);
    checkForDependencyLoop(atomStack);

    const value = atom.get({
        get: <U, V extends SyncOrAsyncValue<U>>(nextAtom: Atom<U, V>) =>
            (getAtomValueFromState(state, nextAtom, atomStack) as GetAtomResult<U, V>),
        getAsync: nextAtom => Promise.resolve(getAtomValue(nextAtom, state, atomStack))
    }, atomKey => state.atoms.states[atomKey]?.value);

    atomStack.pop();
    return value;
}

// eslint-disable-next-line max-len
export function getAtomValueFromState<T>(state: AtomicStoreState, atom: Atom<T, AsyncAtomValue<T>>, atomStack?: string[]): T | LoadingAtom;
// eslint-disable-next-line max-len
export function getAtomValueFromState<T>(state: AtomicStoreState, atom: Atom<T, AtomValue<T>>, atomStack?: string[]): T;
// eslint-disable-next-line max-len
export function getAtomValueFromState<T>(state: AtomicStoreState, atom: Atom<T, SyncOrAsyncValue<T>>, atomStack?: string[]): T | LoadingAtom;
export function getAtomValueFromState<T>(
    state: AtomicStoreState,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atomStack: string[] = []
): T | LoadingAtom {
    const atomState = state.atoms.states[atom.key];

    if (atomState !== undefined && atomState.loadingState === AtomLoadingState.Loading) {
        return new LoadingAtom();
    }

    const result = atomState !== undefined
        ? atomState.value as T
        : getAtomValue(atom, state, atomStack);

    return isPromise(result)
        ? new LoadingAtom()
        : result;
}

type AtomSelector = <T>(state: AtomicStoreState, atom: Atom<T, SyncOrAsyncValue<T>>) => T | undefined;

/**
 * A selector function that returns the current state of an atom
 * @param state The state of the atom store
 * @param atom The atom to select
 * @returns Current atom value
 */
export const selectAtom: AtomSelector = createSelector(
    (state: AtomicStoreState, atom: Atom<unknown, SyncOrAsyncValue<unknown>>) => state.atoms.states[atom.key],
    atomState => (atomState === undefined ? undefined : atomState.value)
) as AtomSelector;

type IsAtomUpdatingSelector = (state: AtomicStoreState, atom: Atom<unknown, SyncOrAsyncValue<unknown>>) => boolean;
/**
 * Returns `true` if atom is currently updating
 * @param state The store state
 * @param atom The atom to check
 * @returns Updating status
 */
export const selectIsAtomUpdating: IsAtomUpdatingSelector = createSelector(
    (state: AtomicStoreState, atom: Atom<unknown, SyncOrAsyncValue<unknown>>) => state.atoms.states[atom.key],
    atomState => atomState !== undefined && atomState.loadingState === AtomLoadingState.Updating
);

/** @internal */
export const {
    internalSet,
    internalSetLoadingState
} = atomsSlice.actions;
export default atomsSlice.reducer;
