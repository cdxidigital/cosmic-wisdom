import { describe, expect, it } from "vitest";
import { buildNatalPatternReading } from "./natalPatterns";

const chart = {
  sun: { sign: "Aquarius" }, moon: { sign: "Aries" }, rising: { sign: "Libra" },
  planets: [{ sign: "Aquarius", house: 5 }, { sign: "Aries", house: 5 }, { sign: "Libra", house: 1 }, { sign: "Gemini", house: 5 }],
  aspects: [{ first: "Sun", type: "trine", second: "Moon" }],
};

describe("natal pattern reading", () => {
  it("creates a deterministic private teaching from real natal pattern inputs", () => {
    const first = buildNatalPatternReading(chart, "2026-08-27");
    const second = buildNatalPatternReading(chart, "2026-08-27");
    expect(first).toEqual(second);
    expect(first?.headline).toContain("Aquarius direction");
    expect(first?.dimensions).toHaveLength(4);
    expect(first?.dimensions[1]?.title).toBe("Air emphasis");
    expect(first?.dimensions[2]?.title).toBe("5th house focus");
    expect(first?.teaching.pattern).toContain("not a transit forecast or a prediction");
  });

  it("does not invent a teaching when the essential calculated placements are absent", () => {
    expect(buildNatalPatternReading({ planets: [] }, "2026-08-27")).toBeNull();
  });
});
