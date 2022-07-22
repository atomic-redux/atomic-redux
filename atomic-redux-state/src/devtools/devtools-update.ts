import { AtomMiddlewareSliceState } from '../atomic-redux-state/atom-middleware-slice';
import { AtomicStoreState } from '../atomic-redux-state/atom-slice';
import { DevtoolsMessage } from './devtools-message';

export const atomicReduxDevtoolsEventType = 'atomic-redux-devtools-event';

export const updateDevtools = (
    state: AtomicStoreState,
    middlewareState: AtomMiddlewareSliceState,
    devtools: boolean
) => {
    if (!devtools || typeof window === 'undefined' || window.postMessage === undefined) {
        return;
    }

    window.postMessage(buildDevtoolsMessage(state, middlewareState), '*');
};

const buildDevtoolsMessage = (state: AtomicStoreState, middlewareState: AtomMiddlewareSliceState): DevtoolsMessage => ({
    type: atomicReduxDevtoolsEventType,
    payload: {
        states: state.atoms.states,
        graph: middlewareState.graph
    }
});
