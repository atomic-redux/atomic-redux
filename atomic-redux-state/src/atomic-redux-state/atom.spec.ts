import { atom } from './atom';
import { ReadOnlyAtom } from './atom-types';
import { DefaultValue, GetOptions, SetOptions } from './getter-setter-utils';

describe('atom', () => {
    it('should return atom with specified key', () => {
        const testKey = 'test-key';
        const testAtom = atom({
            key: testKey,
            default: 0
        });

        expect(testAtom.key).toBe(testKey);
    });

    describe('get', () => {
        it('should return initialiser default value if state not set', () => {
            const testKey = 'test-atom';
            const defaultValue = 10;
            const testAtom = atom({
                key: testKey,
                default: defaultValue
            });

            const result = testAtom.get({} as GetOptions, () => undefined);

            expect(result).toBe(defaultValue);
        });

        it('should return value in state if state exists', () => {
            const testKey = 'test-atom';
            const defaultValue = 10;
            const stateValue = 20;

            const testAtom = atom({
                key: testKey,
                default: defaultValue
            });

            const result = testAtom.get(
                {} as GetOptions,
                (atomKey: string) =>
                    (atomKey === testKey
                        ? stateValue
                        : undefined)
            );
            expect(result).toBe(stateValue);
        });
    });

    describe('set', () => {
        it('should trigger the set callback when a value is provided (primitive)', () => {
            const mockSetCallback = jest.fn();
            const testValue = 10;

            const testAtom = atom({
                key: 'test-atom',
                default: 0
            });

            testAtom.set({} as SetOptions, testValue, mockSetCallback);

            expect(mockSetCallback).toHaveBeenCalledWith(testValue);
        });

        it('should trigger the set callback with default value when DefaultValue is provided (primitive)', () => {
            const mockSetCallback = jest.fn();
            const defaultValue = 10;

            const testAtom = atom({
                key: 'test-atom',
                default: defaultValue
            });

            testAtom.set({} as SetOptions, new DefaultValue(), mockSetCallback);

            expect(mockSetCallback).toHaveBeenCalledWith(defaultValue);
        });

        it('should trigger the set callback when a value is provided (object)', () => {
            const mockSetCallback = jest.fn();
            const testValue = { a: 'test', b: 5 };

            const testAtom = atom({
                key: 'test-atom',
                default: { a: 'hello', b: 0 }
            });

            testAtom.set({} as SetOptions, testValue, mockSetCallback);

            expect(mockSetCallback).toHaveBeenCalledWith(testValue);
        });

        it('should trigger the set callback with default value when DefaultValue is provided (object)', () => {
            const mockSetCallback = jest.fn();
            const defaultValue = { a: 'test', b: 5 };

            const testAtom = atom({
                key: 'test-atom',
                default: defaultValue
            });

            testAtom.set({} as SetOptions, new DefaultValue(), mockSetCallback);

            expect(mockSetCallback).toHaveBeenCalledWith(defaultValue);
        });
    });

    describe('toReadonly', () => {
        it('should return a ReadOnlyAtom', () => {
            const testKey = 'test-atom';
            const testAtom = atom({
                key: testKey,
                default: 0
            });

            const readonlyAtom = testAtom.toReadonly();

            expect(readonlyAtom).toBeInstanceOf(ReadOnlyAtom);
            // @ts-ignore - Testing that this method does not exist despite the typing indicating it doesn't
            expect(readonlyAtom.set).toBeUndefined();
        });
    });
});
