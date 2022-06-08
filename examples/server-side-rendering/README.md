This is a [Next.js](https://nextjs.org/) project demonstrating using `atomic-redux-state` with SSR.

## Running

Run a development server:

```bash
rush dev --only server-side-rendering --verbose
```

Run a production build (Allows styling to be server-side rendered):

```bash
cd examples/server-side-rendering
pnpm start
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Basic Overview

Server side rendering with atomic-redux is achieved in a very similar way to standard Redux.

When initialising the atom middleware, an optional parameter is available for setting the initial state. This is used on the client side to syncronise the atom state with SSR state.

```ts
// store.ts
export const createStore = (preloadedState?: StoreState, atomState?: AtomMiddlewareSliceState) => {
    const atomMiddleware = getAtomMiddleware(atomState);
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: [
            atomMiddleware
        ]
    });

    return { store, atomMiddleware }
}
```

On the server side, the page requests the data it needs to render and dispatches the `setAtom` action to update atom values needed for the initial page render. The Redux and atom state are returned with the serverSideProps so the client-side can hydrate.

```ts
// index.tsx
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { store, atomMiddleware } = createStore();

  const posts = await fetch('https://jsonplaceholder.typicode.com/posts')
    .then(response => response.json()) as PostModel[];
  
  store.dispatch(setAtom(postsAtom, posts))

  return {
    props: {
      initialReduxStoreState: store.getState(),
      initialAtomState: atomMiddleware.getState()
    }
  }
}
```

These page props are used to set the initial store state for the client side:

```ts
function MyApp({ Component, pageProps }: AppProps) {
  const { store } = createStore(pageProps.initialReduxStoreState, pageProps.initialAtomState)

  return <Provider store={store}>
    <Component {...pageProps} />
  </Provider>
}
```