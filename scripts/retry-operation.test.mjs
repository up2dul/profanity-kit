import { describe, expect, it, vi } from "vitest";

import { retryOperation } from "./retry-operation.mjs";

describe("retryOperation", () => {
  it("retries a temporary failure and returns the first successful result", async () => {
    const wait = vi.fn();
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error("not published yet"))
      .mockRejectedValueOnce(new Error("CDN still stale"))
      .mockResolvedValue("available");

    await expect(
      retryOperation(operation, { attempts: 4, intervalMs: 5_000, wait })
    ).resolves.toBe("available");
    expect(operation).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
    expect(wait).toHaveBeenCalledWith(5_000);
  });

  it("throws the final error after exhausting attempts", async () => {
    const wait = vi.fn();
    const finalError = new Error("still unavailable");
    const operation = vi.fn().mockRejectedValue(finalError);

    await expect(
      retryOperation(operation, { attempts: 3, intervalMs: 1, wait })
    ).rejects.toBe(finalError);
    expect(operation).toHaveBeenCalledTimes(3);
    expect(wait).toHaveBeenCalledTimes(2);
  });
});
