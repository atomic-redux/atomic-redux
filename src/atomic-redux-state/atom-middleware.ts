import { Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import produce from 'immer';
import {
    AtomicStoreState,
    initialiseAtomFromState,
    internalAddGraphConnection,
    internalAddNodeToGraph,
    internalInitialiseAtom,
    internalRemoveGraphConnection,
    internalResetGraphNodeDependencies,
    internalSet,
    internalSetLoading,
    setAtom,
    SetAtomPayload
} from './atom-slice';
import { Atom, isWritableAtom, SyncOrAsyncValue, WritableAtom } from './atom-types';
import {
    DefaultValue,
    GetAtomResult,
    LoadingAtom,
    SetOptions,
    ValueOrSetter
} from './getter-setter-utils';
import { SafeRecord } from './util-types';

type AtomMiddlewareStore = MiddlewareAPI<Dispatch<any>, AtomicStoreState>;
type Atoms = SafeRecord<string, Atom<unknown, SyncOrAsyncValue<unknown>>>;
type AtomPromises = SafeRecord<string, Promise<unknown>[]>;

function createAtomGetter(
    currentAtom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: AtomMiddlewareStore,
    promises: AtomPromises
) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: Atom<T, U>): GetAtomResult<T, U> => {
        store.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key
        }));

        return getAtomValue(store, previousAtom, atoms, promises) as GetAtomResult<T, U>;
    };
}

function createAsyncAtomGetter(
    currentAtom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: AtomMiddlewareStore,
    promises: AtomPromises
) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: Atom<T, U>): Promise<T> => {
        store.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key
        }));

        return getAtomValueAsync(store, previousAtom, atoms, promises);
    };
}

const getAtomValue = <T>(
    store: AtomMiddlewareStore,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    promises: AtomPromises
): T | LoadingAtom => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, promises),
        getAsync: createAsyncAtomGetter(atom, atoms, store, promises)
    }, store.getState());
    const value = handlePossiblePromise(result, atom.key, atoms, store, promises);

    if (!(value instanceof LoadingAtom)) {
        store.dispatch(internalSet({
            atomKey: atom.key,
            value
        }));
    }

    return value;
};

const getAtomValueAsync = <T>(
    store: AtomMiddlewareStore,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    promises: AtomPromises
): Promise<T> => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, promises),
        getAsync: createAsyncAtomGetter(atom, atoms, store, promises)
    }, store.getState());

    const atomState = store.getState().atoms.states[atom.key];

    const promise = Promise.resolve(result);
    return atomState !== undefined
        ? Promise.resolve(atomState.value as T)
        : handlePromise(promise, atom.key, atoms, store, promises);
};

const removeStaleGraphConnections = (
    store: AtomMiddlewareStore,
    atomKey: string,
    dependenciesBeforeUpdate: string[],
    dependenciesAfterUpdate: string[]
): void => {
    const staleDependencies = dependenciesBeforeUpdate.filter(d => !dependenciesAfterUpdate.includes(d));
    for (const staleDependency of staleDependencies) {
        store.dispatch(internalRemoveGraphConnection({
            fromAtomKey: staleDependency,
            toAtomKey: atomKey
        }));
    }
};

const handleInitialiseAtomAction = <T>(
    store: AtomMiddlewareStore,
    action: PayloadAction<Atom<T, SyncOrAsyncValue<T>>>,
    atoms: Atoms,
    promises: AtomPromises
): T | LoadingAtom => {
    const atom = action.payload;

    const value = getAtomValue(store, atom, atoms, promises);
    store.dispatch(internalAddNodeToGraph(atom.key));

    return value;
};

const handleSetAtomAction = (
    store: AtomMiddlewareStore,
    action: PayloadAction<SetAtomPayload<unknown>>,
    atoms: Atoms,
    promises: AtomPromises
): void => {
    const payload = action.payload;
    const atom = payload.atom;

    if (!isWritableAtom(atom)) {
        throw new Error(`Attempted to write value ${payload.value} to read-only atom ${atom.key}`);
    }

    const setAtomValue = <T>(nextAtom: Atom<T, SyncOrAsyncValue<T>>, value: ValueOrSetter<T>) => {
        if (!isWritableAtom(nextAtom)) {
            throw new Error(`Attempted to write value ${value} to read-only atom ${nextAtom.key}`);
        }

        setAtomWithProduce(nextAtom, atoms, setAtomArgs, value, store, promises);
    };

    const resetAtom = <T>(nextAtom: WritableAtom<T, SyncOrAsyncValue<T>>) => {
        nextAtom.set(setAtomArgs, new DefaultValue(), reduxSetterGenerator(nextAtom, store, atoms, promises));
    };

    const setAtomArgs = {
        get: createAtomGetter(atom, atoms, store, promises),
        set: setAtomValue,
        reset: resetAtom
    };

    setAtomWithProduce(atom, atoms, setAtomArgs, payload.value, store, promises);
};

