import { DevtoolsGraphNode } from 'atomic-redux-state/out/devtools/devtools-message';
import { FC } from 'react';
import styled from 'styled-components';

interface AtomConnectorsProps {
    atomElementRefs: Record<string, HTMLElement | null>;
    graph: Record<string, DevtoolsGraphNode | undefined>;
    hoverState: Record<string, boolean>;
}

interface LineCoordinates {
    toKey: string;
    fromKey: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

const Container = styled.svg`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
`;

const Connector = styled.path<{ highlighted?: boolean }>`
    opacity: ${props => (props.highlighted ? 1 : 0.4)};
`;

const getPathFromCoordinates = (coordinates: LineCoordinates) =>
    `M ${coordinates.x1}, ${coordinates.y1} `
    + `C ${coordinates.x1 + 30}, ${coordinates.y1} `
    + `${coordinates.x2 - 30}, ${coordinates.y2} `
    + `${coordinates.x2}, ${coordinates.y2}`;

export const AtomConnectors: FC<AtomConnectorsProps> = ({ atomElementRefs, graph, hoverState }) => {
    const lines: LineCoordinates[] = [];

    for (const atomKey in graph) {
        const atomElement = atomElementRefs[atomKey];
        if (atomElement !== undefined && atomElement !== null) {
            const x1 = atomElement.offsetLeft + atomElement.offsetWidth;
            const y1 = atomElement.offsetTop + (atomElement.offsetHeight / 2);

            const graphNode = graph[atomKey];
            if (graphNode !== undefined) {
                for (const dependantKey of graphNode.dependants) {
                    const dependantElement = atomElementRefs[dependantKey];
                    if (dependantElement !== undefined && dependantElement !== null) {
                        const x2 = dependantElement.offsetLeft;
                        const y2 = dependantElement.offsetTop + (dependantElement.offsetHeight / 2);

                        lines.push({
                            toKey: dependantKey,
                            fromKey: atomKey,
                            x1,
                            y1,
                            x2,
                            y2
                        });
                    }
                }
            }
        }
    }

    return (
        <Container>
            <g fill="none" stroke="#eeeeee" strokeWidth="2">
                {
                    // eslint-disable-next-line react/no-array-index-key
                    lines.map(line => (
                        <Connector
                            key={getPathFromCoordinates(line)}
                            d={getPathFromCoordinates(line)}
                            highlighted={hoverState[line.fromKey] || hoverState[line.toKey]}
                        />
                    ))
                }
            </g>
        </Container>
    );
};
