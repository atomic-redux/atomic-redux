import { AtomicReduxProvider } from 'atomic-redux-state-react';
import type { AppProps } from 'next/app';
import { createStore } from '../store/store';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const { store } = createStore(pageProps.initialReduxStoreState, pageProps.initialAtomState)

  return <AtomicReduxProvider store={store}>
    <Component {...pageProps} />
  </AtomicReduxProvider>
}

export default MyApp
