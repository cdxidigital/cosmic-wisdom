import { describe, expect, it } from "vitest";
import { getPersonalJourney } from "./journey";

describe("A–B–C personal journey", () => {
  it("gives a profile-missing visitor the clear starting state", () => {
    expect(getPersonalJourney(null)).toEqual({ hasProfile: false, isCalculated: false, firstName: "there", signalState: "start" });
  });

  it("keeps a saved but uncalculated profile on the queued step", () => {
    expect(getPersonalJourney({ displayName: "James Parker", calculationStatus: "pending" })).toMatchObject({ hasProfile: true, isCalculated: false, firstName: "James", signalState: "queued" });
  });

  it("shows the ready state only after a calculation is ready", () => {
    expect(getPersonalJourney({ displayName: "James Parker", calculationStatus: "ready" })).toMatchObject({ hasProfile: true, isCalculated: true, firstName: "James", signalState: "ready" });
  });
});
