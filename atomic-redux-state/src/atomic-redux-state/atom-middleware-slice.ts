import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AtomLoadingState } from './atom-loading-state';
import { SafeRecord } from './utils';

type AtomGraphNode = {
    dependencies: string[];
    dependants: string[];
    depth: number;
}

export type AtomMiddlewareSliceState = {
    graph: SafeRecord<string, AtomGraphNode>;
    pendingAtomUpdates: SafeRecord<number, string[]>; // key: atom depth, value: atom keys
    stagedChanges: SafeRecord<string, unknown>;
    stagedLoadingStates: SafeRecord<string, AtomLoadingState>;
}

const initialState: AtomMiddlewareSliceState = {
    graph: {},
    pendingAtomUpdates: {},
    stagedChanges: {},
    stagedLoadingStates: {}
};

export const atomMiddlewareSlice = createSlice({
    name: 'atom-middleware',
    initialState,
    reducers: {
        internalAddNodeToGraph: (state, action: PayloadAction<string>) => {
            if (state.graph[action.payload] === undefined) {
                state.graph[action.payload] = {
                    dependants: [],
                    dependencies: [],
                    depth: 0
                };
            }
        },
        internalAddGraphConnection: (state, action: PayloadAction<{
            fromAtomKey: string,
            toAtomKey: string,
            fromAtomDepth: number
        }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;
            const fromAtomDepth = action.payload.fromAtomDepth;

            if (fromAtomKey === toAtomKey) {
                return;
            }

            if (state.graph[fromAtomKey] === undefined) {
                state.graph[fromAtomKey] = {
                    dependants: [],
                    dependencies: [],
                    depth: fromAtomDepth
                };
            }

            if (state.graph[toAtomKey] === undefined) {
                state.graph[toAtomKey] = {
                    dependants: [],
                    dependencies: [],
                    depth: 0
                };
            }

            if (state.graph[fromAtomKey]!.depth < fromAtomDepth) {
                state.graph[fromAtomKey]!.depth = fromAtomDepth;
            }

            if (!state.graph[fromAtomKey]?.dependants?.includes(toAtomKey)) {
                state.graph[fromAtomKey]?.dependants?.push(toAtomKey);
            }

            if (!state.graph[toAtomKey]?.dependencies?.includes(fromAtomKey)) {
                state.graph[toAtomKey]?.dependencies?.push(fromAtomKey);
            }
        },
        internalResetGraphNodeDependencies: (state, action: PayloadAction<string>) => {
            const node = state.graph[action.payload];
            if (node !== undefined) {
                node.dependencies = [];
            }
        },
        internalRemoveGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            const fromNode = state.graph[fromAtomKey];
            const toNode = state.graph[toAtomKey];

            if (fromNode !== undefined) {
                fromNode.dependants = fromNode.dependants.filter(d => d !== toAtomKey);
            }

            if (toNode !== undefined) {
                toNode.dependants = toNode.dependants.filter(d => d !== fromAtomKey);
            }
        },
        internalMarkAtomPendingUpdate: (state, action: PayloadAction<string>) => {
            const node = state.graph[action.payload];
            if (node === undefined) {
                return;
            }

            if (state.pendingAtomUpdates[node.depth] === undefined) {
                state.pendingAtomUpdates[node.depth] = [];
            }

            if (!state.pendingAtomUpdates[node.depth]?.includes(action.payload)) {
                state.pendingAtomUpdates[node.depth]?.push(action.payload);
            }
        },
        internalClearPendingAtomUpdates: state => {
            state.pendingAtomUpdates = {};
        },
        internalStageValue: (state, action: PayloadAction<{ atomKey: string, value: unknown }>) => {
            state.stagedChanges[action.payload.atomKey] = action.payload.value;
        },
        internalStageLoadingState: (state, action: PayloadAction<{
            atomKey: string, loadingState: AtomLoadingState
        }>) => {
            state.stagedLoadingStates[action.payload.atomKey] = action.payload.loadingState;
        },
        internalClearStagedChanges: state => {
            state.stagedChanges = {};
            state.stagedLoadingStates = {};
        }
    }
});

export const {
    internalAddNodeToGraph,
    internalAddGraphConnection,
    internalResetGraphNodeDependencies,
    internalRemoveGraphConnection,
    internalMarkAtomPendingUpdate,
    internalClearPendingAtomUpdates,
    internalStageValue,
    internalStageLoadingState,
    internalClearStagedChanges
} = atomMiddlewareSlice.actions;

export const atomMiddlewareReducer = atomMiddlewareSlice.reducer;
