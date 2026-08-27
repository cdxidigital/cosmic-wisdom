import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Mail, UserRound } from "lucide-react";
import React, { FormEvent, useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

type Mode = "sign-in" | "register";

export default function Account() {
  const [mode, setMode] = useState<Mode>("sign-in");
  const { isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const register = trpc.auth.registerWithEmail.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast("Your account is ready", { description: "You can now create your private mystic home." });
      window.location.href = "/";
    },
    onError: error => toast("We couldn’t create your account", { description: error.message }),
  });
  const signIn = trpc.auth.signInWithEmail.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast("Welcome back", { description: "Your private mystic home is ready." });
      window.location.href = "/";
    },
    onError: error => toast("We couldn’t sign you in", { description: error.message }),
  });

  useEffect(() => { if (isAuthenticated) window.location.href = "/"; }, [isAuthenticated]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    if (mode === "register") register.mutate({ displayName: String(form.get("name") ?? ""), email, password });
    else signIn.mutate({ email, password });
  };
  const pending = register.isPending || signIn.isPending;

  return (
    <main className="min-h-screen bg-[#F3F0E9] text-[#102936]">
      <header className="border-b border-[#102936]/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3 font-mono text-[10px] tracking-[.14em]"><ArrowLeft size={14} /> COSMIC WISDOM</Link>
          <span className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">PRIVATE MEMBER ACCESS</span>
        </div>
      </header>
      <section className="mx-auto grid max-w-5xl gap-10 px-5 py-12 md:grid-cols-[.85fr_1.15fr] md:py-20">
        <div>
          <p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#B63C5E]">YOUR DIGITAL MYSTIC HOME</p>
          <h1 className="mt-5 font-serif text-6xl leading-[.84] tracking-[-.065em]">Keep your<br /><em className="font-light text-[#B63C5E]">cosmic work</em><br />private.</h1>
          <p className="mt-6 max-w-sm font-sans text-[15px] leading-7 text-[#55707d]">Use your email and a strong password to create a private account. Your birth details, chart, and saved readings remain associated only with your member session.</p>
          <div className="mt-8 space-y-4 border-l-2 border-[#EF5D3F] pl-5 font-sans text-[13px] leading-6 text-[#55707d]">
            <p className="flex gap-3"><LockKeyhole className="mt-1 shrink-0 text-[#B63C5E]" size={15} />Passwords are salted and hashed before storage; Cosmic never stores plaintext passwords.</p>
            <p className="flex gap-3"><KeyRound className="mt-1 shrink-0 text-[#B63C5E]" size={15} />Choose at least 12 characters with upper- and lowercase letters plus a number.</p>
          </div>
        </div>
        <section className="border border-[#102936]/15 bg-white/60 p-6 shadow-[-8px_9px_0_#EF5D3F] md:p-9" aria-live="polite">
          <div className="flex border-b border-[#102936]/10">
            <button onClick={() => setMode("sign-in")} className={`flex-1 border-b-2 pb-4 font-mono text-[10px] font-semibold tracking-[.14em] ${mode === "sign-in" ? "border-[#EF5D3F] text-[#102936]" : "border-transparent text-[#55707d]"}`}>SIGN IN</button>
            <button onClick={() => setMode("register")} className={`flex-1 border-b-2 pb-4 font-mono text-[10px] font-semibold tracking-[.14em] ${mode === "register" ? "border-[#EF5D3F] text-[#102936]" : "border-transparent text-[#55707d]"}`}>CREATE ACCOUNT</button>
          </div>
          <div className="mt-8">
            <p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#B63C5E]">{mode === "register" ? "FIRST, YOUR ACCESS" : "WELCOME BACK"}</p>
            <h2 className="mt-4 font-serif text-4xl leading-[.92]">{mode === "register" ? "Create your private account." : "Sign in to your private home."}</h2>
            <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
              {mode === "register" && <label className="block"><span className="font-mono text-[9px] tracking-[.14em] text-[#55707d]">YOUR NAME</span><span className="relative mt-2 block"><UserRound className="absolute left-0 top-3 text-[#B63C5E]" size={16} /><input required name="name" autoComplete="name" maxLength={120} className="h-11 w-full border-b border-[#102936]/20 bg-transparent pl-7 font-sans outline-none focus:border-[#EF5D3F]" /></span></label>}
              <label className="block"><span className="font-mono text-[9px] tracking-[.14em] text-[#55707d]">EMAIL ADDRESS</span><span className="relative mt-2 block"><Mail className="absolute left-0 top-3 text-[#B63C5E]" size={16} /><input required name="email" type="email" autoComplete="email" maxLength={320} className="h-11 w-full border-b border-[#102936]/20 bg-transparent pl-7 font-sans outline-none focus:border-[#EF5D3F]" /></span></label>
              <label className="block"><span className="font-mono text-[9px] tracking-[.14em] text-[#55707d]">PASSWORD</span><span className="relative mt-2 block"><KeyRound className="absolute left-0 top-3 text-[#B63C5E]" size={16} /><input required name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} minLength={mode === "register" ? 12 : 1} maxLength={128} className="h-11 w-full border-b border-[#102936]/20 bg-transparent pl-7 font-sans outline-none focus:border-[#EF5D3F]" /></span>{mode === "register" && <span className="mt-2 block font-sans text-[11px] leading-5 text-[#55707d]">12–128 characters, including uppercase, lowercase, and a number.</span>}</label>
              <button disabled={pending || loading} type="submit" className="mt-2 flex h-12 w-full items-center justify-center gap-2 bg-[#211B2A] font-mono text-[10px] font-semibold tracking-[.14em] text-white transition-colors hover:bg-[#EF5D3F] disabled:cursor-wait disabled:opacity-70">{pending ? "PLEASE WAIT…" : mode === "register" ? "CREATE PRIVATE ACCOUNT" : "SIGN IN"}<ArrowRight size={15} /></button>
            </form>
            <div className="my-7 flex items-center gap-3 text-[#55707d]"><span className="h-px flex-1 bg-[#102936]/10" /><span className="font-mono text-[8px] tracking-[.14em]">OR</span><span className="h-px flex-1 bg-[#102936]/10" /></div>
            <button onClick={startLogin} className="flex w-full items-center justify-center gap-2 border border-[#102936]/20 py-3 font-mono text-[9px] font-semibold tracking-[.14em] transition-colors hover:border-[#EF5D3F] hover:text-[#B63C5E]">CONTINUE WITH CONNECTED ACCOUNT <ArrowRight size={14} /></button>
            <p className="mt-5 font-sans text-[11px] leading-5 text-[#55707d]">Email confirmation and password recovery are not enabled in this beta. Keep your password in a secure password manager.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
