import { AtomLoadingState } from '../atomic-redux-state/atom-loading-state';
import { AtomMiddlewareSliceState } from '../atomic-redux-state/atom-middleware-slice';
import { AtomicStoreState } from '../atomic-redux-state/atom-slice';
import { SafeRecord } from '../atomic-redux-state/utils';
import { DevtoolsAtomState, DevtoolsGraphNode, DevtoolsMessage } from './devtools-message';

export const atomicReduxDevtoolsEventType = 'atomic-redux-devtools-event';

export const updateDevtools = (
    state: AtomicStoreState,
    middlewareState: AtomMiddlewareSliceState,
    devtools: boolean
) => {
    if (!devtools) {
        return;
    }

    window.postMessage(buildDevtoolsMessage(state, middlewareState), '*');
};

const buildDevtoolsMessage = (state: AtomicStoreState, middlewareState: AtomMiddlewareSliceState): DevtoolsMessage => {
    const states: SafeRecord<string, DevtoolsAtomState> = {};
    for (const key of Object.keys(state.atoms.states)) {
        states[key] = {
            value: state.atoms.states[key]?.value,
            loadingState: state.atoms.states[key]?.loadingState ?? AtomLoadingState.Loading
        };
    }

    const graph: SafeRecord<string, DevtoolsGraphNode> = {};
    for (const key of Object.keys(middlewareState.graph)) {
        graph[key] = {
            dependencies: middlewareState.graph[key]?.dependencies ?? [],
            dependants: middlewareState.graph[key]?.dependants ?? []
        };
    }

    return {
        type: atomicReduxDevtoolsEventType,
        payload: {
            states,
            graph
        }
    };
};
