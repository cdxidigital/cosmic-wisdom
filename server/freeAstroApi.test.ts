import { describe, expect, it } from "vitest";

describe("FreeAstroAPI credential", () => {
  it("authenticates a documented natal calculation request", async () => {
    const key = process.env.FREEASTRO_API_KEY;
    expect(key).toBeTruthy();

    const response = await fetch("https://api.freeastroapi.com/api/v1/natal/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key! },
      body: JSON.stringify({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, city: "New York" }),
    });

    expect(response.status, await response.text()).toBeLessThan(400);
  }, 30_000);
});