const reduxSetterGenerator = (
    atom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    store: AtomMiddlewareStore,
    atoms: Atoms,
    promises: AtomPromises
) => <T>(value: T) => {
    store.dispatch(internalSet({
        atomKey: atom.key,
        value: handlePossiblePromise(value, atom.key, atoms, store, promises)
    }));

    updateGraphFromAtom(atom, atoms, store, promises);
};

const setAtomWithProduce = <T>(
    atom: WritableAtom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    setAtomArgs: SetOptions,
    valueOrSetter: ValueOrSetter<T>,
    store: AtomMiddlewareStore,
    promises: AtomPromises
) => {
    if (!(valueOrSetter instanceof Function)) {
        atom.set(setAtomArgs, valueOrSetter, reduxSetterGenerator(atom, store, atoms, promises));
        return;
    }

    const currentValue = initialiseAtomFromState(store.getState(), store.dispatch, atom);
    const newValue = produce(currentValue, valueOrSetter);
    atom.set(setAtomArgs, newValue, reduxSetterGenerator(atom, store, atoms, promises));
};

const updateGraphFromAtom = (
    atom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: AtomMiddlewareStore,
    promises: AtomPromises
): void => {
    const storeState = store.getState();
    const dependerKeys = storeState.atoms.graph.dependants[atom.key];

    if (dependerKeys === undefined) {
        return;
    }

    for (const dependerKey of dependerKeys) {
        const depender = atoms[dependerKey];
        if (depender === undefined) {
            continue;
        }

        const dependenciesBeforeUpdate = store.getState().atoms.graph.dependencies[dependerKey];
        store.dispatch(internalResetGraphNodeDependencies(dependerKey));

        const dependerValue = depender.get({
            get: createAtomGetter(depender, atoms, store, promises),
            getAsync: createAsyncAtomGetter(depender, atoms, store, promises)
        }, storeState);

        store.dispatch(internalSet({
            atomKey: depender.key,
            value: handlePossiblePromise(dependerValue, depender.key, atoms, store, promises)
        }));

        const dependenciesAfterUpdate = store.getState().atoms.graph.dependencies[dependerKey];
        if (dependenciesBeforeUpdate !== undefined && dependenciesAfterUpdate !== undefined) {
            removeStaleGraphConnections(store, dependerKey, dependenciesBeforeUpdate, dependenciesAfterUpdate);
        }

        updateGraphFromAtom(depender, atoms, store, promises);
    }
};

export const getAtomMiddleware = () => {
    const setAtomMiddleware: Middleware<{}, AtomicStoreState> = store => next => {
        const atoms: Atoms = {};
        const promises: AtomPromises = {};

        return action => {
            if (action.type === internalInitialiseAtom.toString()) {
                return handleInitialiseAtomAction(store, action, atoms, promises);
            }

            if (action.type === setAtom.toString()) {
                return handleSetAtomAction(store, action, atoms, promises);
            }

            return next(action);
        };
    };

    return setAtomMiddleware;
};

function handlePossiblePromise<T>(
    valueOrPromise: T | Promise<T>,
    atomKey: string,
    atoms: Atoms,
    store: AtomMiddlewareStore,
    promises: AtomPromises
): T | LoadingAtom {
    if (!isPromise(valueOrPromise)) {
        return valueOrPromise;
    }

    const promise = valueOrPromise;
    handlePromise(promise, atomKey, atoms, store, promises);

    const atomState = store.getState().atoms.states[atomKey];
    if (atomState === undefined) {
        return new LoadingAtom();
    }

    return atomState.value as T;
}

async function handlePromise<T>(
    promise: Promise<T>,
    atomKey: string,
    atoms: Atoms,
    store: AtomMiddlewareStore,
    promises: AtomPromises
): Promise<T> {
    const atom = atoms[atomKey];
    if (!(atomKey in promises)) {
        promises[atomKey] = [];
    }
    promises[atomKey]!.push(promise);

    const atomState = store.getState().atoms.states[atomKey];
    if (atomState !== undefined) {
        store.dispatch(internalSetLoading({ atomKey, loading: true }));
    }

    const value = await promise;

    removeFromArray(promises[atomKey]!, promise);
    store.dispatch(internalSet({ atomKey, value }));

    if (promises[atomKey]!.length < 1) {
        store.dispatch(internalSetLoading({ atomKey, loading: false }));
    }

    if (atom === undefined) {
        return value;
    }
    updateGraphFromAtom(atom, atoms, store, promises);
    return value;
}

function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}

function removeFromArray<T>(array: T[], value: T): void {
    let i = 0;
    while (i < array.length) {
        if (array[i] === value) {
            array.splice(i, 1);
        } else {
            i += 1;
        }
    }
}
