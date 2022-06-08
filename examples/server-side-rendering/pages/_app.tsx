import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { createStore } from '../store/store';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const { store } = createStore(pageProps.initialReduxStoreState, pageProps.initialAtomState)

  return <Provider store={store}>
    <Component {...pageProps} />
  </Provider>
}

export default MyApp
