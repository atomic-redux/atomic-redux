import { Middleware, PayloadAction } from '@reduxjs/toolkit';
import { AtomicStoreState, getAtomValueFromState, internalSet, setAtom, SetAtomPayload } from './atom-slice';
import { AtomState, isWritableAtom, SyncOrAsyncValue } from './atom-state';

export const getAtomMiddleware = () => {
	const setAtomMiddleware: Middleware<{}, AtomicStoreState> = store => next => action => {
		if (action.type === undefined || typeof action.type !== 'string' || !(action.type as string === setAtom.toString())) {
			return next(action);
		}

		const payload = (action as PayloadAction<SetAtomPayload<unknown>>).payload;
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

	return [setAtomMiddleware];
}