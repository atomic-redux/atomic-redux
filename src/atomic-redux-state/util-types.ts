export type SafeRecord<T extends string | number | symbol, U> = Record<T, U | undefined>;

export function isPromise(value: any): value is Promise<unknown> {
    return typeof value.then === 'function';
}
