export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;
export type Delete<T, U> = Pick<T, Exclude<keyof T, U>>;
