import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreState } from '../../store/store';
import { PostModel } from './postModel';

export type PostsSliceState = {
    posts: PostModel[];
}

const initialState: PostsSliceState = {
    posts: []
}

export const postsSlice = createSlice({
    name: 'posts',
    initialState,
    reducers: {
        setPosts: (state, action: PayloadAction<PostModel[]>) => {
            state.posts = action.payload;
        }
    }
});

export const selectPosts = (state: StoreState) => state.posts.posts;

export const { setPosts } = postsSlice.actions;