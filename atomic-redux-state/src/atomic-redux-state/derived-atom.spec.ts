import { ReadOnlyAtom } from './atom-types';
import { derivedAtom } from './derived-atom';

describe('derived-atom', () => {
    it('should return read-only atom if no setter provided', () => {
        const testAtom = derivedAtom({
            key: 'test-atom',
            get: () => { }
        });

        expect((testAtom as any).set).toBeUndefined();
    });

    it('should return writable atom if setter provided', () => {
        const testAtom = derivedAtom({
            key: 'test-atom',
            get: () => { },
            set: () => { }
        });

        expect(testAtom.set).toBeDefined();
    });

    describe('toReadonly', () => {
        it('should return read-only atom', () => {
            const testAtom = derivedAtom({
                key: 'test-atom',
                get: () => { },
                set: () => { }
            });

            const readonlyAtom = testAtom.toReadonly();

            expect(readonlyAtom).toBeInstanceOf(ReadOnlyAtom);
            // @ts-ignore - Testing that this method does not exist despite the typing indicating it doesn't
            expect(readonlyAtom.set).toBeUndefined();
        });
    });
});
