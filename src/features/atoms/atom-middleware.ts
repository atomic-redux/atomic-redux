import { Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import produce from 'immer';
import { AtomicStoreState, getAtomValueFromState, internalAddGraphConnection, internalAddNodeToGraph, internalInitialiseAtom, internalSet, internalSetLoading, setAtom, SetAtomPayload } from './atom-slice';
import { AtomState, isWritableAtom, SyncOrAsyncValue, WritableAtomState } from './atom-state';
import { AtomGetter, DefaultValue, GetAtomResult, LoadingAtom, SetOptions, ValueOrSetter } from './getter-setter-utils';
import { SafeRecord } from './util-types';

type AtomMiddlewareStore = MiddlewareAPI<Dispatch<any>, AtomicStoreState>;
type Atoms = SafeRecord<string, AtomState<unknown, SyncOrAsyncValue<unknown>>>;

function createInitialisationAtomGetter(currentAtom: AtomState<unknown, SyncOrAsyncValue<unknown>>, atoms: Atoms, store: AtomMiddlewareStore) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: AtomState<T, U>): GetAtomResult<T, U> => {
        store.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key
        }));

        return addAtomToGraph(store, previousAtom, atoms) as GetAtomResult<T, U>;
    }
}

const addAtomToGraph = <T>(store: AtomMiddlewareStore, atom: AtomState<T, SyncOrAsyncValue<T>>, atoms: Atoms): T | LoadingAtom => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const result = atom.get({ get: createInitialisationAtomGetter(atom, atoms, store) }, store.getState());
    const value = handlePossiblePromise(result, atom.key, atoms, store);

    if (!(value instanceof LoadingAtom)) {
        store.dispatch(internalSet({
            atomKey: atom.key,
            value
        }));
    }

    return value;
}

const handleInitialiseAtomAction = <T>(store: AtomMiddlewareStore, action: PayloadAction<AtomState<T, SyncOrAsyncValue<T>>>, atoms: Atoms): T | LoadingAtom => {
    const atom = action.payload;

    const value = addAtomToGraph(store, atom, atoms);
    store.dispatch(internalAddNodeToGraph(atom.key));

    return value;
}

const handleSetAtomAction = (store: AtomMiddlewareStore, action: PayloadAction<SetAtomPayload<unknown>>, atoms: Atoms): void => {
    const payload = action.payload;
    const atom = payload.atom;

    if (!isWritableAtom(atom)) {
        throw new Error(`Attempted to write value ${payload.value} to read-only atom ${atom.key}`);
    }

    const getAtom = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U>) => {
        return getAtomValueFromState(store.getState(), store.dispatch, atom);
    }

    const setAtomValue = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>, value: ValueOrSetter<T>) => {
        if (!isWritableAtom(atom)) {
            throw new Error(`Attempted to write value ${value} to read-only atom ${atom.key}`);
        }

        setAtomWithProduce(atom, atoms, setAtomArgs, value, store);
    }

    const resetAtom = <T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>) => {
        atom.set(setAtomArgs, new DefaultValue(), reduxSetterGenerator(atom.key, store, atoms));
    }

    const setAtomArgs = { get: getAtom, set: setAtomValue, reset: resetAtom };

    setAtomWithProduce(atom, atoms, setAtomArgs, payload.value, store);
    updateGraphFromAtom(atom, atoms, store);
}

const reduxSetterGenerator = (atomKey: string, store: AtomMiddlewareStore, atoms: Atoms) => <T>(value: T) => {
    const atom = atoms[atomKey];
    if (atom === undefined) {
        return;
    }

    store.dispatch(internalSet({
        atomKey,
        value: handlePossiblePromise(value, atomKey, atoms, store)
    }));

    updateGraphFromAtom(atom, atoms, store);
}

const setAtomWithProduce = <T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>, atoms: Atoms, setAtomArgs: SetOptions, valueOrSetter: ValueOrSetter<T>, store: AtomMiddlewareStore) => {
    if (!(valueOrSetter instanceof Function)) {
        atom.set(setAtomArgs, valueOrSetter, reduxSetterGenerator(atom.key, store, atoms));
        return;
    }

    const currentValue = getAtomValueFromState(store.getState(), store.dispatch, atom) as T;
    const newValue = produce(currentValue, valueOrSetter as (draft: Function) => void);
    atom.set(setAtomArgs, newValue, reduxSetterGenerator(atom.key, store, atoms));
}

const updateGraphFromAtom = (atom: AtomState<unknown, SyncOrAsyncValue<unknown>>, atoms: Atoms, store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>): void => {
    const storeState = store.getState();
    const dependerKeys = storeState.atoms.graph[atom.key];

    if (dependerKeys === undefined) {
        return;
    }

    const atomGetter: AtomGetter = <T, U extends SyncOrAsyncValue<T>>(previousAtom: AtomState<T, U>): GetAtomResult<T, U> => {
        const result = previousAtom.get({ get: atomGetter }, storeState);
        const value = handlePossiblePromise(result, previousAtom.key, atoms, store);

        return value as GetAtomResult<T, U>;
    }

    for (const dependerKey of dependerKeys) {
        const depender = atoms[dependerKey];
        if (depender === undefined) {
            continue;
        }

        const dependerValue = depender.get({ get: atomGetter }, storeState);

        store.dispatch(internalSet({
            atomKey: depender.key,
            value: handlePossiblePromise(dependerValue, depender.key, atoms, store)
        }));
        updateGraphFromAtom(depender, atoms, store);
    }
}

export const getAtomMiddleware = () => {
    const setAtomMiddleware: Middleware<{}, AtomicStoreState> = store => next => {
        let atoms: Atoms = {};
        return action => {
            if (action.type === internalInitialiseAtom.toString()) {
                return handleInitialiseAtomAction(store, action, atoms);
            }

            if (action.type === setAtom.toString()) {
                return handleSetAtomAction(store, action, atoms)
            }

            return next(action);
        }
    }

    return setAtomMiddleware;
}

function handlePossiblePromise<T>(valueOrPromise: T | Promise<T>, atomKey: string, atoms: Atoms, store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>): T | LoadingAtom {
    if (!isPromise(valueOrPromise)) {
        return valueOrPromise;
    }

    valueOrPromise.then(value => {
        const atom = atoms[atomKey];

        if (atom !== undefined) {
            store.dispatch(internalSet({ atomKey, value }));
            store.dispatch(internalSetLoading({ atomKey, loading: false }))
            updateGraphFromAtom(atom, atoms, store);
        }
    });

    const atomState = store.getState().atoms.states[atomKey];
    if (atomState === undefined) {
        return new LoadingAtom();
    }

    store.dispatch(internalSetLoading({ atomKey, loading: true }))
    return atomState.value as T;
}

function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}