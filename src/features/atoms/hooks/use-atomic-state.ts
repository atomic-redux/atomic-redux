import { useDispatch, useSelector } from "react-redux";
import { AtomicStoreState, resetAtom, setAtom } from "../atom-slice";
import { AtomState } from "../atom-state";

const useAtomicSelector = <T>(selector: (state: AtomicStoreState) => T) => useSelector<AtomicStoreState, T>(selector);

export const useAtomicValue = <T>(atom: AtomState<T>): T => {
    return useAtomicSelector(state => state.atoms.values[atom.key] as T);
}

export const useSetAtomicState = <T>(atom: AtomState<T>): ((value: T) => void) => {
    const dispatch = useDispatch();
    return (value: T) => {
        dispatch(setAtom(atom, value));
    }
}

export const useResetAtomicState = (atom: AtomState<any>): () => void => {
    const dispatch = useDispatch();
    return () => {
        dispatch(resetAtom(atom));
    }
}

export const useAtomicState = <T>(atom: AtomState<T>): [value: T, set: (value: T) => void] => {
    const value = useAtomicValue(atom);
    const set = useSetAtomicState(atom);
    return [value, set];
};