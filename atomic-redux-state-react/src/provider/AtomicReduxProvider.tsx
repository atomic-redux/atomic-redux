import { FC } from 'react';
import { Provider as ReduxProvider, ProviderProps } from 'react-redux';
import { AtomicReduxContext, AtomicReduxContextValue } from '../context/AtomicReduxContext';

const atomicReduxContextValue: AtomicReduxContextValue = {
    atomsToInitialise: []
};

export const AtomicReduxProvider: FC<ProviderProps> = ({ store, children }) => (
    <AtomicReduxContext.Provider value={atomicReduxContextValue}>
        <ReduxProvider store={store}>
            {children}
        </ReduxProvider>
    </AtomicReduxContext.Provider>
);
