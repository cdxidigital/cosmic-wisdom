import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, KeyRound, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function AccountSettings() {
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const settings = trpc.auth.getAccountSettings.useQuery(undefined, { enabled: isAuthenticated });
  const changePassword = trpc.auth.changePassword.useMutation({
    onSuccess: () => { setCurrentPassword(""); setNewPassword(""); toast("Password updated", { description: "Your new password is ready for your next sign-in." }); },
    onError: error => toast("We couldn’t update your password", { description: error.message }),
  });
  const deleteAccount = trpc.auth.deleteAccount.useMutation({
    onSuccess: async () => { await utils.auth.me.invalidate(); toast("Account deleted", { description: "Your private records and access have been removed." }); window.location.href = "/account"; },
    onError: error => toast("We couldn’t delete your account", { description: error.message }),
  });

  useEffect(() => { if (!loading && !isAuthenticated) window.location.href = "/account"; }, [isAuthenticated, loading]);
  const account = settings.data;
  const savePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    changePassword.mutate({ currentPassword: account?.hasPassword ? currentPassword : undefined, newPassword });
  };
  const removeAccount = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (confirmation !== "DELETE MY ACCOUNT") return;
    deleteAccount.mutate({ confirmation: "DELETE MY ACCOUNT", currentPassword: account?.hasPassword ? deletePassword : undefined });
  };

  if (loading || !isAuthenticated || settings.isLoading) return <main className="flex min-h-screen items-center justify-center bg-[#F3F0E9] text-[#102936]"><p className="font-mono text-[10px] tracking-[.14em]">OPENING PRIVATE SETTINGS…</p></main>;
  if (!account) return <main className="flex min-h-screen items-center justify-center bg-[#F3F0E9] text-[#102936]"><p className="font-sans text-sm">Your private settings are temporarily unavailable. Please try again.</p></main>;

  return <main className="min-h-screen bg-[#F3F0E9] text-[#102936]">
    <header className="border-b border-[#102936]/10"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-3 font-mono text-[10px] tracking-[.14em]"><ArrowLeft size={14} /> COSMIC WISDOM</Link><span className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">PRIVATE ACCOUNT SETTINGS</span></div></header>
    <section className="mx-auto max-w-5xl px-5 py-12 md:py-20"><div className="max-w-2xl"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#B63C5E]">YOUR PRIVATE ACCOUNT</p><h1 className="mt-5 font-serif text-5xl leading-[.88] tracking-[-.06em] md:text-6xl">Your access.<br /><em className="font-light text-[#B63C5E]">Your control.</em></h1><p className="mt-6 max-w-xl font-sans text-[15px] leading-7 text-[#55707d]">Manage how you access your private mystic home. Sensitive changes require your current password when one is set.</p></div>
      <div className="mt-12 grid gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <aside className="border border-[#102936]/15 bg-white/45 p-6"><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#B63C5E]">ACCOUNT</p><h2 className="mt-4 font-serif text-3xl">{account.name}</h2><dl className="mt-7 space-y-4 border-t border-[#102936]/10 pt-5 font-sans text-[13px]"><div><dt className="font-mono text-[8px] tracking-[.13em] text-[#55707d]">EMAIL</dt><dd className="mt-1 break-all">{account.email ?? "Not available"}</dd></div><div><dt className="font-mono text-[8px] tracking-[.13em] text-[#55707d]">ACCESS METHOD</dt><dd className="mt-1 capitalize">{account.loginMethod.replaceAll("_", " ")}</dd></div></dl><div className="mt-7 border-l-2 border-[#EF5D3F] pl-4 font-sans text-[12px] leading-5 text-[#55707d]"><ShieldCheck className="mb-2 text-[#B63C5E]" size={16} />Your profile, readings, files, and natal chart remain private to this member account.</div></aside>
        <div className="space-y-5"><section className="border border-[#102936]/15 bg-white/60 p-6 md:p-8"><div className="flex items-start gap-4"><span className="mt-1 text-[#B63C5E]"><KeyRound size={20} /></span><div><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#B63C5E]">PASSWORD</p><h2 className="mt-3 font-serif text-3xl">{account.hasPassword ? "Change your password." : "Set a local password."}</h2><p className="mt-3 font-sans text-[13px] leading-6 text-[#55707d]">{account.hasPassword ? "Confirm your current password, then choose a new one." : "Your connected sign-in remains available. Adding a password also lets you sign in directly with this email."}</p></div></div><form className="mt-7 space-y-5" onSubmit={savePassword}>{account.hasPassword && <label className="block"><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">CURRENT PASSWORD</span><input required name="currentPassword" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} type="password" autoComplete="current-password" className="mt-2 h-11 w-full border-b border-[#102936]/20 bg-transparent font-sans outline-none focus:border-[#EF5D3F]" /></label>}<label className="block"><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">NEW PASSWORD</span><input required name="newPassword" value={newPassword} onChange={event => setNewPassword(event.target.value)} type="password" autoComplete="new-password" minLength={12} maxLength={128} className="mt-2 h-11 w-full border-b border-[#102936]/20 bg-transparent font-sans outline-none focus:border-[#EF5D3F]" /><span className="mt-2 block font-sans text-[11px] leading-5 text-[#55707d]">12–128 characters, including uppercase, lowercase, and a number.</span></label><Button type="submit" disabled={changePassword.isPending} className="h-11 rounded-none bg-[#211B2A] font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#EF5D3F]">{changePassword.isPending ? "UPDATING…" : account.hasPassword ? "UPDATE PASSWORD" : "SET LOCAL PASSWORD"}</Button></form><p className="mt-5 flex gap-2 border-t border-[#102936]/10 pt-4 font-sans text-[11px] leading-5 text-[#55707d]"><LockKeyhole className="mt-0.5 shrink-0 text-[#B63C5E]" size={14} />Password-reset email delivery is not enabled yet. Keep your password in a secure password manager.</p></section>
          <section className="border border-[#B63C5E]/35 bg-[#FFECE7] p-6 md:p-8"><div className="flex items-start gap-4"><span className="mt-1 text-[#B63C5E]"><AlertTriangle size={20} /></span><div><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#B63C5E]">DANGER ZONE</p><h2 className="mt-3 font-serif text-3xl">Delete your account.</h2><p className="mt-3 font-sans text-[13px] leading-6 text-[#55707d]">This permanently removes your private profile, natal chart, readings, file references, and account access. It cannot be undone.</p></div></div><form className="mt-7 space-y-5" onSubmit={removeAccount}>{account.hasPassword && <label className="block"><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">CURRENT PASSWORD</span><input required name="deletePassword" value={deletePassword} onChange={event => setDeletePassword(event.target.value)} type="password" autoComplete="current-password" className="mt-2 h-11 w-full border-b border-[#B63C5E]/35 bg-transparent font-sans outline-none focus:border-[#B63C5E]" /></label>}<label className="block"><span className="font-mono text-[9px] tracking-[.13em] text-[#55707d]">TYPE “DELETE MY ACCOUNT” TO CONFIRM</span><input required name="confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" className="mt-2 h-11 w-full border-b border-[#B63C5E]/35 bg-transparent font-sans outline-none focus:border-[#B63C5E]" /></label><Button type="submit" disabled={confirmation !== "DELETE MY ACCOUNT" || deleteAccount.isPending} className="h-11 rounded-none bg-[#B63C5E] font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#211B2A]"><Trash2 className="mr-2" size={14} />{deleteAccount.isPending ? "DELETING…" : "PERMANENTLY DELETE ACCOUNT"}</Button></form></section>
        </div>
      </div>
    </section>
  </main>;
}
