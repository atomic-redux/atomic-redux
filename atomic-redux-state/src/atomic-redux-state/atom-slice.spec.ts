// Most relevant tests are in ./atom-middleware.spec.ts, as they use the real store implementation

import { createTestStore } from '../__test-files__/test-utils';
import { atom } from './atom';
import { AtomLoadingState } from './atom-loading-state';
import {
    getAtomValueFromState, initialiseAtom, initialiseAtomFromState,
    initialiseAtomFromStore, internalSetLoadingState,
    isAtomUpdating
} from './atom-slice';
import { derivedAtom } from './derived-atom';
import { LoadingAtom } from './getter-setter-utils';

describe('getAtomValueFromStore', () => {
    it('should get atom value from store', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        const value = initialiseAtomFromStore(store, testAtom);

        expect(value).toBe(testValue);
    });
});

describe('initialiseAtomFromState', () => {
    it('should get atom value from state when not initialised', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        const value = initialiseAtomFromState(store.getState(), store.dispatch, testAtom);
        expect(value).toBe(testValue);
    });

    it('should get atom value from state when initialised', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        store.dispatch(initialiseAtom(testAtom));

        const value = initialiseAtomFromState(store.getState(), store.dispatch, testAtom);
        expect(value).toBe(testValue);
    });
});

describe('getAtomValueFromState', () => {
    it('should get atom value from state when not initialised', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        const value = getAtomValueFromState(store.getState(), testAtom);
        expect(value).toBe(testValue);
    });

    it('should get atom value from state when initialised', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        store.dispatch(initialiseAtom(testAtom));

        const value = getAtomValueFromState(store.getState(), testAtom);
        expect(value).toBe(testValue);
    });

    it('should get derived atom value from state when not initialised', () => {
        const store = createTestStore();

        const testValue = 10;
        const baseAtom = atom({
            key: 'base-atom',
            default: testValue
        });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: ({ get }) => {
                const value = get(baseAtom);
                return value * 2;
            }
        });

        const value = getAtomValueFromState(store.getState(), testAtom);
        expect(value).toBe(testValue * 2);
    });

    it('should return LoadingAtom while awaiting promise', async () => {
        const store = createTestStore();

        const testValue = 10;
        const baseAtom = derivedAtom({
            key: 'base-atom',
            get: async () => {
                await new Promise(r => { setTimeout(r, 100); });
                return testValue;
            }
        });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: async ({ getAsync }) => {
                const value = await getAsync(baseAtom);
                return value * 2;
            }
        });

        const value = getAtomValueFromState(store.getState(), testAtom);
        expect(value).toBeInstanceOf(LoadingAtom);
    });

    it('should return async value if already initialised with value', async () => {
        const store = createTestStore();

        const testValue = 10;
        const promise = new Promise<number>(resolve => { resolve(testValue); });

        const baseAtom = derivedAtom({
            key: 'base-atom',
            get: () => promise
        });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: async ({ getAsync }) => {
                const value = await getAsync(baseAtom);
                return value;
            }
        });

        store.dispatch(initialiseAtom(testAtom));

        await promise;
        await new Promise(process.nextTick);

        const value = getAtomValueFromState(store.getState(), testAtom);
        expect(value).toBe(testValue);
    });

    it('should throw an error when atom depends on itself', () => {
        const store = createTestStore();

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: ({ get }) => {
                get(testAtom);
                return 1;
            }
        });

        expect(() => {
            getAtomValueFromState(store.getState(), testAtom);
        }).toThrowError(/.*Atom dependency loop detected: test-atom -> test-atom.*/);
    });

    it('should throw an error when derived atoms create a dependency loop', () => {
        const store = createTestStore();

        const firstAtom = derivedAtom({
            key: 'first-atom',
            get: ({ get }) => {
                get(secondAtom);
                return 1;
            }
        });

        const secondAtom = derivedAtom({
            key: 'second-atom',
            get: ({ get }) => {
                get(firstAtom);
                return 1;
            }
        });

        expect(() => {
            getAtomValueFromState(store.getState(), firstAtom);
        }).toThrowError(/.*Atom dependency loop detected: first-atom -> second-atom -> first-atom.*/);
    });
});

describe('isAtomUpdating', () => {
    it('should return false when atom is not defined', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const result = isAtomUpdating(store.getState(), testAtom);

        expect(result).toBe(false);
    });

    it('should return false when atom is not loading', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        store.dispatch(initialiseAtom(testAtom));

        const result = isAtomUpdating(store.getState(), testAtom);

        expect(result).toBe(false);
    });

    it('should return true when atom is updating', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        store.dispatch(initialiseAtom(testAtom));
        store.dispatch(internalSetLoadingState([{
            atomKey: testAtom.key,
            loadingState: AtomLoadingState.Updating
        }]));

        const result = isAtomUpdating(store.getState(), testAtom);

        expect(result).toBe(true);
    });
});
