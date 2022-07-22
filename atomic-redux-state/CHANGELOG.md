# Change Log - atomic-redux-state

This log was last generated on Fri, 22 Jul 2022 15:32:04 GMT and should not be manually modified.

## 2.3.0
Fri, 22 Jul 2022 15:32:04 GMT

### Minor changes

- Allow batching of atom initialisation

## 2.2.4
Fri, 22 Jul 2022 07:48:12 GMT

### Patches

- Fix graph depth not updating in some circumstances

## 2.2.3
Thu, 21 Jul 2022 21:26:44 GMT

### Patches

- Fix graph depth not updating when edge removed from graph

## 2.2.2
Thu, 21 Jul 2022 13:13:51 GMT

### Patches

- Fix atom depth in graph sometimes calculating incorrectly

## 2.2.1
Wed, 20 Jul 2022 21:49:07 GMT

### Patches

- Performance improvements to atom updates - Approx 4x faster

## 2.2.0
Wed, 20 Jul 2022 17:08:26 GMT

### Minor changes

- Add support for DevTools

## 2.1.0
Fri, 24 Jun 2022 21:43:49 GMT

### Minor changes

- Add toReadonly method to atoms

## 2.0.1
Wed, 22 Jun 2022 16:43:25 GMT

### Patches

- Publish selectAtom as value instead of type

## 2.0.0
Fri, 10 Jun 2022 13:11:52 GMT

### Breaking changes

- Strip internal types from published output

## 1.7.0
Wed, 08 Jun 2022 15:06:50 GMT

### Minor changes

- Add optional preloaded state argument to getAtomMiddleware to set initial state, allowing usage in hydration after server-side rendering.

## 1.6.1
Wed, 08 Jun 2022 14:07:56 GMT

### Patches

- Add jsdoc for atom selector

## 1.6.0
Wed, 08 Jun 2022 10:18:22 GMT

_Initial release_

