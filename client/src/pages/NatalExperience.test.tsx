import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { authenticated: false, chartData: undefined as Record<string, unknown> | undefined, loading: false };

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: state.authenticated }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    cosmic: {
      getNatalChart: { useQuery: () => ({ data: state.chartData ? { chartData: state.chartData } : null, isLoading: state.loading }) },
    },
  },
}));
vi.mock("wouter", async () => {
  const ReactModule = await import("react");
  return { Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => ReactModule.createElement("a", { href, ...props }, children) };
});

import DailyRitual from "@/components/DailyRitual";
import NatalDetails from "./NatalDetails";

const calculatedChart = {
  sun: { sign: "Aquarius" }, moon: { sign: "Aries" }, rising: { sign: "Libra" },
  planets: [{ sign: "Aquarius", house: 5 }, { sign: "Aries", house: 5 }, { sign: "Libra", house: 1 }],
  houses: Array(12).fill({}), aspects: [{ first: "Sun", type: "trine", second: "Moon" }],
};

describe("private natal teaching surfaces", () => {
  beforeEach(() => { state.authenticated = false; state.chartData = undefined; state.loading = false; });

  it("keeps teaching and natal details behind the member gate", () => {
    expect(renderToStaticMarkup(<DailyRitual />)).toContain("Your daily teaching is private.");
    const details = renderToStaticMarkup(<NatalDetails />);
    expect(details).toContain("Your chart details");
    expect(details).toContain("are private.");
    expect(details).toContain('href="/account"');
  });

  it("gives authenticated members with no chart a clear next step without inventing a teaching", () => {
    state.authenticated = true;
    const daily = renderToStaticMarkup(<DailyRitual />);
    const details = renderToStaticMarkup(<NatalDetails />);
    expect(daily).toContain("Start with your natal chart.");
    expect(daily).not.toContain("TODAY’S PATTERN TEACHING");
    expect(details).toContain("No calculated chart yet.");
  });

  it("renders a calculated-chart pattern and daily teaching without raw birth data", () => {
    state.authenticated = true;
    state.chartData = calculatedChart;
    const daily = renderToStaticMarkup(<DailyRitual />);
    const details = renderToStaticMarkup(<NatalDetails />);
    expect(daily).toContain("TODAY’S PATTERN TEACHING");
    expect(daily).toContain("not a transit forecast or a prediction");
    expect(details).toContain("YOUR IN-DEPTH PATTERN");
    expect(details).toContain("Aquarius direction, Aries needs, Libra expression.");
    expect(`${daily}${details}`).not.toContain("1991-06-10");
    expect(`${daily}${details}`).not.toContain("12:34");
    expect(`${daily}${details}`).not.toContain("Yanchep");
  });
});
