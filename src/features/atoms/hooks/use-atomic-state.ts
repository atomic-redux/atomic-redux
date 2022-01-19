import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AtomicStoreState, resetAtom, setAtom } from "../atom-slice";
import { AtomState } from "../atom-state";

type ValueOrSetterFunction<T> = T | ((state: T) => T);

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export const useAtomicValue = <T>(atom: AtomState<T>): T => {
    return useAtomicSelector(state => {
        if (atom.key in state.atoms.values) {
            return state.atoms.values[atom.key] as T;
        }
        return atom.default;
    });
};

export const useSetAtomicState = <T>(atom: AtomState<T>): ((value: ValueOrSetterFunction<T>) => void) => {
    const dispatch = useDispatch();
    const currentState = useAtomicValue(atom);
    return useCallback((value: ValueOrSetterFunction<T>) => {
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

export const useAtomicState = <T>(atom: AtomState<T>): [value: T, set: (value: ValueOrSetterFunction<T>) => void] => {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    return [value, set];
};