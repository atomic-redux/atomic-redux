import { atom } from "../atoms/atom";
import { derivedAtom } from "../atoms/derived-atom";
import { SetOptions } from '../atoms/getter-setter-utils';

export const counterAtom = atom({
    key: 'counter',
    default: 0
});

export const multipliedAtom = derivedAtom<number>({
    key: 'multiplied-counter',
    get: ({ get }) => {
        return get(counterAtom) * 2;
    },
    set: (value: number, { set }: SetOptions) => {
        set(counterAtom, value / 2);
    }
})