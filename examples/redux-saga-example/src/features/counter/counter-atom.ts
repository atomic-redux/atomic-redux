import { atom, DefaultValue, derivedAtom } from 'atomic-redux-state';

export const counterAtom = atom({
    key: 'counter-a',
    default: 0
});

export const multipliedAtom = derivedAtom<number>({
    key: 'multiplied-counter-a',
    get: ({ get }) => {
        return get(counterAtom) * 2;
    },
    set: ({ set, reset }, value) => {
        if (value instanceof DefaultValue) {
            reset(counterAtom);
            return;
        }
        set(counterAtom, value / 2);
    }
});