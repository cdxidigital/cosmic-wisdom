import { buildDateCompatibilityLens, signFromBirthDate } from "./compatibilityLens";
import { describe, expect, it } from "vitest";

describe("date-based compatibility lens", () => {
  it("derives Gemini from Steven’s consented 10 June 1991 date", () => {
    expect(signFromBirthDate("1991-06-10")).toBe("Gemini");
  });

  it("returns the Aquarius–Gemini reflection without a score or prediction", () => {
    const lens = buildDateCompatibilityLens({ memberSunSign: "Aquarius", companionSunSign: "Gemini" });

    expect(lens.title).toContain("Aquarius + Gemini");
    expect(lens.cards).toHaveLength(4);
    expect(lens.introduction).toContain("date-based");
    expect(lens.introduction.toLowerCase()).not.toContain("score");
  });

  it("keeps timing-dependent chart claims explicitly out of scope", () => {
    const lens = buildDateCompatibilityLens({ memberSunSign: "Aquarius", companionSunSign: "Gemini" });

    expect(lens.limitation).toContain("Moon");
    expect(lens.limitation).toContain("Rising sign");
    expect(lens.limitation).toContain("houses");
    expect(lens.limitation).toContain("birth time is unknown");
  });
});
