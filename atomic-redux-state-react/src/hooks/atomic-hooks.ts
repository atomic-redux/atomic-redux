import {
    AsyncAtomValue, Atom, AtomicStoreState, AtomValue, DefaultValue,
    initialiseAtom, LoadingAtom, selectAtom, selectIsAtomUpdating,
    setAtom, SyncOrAsyncValue, ValueOrSetter, WritableAtom
} from 'atomic-redux-state';
import { Immutable } from 'immer';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export function useAtomicValue<T>(atom: Atom<T, AsyncAtomValue<T>>): Immutable<T> | LoadingAtom;
export function useAtomicValue<T>(atom: Atom<T, AtomValue<T>>): Immutable<T>;
export function useAtomicValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom;
export function useAtomicValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom {
    const dispatch = useDispatch();
    const store = useStore<AtomicStoreState>();
    const [value, setValue] = useState<T | undefined>(undefined);

    useEffect(() => {
        const unsubscribe = store.subscribe(() => {
            const newValue = selectAtom(store.getState(), atom);
            if (newValue !== value) {
                setValue(newValue);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [store, atom]);

    if (value !== undefined) {
        return value;
    }

    const initialValue = dispatch(initialiseAtom(atom)) as unknown as T;
    return initialValue ?? new LoadingAtom();
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
): boolean => useAtomicSelector(state => selectIsAtomUpdating(state, atom));

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
