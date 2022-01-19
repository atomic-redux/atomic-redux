import { atom } from "../atoms/atom";
import { derivedAtom } from "../atoms/derived-atom";

export const counterAtom = atom({
    key: 'counter',
    default: 0
});

export const multipliedAtom = derivedAtom({
    key: 'multiplied-counter',
    get: ({ get }) => {
        return get(counterAtom) * 2;
    }
})