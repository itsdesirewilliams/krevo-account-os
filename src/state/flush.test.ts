import { describe, expect, it, vi } from "vitest";
import { flushAll, registerFlushHandler } from "./flush";

describe("flush registry", () => {
  it("awaits every registered handler", async () => {
    const order: string[] = [];
    const a = registerFlushHandler(async () => {
      order.push("a");
    });
    const b = registerFlushHandler(() => {
      order.push("b");
    });

    await flushAll();
    expect(order.sort()).toEqual(["a", "b"]);

    a();
    b();
  });

  it("stops calling unregistered handlers", async () => {
    const handler = vi.fn();
    const unregister = registerFlushHandler(handler);
    unregister();
    await flushAll();
    expect(handler).not.toHaveBeenCalled();
  });
});
