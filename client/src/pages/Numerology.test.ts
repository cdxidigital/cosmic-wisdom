import { describe, expect, it } from "vitest";
import { calculateLifePath, calculatePersonalYear, reduceNumber } from "./Numerology";

describe("Numerology calculations", () => {
  it("preserves master numbers while reducing ordinary values", () => {
    expect(reduceNumber(29)).toBe(11);
    expect(reduceNumber(22)).toBe(22);
    expect(reduceNumber(36)).toBe(9);
  });

  it("derives a Life Path from every digit of the saved birth date", () => {
    expect(calculateLifePath("1985-05-17")).toBe(9);
  });

  it("derives a personal year from the saved month, day, and current calendar year", () => {
    const expected = reduceNumber(5 + 17 + String(new Date().getFullYear()).split("").reduce((total, digit) => total + Number(digit), 0));
    expect(calculatePersonalYear("1985-05-17")).toBe(expected);
    expect(calculatePersonalYear("not-a-date")).toBeNull();
  });
});
