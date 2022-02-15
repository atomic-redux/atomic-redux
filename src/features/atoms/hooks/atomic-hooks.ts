import { Immutable } from 'immer';
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AtomicStoreState, getAtomValueFromState, isAtomUpdating, setAtom } from "../atom-slice";
import { Atom, SyncOrAsyncValue, WritableAtom } from "../atom-types";
import { AsyncAtomValue, AtomValue, DefaultValue, LoadingAtom, ValueOrSetter } from "../getter-setter-utils";

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export function useAtomicValue<T>(atom: Atom<T, AsyncAtomValue<T>>): Immutable<T> | LoadingAtom;
export function useAtomicValue<T>(atom: Atom<T, AtomValue<T>>): Immutable<T>;
export function useAtomicValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom;
export function useAtomicValue<T>(atom: Atom<T, SyncOrAsyncValue<T>>): Immutable<T> | LoadingAtom {
    const dispatch = useDispatch();
    return useAtomicSelector(state => getAtomValueFromState(state, dispatch, atom));
};

export const useSetAtomicState = <T>(atom: WritableAtom<T, SyncOrAsyncValue<T>>): ((value: ValueOrSetter<T>) => void) => {
    const dispatch = useDispatch();
    return useCallback((value: ValueOrSetter<T>) => {
        dispatch(setAtom(atom, value));
    }, [atom, dispatch])
};

export const useResetAtomicState = (atom: WritableAtom<any, any>): () => void => {
    const dispatch = useDispatch();
    return () => {
        dispatch(setAtom(atom, new DefaultValue()));
    }
};

export const useIsAtomUpdating = <T>(atom: Atom<T, SyncOrAsyncValue<T>>): boolean => {
    return useAtomicSelector(state => isAtomUpdating(state, atom));
}

export function useAtomicState<T>(atom: WritableAtom<T, AsyncAtomValue<T>>): [value: Immutable<T> | LoadingAtom, set: (value: ValueOrSetter<T>) => void, isUpdating: boolean];
export function useAtomicState<T>(atom: WritableAtom<T, AtomValue<T>>): [value: Immutable<T>, set: (value: ValueOrSetter<T>) => void, isUpdating: boolean];
export function useAtomicState<T>(atom: WritableAtom<T, SyncOrAsyncValue<T>>): [value: Immutable<T> | LoadingAtom, set: (value: ValueOrSetter<T>) => void, isUpdating: boolean] {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    const isUpdating = useIsAtomUpdating(atom);
    return [value, set, isUpdating];
};