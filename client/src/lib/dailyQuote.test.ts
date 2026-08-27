import { describe, expect, it } from "vitest";
import { getDailyQuote, localDayKey } from "./dailyQuote";

describe("daily homepage quote", () => {
  it("uses a stable local calendar key for the same day", () => {
    const morning = new Date(2026, 7, 27, 7, 5);
    const evening = new Date(2026, 7, 27, 22, 40);
    expect(localDayKey(morning)).toBe("2026-08-27");
    expect(getDailyQuote(morning)).toEqual(getDailyQuote(evening));
  });

  it("returns a bounded authored field note without an external request", () => {
    const quote = getDailyQuote(new Date(2026, 7, 28));
    expect(quote.key).toBe("2026-08-28");
    expect(quote.text.length).toBeGreaterThan(20);
    expect(quote.theme).toContain("/");
  });

  it("advances to a different quote on consecutive local calendar dates", () => {
    const today = getDailyQuote(new Date(2026, 7, 27));
    const tomorrow = getDailyQuote(new Date(2026, 7, 28));
    expect(today.key).not.toBe(tomorrow.key);
    expect(today.text).not.toBe(tomorrow.text);
  });
});
