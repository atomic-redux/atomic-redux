import { fork } from 'redux-saga/effects';
import { counterWatcherSaga } from '../features/counter/counterSaga';

export const rootSaga = function* rootSaga() {
    yield fork(counterWatcherSaga);
}