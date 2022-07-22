import { AtomicReduxProvider } from 'atomic-redux-state-react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { store } from './app/store';
import './index.css';
import * as serviceWorker from './serviceWorker';

const root = createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <AtomicReduxProvider store={store}>
      <App />
    </AtomicReduxProvider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
