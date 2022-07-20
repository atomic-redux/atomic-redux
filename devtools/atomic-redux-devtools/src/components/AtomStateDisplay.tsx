import { AtomLoadingState } from 'atomic-redux-state/out/atomic-redux-state/atom-loading-state';
import { FC } from 'react';
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
    margin: 5px 10px;
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
}

export const AtomStateDisplay: FC<AtomStateDisplayProps> = ({ atomKey, value, loadingState }) => (
    <Container>
        <div>{atomKey}</div>
        <ObjectTree data={value} open={false} />
        <LoadingIndicator loadingState={loadingState} title={getLoadingText(loadingState)} />
    </Container>
);
