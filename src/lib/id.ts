/** Collision-proof id from the platform crypto API. */
export const genId = (): string => globalThis.crypto.randomUUID();
