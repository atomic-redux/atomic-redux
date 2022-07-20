/* eslint-disable no-console */
import { configureStore, createReducer, createSelector } from '@reduxjs/toolkit';
import { createTestStore } from '../__test-files__/test-utils';
import { atom } from './atom';
import { selectAtom, setAtom } from './atom-slice';
import { derivedAtom } from './derived-atom';

const createBaselineStore = () => {
    type RegularStoreState = {
        a: number;
        b: number;
        c: number;
    };

    const initialState: RegularStoreState = {
        a: 0,
        b: 0,
        c: 0
    };

    const regularStore = configureStore({
        reducer: createReducer(
            initialState,
            builder => {
                builder
                    .addCase('increment', state => {
                        state.a++;
                    })
                    .addCase('decrement', state => {
                        state.b--;
                    });
            }
        )
    });

    const aSelector = (store: RegularStoreState) => store.a;
    const bSelector = (store: RegularStoreState) => store.b;
    const cSelector = (store: RegularStoreState) => store.c;

    const multipliedASelector = createSelector(aSelector, a => a * 2);
    const multipliedBSelector = createSelector(bSelector, b => b * 2);
    const multipliedCSelector = createSelector(cSelector, c => c * 2);
    const equationSelector = createSelector(
        multipliedASelector,
        multipliedBSelector,
        multipliedCSelector,
        (a, b, c) => a + b + c
    );

    regularStore.subscribe(() => {
        const state = regularStore.getState();

        aSelector(state);
        bSelector(state);
        cSelector(state);
        multipliedASelector(state);
        multipliedBSelector(state);
        multipliedCSelector(state);
        equationSelector(state);
    });

    return regularStore;
};

const createAtomicReduxStore = () => {
    const store = createTestStore();

    const aAtom = atom({
        key: 'a',
        default: 0
    });

    const bAtom = atom({
        key: 'b',
        default: 0
    });

    const cAtom = atom({
        key: 'c',
        default: 0
    });

    const multipliedAAtom = derivedAtom({
        key: 'multipliedA',
        get: ({ get }) => get(aAtom) * 2
    });

    const multipliedBAtom = derivedAtom({
        key: 'multipliedB',
        get: ({ get }) => get(bAtom) * 2
    });

    const multipliedCAtom = derivedAtom({
        key: 'multipliedC',
        get: ({ get }) => get(cAtom) * 2
    });

    const equationAtom = derivedAtom({
        key: 'equation',
        get: ({ get }) => get(multipliedAAtom) + get(multipliedBAtom) + get(multipliedCAtom)
    });

    return { store, aAtom, bAtom, cAtom, multipliedAAtom, multipliedBAtom, multipliedCAtom, equationAtom };
};

const runBaselineTest = () => {
    const store = createBaselineStore();

    const start = performance.now();

    for (let i = 0; i < 100000; i++) {
        store.dispatch({ type: 'increment' });
    }

    for (let i = 0; i < 100000; i++) {
        store.dispatch({ type: 'decrement' });
    }

    const end = performance.now();
    return end - start;
};

const runAtomicReduxTest = () => {
    const {
        store,
        aAtom,
        bAtom,
        cAtom,
        multipliedAAtom,
        multipliedBAtom,
        multipliedCAtom,
        equationAtom
    } = createAtomicReduxStore();

    const selectAtoms = () => {
        const state = store.getState();
        selectAtom(state, aAtom);
        selectAtom(state, bAtom);
        selectAtom(state, cAtom);
        selectAtom(state, multipliedAAtom);
        selectAtom(state, multipliedBAtom);
        selectAtom(state, multipliedCAtom);
        selectAtom(state, equationAtom);
    };

    const start = performance.now();

    for (let i = 0; i < 100000; i++) {
        store.dispatch(setAtom(aAtom, i));
        selectAtoms();
    }

    for (let i = 0; i < 100000; i++) {
        store.dispatch(setAtom(aAtom, i));
        selectAtoms();
    }

    const end = performance.now();
    return end - start;
};

describe('Atomic Redux State performance', () => {
    it.skip('should be performant', () => {
        const baseline = runBaselineTest();
        console.info(`Baseline: ${baseline}ms`);

        const atomicReduxResult = runAtomicReduxTest();
        console.info(`Atomic Redux: ${atomicReduxResult}ms`);

        expect(true).toBeTruthy();
    });
});
