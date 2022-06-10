import { createMockState, createTestStore } from '../__test-files__/test-utils';
import { atom } from './atom';
import { AtomLoadingState } from './atom-loading-state';
import { getAtomMiddleware } from './atom-middleware';
import { initialiseAtom, setAtom } from './atom-slice';
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

            const initialiseFirstAtomAction = initialiseAtom(firstAtom);
            const initialiseSecondAtomAction = initialiseAtom(secondAtom);
            const initialiseThirdAtomAction = initialiseAtom(thirdAtom);

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

        it('should keep loading state as Loading for async atom until promise is resolved', async () => {
            const store = createTestStore();

            const testValue = 10;
            const promise = new Promise<number>(resolve => { resolve(testValue); });

            const testAtomKey = 'test-atom';
            const testAtom = derivedAtom({
                key: testAtomKey,
                get: async () => promise
            });
            store.dispatch(initialiseAtom(testAtom));

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Loading);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(undefined);

            await promise;
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Idle);
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
            store.dispatch(initialiseAtom(baseAtom));

            const testAtomKey = 'test-atom';
            const testAtom = derivedAtom({
                key: testAtomKey,
                get: async ({ getAsync }) => getAsync(baseAtom)
            });
            store.dispatch(initialiseAtom(testAtom));

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Loading);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(undefined);

            await promise;
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Idle);
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
            store.dispatch(initialiseAtom(testAtom));

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Loading);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(undefined);

            await promise;
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[testAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Idle);
            expect(store.getState().atoms.states[testAtomKey]?.value).toBe(testValue);
        });

        it('should throw an error when derived atoms form an immediate cycle', () => {
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
                    return 2;
                }
            });

            expect(() => {
                store.dispatch(initialiseAtom(secondAtom));
            }).toThrowError(/.*Atom dependency loop detected: first-atom -> second-atom -> first-atom.*/);
        });

        it('should throw an error when derived atoms form an indirect cycle', () => {
            const store = createTestStore();

            const firstAtom = derivedAtom({
                key: 'first-atom',
                get: ({ get }) => {
                    get(fourthAtom);
                    return 1;
                }
            });

            const secondAtom = derivedAtom({
                key: 'second-atom',
                get: ({ get }) => {
                    get(firstAtom);
                    return 2;
                }
            });

            const thirdAtom = derivedAtom({
                key: 'third-atom',
                get: ({ get }) => {
                    get(secondAtom);
                    return 2;
                }
            });

            const fourthAtom = derivedAtom({
                key: 'fourth-atom',
                get: ({ get }) => {
                    get(thirdAtom);
                    return 2;
                }
            });

            expect(() => {
                store.dispatch(initialiseAtom(firstAtom));
            // eslint-disable-next-line max-len
            }).toThrowError(/.*Atom dependency loop detected: fourth-atom -> third-atom -> second-atom -> first-atom -> fourth-atom.*/);
        });

        it('should throw an error when a derived atom with multiple dependencies creates a dependency loop', () => {
            const store = createTestStore();

            const firstAtom = atom({
                key: 'first-atom',
                default: 1
            });

            const secondAtom = derivedAtom({
                key: 'second-atom',
                get: ({ get }) => {
                    get(firstAtom);
                    get(thirdAtom);
                    return 2;
                }
            });

            const thirdAtom = derivedAtom({
                key: 'third-atom',
                get: ({ get }) => {
                    get(secondAtom);
                    return 2;
                }
            });

            const fourthAtom = derivedAtom({
                key: 'fourth-atom',
                get: ({ get }) => get(thirdAtom)
            });

            expect(() => {
                store.dispatch(initialiseAtom(fourthAtom));
            // eslint-disable-next-line max-len
            }).toThrowError(/.*Atom dependency loop detected: third-atom -> second-atom -> third-atom.*/);
        });

        it('should only call get method once per atom on initialise when connections skip depth levels', () => {
            const store = createTestStore();

            const firstAtom = atom({
                key: 'first-atom',
                default: 0
            });

            const secondAtomSpy = jest.fn();
            const secondAtom = derivedAtom({
                key: 'second-atom',
                get: ({ get }) => {
                    secondAtomSpy();
                    return get(firstAtom);
                }
            });

            const thirdAtomSpy = jest.fn();
            const thirdAtom = derivedAtom({
                key: 'third-atom',
                get: ({ get }) => {
                    thirdAtomSpy();
                    return get(secondAtom);
                }
            });

            const fourthAtomSpy = jest.fn();
            const fourthAtom = derivedAtom({
                key: 'fourth-atom',
                get: ({ get }) => {
                    fourthAtomSpy();
                    get(firstAtom);
                    return get(thirdAtom);
                }
            });

            store.dispatch(initialiseAtom(fourthAtom));

            expect(secondAtomSpy).toHaveBeenCalledTimes(1);
            expect(thirdAtomSpy).toHaveBeenCalledTimes(1);
            expect(fourthAtomSpy).toHaveBeenCalledTimes(1);
        });

        it('should only call get method once per atom on initialise when connections do not skip depth levels', () => {
            const store = createTestStore();

            const firstAtom = atom({
                key: 'first-atom',
                default: 0
            });

            const secondAtomSpy = jest.fn();
            const secondAtom = derivedAtom({
                key: 'second-atom',
                get: ({ get }) => {
                    secondAtomSpy();
                    return get(firstAtom);
                }
            });

            const thirdAtomSpy = jest.fn();
            const thirdAtom = derivedAtom({
                key: 'third-atom',
                get: ({ get }) => {
                    thirdAtomSpy();
                    return get(secondAtom);
                }
            });

            const fourthAtomSpy = jest.fn();
            const fourthAtom = derivedAtom({
                key: 'fourth-atom',
                get: ({ get }) => {
                    fourthAtomSpy();
                    return get(firstAtom);
                }
            });

            const fifthAtomSpy = jest.fn();
            const fifthAtom = derivedAtom({
                key: 'fifth-atom',
                get: ({ get }) => {
                    fifthAtomSpy();
                    return get(fourthAtom);
                }
            });

            const sixthAtomSpy = jest.fn();
            const sixthAtom = derivedAtom({
                key: 'sixth-atom',
                get: ({ get }) => {
                    sixthAtomSpy();
                    get(thirdAtom);
                    return get(fifthAtom);
                }
            });

            store.dispatch(initialiseAtom(sixthAtom));

            expect(secondAtomSpy).toHaveBeenCalledTimes(1);
            expect(thirdAtomSpy).toHaveBeenCalledTimes(1);
            expect(fourthAtomSpy).toHaveBeenCalledTimes(1);
            expect(fifthAtomSpy).toHaveBeenCalledTimes(1);
            expect(sixthAtomSpy).toHaveBeenCalledTimes(1);
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
            expect(states[testAtomKey]?.loadingState).toBe(AtomLoadingState.Idle);
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

            store.dispatch(initialiseAtom(thirdAtom));

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

            store.dispatch(initialiseAtom(firstAtom));
            store.dispatch(initialiseAtom(secondAtom));

            const action = setAtom(secondAtom, testValue);
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(testValue / 2);

            expect(states[secondAtomKey]).toBeDefined();
            expect(states[secondAtomKey]?.value).toBe(testValue);
        });

        it('should only call get method once per atom on atom set when connections skip depth levels', () => {
            const store = createTestStore();

            const firstAtom = atom({
                key: 'first-atom',
                default: 0
            });

            const secondAtomSpy = jest.fn();
            const secondAtom = derivedAtom({
                key: 'second-atom',
                get: ({ get }) => {
                    secondAtomSpy();
                    return get(firstAtom);
                }
            });

            const thirdAtomSpy = jest.fn();
            const thirdAtom = derivedAtom({
                key: 'third-atom',
                get: ({ get }) => {
                    thirdAtomSpy();
                    return get(secondAtom);
                }
            });

            const fourthAtomSpy = jest.fn();
            const fourthAtom = derivedAtom({
                key: 'fourth-atom',
                get: ({ get }) => {
                    fourthAtomSpy();
                    get(firstAtom);
                    return get(thirdAtom);
                }
            });
            store.dispatch(initialiseAtom(fourthAtom));
            jest.clearAllMocks();

            store.dispatch(setAtom(firstAtom, 1));

            expect(secondAtomSpy).toHaveBeenCalledTimes(1);
            expect(thirdAtomSpy).toHaveBeenCalledTimes(1);
            expect(fourthAtomSpy).toHaveBeenCalledTimes(1);
        });

        it('should only call get method once per atom on atom set when connections do not skip depth levels', () => {
            const store = createTestStore();

            const firstAtom = atom({
                key: 'first-atom',
                default: 0
            });

            const secondAtomSpy = jest.fn();
            const secondAtom = derivedAtom({
                key: 'second-atom',
                get: ({ get }) => {
                    secondAtomSpy();
                    return get(firstAtom);
                }
            });

            const thirdAtomSpy = jest.fn();
            const thirdAtom = derivedAtom({
                key: 'third-atom',
                get: ({ get }) => {
                    thirdAtomSpy();
                    return get(secondAtom);
                }
            });

            const fourthAtomSpy = jest.fn();
            const fourthAtom = derivedAtom({
                key: 'fourth-atom',
                get: ({ get }) => {
                    fourthAtomSpy();
                    return get(firstAtom);
                }
            });

            const fifthAtomSpy = jest.fn();
            const fifthAtom = derivedAtom({
                key: 'fifth-atom',
                get: ({ get }) => {
                    fifthAtomSpy();
                    return get(fourthAtom);
                }
            });

            const sixthAtomSpy = jest.fn();
            const sixthAtom = derivedAtom({
                key: 'sixth-atom',
                get: ({ get }) => {
                    sixthAtomSpy();
                    get(thirdAtom);
                    return get(fifthAtom);
                }
            });

            store.dispatch(initialiseAtom(sixthAtom));

            jest.clearAllMocks();
            store.dispatch(setAtom(firstAtom, 1));

            expect(secondAtomSpy).toHaveBeenCalledTimes(1);
            expect(thirdAtomSpy).toHaveBeenCalledTimes(1);
            expect(fourthAtomSpy).toHaveBeenCalledTimes(1);
            expect(fifthAtomSpy).toHaveBeenCalledTimes(1);
            expect(sixthAtomSpy).toHaveBeenCalledTimes(1);
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

            store.dispatch(initialiseAtom(firstAtom));
            store.dispatch(initialiseAtom(secondAtom));

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

            store.dispatch(initialiseAtom(firstAtom));
            store.dispatch(initialiseAtom(secondAtom));

            const action = setAtom(secondAtom, new DefaultValue());
            store.dispatch(action);

            const states = store.getState().atoms.states;

            expect(states[firstAtomKey]).toBeDefined();
            expect(states[firstAtomKey]?.value).toBe(10);
        });

        it('should set loading state to updating until async atom promise is resolved', async () => {
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

            store.dispatch(initialiseAtom(asyncAtom));
            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[asyncAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[asyncAtomKey]?.loadingState).toBe(AtomLoadingState.Idle);
            expect(store.getState().atoms.states[asyncAtomKey]?.value).toBe(startValue);

            promise = new Promise<number>(resolve => { resolve(newValue); });
            store.dispatch(setAtom(parentAtom, 1));

            expect(store.getState().atoms.states[asyncAtomKey]).toBeDefined();
            expect(store.getState().atoms.states[asyncAtomKey]?.loadingState).toBe(AtomLoadingState.Updating);
            expect(store.getState().atoms.states[asyncAtomKey]?.value).toBe(startValue);

            await new Promise(process.nextTick);

            expect(store.getState().atoms.states[asyncAtomKey]?.loadingState).toBe(AtomLoadingState.Idle);
            expect(store.getState().atoms.states[asyncAtomKey]?.value).toBe(newValue);
        });
    });
});
