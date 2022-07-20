import { configureStore, Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import produce from 'immer';
import { updateDevtools } from '../devtools/devtools-update';
import { AtomLoadingState } from './atom-loading-state';
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
    AtomLoadingStateUpdate,
    AtomUpdate, initialiseAtom, initialiseAtomFromState, internalSet,
    internalSetLoadingState,
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
type PendingChanges = {
    stagedValues: SafeRecord<string, unknown>;
    stagedLoadingStates: SafeRecord<string, AtomLoadingState>;
    atomsPendingUpdate: Record<number, string[]>; // key: atom depth in graph, value: atom keys pending update
};

const atomMiddlewareStoreName = 'Atom Middleware';

function createAtomGetter(
    currentAtom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises,
    atomStack: string[],
    pendingChanges: PendingChanges,
    devtools: boolean
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
            atomStack,
            pendingChanges,
            devtools
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
    atomStack: string[],
    pendingChanges: PendingChanges,
    devtools: boolean
) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: Atom<T, U>): Promise<T> => {
        atomStack.push(previousAtom.key);
        middlewareStore.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key,
            fromAtomDepth: atomStack.length
        }));

        checkForDependencyLoop(atomStack);
        const value = getAtomValueAsync(
            store,
            middlewareStore,
            previousAtom,
            atoms,
            promises,
            atomStack,
            pendingChanges,
            devtools
        );

        atomStack.pop();
        return value;
    };
}

const stageValue = (pendingChanges: PendingChanges, atomKey: string, value: unknown) => {
    pendingChanges.stagedValues[atomKey] = value;
};

const clearStagedChanges = (pendingChanges: PendingChanges) => {
    pendingChanges.stagedValues = {};
    pendingChanges.stagedLoadingStates = {};
};

const clearPendingAtomUpdates = (pendingChanges: PendingChanges) => {
    pendingChanges.atomsPendingUpdate = {};
};

const getAtomValue = <T>(
    store: MainStore,
    middlewareStore: MiddlewareStore,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    promises: AtomPromises,
    atomStack: string[],
    pendingChanges: PendingChanges,
    devtools: boolean
): T | LoadingAtom => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const stagedAtomState = pendingChanges.stagedValues[atom.key];
    if (stagedAtomState !== undefined) {
        return stagedAtomState as T;
    }

    const atomState = store.getState().atoms.states[atom.key];
    if (atomState !== undefined) {
        return atomState.loadingState === AtomLoadingState.Loading
            ? LoadingAtom
            : atomState.value as T;
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack, pendingChanges, devtools),
        getAsync: createAsyncAtomGetter(
            atom,
            atoms,
            store,
            middlewareStore,
            promises,
            atomStack,
            pendingChanges,
            devtools
        )
    }, createStateGetter(store, pendingChanges));
    const value = handlePossiblePromise(
        result,
        atom.key,
        atoms,
        store,
        middlewareStore,
        promises,
        pendingChanges,
        devtools
    );

    if (!(value instanceof LoadingAtom)) {
        stageValue(pendingChanges, atom.key, value);
    }

    return value;
};

const getAtomValueAsync = <T>(
    store: MainStore,
    middlewareStore: MiddlewareStore,
    atom: Atom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    promises: AtomPromises,
    atomStack: string[],
    pendingChanges: PendingChanges,
    devtools: boolean
): Promise<T> => {
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    const stagedAtomState = pendingChanges.stagedValues[atom.key];
    if (stagedAtomState !== undefined) {
        return Promise.resolve(stagedAtomState as T);
    }

    const atomState = store.getState().atoms.states[atom.key];
    if (atomState !== undefined) {
        if (atomState.loadingState !== AtomLoadingState.Loading) {
            return Promise.resolve(atomState.value as T);
        }

        const atomPromises = promises[atom.key];
        if (atomPromises !== undefined && atomPromises.length > 0) {
            return atomPromises[0] as Promise<T>;
        }
    }

    const result = atom.get({
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, atomStack, pendingChanges, devtools),
        getAsync: createAsyncAtomGetter(
            atom,
            atoms,
            store,
            middlewareStore,
            promises,
            atomStack,
            pendingChanges,
            devtools
        )
    }, createStateGetter(store, pendingChanges));

    const promise = Promise.resolve(result);
    return handlePromise(
        promise,
        atom.key,
        atoms,
        store,
        middlewareStore,
        promises,
        pendingChanges,
        devtools
    );
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
    promises: AtomPromises,
    devtools: boolean
): void => {
    const atom = action.payload;
    const pendingChanges = {
        stagedValues: {},
        stagedLoadingStates: {},
        atomsPendingUpdate: {}
    };
    getAtomValue(store, middlewareStore, atom, atoms, promises, [], pendingChanges, devtools);
    middlewareStore.dispatch(internalAddNodeToGraph(atom.key));
    commitStagedUpdates(store, middlewareStore, pendingChanges, devtools);
};

