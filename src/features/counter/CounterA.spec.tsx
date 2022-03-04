import { fireEvent, screen } from '@testing-library/dom';
import { render } from '@testing-library/react';
import { getAtomValueFromState } from 'atomic-redux-state';
import { Provider } from 'react-redux';
import { counterAtomA, multipliedAtomA } from './counter-atom';
import { CounterA } from './CounterA';
import { createTestStore } from './test-utils';

describe('CounterA', () => {
    it('should increment counter A when + clicked', () => {
        const store = createTestStore();

        render(
            <Provider store={store}>
                <CounterA />
            </Provider>
        )

        const previousValue = getAtomValueFromState(store.getState(), counterAtomA);

        const button = screen.getByLabelText('Increment value');
        fireEvent.click(button);

        const value = getAtomValueFromState(store.getState(), counterAtomA);

        expect(value).toBe(previousValue + 1);
    });

    it('should decrement counter A when - clicked', () => {
        const store = createTestStore();

        render(
            <Provider store={store}>
                <CounterA />
            </Provider>
        )

        const previousValue = getAtomValueFromState(store.getState(), counterAtomA);

        const button = screen.getByLabelText('Decrement value');
        fireEvent.click(button);

        const value = getAtomValueFromState(store.getState(), counterAtomA);

        expect(value).toBe(previousValue - 1);
    });

    it('should increment multiplied counter A when + clicked', () => {
        const store = createTestStore();

        render(
            <Provider store={store}>
                <CounterA />
            </Provider>
        )

        const previousValue = getAtomValueFromState(store.getState(), multipliedAtomA);

        const button = screen.getByLabelText('Increment multiplied value');
        fireEvent.click(button);

        const value = getAtomValueFromState(store.getState(), multipliedAtomA);

        expect(value).toBe(previousValue + 1);
    });

    it('should decrement multiplied counter A when + clicked', () => {
        const store = createTestStore();

        render(
            <Provider store={store}>
                <CounterA />
            </Provider>
        )

        const previousValue = getAtomValueFromState(store.getState(), multipliedAtomA);

        const button = screen.getByLabelText('Decrement multiplied value');
        fireEvent.click(button);

        const value = getAtomValueFromState(store.getState(), multipliedAtomA);

        expect(value).toBe(previousValue - 1);
    });
});