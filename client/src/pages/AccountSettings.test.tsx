import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mutation = { isPending: false, mutate: vi.fn() };
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ auth: { me: { invalidate: vi.fn() } } }),
    auth: {
      getAccountSettings: { useQuery: () => ({ isLoading: false, data: { name: "Parker", email: "parker@example.com", loginMethod: "email_password", hasPassword: true } }) },
      changePassword: { useMutation: () => mutation },
      deleteAccount: { useMutation: () => mutation },
    },
  },
}));
vi.mock("wouter", async () => {
  const ReactModule = await import("react");
  return { Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => ReactModule.createElement("a", { href, ...props }, children) };
});

import AccountSettings from "./AccountSettings";

describe("account settings", () => {
  it("renders private password controls, explicit destruction confirmation, and reset-delivery status", () => {
    const page = renderToStaticMarkup(<AccountSettings />);
    expect(page).toContain("PRIVATE ACCOUNT SETTINGS");
    expect(page).toContain("CURRENT PASSWORD");
    expect(page).toContain("UPDATE PASSWORD");
    expect(page).toContain("TYPE “DELETE MY ACCOUNT” TO CONFIRM");
    expect(page).toContain("PERMANENTLY DELETE ACCOUNT");
    expect(page).toContain("Password-reset email delivery is not enabled yet.");
    expect(page).not.toContain("passwordHash");
  });
});
