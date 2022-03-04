import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SafeRecord } from './utils';

export type AtomMiddlewareSliceState = {
    graph: {
        dependencies: SafeRecord<string, string[]>;
        dependants: SafeRecord<string, string[]>;
    }
}

const initialState: AtomMiddlewareSliceState = {
    graph: {
        dependencies: {},
        dependants: {}
    }
};

export const atomMiddlewareSlice = createSlice({
    name: 'atom-middleware',
    initialState,
    reducers: {
        internalAddNodeToGraph: (state, action: PayloadAction<string>) => {
            if (state.graph.dependants[action.payload] === undefined) {
                state.graph.dependants[action.payload] = [];
            }

            if (state.graph.dependencies[action.payload] === undefined) {
                state.graph.dependencies[action.payload] = [];
            }
        },
        internalAddGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            if (fromAtomKey === toAtomKey) {
                return;
            }

            if (state.graph.dependants[fromAtomKey] === undefined) {
                state.graph.dependants[fromAtomKey] = [];
            }

            if (state.graph.dependencies[toAtomKey] === undefined) {
                state.graph.dependencies[toAtomKey] = [];
            }

            if (!state.graph.dependants[fromAtomKey]?.includes(toAtomKey)) {
                state.graph.dependants[fromAtomKey]?.push(toAtomKey);
            }

            if (!state.graph.dependencies[toAtomKey]?.includes(fromAtomKey)) {
                state.graph.dependencies[toAtomKey]?.push(fromAtomKey);
            }
        },
        internalResetGraphNodeDependencies: (state, action: PayloadAction<string>) => {
            state.graph.dependencies[action.payload] = [];
        },
        internalRemoveGraphConnection: (state, action: PayloadAction<{ fromAtomKey: string, toAtomKey: string }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            state.graph.dependants[fromAtomKey] = state.graph.dependants[fromAtomKey]?.filter(d => d !== toAtomKey);
            state.graph.dependencies[toAtomKey] = state.graph.dependencies[toAtomKey]?.filter(d => d !== fromAtomKey);
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
