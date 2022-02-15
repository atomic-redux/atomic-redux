// Most relevant tests are in ./atom-middleware.spec.ts, as they use the real store implementation

import { atom } from './atom';
import { getAtomValueFromStore } from './atom-slice';
import { createTestStore } from './tests/test-utils';

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
})