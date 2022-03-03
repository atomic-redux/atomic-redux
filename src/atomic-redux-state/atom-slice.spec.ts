// Most relevant tests are in ./atom-middleware.spec.ts, as they use the real store implementation

import { createTestStore } from '../__test-files__/test-utils';
import { atom } from './atom';
import {
    initialiseAtomFromState,
    initialiseAtomFromStore,
    internalInitialiseAtom,
    internalSetLoading,
    isAtomUpdating
} from './atom-slice';

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

describe('getAtomValueFromState', () => {
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

        store.dispatch(internalInitialiseAtom(testAtom));

        const value = initialiseAtomFromState(store.getState(), store.dispatch, testAtom);
        expect(value).toBe(testValue);
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

        store.dispatch(internalInitialiseAtom(testAtom));

        const result = isAtomUpdating(store.getState(), testAtom);

        expect(result).toBe(false);
    });

    it('should return true when atom is loading', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        store.dispatch(internalInitialiseAtom(testAtom));
        store.dispatch(internalSetLoading({
            atomKey: testAtom.key,
            loading: true
        }));

        const result = isAtomUpdating(store.getState(), testAtom);

        expect(result).toBe(true);
    });
});
