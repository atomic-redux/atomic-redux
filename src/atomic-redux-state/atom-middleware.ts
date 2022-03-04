import { configureStore, Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import produce from 'immer';
import {
    atomMiddlewareReducer,
    AtomMiddlewareSliceState,
    internalAddGraphConnection,
    internalAddNodeToGraph,
    internalRemoveGraphConnection,
    internalResetGraphNodeDependencies
} from './atom-middleware-slice';
import {
    AtomicStoreState,
    initialiseAtomFromState,
    internalInitialiseAtom,
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
import { checkForDependencyLoop, isPromise, SafeRecord } from './utils';

type MainStore = MiddlewareAPI<Dispatch<any>, AtomicStoreState>;
type MiddlewareStore = MiddlewareAPI<Dispatch<any>, AtomMiddlewareSliceState>;
type Atoms = SafeRecord<string, Atom<unknown, SyncOrAsyncValue<unknown>>>;
type AtomPromises = SafeRecord<string, Promise<unknown>[]>;

const atomMiddlewareStoreName = 'Atom Middleware';

function createAtomGetter(
    currentAtom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises,
    atomStack: string[]
) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: Atom<T, U>): GetAtomResult<T, U> => {
        middlewareStore.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key
        }));

        atomStack.push(previousAtom.key);
        checkForDependencyLoop(atomStack);
        const value = getAtomValue(
            store,
            middlewareStore,
            previousAtom,
            atoms,
            promises,
            atomStack
        ) as GetAtomResult<T, U>;
        atomStack.pop();

        return value;
    };
}

function createAsyncAtomGetter(
    currentAtom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises,
    atomStack: string[]
) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: Atom<T, U>): Promise<T> => {
        middlewareStore.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key
        }));

        atomStack.push(previousAtom.key);
        checkForDependencyLoop(atomStack);
        const value = getAtomValueAsync(store, middlewareStore, previousAtom, atoms, promises, atomStack);
        atomStack.pop();

        return value;
    };
}

const getAtomValue = <T>(
    store: MainStore,
    middlewareStore: MiddlewareStore,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    promises: AtomPromises,
    atomStack: string[]
): T | LoadingAtom => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const atomState = store.getState().atoms.states[atom.key];
    if (atomState !== undefined) {
        return atomState.value as T;
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack),
        getAsync: createAsyncAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack)
    }, store.getState());
    const value = handlePossiblePromise(result, atom.key, atoms, store, middlewareStore, promises);

    if (!(value instanceof LoadingAtom)) {
        store.dispatch(internalSet({
            atomKey: atom.key,
            value
        }));
    }

    return value;
};

const getAtomValueAsync = <T>(
    store: MainStore,
    middlewareStore: MiddlewareStore,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    promises: AtomPromises,
    atomStack: string[]
): Promise<T> => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const atomState = store.getState().atoms.states[atom.key];
    if (atomState !== undefined) {
        return Promise.resolve(atomState.value as T);
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack),
        getAsync: createAsyncAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack)
    }, store.getState());

    const promise = Promise.resolve(result);
    return handlePromise(promise, atom.key, atoms, store, middlewareStore, promises);
};

const removeStaleGraphConnections = (
    middlewareStore: MiddlewareStore,
    atomKey: string,
    dependenciesBeforeUpdate: string[],
    dependenciesAfterUpdate: string[]
): void => {
    const staleDependencies = dependenciesBeforeUpdate.filter(d => !dependenciesAfterUpdate.includes(d));
    for (const staleDependency of staleDependencies) {
        middlewareStore.dispatch(internalRemoveGraphConnection({
            fromAtomKey: staleDependency,
            toAtomKey: atomKey
        }));
    }
};

const handleInitialiseAtomAction = <T>(
    store: MainStore,
    middlewareStore: MiddlewareStore,
    action: PayloadAction<Atom<T, SyncOrAsyncValue<T>>>,
    atoms: Atoms,
    promises: AtomPromises
): void => {
    const atom = action.payload;
    getAtomValue(store, middlewareStore, atom, atoms, promises, []);
    middlewareStore.dispatch(internalAddNodeToGraph(atom.key));
};

