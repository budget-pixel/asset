import { describe, expect, it } from "vitest";
import type { Activity } from "@prisma/client";
import { resolveActivity } from "./reporting";

const publicSafety = { id: "a1", function: "Public safety", activity: "Fire" } as Activity;
const transportation = {
  id: "a2",
  function: "Transportation",
  activity: "Transportation",
} as Activity;

describe("resolveActivity", () => {
  it("uses the asset's own override when set", () => {
    const result = resolveActivity({
      activity: publicSafety,
      department: { defaultActivity: transportation },
    });
    expect(result).toBe(publicSafety);
  });

  it("falls back to the department's default when the asset has no override", () => {
    const result = resolveActivity({
      activity: null,
      department: { defaultActivity: transportation },
    });
    expect(result).toBe(transportation);
  });

  it("returns null when neither the asset nor its department has an activity", () => {
    const result = resolveActivity({
      activity: null,
      department: { defaultActivity: null },
    });
    expect(result).toBeNull();
  });
});
