import {
    AsyncAtomValue, Atom, AtomicStoreState, AtomValue,
    DefaultValue, getAtomValueFromState,
    isAtomUpdating, LoadingAtom, setAtom, SyncOrAsyncValue, ValueOrSetter, WritableAtom
} from 'atomic-redux-state';
import { internalInitialiseAtom } from 'atomic-redux-state/out/atomic-redux-state/atom-slice';
import { Immutable } from 'immer';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export function useAtomicValue<T>(atom: Atom<T, AsyncAtomValue<T>>): Immutable<T> | LoadingAtom;
export function useAtomicValue<T>(atom: Atom<T, AtomValue<T>>): Immutable<T>;
export function useAtomicValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom;
export function useAtomicValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(internalInitialiseAtom(atom));
    }, []);
    return useAtomicSelector(state => getAtomValueFromState(state, atom));
}

export const useSetAtomicState = <T>(
    atom: WritableAtom<T, SyncOrAsyncValue<T>>
): ((value: ValueOrSetter<T>) => void) => {
    const dispatch = useDispatch();
    return useCallback((value: ValueOrSetter<T>) => {
        dispatch(setAtom(atom, value));
    }, [atom, dispatch]);
};

export const useResetAtomicState = (atom: WritableAtom<any, any>): () => void => {
    const dispatch = useDispatch();
    return () => {
        dispatch(setAtom(atom, new DefaultValue()));
    };
};

export const useIsAtomUpdating = <T>(
    atom: Atom<T, SyncOrAsyncValue<T>>
): boolean => useAtomicSelector(state => isAtomUpdating(state, atom));

// eslint-disable-next-line max-len
export function useAtomicState<T>(atom: WritableAtom<T, AsyncAtomValue<T>>): [value: Immutable<T> | LoadingAtom, set: (value: ValueOrSetter<T>) => void, reset: () => void, isUpdating: boolean];
// eslint-disable-next-line max-len
export function useAtomicState<T>(atom: WritableAtom<T, AtomValue<T>>): [value: Immutable<T>, set: (value: ValueOrSetter<T>) => void, reset: () => void, isUpdating: boolean];
// eslint-disable-next-line max-len
export function useAtomicState<T>(atom: WritableAtom<T, SyncOrAsyncValue<T>>): [value: Immutable<T> | LoadingAtom, set: (value: ValueOrSetter<T>) => void, reset: () => void, isUpdating: boolean] {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    const reset = useResetAtomicState(atom);
    const isUpdating = useIsAtomUpdating(atom);
    return [value, set, reset, isUpdating];
}