import { atomicReduxDevtoolsEventType, DevtoolsMessage, DevtoolsState } from 'atomic-redux-state';
import { DevtoolsAtomState } from 'atomic-redux-state/out/devtools/devtools-message';
import { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { AtomStateDisplay } from '../components/AtomStateDisplay';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    font-size: 12px;
    background-color: #020061;
    color: white;
`;

const Graph = styled.div`
    display: flex;
    overflow: auto;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
`;

const Header = styled.h3`
    font-size: 16px;
`;

interface AtomStateWithKey extends DevtoolsAtomState {
    atomKey: string;
}

const renderDevtools = (state: DevtoolsState) => {
    const atomsByDepth: Record<number, AtomStateWithKey[]> = {};
    for (const atomKey in state.states) {
        const atomState = state.states[atomKey];
        const graphNode = state.graph[atomKey];

        if (atomState !== undefined && graphNode !== undefined) {
            if (atomsByDepth[graphNode.depth] === undefined) {
                atomsByDepth[graphNode.depth] = [];
            }

            atomsByDepth[graphNode.depth].push({
                atomKey,
                ...atomState
            });
        }
    }

    return (
        <Container>
            <Header>Atomic Redux DevTools</Header>
            <Graph>
                {Object.keys(atomsByDepth)
                    .map(depth => Number(depth))
                    .sort((a, b) => b - a)
                    .map(depth => (
                        <Column key={depth}>
                            {atomsByDepth[depth].map(atomState => (
                                <AtomStateDisplay
                                    key={atomState.atomKey}
                                    atomKey={atomState.atomKey}
                                    value={atomState.value}
                                    loadingState={atomState.loadingState}
                                />
                            ))}
                        </Column>
                    ))}
            </Graph>
        </Container>
    );
};

export const AtomicReduxDevtools = () => {
    const [atomsState, setAtomsState] = useState<DevtoolsState>({
        states: {},
        graph: {}
    });

    const handleWindowMessage = useCallback((evt: MessageEvent<DevtoolsMessage>) => {
        if (!evt.data || evt.data.type === undefined || evt.data.type !== atomicReduxDevtoolsEventType) {
            return;
        }

        setAtomsState(evt.data.payload);
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleWindowMessage);
        return () => {
            window.removeEventListener('message', handleWindowMessage);
        };
    }, [handleWindowMessage]);

    return renderDevtools(atomsState);
};
