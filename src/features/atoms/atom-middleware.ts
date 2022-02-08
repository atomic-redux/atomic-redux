import { Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import { AtomicStoreState, getAtomValueFromState, internalAddGraphConnection, internalAddNodeToGraph, internalInitialiseAtom, internalSet, setAtom, SetAtomPayload } from './atom-slice';
import { AtomState, isWritableAtom, SyncOrAsyncValue } from './atom-state';
import { AtomGetter, GetAtomResult } from './getter-setter-utils';

type Atoms = Record<string, AtomState<unknown, SyncOrAsyncValue<unknown>>>;

function createAtomGetter(currentAtom: AtomState<unknown, SyncOrAsyncValue<unknown>>, atoms: Atoms, store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>) {
    return <T, U extends SyncOrAsyncValue<T>>(previousAtom: AtomState<T, U>): GetAtomResult<T, U> => {
        store.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: currentAtom.key
        }));

        const result = previousAtom.get({ get: createAtomGetter(previousAtom, atoms, store) }, store.getState());
        const value = handlePossiblePromise(result, previousAtom.key, atoms, store);

        return value as GetAtomResult<T, U>;
    }
}

const addAtomToGraph = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, atom: AtomState<unknown, SyncOrAsyncValue<unknown>>, atoms: Atoms): void => {
    const result = atom.get({ get: createAtomGetter(atom, atoms, store) }, store.getState());

    store.dispatch(internalSet({
        atomKey: atom.key,
        value: handlePossiblePromise(result, atom.key, atoms, store)
    }));
}

const handleInitialiseAtomAction = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, action: PayloadAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>, atoms: Atoms): void => {
    const atom = action.payload;
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    addAtomToGraph(store, atom, atoms);

    store.dispatch(internalAddNodeToGraph(atom.key));
}

const handleSetAtomAction = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, action: PayloadAction<SetAtomPayload<unknown>>, atoms: Atoms): void => {
    const payload = action.payload;
    const atom = payload.atom;

    if (!isWritableAtom(atom)) {
        throw new Error(`Attempted to write value ${payload.value} to read-only atom ${atom.key}`);
    }

    const getAtom = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U>) => {
        return getAtomValueFromState(store.getState(), store.dispatch, atom);
    }

    const reduxSetterGenerator = (atomKey: string) => (value: unknown) => {
        store.dispatch(internalSet({
            atomKey,
            value: handlePossiblePromise(value, atomKey, atoms, store)
        }))
        updateGraphFromAtom(atoms[atomKey], atoms, store);
    }

    const setAtomValue = <T>(atomState: AtomState<T, SyncOrAsyncValue<T>>, value: T) => {
        if (!isWritableAtom(atomState)) {
            throw new Error(`Attempted to write value ${value} to read-only atom ${atomState.key}`);
        }

        atomState.set(value, setAtomArgs, reduxSetterGenerator(atomState.key));
    }

    const setAtomArgs = { get: getAtom, set: setAtomValue };

    atom.set(payload.value, setAtomArgs, reduxSetterGenerator(atom.key));
    updateGraphFromAtom(atom, atoms, store);
}

const updateGraphFromAtom = (atom: AtomState<unknown, SyncOrAsyncValue<unknown>>, atoms: Atoms, store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>): void => {
    const storeState = store.getState();
    const dependerKeys = storeState.atoms.graph[atom.key];

    const atomGetter: AtomGetter = <T, U extends SyncOrAsyncValue<T>>(previousAtom: AtomState<T, U>): GetAtomResult<T, U> => {
        const result = previousAtom.get({ get: atomGetter }, storeState);
        const value = handlePossiblePromise(result, previousAtom.key, atoms, store);

        return value as GetAtomResult<T, U>;
    }

    for (const dependerKey of dependerKeys) {
        const depender = atoms[dependerKey];

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

function handlePossiblePromise(valueOrPromise: unknown, atomKey: string, atoms: Atoms, store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>): unknown {
    if (!isPromise(valueOrPromise)) {
        return valueOrPromise;
    }

    valueOrPromise.then(value => {
        store.dispatch(internalSet({ atomKey, value }));
        updateGraphFromAtom(atoms[atomKey], atoms, store);
    });

    return store.getState().atoms.values[atomKey];
}

function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}