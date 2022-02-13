import { Immutable } from 'immer';
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AtomicStoreState, getAtomValueFromState, setAtom } from "../atom-slice";
import { AtomState, SyncOrAsyncValue, WritableAtomState } from "../atom-state";
import { AsyncAtomValue, AtomValue, DefaultValue, ValueOrSetter } from "../getter-setter-utils";

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export function useAtomicValue<T>(atom: AtomState<T, AsyncAtomValue<T>>): Immutable<T> | undefined;
export function useAtomicValue<T>(atom: AtomState<T, AtomValue<T>>): Immutable<T>;
export function useAtomicValue<T>(atom: AtomState<T, SyncOrAsyncValue<T>>): Immutable<T> | undefined;
export function useAtomicValue<T>(atom: AtomState<T, SyncOrAsyncValue<T>>): Immutable<T> | undefined {
    const dispatch = useDispatch();
    return useAtomicSelector(state => getAtomValueFromState(state, dispatch, atom));
};

export const useSetAtomicState = <T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>): ((value: ValueOrSetter<T>) => void) => {
    const dispatch = useDispatch();
    return useCallback((value: ValueOrSetter<T>) => {
        dispatch(setAtom(atom, value));
    }, [atom, dispatch])
};

export const useResetAtomicState = (atom: WritableAtomState<any, any>): () => void => {
    const dispatch = useDispatch();
    return () => {
        dispatch(setAtom(atom, new DefaultValue()));
    }
};

export function useAtomicState<T>(atom: WritableAtomState<T, AsyncAtomValue<T>>): [value: Immutable<T> | undefined, set: (value: ValueOrSetter<T>) => void];
export function useAtomicState<T>(atom: WritableAtomState<T, AtomValue<T>>): [value: Immutable<T>, set: (value: ValueOrSetter<T>) => void];
export function useAtomicState<T>(atom: WritableAtomState<T, SyncOrAsyncValue<T>>): [value: Immutable<T> | undefined, set: (value: ValueOrSetter<T>) => void] {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    return [value, set];
};