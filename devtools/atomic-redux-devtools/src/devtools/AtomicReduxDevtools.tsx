import { atomicReduxDevtoolsEventType, DevtoolsMessage, DevtoolsState } from 'atomic-redux-state';
import { useCallback, useEffect, useState } from 'react';

export function AtomicReduxDevtools() {
    const [atomsState, setAtomsState] = useState<DevtoolsState>({
        states: {},
        graph: {}
    });

    const handleWindowMessage = useCallback((evt: MessageEvent<DevtoolsMessage>) => {
        if (evt.data && evt.data.type === atomicReduxDevtoolsEventType) {
            console.log(evt.data);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('message', handleWindowMessage);
        return () => {
            window.removeEventListener('message', handleWindowMessage);
        };
    }, [handleWindowMessage]);

    return <div />;
}
