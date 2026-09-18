/* Test-only helpers for narrowing array/optional access under
 * `noUncheckedIndexedAccess`, without non-null assertions. */

/** Return the first element, failing loudly when the array is empty. */
export function first<T>(items: readonly T[]): T {
  const value = items[0];
  if (value === undefined) throw new Error("Expected a non-empty array");
  return value;
}

/** Return a value, failing loudly when it is null or undefined. */
export function present<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("Expected a present value");
  return value;
}