const handleSetAtomAction = (
    store: MainStore,
    middlewareStore: MiddlewareStore,
    action: PayloadAction<SetAtomPayload<unknown>>,
    atoms: Atoms,
    promises: AtomPromises,
    devtools: boolean
): void => {
    const payload = action.payload;
    const atom = payload.atom;

    if (!isWritableAtom(atom)) {
        throw new Error(`Attempted to write value ${payload.value} to read-only atom ${atom.key}`);
    }

    const pendingChanges = {
        stagedValues: {},
        stagedLoadingStates: {},
        atomsPendingUpdate: {}
    };

    const setAtomValue = <T>(nextAtom: Atom<T, SyncOrAsyncValue<T>>, value: ValueOrSetter<T>) => {
        if (!isWritableAtom(nextAtom)) {
            throw new Error(`Attempted to write value ${value} to read-only atom ${nextAtom.key}`);
        }

        setAtomWithProduce(
            nextAtom,
            atoms,
            setAtomArgs,
            value,
            store,
            middlewareStore,
            promises,
            pendingChanges,
            devtools
        );
    };

    const resetAtom = <T>(nextAtom: WritableAtom<T, SyncOrAsyncValue<T>>) => {
        nextAtom.set(
            setAtomArgs,
            new DefaultValue(),
            reduxSetterGenerator(nextAtom, store, middlewareStore, atoms, promises, pendingChanges, devtools)
        );
    };

    const setAtomArgs = {
        get: createAtomGetter(atom, atoms, store, middlewareStore, promises, [], pendingChanges, devtools),
        set: setAtomValue,
        reset: resetAtom
    };

    setAtomWithProduce(
        atom,
        atoms,
        setAtomArgs,
        payload.value,
        store,
        middlewareStore,
        promises,
        pendingChanges,
        devtools
    );
};

const reduxSetterGenerator = (
    atom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    atoms: Atoms,
    promises: AtomPromises,
    pendingChanges: PendingChanges,
    devtools: boolean
) => <T>(value: T) => {
    const result = handlePossiblePromise(
        value,
        atom.key,
        atoms,
        store,
        middlewareStore,
        promises,
        pendingChanges,
        devtools
    );

    if (!(result instanceof LoadingAtom)) {
        stageValue(pendingChanges, atom.key, result);
    }

    updateGraphFromAtom(atom, atoms, store, middlewareStore, promises, pendingChanges, devtools);
    commitStagedUpdates(store, middlewareStore, pendingChanges, devtools);
};

const setAtomWithProduce = <T>(
    atom: WritableAtom<T, SyncOrAsyncValue<T>>,
    atoms: Atoms,
    setAtomArgs: SetOptions,
    valueOrSetter: ValueOrSetter<T>,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises,
    pendingChanges: PendingChanges,
    devtools: boolean
) => {
    if (!(valueOrSetter instanceof Function)) {
        atom.set(
            setAtomArgs,
            valueOrSetter,
            reduxSetterGenerator(atom, store, middlewareStore, atoms, promises, pendingChanges, devtools)
        );
        return;
    }

    const currentValue = initialiseAtomFromState(store.getState(), store.dispatch, atom);
    const newValue = produce(currentValue, valueOrSetter);
    atom.set(
        setAtomArgs,
        newValue,
        reduxSetterGenerator(atom, store, middlewareStore, atoms, promises, pendingChanges, devtools)
    );
};

const updateGraphFromAtom = (
    atom: Atom<unknown, SyncOrAsyncValue<unknown>>,
    atoms: Atoms,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises,
    pendingChanges: PendingChanges,
    devtools: boolean
): void => {
    setNodesAfterAtomAsPendingUpdate(atom.key, middlewareStore, pendingChanges);
    const depths = Object.keys(pendingChanges.atomsPendingUpdate).map(k => Number(k)).sort((a, b) => b - a);
    for (const atomDepth of depths) {
        const pendingUpdates = pendingChanges.atomsPendingUpdate[atomDepth];
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
                get: createAtomGetter(
                    updatingAtom,
                    atoms,
                    store,
                    middlewareStore,
                    promises,
                    [],
                    pendingChanges,
                    devtools
                ),
                getAsync: createAsyncAtomGetter(
                    updatingAtom,
                    atoms,
                    store,
                    middlewareStore,
                    promises,
                    [],
                    pendingChanges,
                    devtools
                )
            }, createStateGetter(store, pendingChanges));

            const value = handlePossiblePromise(
                dependerValue,
                updatingAtomKey,
                atoms,
                store,
                middlewareStore,
                promises,
                pendingChanges,
                devtools
            );

            if (!(value instanceof LoadingAtom)) {
                stageValue(pendingChanges, updatingAtomKey, value);
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
    clearPendingAtomUpdates(pendingChanges);
};

