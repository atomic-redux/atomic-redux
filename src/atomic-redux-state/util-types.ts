export type SafeRecord<T extends string | number | symbol, U> = Record<T, U | undefined>;
