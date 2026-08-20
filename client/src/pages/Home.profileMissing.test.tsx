import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mutation = { isPending: false, mutate: vi.fn() };

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ cosmic: { getMyProfile: { setData: vi.fn(), invalidate: vi.fn() }, getNatalChart: { setData: vi.fn(), invalidate: vi.fn() }, listFiles: { invalidate: vi.fn() } } }),
    cosmic: {
      getMyProfile: { useQuery: () => ({ data: null }) },
      getNatalChart: { useQuery: () => ({ data: null }) },
      listFiles: { useQuery: () => ({ data: [] }) },
      saveProfile: { useMutation: () => mutation },
      uploadProfileAsset: { useMutation: () => mutation },
      uploadTextReport: { useMutation: () => mutation },
      getFileDownloadUrl: { useMutation: () => mutation },
      calculateNatalChart: { useMutation: () => mutation },
    },
  },
}));
vi.mock("wouter", async () => {
  const ReactModule = await import("react");
  return {
    Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => ReactModule.createElement("a", { href, ...props }, children),
  };
});

import Home from "./Home";

describe("Home profile-missing journey", () => {
  it("renders the real A–B–C start state without personal data", () => {
    const page = renderToStaticMarkup(<Home />);

    expect(page).toContain("One profile.");
    expect(page).toContain("Four ways in.");
    expect(page).toContain("CREATE MY PROFILE");
    expect(page).toContain("Natal Chart");
    expect(page).toContain("Numerology");
    expect(page).toContain("Tarot");
    expect(page).toContain("Palmistry");
    expect(page).not.toContain("Welcome back,");
  });
});
