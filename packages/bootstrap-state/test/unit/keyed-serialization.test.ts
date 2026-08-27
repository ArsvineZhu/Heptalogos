import { describe, expect, it } from "vitest";
import { KeyedAsyncSerializer } from "../../src/keyed-serialization.js";

describe("KeyedAsyncSerializer", () => {
  it("serializes operations per key while allowing different keys to proceed", async () => {
    const serializer = new KeyedAsyncSerializer();
    const events: string[] = [];
    let release: (() => void) | undefined;
    const first = serializer.run("same", async () => {
      events.push("first-start");
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      events.push("first-end");
      return "first";
    });
    const second = serializer.run("same", async () => {
      events.push("second");
      return "second";
    });
    const other = serializer.run("other", async () => {
      events.push("other");
      return "other";
    });

    await other;
    expect(events).toEqual(["first-start", "other"]);
    release?.();
    await expect(first).resolves.toBe("first");
    await expect(second).resolves.toBe("second");
    expect(events).toEqual(["first-start", "other", "first-end", "second"]);
  });

  it("continues a key after a rejected operation", async () => {
    const serializer = new KeyedAsyncSerializer();
    await expect(
      serializer.run("key", async () => {
        throw new Error("expected");
      }),
    ).rejects.toThrow("expected");
    await expect(serializer.run("key", async () => "recovered")).resolves.toBe(
      "recovered",
    );
  });
});
