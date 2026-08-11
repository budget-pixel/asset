import { describe, expect, it } from "vitest";
import { toTitleCase } from "./text";

describe("toTitleCase", () => {
  it("title-cases plain all-caps words", () => {
    expect(toTitleCase("TAX COLLECTOR OFFICE")).toBe("Tax Collector Office");
  });

  it("preserves known acronyms", () => {
    expect(toTitleCase("GIS DEPARTMENT")).toBe("GIS Department");
    expect(toTitleCase("COURTHOUSE NW/SWA")).toBe("Courthouse NW/SWA");
    expect(toTitleCase("CNC MILLING MACHINE")).toBe("CNC Milling Machine");
  });

  it("leaves digits and punctuation untouched", () => {
    expect(toTitleCase("12' UTILITY TRAILER")).toBe("12' Utility Trailer");
    expect(toTitleCase("148 RAILRD AVENUE - 3.044 ACRES")).toBe("148 Railrd Avenue - 3.044 Acres");
  });

  it("is a no-op on names that are already properly cased", () => {
    expect(toTitleCase("Facilities")).toBe("Facilities");
    expect(toTitleCase("20 Ton Hydraulic Press")).toBe("20 Ton Hydraulic Press");
  });

  it("never lowercases a word that already has a lowercase letter, even mid-word", () => {
    // Guards against regressing already-correct data such as a parenthetical
    // that happens to contain a small word — "(In Progress)" must not become
    // "(in Progress)" just because "in" looks like a connecting word.
    expect(toTitleCase("Warehouse Expansion (In Progress)")).toBe(
      "Warehouse Expansion (In Progress)"
    );
    expect(toTitleCase("2003 International 5600 6x6 Lime Truck")).toBe(
      "2003 International 5600 6x6 Lime Truck"
    );
  });

  it("handles acronyms glued directly to digits", () => {
    expect(toTitleCase("16TA UTILITY TRAILER")).toBe("16TA Utility Trailer");
  });
});
