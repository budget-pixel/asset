import { describe, expect, it } from "vitest";
import { computeNextAdditionTag } from "./asset-tags";

describe("computeNextAdditionTag", () => {
  it("starts at -01 when there are no existing additions", () => {
    expect(computeNextAdditionTag("9071", [])).toBe("9071-01");
  });

  it("continues the sequence from the highest existing number", () => {
    expect(computeNextAdditionTag("9071", ["9071-01", "9071-02"])).toBe("9071-03");
  });

  it("ignores tags that don't match the parent's prefix", () => {
    expect(computeNextAdditionTag("9071", ["9072-01", "9071-01"])).toBe("9071-02");
  });

  it("handles out-of-order and non-contiguous sequences by taking the max", () => {
    expect(computeNextAdditionTag("9071", ["9071-02", "9071-01", "9071-05"])).toBe("9071-06");
  });

  it("rolls past two digits without truncating", () => {
    expect(computeNextAdditionTag("9071", ["9071-99"])).toBe("9071-100");
  });
});
