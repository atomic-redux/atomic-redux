import { AtomLoadingState } from '../atomic-redux-state/atom-loading-state';
import { SafeRecord } from '../atomic-redux-state/utils';

export interface DevtoolsAtomState {
    value: unknown;
    loadingState: AtomLoadingState;
}

export interface DevtoolsGraphNode {
    dependencies: string[];
    dependants: string[];
}

export interface DevtoolsMessage {
    type: string;
    payload: {
        states: SafeRecord<string, DevtoolsAtomState>;
        graph: SafeRecord<string, DevtoolsGraphNode>;
    }
}