const handleSetAtomAction = (
    store: MainStore,
    middlewareStore: MiddlewareStore,
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

        setAtomWithProduce(nextAtom, atoms, setAtomArgs, value, store, middlewareStore, promises);
    };

    const resetAtom = <T>(nextAtom: WritableAtom<T, SyncOrAsyncValue<T>>) => {
        nextAtom.set(
            setAtomArgs,
            new DefaultValue(),
            reduxSetterGenerator(nextAtom, store, middlewareStore, atoms, promises)
        );
    };

    const setAtomArgs = {
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, []),
        set: setAtomValue,
        reset: resetAtom
    };

    setAtomWithProduce(atom, atoms, setAtomArgs, payload.value, store, middlewareStore, promises);
};

const reduxSetterGenerator = (
    atom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    atoms: Atoms,
    promises: AtomPromises
) => <T>(value: T) => {
    store.dispatch(internalSet({
        atomKey: atom.key,
        value: handlePossiblePromise(value, atom.key, atoms, store, middlewareStore, promises)
    }));

    updateGraphFromAtom(atom, atoms, store, middlewareStore, promises);
};

const setAtomWithProduce = <T>(
    atom: WritableAtom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    setAtomArgs: SetOptions,
    valueOrSetter: ValueOrSetter<T>,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises
) => {
    if (!(valueOrSetter instanceof Function)) {
        atom.set(setAtomArgs, valueOrSetter, reduxSetterGenerator(atom, store, middlewareStore, atoms, promises));
        return;
    }

    const currentValue = initialiseAtomFromState(store.getState(), store.dispatch, atom);
    const newValue = produce(currentValue, valueOrSetter);
    atom.set(setAtomArgs, newValue, reduxSetterGenerator(atom, store, middlewareStore, atoms, promises));
};

const updateGraphFromAtom = (
    atom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises
): void => {
    const storeState = store.getState();
    const dependerKeys = middlewareStore.getState().graph.dependants[atom.key];

    if (dependerKeys === undefined) {
        return;
    }

    for (const dependerKey of dependerKeys) {
        const depender = atoms[dependerKey];
        if (depender === undefined) {
            continue;
        }

        const dependenciesBeforeUpdate = middlewareStore.getState().graph.dependencies[dependerKey];
        middlewareStore.dispatch(internalResetGraphNodeDependencies(dependerKey));

        const dependerValue = depender.get({
            get: createAtomGetter(depender, atoms, store, middlewareStore, promises, []),
            getAsync: createAsyncAtomGetter(depender, atoms, store, middlewareStore, promises, [])
        }, storeState);

        store.dispatch(internalSet({
            atomKey: depender.key,
            value: handlePossiblePromise(dependerValue, depender.key, atoms, store, middlewareStore, promises)
        }));

        const dependenciesAfterUpdate = middlewareStore.getState().graph.dependencies[dependerKey];
        if (dependenciesBeforeUpdate !== undefined && dependenciesAfterUpdate !== undefined) {
            removeStaleGraphConnections(
                middlewareStore,
                dependerKey,
                dependenciesBeforeUpdate,
                dependenciesAfterUpdate
            );
        }

        updateGraphFromAtom(depender, atoms, store, middlewareStore, promises);
    }
};

export const getAtomMiddleware = () => {
    const setAtomMiddleware: Middleware<{}, AtomicStoreState> = store => next => {
        const atoms: Atoms = {};
        const promises: AtomPromises = {};
        const middlewareStore = configureStore({
            reducer: atomMiddlewareReducer,
            devTools: {
                name: atomMiddlewareStoreName
            }
        });

        return action => {
            if (action.type === internalInitialiseAtom.toString()) {
                return handleInitialiseAtomAction(store, middlewareStore, action, atoms, promises);
            }

            if (action.type === setAtom.toString()) {
                return handleSetAtomAction(store, middlewareStore, action, atoms, promises);
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
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises
): T | LoadingAtom {
    if (!isPromise(valueOrPromise)) {
        return valueOrPromise;
    }

    const promise = valueOrPromise;
    handlePromise(promise, atomKey, atoms, store, middlewareStore, promises);

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
    store: MainStore,
    middlewareStore: MiddlewareStore,
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
    updateGraphFromAtom(atom, atoms, store, middlewareStore, promises);
    return value;
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
