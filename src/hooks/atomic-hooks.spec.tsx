import { Store } from '@reduxjs/toolkit';
import { act, renderHook, RenderHookOptions } from '@testing-library/react-hooks';
import { atom, derivedAtom, setAtom } from 'atomic-redux-state';
import { AtomLoadingState } from 'atomic-redux-state/out/atomic-redux-state/atom-loading-state';
import {
    getAtomValueFromState,
    internalInitialiseAtom,
    internalSetLoadingState
} from 'atomic-redux-state/out/atomic-redux-state/atom-slice';
import { Provider } from 'react-redux';
import { useAtomicState, useIsAtomUpdating, useSetAtomicState } from '..';
import { createTestStore } from '../__test-files__/test-utils';
import { useAtomicValue, useResetAtomicState } from './atomic-hooks';

const createRenderHookOptions: (store: Store) => RenderHookOptions<unknown> = store => {
    const options: RenderHookOptions<unknown> = {
        wrapper: ({ children }) => <Provider store={store}>{children}</Provider>
    };
    return options;
};

describe('useAtomicValue', () => {
    it('should return default atom value when no updates made', () => {
        const store = createTestStore();

        const defaultValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: defaultValue
        });

        const { result } = renderHook(() => useAtomicValue(testAtom), createRenderHookOptions(store));

        expect(result.current).toBe(defaultValue);
    });

    it('should change value when redux state changes', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const { result } = renderHook(() => useAtomicValue(testAtom), createRenderHookOptions(store));

        act(() => {
            store.dispatch(setAtom(testAtom, testValue));
        });

        expect(result.current).toBe(testValue);
    });
});

describe('useSetAtomicState', () => {
    it('should set the atom value when set called with value', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const { result } = renderHook(() => useSetAtomicState(testAtom), createRenderHookOptions(store));

        act(() => {
            result.current(testValue);
        });

        const newValue = getAtomValueFromState(store.getState(), testAtom);
        expect(newValue).toBe(testValue);
    });

    it('should set the atom value when set called with update function', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 10
        });

        const { result } = renderHook(() => useSetAtomicState(testAtom), createRenderHookOptions(store));

        act(() => {
            result.current(value => value + 1);
        });

        const newValue = getAtomValueFromState(store.getState(), testAtom);
        expect(newValue).toBe(11);
    });
});

describe('useResetAtomicState', () => {
    it('should reset atom to default value when called', () => {
        const store = createTestStore();

        const defaultValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: defaultValue
        });

        const { result } = renderHook(() => useResetAtomicState(testAtom), createRenderHookOptions(store));

        store.dispatch(setAtom(testAtom, 0));
        expect(getAtomValueFromState(store.getState(), testAtom)).toBe(0);

        act(() => {
            result.current();
        });

        const newValue = getAtomValueFromState(store.getState(), testAtom);
        expect(newValue).toBe(defaultValue);
    });
});

describe('useIsAtomUpdating', () => {
    it('should return false when atom has not yet loaded', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const { result } = renderHook(() => useIsAtomUpdating(testAtom), createRenderHookOptions(store));

        expect(result.current).toBe(false);
    });

    it('should return false when atom has loaded and is not updating', async () => {
        const store = createTestStore();

        const testValue = 10;
        const promise = new Promise<number>(resolve => { resolve(testValue); });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: async () => promise
        });
        store.dispatch(internalInitialiseAtom(testAtom));

        await promise;
        await new Promise(process.nextTick);

        const { result } = renderHook(() => useIsAtomUpdating(testAtom), createRenderHookOptions(store));

        expect(result.current).toBe(false);
    });

    it('should return true when atom has loaded and is updating', async () => {
        const store = createTestStore();

        const testValue = 10;
        const promise = new Promise<number>(resolve => { resolve(testValue); });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: async () => promise
        });
        store.dispatch(internalInitialiseAtom(testAtom));

        await promise;
        await new Promise(process.nextTick);

        const { result } = renderHook(() => useIsAtomUpdating(testAtom), createRenderHookOptions(store));

        expect(result.current).toBe(false);

        act(() => {
            store.dispatch(internalSetLoadingState([{
                atomKey: testAtom.key,
                loadingState: AtomLoadingState.Updating
            }]));
        });

        expect(result.current).toBe(true);
    });
});

describe('useAtomicState', () => {
    it('should return default atom value when no updates made', () => {
        const store = createTestStore();

        const defaultValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: defaultValue
        });

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));
        const [value] = result.current;

        expect(value).toBe(defaultValue);
    });

    it('should change value when redux state changes', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        act(() => {
            store.dispatch(setAtom(testAtom, testValue));
        });

        const [value] = result.current;

        expect(value).toBe(testValue);
    });

    it('should set the atom value when set called with value', () => {
        const store = createTestStore();

        const testValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        const [, setValue] = result.current;

        act(() => {
            setValue(testValue);
        });

        const [value] = result.current;
        expect(value).toBe(testValue);
    });

    it('should set the atom value when set called with update function', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 10
        });

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        const [, setValue] = result.current;

        act(() => {
            setValue(value => value + 1);
        });

        const [value] = result.current;
        expect(value).toBe(11);
    });

    it('should reset atom to default value when reset function called', () => {
        const store = createTestStore();

        const defaultValue = 10;
        const testAtom = atom({
            key: 'test-atom',
            default: defaultValue
        });

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        store.dispatch(setAtom(testAtom, 0));
        expect(getAtomValueFromState(store.getState(), testAtom)).toBe(0);

        const [, , reset] = result.current;

        act(() => {
            reset();
        });

        const [value] = result.current;
        expect(value).toBe(defaultValue);
    });

    it('should set updating to false when atom has not yet loaded', () => {
        const store = createTestStore();

        const testAtom = atom({
            key: 'test-atom',
            default: 0
        });

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        const [, , , isUpdating] = result.current;

        expect(isUpdating).toBe(false);
    });

    it('should set updating to false when atom has loaded and is not updating', async () => {
        const store = createTestStore();

        const testValue = 10;
        const promise = new Promise<number>(resolve => { resolve(testValue); });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: async () => promise,
            set: () => {}
        });
        store.dispatch(internalInitialiseAtom(testAtom));

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        await promise;
        await new Promise(process.nextTick);

        const [, , , isUpdating] = result.current;

        expect(isUpdating).toBe(false);
    });

    it('should set updating to true when atom has loaded and is updating', async () => {
        const store = createTestStore();

        const testValue = 10;
        const promise = new Promise<number>(resolve => { resolve(testValue); });

        const testAtom = derivedAtom({
            key: 'test-atom',
            get: async () => promise,
            set: () => {}
        });
        store.dispatch(internalInitialiseAtom(testAtom));

        const { result } = renderHook(() => useAtomicState(testAtom), createRenderHookOptions(store));

        await promise;
        await new Promise(process.nextTick);

        let [, , , isUpdating] = result.current;

        expect(isUpdating).toBe(false);

        act(() => {
            store.dispatch(internalSetLoadingState([{
                atomKey: testAtom.key,
                loadingState: AtomLoadingState.Updating
            }]));
        });

        [, , , isUpdating] = result.current;

        expect(isUpdating).toBe(true);
    });
});
