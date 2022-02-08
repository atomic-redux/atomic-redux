import { Dispatch, Middleware, MiddlewareAPI, PayloadAction } from '@reduxjs/toolkit';
import { AtomicStoreState, getAtomValueFromState, internalAddNodeToGraph, internalInitialiseAtom, internalSet, setAtom, SetAtomPayload } from './atom-slice';
import { AtomState, isWritableAtom, SyncOrAsyncValue } from './atom-state';

type Atoms = Record<string, AtomState<unknown, SyncOrAsyncValue<unknown>>>;

export const getAtomMiddleware = () => {
	const handleInitialiseAtomAction = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, action: PayloadAction<AtomState<unknown, SyncOrAsyncValue<unknown>>>, atoms: Atoms) => {
		const atom = action.payload;
		if (!(atom.key in atoms)) {
			atoms[atom.key] = atom;
		}

		store.dispatch(internalAddNodeToGraph(atom.key));
	}

	const handleSetAtomAction = (store: MiddlewareAPI<Dispatch<any>, AtomicStoreState>, action: PayloadAction<SetAtomPayload<unknown>>) => {
		const payload = action.payload;
		const atom = payload.atom;

		if (!isWritableAtom(atom)) {
			throw new Error(`Attempted to write value ${payload.value} to read-only atom ${atom.key}`);
		}

		const getAtom = <T, U extends SyncOrAsyncValue<T>>(atom: AtomState<T, U>) => {
			return getAtomValueFromState(store.getState(), store.dispatch, atom);
		}

		const reduxSetterGenerator = (atomKey: string) => (value: unknown) => {
			store.dispatch(internalSet({ atomKey, value }))
		}

		const setAtomValue = <T>(atomState: AtomState<T, SyncOrAsyncValue<T>>, value: T) => {
			if (!isWritableAtom(atomState)) {
				throw new Error(`Attempted to write value ${value} to read-only atom ${atomState.key}`);
			}

			atomState.set(value, setAtomArgs, reduxSetterGenerator(atomState.key));
		}

		const setAtomArgs = { get: getAtom, set: setAtomValue };

		atom.set(payload.value, setAtomArgs, reduxSetterGenerator(atom.key));
	}

	const setAtomMiddleware: Middleware<{}, AtomicStoreState> = store => next => {
		let atoms: Atoms = {};
		return action => {
			if (action.type === internalInitialiseAtom.toString()) {
				return handleInitialiseAtomAction(store, action, atoms);
			}

			if (action.type === setAtom.toString()) {
				return handleSetAtomAction(store, action)
			}

			return next(action);
		}
	}

	return [setAtomMiddleware];
}