import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { atomsReducer, getAtomMiddleware } from 'atomic-redux-state';
import createSagaMiddleware from 'redux-saga';
import { rootSaga } from './saga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    atoms: atomsReducer
  },
  middleware: [
    sagaMiddleware,
    getAtomMiddleware()
  ]
});

sagaMiddleware.run(rootSaga);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
