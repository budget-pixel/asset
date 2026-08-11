import { describe, expect, it } from "vitest";
import { meetsCapitalizationThreshold } from "./capitalization";

describe("meetsCapitalizationThreshold", () => {
  it("always passes when the category has no threshold", () => {
    expect(meetsCapitalizationThreshold(1, null)).toBe(true);
    expect(meetsCapitalizationThreshold(0, null)).toBe(true);
  });

  it("passes when cost is at or above the threshold", () => {
    expect(meetsCapitalizationThreshold(5000, 5000)).toBe(true);
    expect(meetsCapitalizationThreshold(5000.01, 5000)).toBe(true);
  });

  it("fails when cost is below the threshold", () => {
    expect(meetsCapitalizationThreshold(4999.99, 5000)).toBe(false);
  });
});
