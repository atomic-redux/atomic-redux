import { atom } from "../atoms/atom";
import { derivedAtom } from "../atoms/derived-atom";
import { SetOptions } from '../atoms/getter-setter-utils';

export const counterAtomA = atom({
    key: 'counter-a',
    default: 0
});

export const counterAtomB = atom({
    key: 'counter-b',
    default: 0
});

export const multipliedAtomA = derivedAtom({
    key: 'multiplied-counter-a',
    get: ({ get }) => {
        return get(counterAtomA) * 2;
    },
    set: (value: number, { set }: SetOptions) => {
        set(counterAtomA, value / 2);
    }
});

export const multipliedAtomB = derivedAtom({
    key: 'multiplied-counter-b',
    get: ({ get }) => {
        return get(counterAtomB) * 2
    }
});

export const equationAtom = derivedAtom({
    key: 'equation',
    get: ({ get }) => {
        return get(multipliedAtomA) + get(counterAtomB) ?? 0;
    },
    set: (value: number, { get, set }: SetOptions) => {
        const delta = value - (get(equationAtom) ?? 0);
        const b = get(counterAtomB) ?? 0;
        set(counterAtomB, b + delta);
    }
})