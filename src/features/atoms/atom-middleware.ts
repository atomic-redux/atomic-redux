import { Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import { AtomicStoreState, getAtomValueFromState, internalAddGraphConnection, internalAddNodeToGraph, internalInitialiseAtom, internalSet, setAtom, SetAtomPayload } from './atom-slice';
import { AtomState, isWritableAtom, SyncOrAsyncValue } from './atom-state';
import { AtomGetter, GetAtomResult } from './getter-setter-utils';

type Atoms = Record<string, AtomState<unknown, SyncOrAsyncValue<unknown>>>;

const addAtomToGraph = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, atom: AtomState<unknown, SyncOrAsyncValue<unknown>>): void => {
    const atomGetter: AtomGetter = <T, U extends SyncOrAsyncValue<T>>(previousAtom: AtomState<T, U>): GetAtomResult<T, U> => {
        const storeState = store.getState();

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: previousAtom.key,
            toAtomKey: atom.key
        }));

        const result = previousAtom.get({ get: atomGetter }, storeState);
        const value = fallbackPromise(result, previousAtom.key, storeState);

        return value as GetAtomResult<T, U>;
    }

    const storeState = store.getState();
    const result = atom.get({ get: atomGetter }, storeState);

    store.dispatch(internalSet({
        atomKey: atom.key,
        value: fallbackPromise(result, atom.key, storeState)
    }));
}

const handleInitialiseAtomAction = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, action: PayloadAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>, atoms: Atoms): void => {
    const atom = action.payload;
    if (!(atom.key in atoms)) {
        atoms[atom.key] = atom;
    }

    addAtomToGraph(store, atom);

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
            value: fallbackPromise(value, atomKey, store.getState())
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
        const value = fallbackPromise(result, previousAtom.key, storeState);

        return value as GetAtomResult<T, U>;
    }

    for (const dependerKey of dependerKeys) {
        const depender = atoms[dependerKey];

        const dependerValue = depender.get({ get: atomGetter }, storeState);

        store.dispatch(internalSet({
            atomKey: depender.key,
            value: fallbackPromise(dependerValue, depender.key, storeState)
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

function fallbackPromise(value: unknown, atomKey: string, state: AtomicStoreState): unknown {
    return isPromise(value)
        ? state.atoms.values[atomKey]
        : value;
}

function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}