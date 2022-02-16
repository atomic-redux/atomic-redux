# Atomic Redux State

An application state management solution built on top of Redux, inspired by [Recoil](https://recoiljs.org/).

### Why?

Recoil has a great developer-friendly API for managing application state, especially derived state or dynamic data. However, it can only be used within a React context, which may not be suitable for all applications. For example, a system that integrates some React components into an existing website cannot (easily) get the data stored in Recoil atoms.

**Only use this if you need to access the state outside of a React context - If your project only uses React just use [Recoil](https://recoiljs.org/).**

### Building

Build using `yarn build`

### Testing

Test using `yarn test`