import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SafeRecord } from './utils';

type AtomGraphNode = {
    dependencies: string[];
    dependants: string[];
}

export type AtomMiddlewareSliceState = {
    graph: SafeRecord<string, AtomGraphNode>;
}

const initialState: AtomMiddlewareSliceState = {
    graph: {}
};

export const atomMiddlewareSlice = createSlice({
    name: 'atom-middleware',
    initialState,
    reducers: {
        internalAddNodeToGraph: (state, action: PayloadAction<string>) => {
            if (state.graph[action.payload] === undefined) {
                state.graph[action.payload] = {
                    dependants: [],
                    dependencies: []
                };
            }
        },
        internalAddGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            if (fromAtomKey === toAtomKey) {
                return;
            }

            if (state.graph[fromAtomKey] === undefined) {
                state.graph[fromAtomKey] = {
                    dependants: [],
                    dependencies: []
                };
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
        }
    }
});

export const {
    internalAddNodeToGraph,
    internalAddGraphConnection,
    internalResetGraphNodeDependencies,
    internalRemoveGraphConnection
} = atomMiddlewareSlice.actions;

export const atomMiddlewareReducer = atomMiddlewareSlice.reducer;
