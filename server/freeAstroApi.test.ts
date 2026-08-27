import { describe, expect, it } from "vitest";

const runLiveCredentialCheck = process.env.RUN_LIVE_NATAL_CREDENTIAL_CHECK === "true";

describe("FreeAstroAPI credential", () => {
  it.runIf(runLiveCredentialCheck)("authenticates a documented natal calculation request", async () => {
    const key = process.env.FREEASTRO_API_KEY;
    expect(key).toBeTruthy();

    const response = await fetch("https://api.freeastroapi.com/api/v1/natal/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key! },
      body: JSON.stringify({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, city: "New York" }),
      signal: AbortSignal.timeout(8_000),
    });

    expect(response.status, await response.text()).toBeLessThan(400);
  }, 10_000);
});
