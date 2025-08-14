/**
 * Utility type: If C is true, T is required; otherwise, T or undefined.
 */
export type OptRequired<C, T> = C extends true ? T : T | undefined;

/**
 * Utility type: T or Promise<T>.
 */
export type OptPromise<T> = T | Promise<T>;
