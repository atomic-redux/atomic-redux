export type SafeRecord<T extends string | number | symbol, U> = Record<T, U | undefined>;

export function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}

export const checkForDependencyLoop = (atomStack: string[]): void => {
    if ((new Set(atomStack)).size === atomStack.length) {
        return;
    }

    const formattedStack = atomStack.join(' -> ');

    // eslint-disable-next-line no-console
    throw new Error(`Atom dependency loop detected: ${formattedStack}`);
};
