import { atomicReduxDevtoolsEventType, DevtoolsMessage, DevtoolsState } from 'atomic-redux-state';
import { DevtoolsAtomState } from 'atomic-redux-state/out/devtools/devtools-message';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { AtomConnectors } from '../components/AtomConnectors';
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
    position: relative;
`;

const Column = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-end;
`;

const Header = styled.h3`
    font-size: 16px;
`;

interface AtomStateWithKey extends DevtoolsAtomState {
    atomKey: string;
}

const DevTools: FC<{ state: DevtoolsState }> = ({ state }) => {
    const [atomElementRefs, setAtomElementRefs] = useState<Record<string, HTMLElement>>({});
    const [hoverState, setHoverState] = useState<Record<string, boolean>>({});

    const refUpdateCallback = useCallback((element: HTMLElement | null, atomKey: string) => {
        if (element === null) {
            return;
        }

        setAtomElementRefs(refs => ({ ...refs, [atomKey]: element }));
    }, [setAtomElementRefs]);

    const onHoverStateChange = useCallback((atomKey: string, newState: boolean) => {
        setHoverState(refs => ({ ...refs, [atomKey]: newState }));
    }, [setHoverState]);

    const atomsByDepth = useMemo(() => {
        const output: Record<number, AtomStateWithKey[]> = {};
        for (const atomKey in state.states) {
            const atomState = state.states[atomKey];
            const graphNode = state.graph[atomKey];

            if (atomState !== undefined && graphNode !== undefined) {
                if (output[graphNode.depth] === undefined) {
                    output[graphNode.depth] = [];
                }

                output[graphNode.depth].push({
                    atomKey,
                    ...atomState
                });
            }
        }
        return output;
    }, [state.graph, state.states]);

    const atomValueDisplay = useMemo(() =>
        Object.keys(atomsByDepth)
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
                            ref={el => refUpdateCallback(el, atomState.atomKey)}
                            onHoverStateChange={onHoverStateChange}
                            onExpandChange={() => setAtomElementRefs(x => ({ ...x }))}
                        />
                    ))}
                </Column>
            )), [atomsByDepth, refUpdateCallback, onHoverStateChange]);

    return (
        <Container>
            <Header>Atomic Redux DevTools</Header>
            <Graph>
                {atomValueDisplay}
                <AtomConnectors atomElementRefs={atomElementRefs} graph={state.graph} hoverState={hoverState} />
            </Graph>
        </Container>
    );
};

export const AtomicReduxDevtools = () => {
    const [atomsState, setAtomsState] = useState<DevtoolsState>({
        states: {},
        graph: {}
    });

    useEffect(() => {
        const handleWindowMessage = (evt: MessageEvent<DevtoolsMessage>) => {
            if (!evt.data || evt.data.type === undefined || evt.data.type !== atomicReduxDevtoolsEventType) {
                return;
            }

            setAtomsState(evt.data.payload);
        };

        window.addEventListener('message', handleWindowMessage);
        return () => {
            window.removeEventListener('message', handleWindowMessage);
        };
    }, []);

    return <DevTools state={atomsState} />;
};
