import { configureStore } from '@reduxjs/toolkit';
import {
    atomMiddlewareReducer, internalAddGraphConnection, internalAddNodeToGraph, internalRemoveGraphConnection
} from './atom-middleware-slice';

describe('AtomMiddlewareSlice', () => {
    it('should set graph dependencies correctly when atoms added', () => {
        const store = configureStore({
            reducer: atomMiddlewareReducer
        });

        store.dispatch(internalAddNodeToGraph('a'));
        store.dispatch(internalAddNodeToGraph('b'));
        store.dispatch(internalAddNodeToGraph('c'));
        store.dispatch(internalAddNodeToGraph('d'));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'a',
            toAtomKey: 'b'
        }));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'b',
            toAtomKey: 'c'
        }));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'b',
            toAtomKey: 'd'
        }));

        const graph = store.getState().graph;

        expect(graph.a?.dependencies).toEqual([]);
        expect(graph.b?.dependencies).toEqual(['a']);
        expect(graph.c?.dependencies).toEqual(['b']);
        expect(graph.d?.dependencies).toEqual(['b']);

        expect(graph.a?.dependants).toEqual(['b']);
        expect(graph.b?.dependants).toEqual(['c', 'd']);
        expect(graph.c?.dependants).toEqual([]);
        expect(graph.d?.dependants).toEqual([]);
    });

    it('should set graph depth correctly when atoms added', () => {
        const store = configureStore({
            reducer: atomMiddlewareReducer
        });

        store.dispatch(internalAddNodeToGraph('a'));
        store.dispatch(internalAddNodeToGraph('b'));
        store.dispatch(internalAddNodeToGraph('c'));
        store.dispatch(internalAddNodeToGraph('d'));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'a',
            toAtomKey: 'b'
        }));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'b',
            toAtomKey: 'c'
        }));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'b',
            toAtomKey: 'd'
        }));

        const graph = store.getState().graph;

        expect(graph.a?.depth).toEqual(2);
        expect(graph.b?.depth).toEqual(1);
        expect(graph.c?.depth).toEqual(0);
        expect(graph.d?.depth).toEqual(0);
    });

    it('should update graph depth when graph edge removed', () => {
        const store = configureStore({
            reducer: atomMiddlewareReducer
        });

        store.dispatch(internalAddNodeToGraph('a'));
        store.dispatch(internalAddNodeToGraph('b'));
        store.dispatch(internalAddNodeToGraph('c'));
        store.dispatch(internalAddNodeToGraph('d'));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'a',
            toAtomKey: 'c'
        }));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'b',
            toAtomKey: 'c'
        }));

        store.dispatch(internalAddGraphConnection({
            fromAtomKey: 'c',
            toAtomKey: 'd'
        }));

        store.dispatch(internalRemoveGraphConnection({
            fromAtomKey: 'c',
            toAtomKey: 'd'
        }));

        const graph = store.getState().graph;

        expect(graph.a?.depth).toEqual(1);
        expect(graph.b?.depth).toEqual(1);
        expect(graph.c?.depth).toEqual(0);
        expect(graph.d?.depth).toEqual(0);
    });
});
