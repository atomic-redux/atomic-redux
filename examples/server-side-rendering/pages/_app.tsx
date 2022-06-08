import type { AppProps } from 'next/app';
import { Provider } from 'react-redux';
import { createStore } from '../store/store';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return <Provider store={createStore(pageProps.initialReduxStoreState)}>
    <Component {...pageProps} />
  </Provider>
}

export default MyApp
