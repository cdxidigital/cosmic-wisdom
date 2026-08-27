import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { buildDateCompatibilityLens, signFromBirthDate, type ZodiacSign } from "@/lib/compatibilityLens";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, HeartHandshake, Info, LockKeyhole, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function sunSignFromChart(chartData: unknown): ZodiacSign | null {
  const planets = asRecord(chartData)?.planets;
  if (!Array.isArray(planets)) return null;
  const sun = planets.map(asRecord).find((planet) => planet?.name === "Sun");
  const sign = sun?.sign;
  return typeof sign === "string" && (["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"] as const).includes(sign as ZodiacSign)
    ? (sign as ZodiacSign)
    : null;
}

export default function Compatibility() {
  const { isAuthenticated } = useAuth();
  const profileQuery = trpc.cosmic.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const natalQuery = trpc.cosmic.getNatalChart.useQuery(undefined, { enabled: isAuthenticated && Boolean(profileQuery.data) });
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [consent, setConsent] = useState(false);
  const [shown, setShown] = useState(false);
  const companionSunSign = useMemo(() => signFromBirthDate(birthDate), [birthDate]);
  const memberSunSign = useMemo(() => sunSignFromChart(natalQuery.data?.chartData) ?? signFromBirthDate(profileQuery.data?.birthDate ?? ""), [natalQuery.data?.chartData, profileQuery.data?.birthDate]);
  const lens = useMemo(() => (memberSunSign && companionSunSign ? buildDateCompatibilityLens({ memberSunSign, companionSunSign }) : null), [memberSunSign, companionSunSign]);
  const displayName = name.trim() || "this person";
  const isCheckingProfile = isAuthenticated && (profileQuery.isLoading || natalQuery.isLoading);
  const missingMemberProfile = isAuthenticated && !isCheckingProfile && (!profileQuery.data || !memberSunSign);
  const blocked = !isAuthenticated || isCheckingProfile || missingMemberProfile;

  const open = () => {
    if (!isAuthenticated) {
      toast("Sign in to use Compatibility", { description: "Your own profile stays private inside your member account." });
      startLogin();
      return;
    }
    if (isCheckingProfile) return;
    if (missingMemberProfile) {
      toast("Create your profile first", { description: "Compatibility begins with your own private natal profile." });
      return;
    }
    if (!consent || !lens) return;
    setShown(true);
  };

  const accessMessage = !isAuthenticated
    ? "Sign in and create your natal profile before opening a compatibility lens."
    : isCheckingProfile
      ? "Checking your private natal profile…"
      : missingMemberProfile
        ? "Create your own natal profile before opening a compatibility lens."
        : null;

  return (
    <main className="min-h-screen bg-[#F3F0E9] text-[#102936]">
      <header className="border-b border-[#102936]/10 bg-[#F3F0E9]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/" className="flex items-center gap-3 font-mono text-[10px] tracking-[.14em]"><ArrowLeft size={14} /> COSMIC WISDOM</Link>
          <span className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">COMPATIBILITY / PRIVATE LENS</span>
        </div>
      </header>
      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[.9fr_1.1fr] lg:py-16">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[.16em] text-[#B63C5E]">05 / COMPATIBILITY</p>
          <h1 className="mt-5 font-serif text-6xl leading-[.84] tracking-[-.065em]">Connection, with room for both people.</h1>
          <p className="mt-6 font-sans text-[16px] leading-7 text-[#55707d]">Use this as a reflective starting point for communication, emotional rhythm, care, and friction—not a relationship score or prediction.</p>
          <div className="mt-8 flex gap-3 border border-[#102936]/10 bg-white/60 p-4">
            <LockKeyhole className="shrink-0 text-[#B63C5E]" size={16} />
            <p className="font-sans text-[12px] leading-5 text-[#55707d]">The other person’s name, birthday, and optional location stay only in this active browser page. They are not added to a profile, reading history, or file record.</p>
          </div>
        </div>
        <div className="border border-[#102936]/15 bg-white/60 p-6 md:p-8">
          <p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#B63C5E]">START A PRIVATE LENS</p>
          {accessMessage && <div className="mt-5 border-l-2 border-[#B63C5E] bg-[#F3F0E9] p-4"><p className="font-sans text-[13px] leading-6">{accessMessage}</p></div>}
          <label className="mt-6 block font-mono text-[9px] tracking-[.14em] text-[#55707d]">THEIR NAME<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Optional" disabled={blocked} className="mt-2 w-full border border-[#102936]/15 bg-[#F3F0E9] px-4 py-3 font-sans text-sm text-[#102936] outline-none focus:border-[#B63C5E] disabled:opacity-50" /></label>
          <label className="mt-5 block font-mono text-[9px] tracking-[.14em] text-[#55707d]">THEIR BIRTH DATE<input value={birthDate} onChange={(event) => setBirthDate(event.target.value)} type="date" disabled={blocked} className="mt-2 w-full border border-[#102936]/15 bg-[#F3F0E9] px-4 py-3 font-sans text-sm text-[#102936] outline-none focus:border-[#B63C5E] disabled:opacity-50" /></label>
          <label className="mt-5 block font-mono text-[9px] tracking-[.14em] text-[#55707d]">THEIR BIRTH LOCATION <span className="normal-case tracking-normal">(optional)</span><input value={birthLocation} onChange={(event) => setBirthLocation(event.target.value)} placeholder="Optional" disabled={blocked} className="mt-2 w-full border border-[#102936]/15 bg-[#F3F0E9] px-4 py-3 font-sans text-sm text-[#102936] outline-none focus:border-[#B63C5E] disabled:opacity-50" /><span className="mt-2 block font-sans text-[11px] normal-case leading-5 tracking-normal text-[#55707d]">Location is held only in this page and does not affect a date-only reflection.</span></label>
          <label className="mt-5 flex gap-3 border border-[#102936]/10 bg-[#F3F0E9] p-4"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} disabled={blocked} className="mt-1 accent-[#B63C5E]" /><span className="font-sans text-[12px] leading-5">I have permission to use these details for a private reflection. I understand they will remain only in this active browser page.</span></label>
          <Button onClick={open} disabled={blocked || !consent || !lens} className="mt-6 h-12 w-full rounded-none bg-[#211B2A] font-mono text-[9px] tracking-[.15em] text-white hover:bg-[#B63C5E]">OPEN DATE-BASED LENS <Sparkles className="ml-2" size={14} /></Button>
          {shown && lens && companionSunSign && memberSunSign && <article className="mt-8 border-t border-[#102936]/10 pt-7">
            <p className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">YOU / {memberSunSign.toUpperCase()} + {displayName.toUpperCase()} / {companionSunSign.toUpperCase()}</p>
            <h2 className="mt-3 font-serif text-4xl leading-[.92]">{lens.title}</h2>
            <p className="mt-4 max-w-2xl font-sans text-[14px] leading-6 text-[#55707d]">{lens.introduction}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{lens.cards.map((card) => <div key={card.label} className="border border-[#102936]/10 bg-[#F3F0E9] p-4"><p className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">{card.label}</p><p className="mt-3 font-sans text-[13px] leading-6 text-[#55707d]">{card.copy}</p></div>)}</div>
            <div className="mt-6 flex gap-3 border-l-2 border-[#B63C5E] bg-[#F3F0E9] p-4"><Info className="mt-0.5 shrink-0 text-[#B63C5E]" size={17} /><div><p className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">WHAT THIS DOES NOT CLAIM</p><p className="mt-2 font-sans text-[12px] leading-5 text-[#55707d]">{lens.limitation}</p>{birthLocation.trim() && <p className="mt-2 font-sans text-[12px] leading-5 text-[#55707d]">{birthLocation.trim()} is noted only in this page for a potential future time-aware lens; it does not change this result.</p>}</div></div>
            <div className="mt-6 flex items-start gap-3 border-l-2 border-[#B63C5E] pl-4"><HeartHandshake className="mt-0.5 text-[#B63C5E]" size={17} /><p className="font-serif text-xl leading-tight">One useful question: “{lens.question}”</p></div>
          </article>}
        </div>
      </section>
    </main>
  );
}
