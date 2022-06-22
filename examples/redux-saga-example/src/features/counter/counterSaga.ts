import { createAction } from '@reduxjs/toolkit';
import { selectAtom, setAtom } from 'atomic-redux-state';
import { put, select, takeEvery } from 'typed-redux-saga';
import { counterAtom } from './counter-atom';

export const incrementCounter = createAction('counter/increment');
export function* incrementCounterSaga() {
    yield* put(setAtom(counterAtom, value => value + 1));
}

export const decrementCounter = createAction('counter/decrement');
export function* decrementCounterSaga() {
    yield* put(setAtom(counterAtom, value => value - 1));
}

export const consoleLogCounter = createAction('counter/consoleLog');
export function* consoleLogCounterSaga() {
    const value = yield* select(selectAtom, counterAtom);
    console.log(value);
}

export function* counterWatcherSaga() {
    yield* takeEvery(incrementCounter, incrementCounterSaga);
    yield* takeEvery(decrementCounter, decrementCounterSaga);
    yield* takeEvery(consoleLogCounter, consoleLogCounterSaga);
}