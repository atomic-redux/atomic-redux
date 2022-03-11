import { configureStore, Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import produce from 'immer';
import {
    atomMiddlewareReducer,
    AtomMiddlewareSliceState,
    internalAddGraphConnection,
    internalAddNodeToGraph,
    internalClearPendingAtomUpdates,
    internalClearStagedChanges,
    internalMarkAtomPendingUpdate,
    internalRemoveGraphConnection,
    internalResetGraphNodeDependencies,
    internalStageValue
} from './atom-middleware-slice';
import {
    AtomicStoreState,
    AtomUpdate,
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
        atomStack.push(previousAtom.key);
        middlewareStore.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key,
            fromAtomDepth: atomStack.length
        }));

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
        atomStack.push(previousAtom.key);
        middlewareStore.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key,
            fromAtomDepth: atomStack.length
        }));

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

    const stagedAtomState = middlewareStore.getState().stagedChanges[atom.key];
    if (stagedAtomState !== undefined) {
        return stagedAtomState as T;
    }

    const atomState = store.getState().atoms.states[atom.key];
    if (atomState !== undefined) {
        return atomState.value as T;
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack),
        getAsync: createAsyncAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack)
    }, createStateGetter(store, middlewareStore));
    const value = handlePossiblePromise(result, atom.key, atoms, store, middlewareStore, promises);

    if (!(value instanceof LoadingAtom)) {
        middlewareStore.dispatch(internalStageValue({
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

    const stagedAtomState = middlewareStore.getState().stagedChanges[atom.key];
    if (stagedAtomState !== undefined) {
        return Promise.resolve(stagedAtomState as T);
    }

    const atomState = store.getState().atoms.states[atom.key];
    if (atomState !== undefined) {
        return Promise.resolve(atomState.value as T);
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack),
        getAsync: createAsyncAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack)
    }, createStateGetter(store, middlewareStore));

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
    commitStagedUpdates(store, middlewareStore);
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
    const result = handlePossiblePromise(value, atom.key, atoms, store, middlewareStore, promises);

    if (!(result instanceof LoadingAtom)) {
        middlewareStore.dispatch(internalStageValue({
            atomKey: atom.key,
            value: result
        }));
    }

    updateGraphFromAtom(atom, atoms, store, middlewareStore, promises);
    commitStagedUpdates(store, middlewareStore);
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
    setNodesAfterAtomAsPendingUpdate(atom.key, middlewareStore);
    const depths = Object.keys(middlewareStore.getState().pendingAtomUpdates).map(k => Number(k)).sort((a, b) => b - a);
    for (const atomDepth of depths) {
        const pendingUpdates = middlewareStore.getState().pendingAtomUpdates[atomDepth];
        if (pendingUpdates === undefined) {
            continue;
        }

        for (const updatingAtomKey of pendingUpdates) {
            const updatingAtom = atoms[updatingAtomKey];
            if (updatingAtom === undefined) {
                continue;
            }

            const dependenciesBeforeUpdate = middlewareStore.getState().graph[updatingAtomKey]?.dependencies;
            middlewareStore.dispatch(internalResetGraphNodeDependencies(updatingAtomKey));

            const dependerValue = updatingAtom.get({
                get: createAtomGetter(updatingAtom, atoms, store, middlewareStore, promises, []),
                getAsync: createAsyncAtomGetter(updatingAtom, atoms, store, middlewareStore, promises, [])
            }, createStateGetter(store, middlewareStore));

            const value = handlePossiblePromise(
                dependerValue,
                updatingAtomKey,
                atoms,
                store,
                middlewareStore,
                promises
            );

            if (!(value instanceof LoadingAtom)) {
                middlewareStore.dispatch(internalStageValue({
                    atomKey: updatingAtomKey,
                    value
                }));
            }

            const dependenciesAfterUpdate = middlewareStore.getState().graph[updatingAtomKey]?.dependencies;
            if (dependenciesBeforeUpdate !== undefined && dependenciesAfterUpdate !== undefined) {
                removeStaleGraphConnections(
                    middlewareStore,
                    updatingAtomKey,
                    dependenciesBeforeUpdate,
                    dependenciesAfterUpdate
                );
            }
        }
    }
    middlewareStore.dispatch(internalClearPendingAtomUpdates());
};

const createStateGetter = (
    store: MainStore,
    middlewareStore: MiddlewareStore
) => (atomKey: string): unknown => {
    const stagedValue = middlewareStore.getState().stagedChanges[atomKey];
    return stagedValue !== undefined
        ? stagedValue
        : store.getState().atoms.states[atomKey]?.value;
};

const setNodesAfterAtomAsPendingUpdate = (
    atomKey: string,
    middlewareStore: MiddlewareStore
): void => {
    const graphNode = middlewareStore.getState().graph[atomKey];
    const dependerKeys = graphNode?.dependants;

    if (graphNode === undefined || dependerKeys === undefined) {
        return;
    }

    for (const dependerKey of dependerKeys) {
        const dependerNode = middlewareStore.getState().graph[dependerKey];
        if (dependerNode === undefined) {
            continue;
        }

        middlewareStore.dispatch(internalMarkAtomPendingUpdate(dependerKey));

        setNodesAfterAtomAsPendingUpdate(dependerKey, middlewareStore);
    }
};

const commitStagedUpdates = (store: MainStore, middlewareStore: MiddlewareStore): void => {
    const stagedChanges = middlewareStore.getState().stagedChanges;

    const updates: AtomUpdate[] = [];
    for (const atomKey of Object.keys(stagedChanges)) {
        const value = stagedChanges[atomKey];
        updates.push({ atomKey, value });
    }

    if (updates.length > 0) {
        store.dispatch(internalSet(updates));
        middlewareStore.dispatch(internalClearStagedChanges());
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
    middlewareStore.dispatch(internalStageValue({ atomKey, value }));

    if (promises[atomKey]!.length < 1) {
        store.dispatch(internalSetLoading({ atomKey, loading: false }));
    }

    if (atom === undefined) {
        return value;
    }
    updateGraphFromAtom(atom, atoms, store, middlewareStore, promises);
    commitStagedUpdates(store, middlewareStore);
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
