import { createMockState, createTestStore } from '../__test-files__/test-utils';
import { atom } from './atom';
import { getAtomMiddleware } from './atom-middleware';
import { internalInitialiseAtom, setAtom } from './atom-slice';
import { derivedAtom } from './derived-atom';
import { DefaultValue } from './getter-setter-utils';

describe('atom-middleware', () => {
    const dispatchMock = jest.fn();
    const getStateMock = jest.fn();
    const mockNextHandler = getAtomMiddleware()({
        dispatch: dispatchMock,
        getState: getStateMock
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe('next', () => {
        it('should return an action handler', () => {
            const actionHandler = mockNextHandler(jest.fn());

            expect(actionHandler).toBeInstanceOf(Function);
            expect(actionHandler.length).toBe(1);
        });
    });

    describe('action handler', () => {
        it('should call the next callback with the action when the action is not an atom type', () => {
            const nextCallback = jest.fn();
            const actionHandler = mockNextHandler(nextCallback);
            const action = { type: 'some-action' };

            actionHandler(action);

            expect(nextCallback).toHaveBeenCalledWith(action);
        });
    });

    describe('initialiseAtom', () => {
        it('should set dependant atom values', () => {
            const store = createTestStore();

            const testValue = 1;
            const firstAtomKey = 'first-atom';
            const firstAtom = atom({
                key: firstAtomKey,
                default: testValue
            });

            const secondAtomKey = 'second-atom';
            const secondAtom = derivedAtom({
                key: secondAtomKey,
                get: ({ get }) => get(firstAtom) * 2
            });

            const thirdAtomKey = 'third-atom';
            const thirdAtom = derivedAtom({
                key: thirdAtomKey,
                get: ({ get }) => get(secondAtom) * 2
            });

            getStateMock.mockReturnValue(createMockState());

            const initialiseFirstAtomAction = internalInitialiseAtom(firstAtom);
            const initialiseSecondAtomAction = internalInitialiseAtom(secondAtom);
            const initialiseThirdAtomAction = internalInitialiseAtom(thirdAtom);

            store.dispatch(initialiseFirstAtomAction);
            store.dispatch(initialiseSecondAtomAction);
            store.dispatch(initialiseThirdAtomAction);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(testValue);

            expect(states[secondAtomKey]).toBeDefined();
            expect(states[secondAtomKey]?.value).toBe(testValue * 2);

            expect(states[thirdAtomKey]).toBeDefined();
            expect(states[thirdAtomKey]?.value).toBe(testValue * 4);
        });

        it('should keep state undefined for async atom until promise is resolved', async () => {
            const store = createTestStore();

            const testValue = 10;
            const promise = new Promise<number>(resolve => { resolve(testValue); });

            const testAtomKey = 'test-atom';
            const testAtom = derivedAtom({
                key: testAtomKey,
                get: async () => promise
            });
            store.dispatch(internalInitialiseAtom(testAtom));

            expect(store.getState().atoms.states[testAtomKey]).toBeUndefined();

            await promise;
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loading).toBe(false);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(testValue);
        });

        it('should keep state for derived atoms using getAsync as undefined until the base atom resolves', async () => {
            const store = createTestStore();

            const testValue = 10;
            const promise = new Promise<number>(resolve => { resolve(testValue); });

            const baseAtom = derivedAtom({
                key: 'base-atom',
                get: async () => promise
            });
            store.dispatch(internalInitialiseAtom(baseAtom));

            const testAtomKey = 'test-atom';
            const testAtom = derivedAtom({
                key: testAtomKey,
                get: async ({ getAsync }) => getAsync(baseAtom)
            });
            store.dispatch(internalInitialiseAtom(testAtom));

            expect(store.getState().atoms.states[testAtomKey]).toBeUndefined();

            await promise;
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loading).toBe(false);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(testValue);
        });

        it('should execute and await async get when getAsync called on atom that has not initialised', async () => {
            const store = createTestStore();

            const testValue = 10;
            const promise = new Promise<number>(resolve => { resolve(testValue); });

            const baseAtom = derivedAtom({
                key: 'base-atom',
                get: async () => promise
            });

            const testAtomKey = 'test-atom';
            const testAtom = derivedAtom({
                key: testAtomKey,
                get: async ({ getAsync }) => getAsync(baseAtom)
            });
            store.dispatch(internalInitialiseAtom(testAtom));

            expect(store.getState().atoms.states[testAtomKey]).toBeUndefined();

            await promise;
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loading).toBe(false);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(testValue);
        });
    });

    describe('setAtom', () => {
        it('should throw an error when attempting to set a read-only atom', () => {
            const actionHandler = mockNextHandler(jest.fn());

            const testAtomKey = 'test-atom';
            const testValue = 10;
            const testAtom = derivedAtom({
                key: testAtomKey,
                get: () => 0
            });

            /// @ts-ignore testAtom is readonly, intentionally testing invalid input
            const action = setAtom(testAtom, testValue);

            expect(() => {
                actionHandler(action);
            }).toThrowError(`Attempted to write value ${testValue} to read-only atom ${testAtomKey}`);
        });

        it('should set atom value in state', () => {
            const store = createTestStore();

            const testAtomKey = 'test-atom';
            const testValue = 10;
            const testAtom = atom({
                key: testAtomKey,
                default: 0
            });

            const action = setAtom(testAtom, testValue);

            store.dispatch(action);

            const states = store.getState().atoms.states;
            expect(states[testAtomKey]).toBeDefined();
            expect(states[testAtomKey]?.value).toBe(testValue);
            expect(states[testAtomKey]?.loading).toBe(false);
        });

        it('should set the atom value based on the current state when a callback is provided', () => {
            const store = createTestStore();

            const testAtomKey = 'test-atom';
            const testAtom = atom({
                key: testAtomKey,
                default: 2
            });

            const action = setAtom(testAtom, value => value + 1);
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[testAtomKey]).toBeDefined();
            expect(states[testAtomKey]?.value).toBe(3);
        });

        it('should set the atom value based on mutation in immer callback', () => {
            const store = createTestStore();

            const testAtomKey = 'test-atom';
            const testAtom = atom({
                key: testAtomKey,
                default: {
                    a: 'hello',
                    b: 10
                }
            });

            const action = setAtom(testAtom, value => {
                value.a = 'test';
                value.b += 10;
            });
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[testAtomKey]).toBeDefined();
            expect(states[testAtomKey]?.value).toMatchObject({
                a: 'test',
                b: 20
            });
        });

        it('should update dependant atom values in state', () => {
            const store = createTestStore();

            const testValue = 1;
            const firstAtomKey = 'test-atom';
            const firstAtom = atom({
                key: firstAtomKey,
                default: 0
            });

            const secondAtomKey = 'second-atom';
            const secondAtom = derivedAtom({
                key: secondAtomKey,
                get: ({ get }) => get(firstAtom) * 2
            });

            const thirdAtomKey = 'third-atom';
            const thirdAtom = derivedAtom({
                key: thirdAtomKey,
                get: ({ get }) => get(secondAtom) * 2
            });

            store.dispatch(internalInitialiseAtom(thirdAtom));

            const action = setAtom(firstAtom, testValue);
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(testValue);

            expect(states[secondAtomKey]).toBeDefined();
            expect(states[secondAtomKey]?.value).toBe(testValue * 2);

            expect(states[thirdAtomKey]).toBeDefined();
            expect(states[thirdAtomKey]?.value).toBe(testValue * 4);
        });

        it('should set derivedAtom parent value', () => {
            const store = createTestStore();

            const testValue = 1;
            const firstAtomKey = 'test-atom';
            const firstAtom = atom({
                key: firstAtomKey,
                default: 0
            });

            const secondAtomKey = 'second-atom';
            const secondAtom = derivedAtom<number>({
                key: secondAtomKey,
                get: ({ get }) => get(firstAtom) * 2,
                set: ({ set, reset }, value) => {
                    if (value instanceof DefaultValue) {
                        reset(firstAtom);
                        return;
                    }

                    set(firstAtom, value / 2);
                }
            });

            store.dispatch(internalInitialiseAtom(firstAtom));
            store.dispatch(internalInitialiseAtom(secondAtom));

            const action = setAtom(secondAtom, testValue);
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(testValue / 2);

            expect(states[secondAtomKey]).toBeDefined();
            expect(states[secondAtomKey]?.value).toBe(testValue);
        });

        it('should reset parent of derivedAtom when reset method called', () => {
            const store = createTestStore();

            const firstAtomKey = 'test-atom';
            const firstAtom = atom({
                key: firstAtomKey,
                default: 0
            });

            const secondAtomKey = 'second-atom';
            const secondAtom = derivedAtom<number>({
                key: secondAtomKey,
                get: ({ get }) => get(firstAtom) * 2,
                set: ({ reset }) => {
                    reset(firstAtom);
                }
            });

            store.dispatch(internalInitialiseAtom(firstAtom));
            store.dispatch(internalInitialiseAtom(secondAtom));

            const action = setAtom(secondAtom, new DefaultValue());
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(0);

            expect(states[secondAtomKey]).toBeDefined();
            expect(states[secondAtomKey]?.value).toBe(0);
        });

        it('should provide get functionality in derivedAtom set method', () => {
            const store = createTestStore();

            const firstAtomKey = 'test-atom';
            const firstAtom = atom({
                key: firstAtomKey,
                default: 0
            });

            const otherAtom = atom({
                key: 'other-atom',
                default: 10
            });

            const secondAtomKey = 'second-atom';
            const secondAtom = derivedAtom<number>({
                key: secondAtomKey,
                get: ({ get }) => get(firstAtom) * 2,
                set: ({ get, set }) => {
                    const value = get(otherAtom);
                    set(firstAtom, value);
                }
            });

            store.dispatch(internalInitialiseAtom(firstAtom));
            store.dispatch(internalInitialiseAtom(secondAtom));

            const action = setAtom(secondAtom, new DefaultValue());
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(10);
        });

        it('should set loading state until async atom promise is resolved', async () => {
            const store = createTestStore();

            const startValue = 1;
            const newValue = 10;
            let promise = new Promise<number>(resolve => { resolve(startValue); });

            const parentAtom = atom({
                key: 'parent-atom',
                default: 0
            });

            const asyncAtomKey = 'async-atom';
            const asyncAtom = derivedAtom({
                key: asyncAtomKey,
                get: async ({ get }) => {
                    get(parentAtom);
                    return promise;
                }
            });

            store.dispatch(internalInitialiseAtom(asyncAtom));
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[asyncAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[asyncAtomKey]?.loading).toBe(false);
            expect(store.getState().atoms.states[asyncAtomKey]?.value).toBe(startValue);

            promise = new Promise<number>(resolve => { resolve(newValue); });
            store.dispatch(setAtom(parentAtom, 1));

            expect(store.getState().atoms.states[asyncAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[asyncAtomKey]?.loading).toBe(true);
            expect(store.getState().atoms.states[asyncAtomKey]?.value).toBe(startValue);

            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[asyncAtomKey]?.loading).toBe(false);
            expect(store.getState().atoms.states[asyncAtomKey]?.value).toBe(newValue);
        });
    });
});
