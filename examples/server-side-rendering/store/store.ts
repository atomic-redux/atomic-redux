import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { postsSlice } from '../features/posts/posts.slice';

const rootReducer = combineReducers({
    posts: postsSlice.reducer
})

export type StoreState = ReturnType<typeof rootReducer>

export const createStore = (preloadedState?: StoreState) => configureStore({
    reducer: rootReducer,
    preloadedState
});