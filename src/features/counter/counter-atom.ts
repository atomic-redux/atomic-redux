import { atom } from "../atoms/atom";
import { derivedAtom } from "../atoms/derived-atom";

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
    set: ({ set }, value: number) => {
        set(counterAtomA, value / 2);
    }
});

export const multipliedAtomB = derivedAtom({
    key: 'multiplied-counter-b',
    get: ({ get }) => {
        return get(counterAtomB) * 2;
    }
});

export const equationAtom = derivedAtom({
    key: 'equation',
    get: ({ get }) => {
        return get(multipliedAtomA) + get(counterAtomB);
    },
    set: ({ get, set }, value: number) => {
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

export const personAtom = (id: number) => derivedAtom({
    key: `person-${id}`,
    get: ({ get }) => {
        const people = get(peopleAtom);
        return people[
            id < 0
                ? people.length - Math.abs(id % people.length) - 1
                : id % people.length
        ];
    },
    set: ({ get, set }, value: Person) => {
        set(peopleAtom, people => {
            people[id] = value;
        });
    }
})