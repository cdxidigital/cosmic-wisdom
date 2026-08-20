export type JourneyProfile = {
  displayName: string;
  calculationStatus: "pending" | "ready" | "stale" | "failed";
} | null | undefined;

export function getPersonalJourney(profile: JourneyProfile) {
  const hasProfile = Boolean(profile);
  const isCalculated = profile?.calculationStatus === "ready";
  const firstName = profile?.displayName.trim().split(/\s+/)[0] || "there";
  const signalState = isCalculated ? "ready" : hasProfile ? "queued" : "start";

  return { hasProfile, isCalculated, firstName, signalState } as const;
}
