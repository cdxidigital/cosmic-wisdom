import { describe, expect, it } from "vitest";
import { normaliseNatalResponse } from "./natalAstrology";

describe("natal response normalisation", () => {
  it("retains calculated Sun, Moon, Rising, houses, and major aspects for the reading layer", () => {
    const calculation = normaliseNatalResponse({
      planets: [
        { name: "Sun", sign: "Taurus", pos: 24.5, house: 9, retrograde: false },
        { name: "Moon", sign: "Cancer", pos: 3.25, house: 11, retrograde: false },
        { name: "Mars", sign: "Gemini", pos: 8.75, house: 10, retrograde: false },
      ],
      angles_details: { asc: { name: "Ascendant", sign: "Leo", pos: 12.5, house: 1 } },
      houses: [{ house: 1, sign: "Leo", pos: 12.5 }],
      aspects: [{ p1: "Sun", p2: "Moon", type: "sextile", orb: 1.2, is_major: true, is_applying: true }],
      confidence: { overall: "high" },
    });

    expect(calculation.chartData).toMatchObject({
      sun: { sign: "Taurus", formatted: "Taurus 24°30′" },
      moon: { sign: "Cancer" },
      rising: { sign: "Leo" },
      aspects: [{ first: "Sun", second: "Moon", type: "sextile" }],
    });
    expect(calculation.readingData.title).toContain("Taurus Sun");
    expect(calculation.sourceData.provider).toBe("FreeAstroAPI");
  });

  it("requires the essential natal placements rather than inventing a reading", () => {
    expect(() => normaliseNatalResponse({ planets: [] })).toThrow("Sun");
  });
});
