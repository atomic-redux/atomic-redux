# Atomic Redux State

An application state management solution built on top of Redux, inspired by [Recoil](https://recoiljs.org/).

### Why?

`atomic-redux-state` uses a simple API for managing global application state, aiming to reduce the boilerplate code prevalent in regular Redux. This API is clearer to read, and makes managing derived state easier.

Internally, it automtically builds a [directed acyclic graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) of dependencies, to prevent unneccesary re-execution of selectors, without requiring manual memoisation like Redux selectors do.

Recoil, the library that inspired this package, has an excellent developer-friendly API for managing application state, especially derived state or dynamic data. However, it can only be used within a React context, which may not be suitable for all applications. For example, a system that integrates some React components into an existing website cannot (easily) get the data stored in Recoil atoms.

This library also allows interaction with atoms within Redux middleware, for example in [Redux Sagas](https://redux-saga.js.org/).

### Installation

First, set up a Redux store and provider, as described in the [Redux Toolkit getting started guide](https://redux-toolkit.js.org/tutorials/quick-start).

Install the core and React libraries using `yarn add atomic-redux-state atomic-redux-state-react`.
If not using with React, `atomic-redux-state-react` can be omitted.

You must then add the atom middleware and reducer to your Redux store.
```typescript
import { atomsReducer, getAtomMiddleware } from 'atomic-redux-state';
import { combineReducers, configureStore } from '@reduxjs/toolkit';

const store = configureStore({
    reducer: combineReducers({
        atoms: atomsReducer
        // Other reducers
    }),
    middleware: [
        // Other middleware
        getAtomMiddleware()
    ]
});
```

### Usage
Most principles from Recoil apply to `atomic-redux-state`.

#### Atom
An atom is the simplest type of state in `atomic-redux-state`. An atom holds a unit of state, and can be shared by multiple components. Any updates to an atom are syncronised across all components that use it.

An atom can hold simple primitive types, or any serialisable object (e.g. no functions).

A default initial value must be provided for an atom.

The example below demonstrates creating a simple atom used by two components, with the value and changes to it being syncronised between them.
```ts
import { atom } from 'atomic-redux-state';

const myAtom = atom({
    key: 'my-atom',
    default: 0
});
```
```tsx
import { useAtomicState } from 'atomic-redux-state-react';
import { myAtom } from './atoms';

export const MyComponent = () => {
    const [value, setValue] = useAtomicState(myAtom);

    return
        <div>
            <button onClick={() => setValue(value => value - 1)}>Decrement</button>
            <span>{value}</span>
            <button onClick={() => setValue(value => value + 1)}>Increment</button>
        </div>
};
```
```tsx
import { useAtomicState } from 'atomic-redux-state-react';
import { myAtom } from './atoms';

export const MyOtherComponent = () => {
    const [value, setValue] = useAtomicState(myAtom);

    return
        <div>
            <button onClick={() => setValue(value => value - 10)}>Add</button>
            <span>{value}</span>
            <button onClick={() => setValue(value => value + 10)}>Subtract</button>
        </div>
};
```

#### Derived atom
Atom state can also be derived from other atoms. The derived state will change whenever the state it depends on is updated. This creates a data-flow graph for your application state.

Note that in Recoil, this concept is called a `selector`. However, to avoid conflicting with the Redux concept of selectors, `atomic-redux-state` refers to these as "derived atoms", created using the `derivedAtom` function.

The below example shows the creation of a derived atom that will always have a value that is double the value of `myAtom`.
```ts
import { atom, derivedAtom } from 'atomic-redux-state';

const myAtom = atom({
    key: 'my-atom',
    default: 0
});

const multipliedValueAtom = derivedAtom({
    key: 'multiplied-value',
    get: ({ get }) => {
        const originalValue = get(myAtom);
        return originalValue * 2;
    }
});
```
By default derived atoms are readonly, so should be read using `useAtomicValue()`
```tsx
const value = useAtomicValue(multipliedValueAtom);
```
Derived atoms can also specify a `set` method, which makes the derived atom writable and allows it to update the atoms it depends upon.
```ts
const multipliedValueAtom = derivedAtom<number>({
    key: 'multiplied-value',
    get: ({ get }) => {
        return get(myAtom) * 2;
    },
    set: ({ set }, value) => {
        set(myAtom, value / 2);
    }
});
```

Once a derived atom specifies a `set` method, it becomes writable and can now be consumed like a regular atom.
```tsx
const [value, setValue] = useAtomicState(multipliedValueAtom);
```

#### Async `get`
The `get` method on a derived atom can also be async
```ts
const userDataAtom = derivedAtom<UserData>({
    key: 'user-data',
    get: async () => {
        return await Api.getUserData();
    }
});
```
Async atoms and atoms that depend on them will return `LoadingAtom` until a value is returned by the promise, allowing the component consuming it to display a placeholder until there is data.
```tsx
export const UserDataDisplay = () => {
    const userData = useAtomicValue(userDataAtom); // typeof userData = UserData | LoadingAtom

    return
        <div>
            {userData instanceof LoadingAtom
                ? <span>Loading...</span>
                : <span>Hello {userData.firstName} {userData.lastName}!</span>
            }
        </div>
}
```

#### Async atom updates
If an atom that an async atom depends on updates, and the async atom already has a value, it maintains that value until the promise resolves. Once an async atom promise resolves, it's value does ***not*** go back to `LoadingAtom` when it re-updates.

Instead, check if an atom is updating from its current value using `useIsAtomUpdating(atom)`
```ts
const selectedUserIdAtom = atom({
    key: 'selected-user-id',
    default: 1
})

const userDataAtom = derivedAtom<UserData>({
    key: 'user-data',
    get: async ({ get }) => {
        const selectedUserId = get(selectedUserIdAtom);
        return await Api.getUserData(selectedUserId);
    }
});
```
```tsx
export const UserDataDisplay = () => {
    const userData = useAtomicValue(userDataAtom); // typeof userData = UserData | LoadingAtom
    const isUpdating = useIsAtomUpdating(userDataAtom);

    return
        <div>
            {userData instanceof LoadingAtom || isUpdating
                ? <span>Loading...</span>
                : <span>Hello {userData.firstName} {userData.lastName}!</span>
            }
        </div>
}
```

#### Accessing atom values outside React context - `getAtomValueFromStore`
The `initialiseAtomFromStore(store, atom)` method initialises and returns an atom value from outside of the React context by providing the Redux store containing the atoms.
This is the prefered way to get an atom value outside of a React context.

```ts
import { getAtomValueFromStore } from 'atomic-redux-state';

const atomValue = initialiseAtomFromStore(store, myAtom);
```

Alternatively, use `getAtomValueFromState(state, atom)` to perform a read-only get on atom values in state. Avoid using this instead of `initialiseAtomFromStore`, as this will not set the atom value in the Redux state if it has not yet been initialised, so the atom `get` method result is not cached.

#### Setting atom values outside React context - `setAtom`
The `setAtom(atom, value)` action creator allows you to set atom values outside of the React context, or in a Redux middleware such as [Sagas](https://redux-saga.js.org/).

Dispatch the action created by `setAtom` to update the atom value.
```ts
import { setAtom } from 'atomic-redux-state';

store.dispatch(setAtom(myAtom, 10));

// getAtomValueFromStore(store, myAtom) now returns 10
```


### Building

Build using `yarn build`

### Testing

Test using `yarn test`