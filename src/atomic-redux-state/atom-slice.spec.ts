// Most relevant tests are in ./atom-middleware.spec.ts, as they use the real store implementation

import { createTestStore } from '../__test-files__/test-utils';
import { atom } from './atom';
import { getAtomValueFromState, getAtomValueFromStore } from './atom-slice';

describe('getAtomValueFromStore', () => {
    it('should get atom value from store', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        const value = getAtomValueFromStore(store, testAtom);

        expect(value).toBe(testValue);
    });

    it('should get atom value from state', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: testValue
        });

        const value = getAtomValueFromState(store.getState(), store.dispatch, testAtom);
        expect(value).toBe(testValue);
    });
});
