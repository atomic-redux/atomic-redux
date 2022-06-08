import { derivedAtom } from 'atomic-redux-state';
import { postsAtom } from './postsAtom';

export const totalPostsAtom = derivedAtom({
    key: 'total-posts',
    get: ({ get }) => {
        return get(postsAtom).length;
    }
})