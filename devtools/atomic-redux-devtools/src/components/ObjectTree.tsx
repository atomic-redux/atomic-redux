import { FC, useState } from 'react';
import styled from 'styled-components';

interface ObjectTreeProps {
    data: any,
    open?: boolean,
    name?: string
}

const ToggleButton = styled.div<{ open: boolean }>`
    position: absolute;
    top: 5px;
    right: 7px;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 5px solid gray;
    cursor: pointer;

    transform: ${props => (props.open ? 'rotate(90deg)' : 'rotate(180deg)')};
`;

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    position: relative;
    padding: 0 5px;
    min-width: 50px;
    color: #9c9c9c;
    font-style: italic;
`;

const BorderContainer = styled(Container)`
    border: 1px solid grey;
    margin: 2px 0;
`;

export const ObjectTree: FC<ObjectTreeProps> = ({ data, open = true, name }) => {
    const [isOpen, setIsOpen] = useState(open);
    const isArray = Array.isArray(data);

    if (typeof data !== 'object') {
        return <Container>{name ? `${name}: ${data}` : data}</Container>;
    }

    return (
        <BorderContainer>
            <ToggleButton open={isOpen} onClick={() => setIsOpen(!isOpen)} />
            <span>{isArray ? '[' : '{'}</span>

            <span>{!isOpen && '...'}</span>
            {isOpen && Object.keys(data).map(key =>
                <ObjectTree key={key} data={data[key]} name={key} open={false} />)}

            <span>{isArray ? ']' : '}'}</span>
        </BorderContainer>
    );
};
