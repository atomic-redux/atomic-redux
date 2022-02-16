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
});