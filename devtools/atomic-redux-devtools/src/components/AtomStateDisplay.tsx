import { AtomLoadingState } from 'atomic-redux-state/out/atomic-redux-state/atom-loading-state';
import { forwardRef } from 'react';
import styled from 'styled-components';
import { ObjectTree } from './ObjectTree';

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    border: 1px solid grey;
    border-radius: 5px;
    padding: 5px;
    padding-right: 20px;
    width: fit-content;
    margin: 5px 20px;
    background-color: #002c64;
`;

const LoadingIndicator = styled.div<{ loadingState: AtomLoadingState }>`
    position: absolute;
    top: 7px;
    right: 5px;
    width: 8px;
    height: 8px;
    border-radius: 100%;
    border: 1px solid black;
    background-color: ${props => {
        switch (props.loadingState) {
            case AtomLoadingState.Loading:
                return '#ff0000';
            case AtomLoadingState.Updating:
                return '#ffbb00';
            default:
                return '#00ff00';
        }
    }};
`;

const getLoadingText = (loadingState: AtomLoadingState) => {
    switch (loadingState) {
        case AtomLoadingState.Loading:
            return 'Loading';
        case AtomLoadingState.Updating:
            return 'Updating';
        default:
            return 'Idle';
    }
};

interface AtomStateDisplayProps {
    atomKey: string,
    value: any;
    loadingState: AtomLoadingState
    onHoverStateChange?: (atomKey: string, hoverState: boolean) => void;
    onExpandChange?: (atomKey: string) => void;
}

export const AtomStateDisplay = forwardRef<HTMLDivElement, AtomStateDisplayProps>(
    ({ atomKey, value, loadingState, onHoverStateChange, onExpandChange }, ref) => (
        <Container
            ref={ref}
            onMouseEnter={() => onHoverStateChange?.(atomKey, true)}
            onMouseLeave={() => onHoverStateChange?.(atomKey, false)}
        >
            <div>{atomKey}</div>
            <ObjectTree data={value} open={false} onExpandChange={() => onExpandChange?.(atomKey)} />
            <LoadingIndicator loadingState={loadingState} title={getLoadingText(loadingState)} />
        </Container>
    )
);
