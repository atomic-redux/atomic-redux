import { createMockState } from '../__test-files__/test-utils';
import { atom } from './atom';
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

            const result = testAtom.get({} as GetOptions, {
                atoms: {
                    states: {}
                }
            });

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

            const testState = createMockState({
                key: testKey,
                value: stateValue
            });

            const result = testAtom.get({} as GetOptions, testState);
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
});
