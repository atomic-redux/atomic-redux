import { createSlice, PayloadAction } from '@reduxjs/toolkit';
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

const calculateAtomDepth = (
    atom: AtomGraphNode,
    graph: SafeRecord<string, AtomGraphNode>
): number => {
    let maxDepth = 0;
    for (const dependantKey of atom.dependants) {
        maxDepth = Math.max(maxDepth, graph[dependantKey]?.depth ?? 0);
    }

    return atom.dependants.length > 0
        ? maxDepth + 1
        : 0;
};

const updateGraphDepthFromAtom = (
    graph: SafeRecord<string, AtomGraphNode>,
    atomKey: string,
    atomStack: string[] = []
) => {
    const atom = graph[atomKey];
    if (atom === undefined || atomStack.includes(atomKey)) {
        return;
    }

    const newDepth = calculateAtomDepth(atom, graph);

    if (atom.depth !== newDepth) {
        atom.depth = newDepth;

        for (const dependencyKey of atom.dependencies) {
            atomStack.push(atomKey);
            updateGraphDepthFromAtom(graph, dependencyKey, atomStack);
            atomStack.pop();
        }
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
        }>) => {
            const fromAtomKey = action.payload.fromAtomKey;
            const toAtomKey = action.payload.toAtomKey;

            if (fromAtomKey === toAtomKey) {
                return;
            }

            if (state.graph[fromAtomKey] === undefined) {
                state.graph[fromAtomKey] = {
                    dependants: [],
                    dependencies: [],
                    depth: 1
                };
            }

            if (state.graph[toAtomKey] === undefined) {
                state.graph[toAtomKey] = {
                    dependants: [],
                    dependencies: [],
                    depth: 0
                };
            }

            if (!state.graph[fromAtomKey]?.dependants?.includes(toAtomKey)) {
                state.graph[fromAtomKey]?.dependants?.push(toAtomKey);
            }

            if (!state.graph[toAtomKey]?.dependencies?.includes(fromAtomKey)) {
                state.graph[toAtomKey]?.dependencies?.push(fromAtomKey);
            }

            updateGraphDepthFromAtom(state.graph, fromAtomKey);
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

            updateGraphDepthFromAtom(state.graph, fromAtomKey);
            updateGraphDepthFromAtom(state.graph, toAtomKey);
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
