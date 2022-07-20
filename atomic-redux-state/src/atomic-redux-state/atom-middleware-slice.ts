import { createSlice, Draft, PayloadAction } from '@reduxjs/toolkit';
import { SafeRecord } from './utils';

type AtomGraphNode = {
    dependencies: string[];
    dependants: string[];
    depth: number;
};

export type AtomMiddlewareSliceState = {
    graph: SafeRecord<string, AtomGraphNode>;
};

const initialState: AtomMiddlewareSliceState = {
    graph: {}
};

const updateGraphDepthFromAtom = (
    graph: Draft<SafeRecord<string, AtomGraphNode>>,
    atomKey: string,
    depth: number,
    atomStack: string[] = []
) => {
    const atom = graph[atomKey];
    if (atom === undefined || atomStack.includes(atomKey) || atom.depth >= depth) {
        return;
    }

    atom.depth = depth;

    for (const dependencyKey of atom.dependencies) {
        atomStack.push(atomKey);
        updateGraphDepthFromAtom(graph, dependencyKey, depth + 1, atomStack);
        atomStack.pop();
    }
};

/** @internal */
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
                    depth: fromAtomDepth - 1
                };
            }

            updateGraphDepthFromAtom(state.graph, fromAtomKey, fromAtomDepth);

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

/** @internal */
export const {
    internalAddNodeToGraph,
    internalAddGraphConnection,
    internalResetGraphNodeDependencies,
    internalRemoveGraphConnection
} = atomMiddlewareSlice.actions;

export const atomMiddlewareReducer = atomMiddlewareSlice.reducer;