const createStateGetter = (
    store: MainStore,
    pendingChanges: PendingChanges
) => (atomKey: string): unknown => {
    const stagedValue = pendingChanges.stagedValues[atomKey];
    return stagedValue !== undefined
        ? stagedValue
        : store.getState().atoms.states[atomKey]?.value;
};

const setNodesAfterAtomAsPendingUpdate = (
    atomKey: string,
    middlewareStore: MiddlewareStore,
    pendingChanges: PendingChanges
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

        if (pendingChanges.atomsPendingUpdate[dependerNode.depth] === undefined) {
            pendingChanges.atomsPendingUpdate[dependerNode.depth] = [];
        }

        if (!pendingChanges.atomsPendingUpdate[dependerNode.depth].includes(dependerKey)) {
            pendingChanges.atomsPendingUpdate[dependerNode.depth].push(dependerKey);
        }

        setNodesAfterAtomAsPendingUpdate(dependerKey, middlewareStore, pendingChanges);
    }
};

const commitStagedUpdates = (
    store: MainStore,
    middlewareStore: MiddlewareStore,
    pendingChanges: PendingChanges,
    devtools: boolean
): void => {
    const stagedValues = pendingChanges.stagedValues;
    const stagedLoadingStates = pendingChanges.stagedLoadingStates;

    const updates: AtomUpdate[] = [];
    for (const atomKey of Object.keys(stagedValues)) {
        const value = stagedValues[atomKey];
        updates.push({ atomKey, value });
    }

    if (updates.length > 0) {
        store.dispatch(internalSet(updates));
    }

    const loadingStatesUpdates: AtomLoadingStateUpdate[] = [];
    for (const atomKey of Object.keys(stagedLoadingStates)) {
        const loadingState = stagedLoadingStates[atomKey]!;
        loadingStatesUpdates.push({ atomKey, loadingState });
    }

    if (loadingStatesUpdates.length > 0) {
        store.dispatch(internalSetLoadingState(loadingStatesUpdates));
    }

    clearStagedChanges(pendingChanges);

    if (updates.length > 0 || loadingStatesUpdates.length > 0) {
        updateDevtools(store.getState(), middlewareStore.getState(), devtools);
    }
};

type AtomMiddleware =
    Middleware<{}, AtomicStoreState>
    & {
        getState: (() => AtomMiddlewareSliceState)
    };

export const getAtomMiddleware = (preloadedState?: AtomMiddlewareSliceState, devtools: boolean = true) => {
    const middlewareStore = configureStore({
        reducer: atomMiddlewareReducer,
        devTools: {
            name: atomMiddlewareStoreName
        },
        preloadedState,
        middleware: []
    });

    const setAtomMiddleware: AtomMiddleware = store => next => {
        const atoms: Atoms = {};
        const promises: AtomPromises = {};

        return action => {
            if (action.type === initialiseAtom.toString()) {
                return handleInitialiseAtomAction(store, middlewareStore, action, atoms, promises, devtools);
            }

            if (action.type === setAtom.toString()) {
                return handleSetAtomAction(store, middlewareStore, action, atoms, promises, devtools);
            }

            return next(action);
        };
    };

    setAtomMiddleware.getState = () => middlewareStore.getState();

    return setAtomMiddleware;
};

function handlePossiblePromise<T>(
    valueOrPromise: T | Promise<T>,
    atomKey: string,
    atoms: Atoms,
    store: MainStore,
    middlewareStore: MiddlewareStore,
    promises: AtomPromises,
    pendingChanges: PendingChanges,
    devtools: boolean
): T | LoadingAtom {
    if (!isPromise(valueOrPromise)) {
        return valueOrPromise;
    }

    const promise = valueOrPromise;
    handlePromise(promise, atomKey, atoms, store, middlewareStore, promises, pendingChanges, devtools);

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
    promises: AtomPromises,
    pendingChanges: PendingChanges,
    devtools: boolean
): Promise<T> {
    const atom = atoms[atomKey];
    if (!(atomKey in promises)) {
        promises[atomKey] = [];
    }
    promises[atomKey]!.push(promise);

    const atomState = store.getState().atoms.states[atomKey];
    store.dispatch(internalSetLoadingState([{
        atomKey,
        loadingState: atomState === undefined
            ? AtomLoadingState.Loading
            : AtomLoadingState.Updating
    }]));

    const value = await promise;

    removeFromArray(promises[atomKey]!, promise);
    stageValue(pendingChanges, atomKey, value);

    if (promises[atomKey]!.length < 1) {
        pendingChanges.stagedLoadingStates[atomKey] = AtomLoadingState.Idle;
    }

    if (atom === undefined) {
        return value;
    }
    updateGraphFromAtom(atom, atoms, store, middlewareStore, promises, pendingChanges, devtools);
    commitStagedUpdates(store, middlewareStore, pendingChanges, devtools);
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
