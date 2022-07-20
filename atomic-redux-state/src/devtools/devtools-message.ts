import { AtomLoadingState } from '../atomic-redux-state/atom-loading-state';
import { SafeRecord } from '../atomic-redux-state/utils';

export interface DevtoolsAtomState {
    value: unknown;
    loadingState: AtomLoadingState;
}

export interface DevtoolsGraphNode {
    dependencies: string[];
    dependants: string[];
    depth: number;
}

export interface DevtoolsState {
    states: SafeRecord<string, DevtoolsAtomState>;
    graph: SafeRecord<string, DevtoolsGraphNode>;
}

export interface DevtoolsMessage {
    type: string;
    payload: DevtoolsState;
}
