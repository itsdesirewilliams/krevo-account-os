/* Minimal localStorage mock for Node. */
const map = new Map<string, string>();

export const localStorage = {
  getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
  setItem: (k: string, v: string) => void map.set(k, String(v)),
  removeItem: (k: string) => void map.delete(k),
  clear: () => void map.clear(),
  key: (i: number) => Array.from(map.keys())[i] ?? null,
  get length() {
    return map.size;
  },
};
