import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { atomsReducer, getAtomMiddleware } from 'atomic-redux-state';
import counterReducer from '../features/counter/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    atoms: atomsReducer
  },
  middleware: [getAtomMiddleware()]
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
