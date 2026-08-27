import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mutation = { isPending: false, mutate: vi.fn() };
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, loading: false }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    auth: { registerWithEmail: { useMutation: () => mutation }, signInWithEmail: { useMutation: () => mutation } },
  },
}));
vi.mock("wouter", async () => {
  const ReactModule = await import("react");
  return { Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => ReactModule.createElement("a", { href, ...props }, children) };
});

import Account from "./Account";

describe("local account entry", () => {
  it("renders the no-session password sign-in form with privacy and password boundaries", () => {
    const page = renderToStaticMarkup(<Account />);
    expect(page).toContain("PRIVATE MEMBER ACCESS");
    expect(page).toContain("Sign in to your private home.");
    expect(page).toContain("type=\"email\"");
    expect(page).toContain("type=\"password\"");
    expect(page).toContain("autoComplete=\"current-password\"");
    expect(page).toContain("salted and hashed");
    expect(page).toContain("CREATE ACCOUNT");
    expect(page).toContain("CONTINUE WITH CONNECTED ACCOUNT");
  });
});
