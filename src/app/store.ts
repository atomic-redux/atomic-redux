import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { atomMiddleware } from '../features/atoms/atom-middleware';
import atomsReducer from '../features/atoms/atom-slice';
import counterReducer from '../features/counter/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    atoms: atomsReducer
  },
  middleware: [atomMiddleware]
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
