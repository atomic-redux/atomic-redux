import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AtomicStoreState, getAtomValueFromState, resetAtom, setAtom } from "../atom-slice";
import { AtomState, WritableAtomState } from "../atom-state";
import { ValueOrSetter } from "../getter-setter-utils";

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export const useAtomicValue = <T>(atom: AtomState<T>): T => {
    return useAtomicSelector(state => getAtomValueFromState(state, atom));
};

export const useSetAtomicState = <T>(atom: WritableAtomState<T>): ((value: ValueOrSetter<T>) => void) => {
    const dispatch = useDispatch();
    const currentState = useAtomicValue(atom);
    return useCallback((value: ValueOrSetter<T>) => {
        if (value instanceof Function) {
            dispatch(setAtom(atom, value(currentState)));
            return;
        }
        dispatch(setAtom(atom, value));
    }, [atom, dispatch, currentState])
};

export const useResetAtomicState = (atom: AtomState<any>): () => void => {
    const dispatch = useDispatch();
    return () => {
        dispatch(resetAtom(atom));
    }
};

export const useAtomicState = <T>(atom: WritableAtomState<T>): [value: T, set: (value: ValueOrSetter<T>) => void] => {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    return [value, set];
};