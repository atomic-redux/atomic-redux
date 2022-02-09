import { Immutable } from 'immer';
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AtomicStoreState, getAtomValueFromState, resetAtom, setAtom } from "../atom-slice";
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "../atom-state";
import { AsyncAtomValue, AtomValue, ValueOrSetter } from "../getter-setter-utils";

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export const useAtomicValue = <T>(atom: AtomState<T, SyncOrAsyncValue<T>>): Immutable<T> | undefined => {
    const dispatch = useDispatch();
    return useAtomicSelector(state => getAtomValueFromState(state, dispatch, atom));
};

export const useSetAtomicState = <T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>): ((value: ValueOrSetter<T>) => void) => {
    const dispatch = useDispatch();
    return useCallback((value: ValueOrSetter<T>) => {
        dispatch(setAtom(atom, value));
    }, [atom, dispatch])
};

export const useResetAtomicState = (atom: AtomState<any, any>): () => void => {
    const dispatch = useDispatch();
    return () => {
        dispatch(resetAtom(atom));
    }
};

export function useAtomicState<T>(atom: WritableAtomState<T, AsyncAtomValue<T>>): [value: Immutable<T> | undefined, set: (value: ValueOrSetter<T>) => void];
export function useAtomicState<T>(atom: WritableAtomState<T, AtomValue<T>>): [value: Immutable<T>, set: (value: ValueOrSetter<T>) => void];
export function useAtomicState<T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>): [value: Immutable<T> | undefined, set: (value: ValueOrSetter<T>) => void] {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    return [value, set];
};