import { atom } from 'atomic-redux-state';
import { PostModel } from './postModel';

export const postsAtom = atom<PostModel[]>({
    key: 'posts',
    default: []
})