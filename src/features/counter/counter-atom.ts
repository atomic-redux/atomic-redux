import { atom } from "../atoms/atom";
import { derivedAtom } from "../atoms/derived-atom";
import { DefaultValue } from '../atoms/getter-setter-utils';

export const counterAtomA = atom({
    key: 'counter-a',
    default: 0
});

export const counterAtomB = atom({
    key: 'counter-b',
    default: 0
});

export const multipliedAtomA = derivedAtom<number>({
    key: 'multiplied-counter-a',
    get: ({ get }) => {
        return get(counterAtomA) * 2;
    },
    set: ({ set, reset }, value) => {
        if (value instanceof DefaultValue) {
            reset(counterAtomA);
            return;
        }
        set(counterAtomA, value / 2);
    }
});

export const multipliedAtomB = derivedAtom({
    key: 'multiplied-counter-b',
    get: async ({ get }) => {
        await new Promise(r => setTimeout(r, 1000));
        return get(counterAtomB) * 2;
    }
});

export const equationAtom = derivedAtom<number>({
    key: 'equation',
    get: ({ get }) => {
        return get(multipliedAtomA) + get(counterAtomB);
    },
    set: ({ get, set, reset }, value) => {
        if (value instanceof DefaultValue) {
            reset(multipliedAtomA);
            reset(counterAtomB);
            return;
        }
        const delta = value - get(equationAtom);
        set(counterAtomB, b => b + delta);
    }
});

interface Person {
    name: string;
    age: number;
}

export const peopleAtom = atom<Person[]>({
    key: 'people',
    default: [
        {
            name: 'Bob',
            age: 25
        },
        {
            name: 'Bill',
            age: 42
        },
        {
            name: 'Blake',
            age: 92
        }
    ]
})

export const personAtom = (id: number) => derivedAtom<Person>({
    key: `person-${id}`,
    get: ({ get }) => {
        const people = get(peopleAtom);
        return people[
            id < 0
                ? people.length - Math.abs(id % people.length) - 1
                : id % people.length
        ];
    },
    set: ({ set, reset }, value) => {
        if (value instanceof DefaultValue) {
            reset(peopleAtom);
            return;
        }

        set(peopleAtom, people => {
            people[id] = value;
        });
    }
})