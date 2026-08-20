/**
 * Cosmic Wisdom home: a deliberately plain-language member journey.
 * A = add the moment, B = see three useful signals, C = take one grounded action.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { getPersonalJourney } from "@/lib/journey";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  Clock3,
  FileText,
  FileUp,
  Menu,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import React, { ChangeEvent, FormEvent, useMemo, useState } from "react";

const pathSteps = [
  {
    letter: "A",
    title: "Add your moment",
    short: "Your birth date, time, and place give Cosmic the context it needs.",
  },
  {
    letter: "B",
    title: "See what matters",
    short: "Three clear signals replace a page of hard-to-read symbols.",
  },
  {
    letter: "C",
    title: "Choose one next move",
    short: "Every reading ends with a useful action you can take today.",
  },
];

function PathLabel({ children, accent = false }: { children: string; accent?: boolean }) {
  return <span className={`inline-flex items-center gap-2 border px-3 py-1.5 font-mono text-[9px] font-semibold tracking-[.14em] ${accent ? "border-[#EF5D3F]/40 bg-[#EF5D3F]/10 text-[#EF5D3F]" : "border-[#102936]/15 bg-white/45 text-[#55707d]"}`}><span className={`h-1.5 w-1.5 rounded-full ${accent ? "bg-[#EF5D3F]" : "bg-[#89a9b9]"}`} />{children}</span>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const myProfile = trpc.cosmic.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const files = trpc.cosmic.listFiles.useQuery(undefined, { enabled: isAuthenticated && profileOpen });
  const profile = myProfile.data;
  const { hasProfile, isCalculated, firstName } = getPersonalJourney(profile);
  const storedFileCount = files.data?.length ?? 0;
  const latestFile = files.data?.[0] ?? null;

  const coreSignals = useMemo(() => [
    {
      number: "01",
      title: "Your rhythm",
      simple: isCalculated ? "Your calculated timing signal is ready." : hasProfile ? "Your timing signal is queued for calculation." : "Add your details to reveal your natural pace.",
      source: "Birth date + current timing",
    },
    {
      number: "02",
      title: "Your decision style",
      simple: isCalculated ? "Your decision-making cue is ready to use." : hasProfile ? "Your decision cue will appear with your first calculation." : "Learn the easiest way for you to make clear choices.",
      source: "Birth time + personal pattern",
    },
    {
      number: "03",
      title: "Your focus today",
      simple: isCalculated ? "Your current focus signal is ready." : hasProfile ? "Your daily focus will appear as soon as the calculation layer is connected." : "Turn a complex chart into one simple focus for today.",
      source: "Today’s cycle + active transits",
    },
  ], [hasProfile, isCalculated]);

  const openProfile = () => {
    setMenuOpen(false);
    setProfileOpen(true);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const saveProfile = trpc.cosmic.saveProfile.useMutation({
    onSuccess: savedProfile => {
      utils.cosmic.getMyProfile.setData(undefined, savedProfile);
      utils.cosmic.listFiles.invalidate();
      setProfileOpen(false);
      toast("Your personal field is ready", { description: "Cosmic has stored your details privately. Your signal cards are ready for calculation." });
    },
    onError: error => toast("We couldn’t save your details", { description: error.message }),
  });

  const uploadProfileAsset = trpc.cosmic.uploadProfileAsset.useMutation({
    onSuccess: () => {
      utils.cosmic.listFiles.invalidate();
      toast("Private file added", { description: "Your attachment is stored in your protected Cosmic file space." });
    },
    onError: error => toast("We couldn’t attach that file", { description: error.message }),
  });

  const savePatternBriefReport = trpc.cosmic.uploadTextReport.useMutation({
    onSuccess: () => {
      utils.cosmic.listFiles.invalidate();
      toast("Reading saved privately", { description: "A text copy of this simple daily prompt is now in your protected file space." });
    },
    onError: error => toast("We couldn’t save that reading", { description: error.message }),
  });
  const openPrivateFile = trpc.cosmic.getFileDownloadUrl.useMutation({
    onSuccess: ({ url, originalFilename }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      toast("Opening protected file", { description: `${originalFilename} is being opened through your private member session.` });
    },
    onError: error => toast("We couldn’t open that private file", { description: error.message }),
  });

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast("Sign in to keep your personal field", { description: "Your birth details are only saved inside your private member account." });
      startLogin();
      return;
    }
    const formData = new FormData(event.currentTarget);
    saveProfile.mutate({
      displayName: String(formData.get("fullName") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      birthTime: String(formData.get("birthTime") ?? "") || null,
      birthLocation: String(formData.get("birthLocation") ?? ""),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    });
  };

  const handleProfileAssetUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isAuthenticated) {
      toast("Sign in to attach a file", { description: "Cosmic keeps supporting files inside your private member account." });
      startLogin();
      return;
    }
    if (!profile) {
      toast("Save step A first", { description: "Once your personal field is saved, you can attach a chart scan or supporting file." });
      return;
    }
    if (file.size > 7_500_000) {
      toast("That file is too large", { description: "Choose a PNG, JPG, WEBP, or PDF below 7.5 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const contentBase64 = typeof reader.result === "string" ? reader.result.split(",")[1] : null;
      if (!contentBase64) {
        toast("We couldn’t read that file", { description: "Please try a different PNG, JPG, WEBP, or PDF." });
        return;
      }
      uploadProfileAsset.mutate({
        profileId: profile.id,
        fileName: file.name,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
        contentBase64,
      });
    };
    reader.onerror = () => toast("We couldn’t read that file", { description: "Please choose a different file and try again." });
    reader.readAsDataURL(file);
  };

  const handleSaveDailyPrompt = () => {
    if (!isAuthenticated) {
      toast("Sign in to save your reading", { description: "Your saved prompts live inside your private member account." });
      startLogin();
      return;
    }
    if (!profile) {
      toast("Complete step A first", { description: "Save your personal field before keeping a dated reading." });
      openProfile();
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    const report = [
      "COSMIC WISDOM / SIMPLE DAILY READING",
      `Profile: ${profile.displayName}`,
      `Date: ${date}`,
      "",
      "TODAY’S ONE USEFUL MOVE",
      "Choose one task that makes tomorrow easier, and complete the smallest useful version of it before taking on anything new.",
      "",
      "SOURCE STATUS",
      isCalculated ? "Your calculated signal layer is connected." : "Your field is stored. Detailed calculations will appear here when the calculation layer is connected.",
    ].join("\n");
    savePatternBriefReport.mutate({ profileId: profile.id, fileName: `cosmic-wisdom-daily-reading-${date}.txt`, content: report });
  };

  const handleOpenLatestFile = () => {
    if (!latestFile) return;
    openPrivateFile.mutate({ fileId: latestFile.id });
  };

  return <main className="min-h-screen overflow-hidden bg-[#F3F0E9] text-[#102936] selection:bg-[#EF5D3F] selection:text-white">
    <header className="sticky top-0 z-40 border-b border-[#102936]/10 bg-[#F3F0E9]/92 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-4 md:px-9 lg:px-12">
        <button onClick={() => scrollTo("overview")} className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]">
          <span className="relative h-9 w-9 overflow-hidden"><img src="/manus-storage/cosmic-orbit-mark_02e07e29.png" alt="" className="h-9 w-9 scale-[1.42] object-cover transition-transform group-hover:rotate-12" /></span>
          <span className="font-sans text-[10px] font-extrabold tracking-[.3em] text-[#102936]">COSMIC <span className="font-mono text-[8px] font-medium tracking-[.16em] text-[#EF5D3F]">WISDOM</span></span>
        </button>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          <button onClick={() => scrollTo("your-path")} className="font-mono text-[9px] tracking-[.14em] text-[#55707d] transition-colors hover:text-[#EF5D3F]">HOW IT WORKS</button>
          <button onClick={() => scrollTo("your-signals")} className="font-mono text-[9px] tracking-[.14em] text-[#55707d] transition-colors hover:text-[#EF5D3F]">YOUR SIGNALS</button>
          <Link href="/tarot" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] transition-colors hover:text-[#EF5D3F]">TAROT</Link>
          <Link href="/palmistry" className="font-mono text-[9px] tracking-[.14em] text-[#55707d] transition-colors hover:text-[#EF5D3F]">PALMISTRY</Link>
          <Button onClick={openProfile} className="h-10 rounded-none bg-[#102936] px-5 font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#EF5D3F]">{hasProfile ? "UPDATE MY DETAILS" : "START WITH A"}<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Button>
        </nav>
        <button onClick={() => setMenuOpen(open => !open)} aria-label="Open menu" aria-expanded={menuOpen} className="flex h-10 w-10 items-center justify-center border border-[#102936]/15 text-[#102936] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
      </div>
      {menuOpen && <div className="border-t border-[#102936]/10 bg-[#F3F0E9] px-5 py-3 md:hidden"><div className="mx-auto max-w-[1500px] space-y-1"><button onClick={() => scrollTo("your-path")} className="flex w-full justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">HOW IT WORKS <ArrowRight size={14} /></button><button onClick={() => scrollTo("your-signals")} className="flex w-full justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">YOUR SIGNALS <ArrowRight size={14} /></button><Link href="/tarot" className="flex justify-between border-b border-[#102936]/10 py-3 font-mono text-[10px] tracking-[.14em]">TAROT <ArrowRight size={14} /></Link><Link href="/palmistry" className="flex justify-between py-3 font-mono text-[10px] tracking-[.14em]">PALMISTRY <ArrowRight size={14} /></Link><Button onClick={openProfile} className="mt-3 w-full rounded-none bg-[#102936] font-mono text-[9px] tracking-[.14em] text-white">{hasProfile ? "UPDATE MY DETAILS" : "START WITH A"}</Button></div></div>}
    </header>

    <section id="overview" className="px-5 py-7 md:px-9 md:py-10 lg:px-12 lg:py-14">
      <div className="relative mx-auto max-w-[1500px] overflow-hidden bg-[#211B2A] px-6 py-8 text-[#F3F0E9] shadow-[0_26px_80px_rgba(33,27,42,.2)] sm:px-10 sm:py-12 md:px-14 lg:grid lg:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:px-16 lg:py-16">
        <img src="/manus-storage/cosmic-hero-field_09e49a6f.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 mix-blend-screen" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(33,27,42,.98),rgba(33,27,42,.91)_52%,rgba(33,27,42,.56))]" />
        <div className="absolute inset-y-0 left-0 w-1 bg-[#EF5D3F]" />
        <div className="relative"><PathLabel accent>PERSONAL GUIDANCE, MADE SIMPLE</PathLabel><h1 className="mt-7 max-w-[760px] font-serif text-[clamp(3.8rem,8vw,7.8rem)] leading-[.84] tracking-[-.065em]">Your chart,<br /><em className="font-light text-[#D9D1EF]">made useful.</em></h1><p className="mt-7 max-w-[560px] font-sans text-[16px] leading-7 text-[#E3DAEA] md:text-[18px]">Cosmic turns complex systems into three things you can use: your rhythm, your decision style, and one practical focus for today.</p><div className="mt-9 flex flex-wrap gap-3"><Button onClick={() => hasProfile ? scrollTo("your-signals") : openProfile()} className="h-12 rounded-none bg-[#EF5D3F] px-6 font-mono text-[10px] tracking-[.14em] text-white hover:bg-[#D75D7F]">{hasProfile ? "GO TO STEP B" : "START WITH STEP A"}<ArrowRight className="ml-2" size={15} /></Button><button onClick={() => scrollTo("your-path")} className="px-4 font-mono text-[10px] tracking-[.14em] text-[#D9D1EF] hover:text-white">SEE THE 3 STEPS</button></div></div>
        <aside className="relative mt-10 border border-white/15 bg-[#F3F0E9]/95 p-5 text-[#102936] shadow-[-12px_14px_0_rgba(239,93,63,.82)] lg:mt-0 lg:self-end sm:p-7"><div className="flex items-start justify-between gap-6"><div><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">YOUR CURRENT PLACE</p><h2 className="mt-3 font-serif text-3xl leading-[.95] tracking-[-.05em]">{hasProfile ? `Welcome back, ${firstName}.` : "Begin with your details."}</h2></div><UserRound size={23} className="text-[#EF5D3F]" /></div><div className="mt-7 space-y-4">{pathSteps.map((step, index) => { const done = index === 0 && hasProfile; const current = (index === 0 && !hasProfile) || (index === 1 && hasProfile); return <div key={step.letter} className="flex items-center gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px] font-semibold ${done ? "border-[#EF5D3F] bg-[#EF5D3F] text-white" : current ? "border-[#102936] bg-[#102936] text-white" : "border-[#102936]/20 text-[#55707d]"}`}>{done ? <Check size={14} /> : step.letter}</span><div><p className="font-sans text-[13px] font-bold">{step.title}</p><p className="mt-0.5 font-sans text-[11px] text-[#55707d]">{done ? "Complete" : current ? "Your next step" : "Unlocked next"}</p></div></div>; })}</div><button onClick={openProfile} className="mt-7 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F] hover:text-[#B63C5E]">{hasProfile ? "REVIEW YOUR DETAILS" : "ADD YOUR DETAILS"}<ArrowUpRight size={14} /></button></aside>
      </div>
    </section>

    <section id="your-path" className="border-y border-[#102936]/10 px-5 py-16 md:px-9 lg:px-12 lg:py-24"><div className="mx-auto max-w-[1500px]"><div className="max-w-2xl"><p className="font-mono text-[10px] font-semibold tracking-[.15em] text-[#EF5D3F]">THE SIMPLE PATH</p><h2 className="mt-4 font-serif text-5xl leading-[.9] tracking-[-.06em] text-[#102936] md:text-6xl">Three steps. No chart-reading degree required.</h2><p className="mt-5 max-w-xl font-sans text-[15px] leading-7 text-[#55707d]">The system stays detailed under the surface. On the page, you only see what is useful to you right now.</p></div><div className="mt-10 grid gap-px overflow-hidden border border-[#102936]/10 bg-[#102936]/10 md:grid-cols-3">{pathSteps.map((step, index) => <article key={step.letter} className="bg-[#F8F6F1] p-6 md:p-8"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#211B2A] font-serif text-2xl text-[#F3F0E9]">{step.letter}</span><h3 className="mt-8 font-serif text-4xl leading-none tracking-[-.05em]">{step.title}</h3><p className="mt-4 max-w-sm font-sans text-[14px] leading-6 text-[#55707d]">{step.short}</p>{index === 0 ? <button onClick={openProfile} className="mt-7 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] text-[#EF5D3F] hover:text-[#B63C5E]">{hasProfile ? "UPDATE DETAILS" : "ADD DETAILS"}<ArrowRight size={14} /></button> : <button onClick={() => scrollTo(index === 1 ? "your-signals" : "today")} className="mt-7 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] text-[#102936] hover:text-[#EF5D3F]">{index === 1 ? "SEE THE SIGNALS" : "READ TODAY’S PROMPT"}<ArrowRight size={14} /></button>}</article>)}</div></div></section>

    <section id="your-signals" className="px-5 py-16 md:px-9 lg:px-12 lg:py-24"><div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[.65fr_1.35fr] lg:gap-16"><div className="lg:pt-4"><PathLabel accent>STEP B / WHAT MATTERS</PathLabel><h2 className="mt-5 font-serif text-5xl leading-[.9] tracking-[-.06em] md:text-6xl">The chart translated into everyday language.</h2><p className="mt-6 max-w-md font-sans text-[15px] leading-7 text-[#55707d]">Instead of a wall of placements, Cosmic starts with three questions: How should I pace myself? How do I decide? What is worth my attention today?</p><button onClick={() => setDetailsOpen(open => !open)} aria-expanded={detailsOpen} className="mt-7 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] text-[#102936] hover:text-[#EF5D3F]">{detailsOpen ? "HIDE SOURCE DETAILS" : "SHOW SOURCE DETAILS"}<ArrowUpRight size={14} /></button>{detailsOpen && <div className="mt-4 border-l-2 border-[#EF5D3F] pl-4 font-sans text-[12px] leading-5 text-[#55707d]">Source detail remains available when you want it: astrology supplies timing, numerology supplies cycle language, and Human Design supplies decision-making cues. The first screen keeps those sources translated, not hidden.</div>}</div><div className="grid gap-3 md:grid-cols-3">{coreSignals.map((signal, index) => <article key={signal.number} className={`min-h-[315px] border p-6 ${index === 1 ? "border-[#211B2A] bg-[#211B2A] text-[#F3F0E9] shadow-[-8px_10px_0_#EF5D3F]" : "border-[#102936]/15 bg-white/55"}`}><p className={`font-mono text-[9px] font-semibold tracking-[.16em] ${index === 1 ? "text-[#E1A0B1]" : "text-[#EF5D3F]"}`}>{signal.number} / PLAIN LANGUAGE</p><h3 className="mt-10 font-serif text-3xl leading-[.95] tracking-[-.05em]">{signal.title}</h3><p className={`mt-6 font-sans text-[14px] leading-6 ${index === 1 ? "text-[#E3DAEA]" : "text-[#46616d]"}`}>{signal.simple}</p><div className={`mt-9 border-t pt-4 ${index === 1 ? "border-white/15" : "border-[#102936]/10"}`}><p className={`font-mono text-[8px] tracking-[.13em] ${index === 1 ? "text-[#BFC8E3]" : "text-[#6B828D]"}`}>SOURCE / {signal.source.toUpperCase()}</p></div></article>)}</div></div></section>

    <section id="today" className="px-5 pb-16 md:px-9 lg:px-12 lg:pb-24"><div className="mx-auto grid max-w-[1500px] overflow-hidden bg-[#211B2A] text-[#F3F0E9] lg:grid-cols-[.9fr_1.1fr]"><div className="border-b border-white/15 p-7 md:p-10 lg:border-b-0 lg:border-r"><PathLabel accent>STEP C / ONE USEFUL MOVE</PathLabel><h2 className="mt-6 font-serif text-5xl leading-[.9] tracking-[-.06em] md:text-6xl">Today, make tomorrow easier.</h2><p className="mt-6 max-w-md font-sans text-[16px] leading-7 text-[#D9D1EF]">Choose one task that clears space for the version of you that has more energy. Complete the smallest useful version before you begin anything new.</p><div className="mt-8 flex items-center gap-3 font-mono text-[9px] tracking-[.14em] text-[#D9D1EF]"><Clock3 size={15} className="text-[#EF5D3F]" /> 10–20 MINUTES IS ENOUGH</div></div><div className="relative p-7 md:p-10"><span className="absolute right-7 top-7 font-mono text-[9px] tracking-[.15em] text-[#E1A0B1]">DAILY PROMPT / 01</span><p className="mt-12 font-serif text-[clamp(2.2rem,4vw,4rem)] leading-[.94] tracking-[-.055em]">“What can I finish gently, before I ask more of myself?”</p><p className="mt-7 max-w-lg font-sans text-[13px] leading-6 text-[#D9D1EF]">{hasProfile ? `This is your simple starter prompt, ${firstName}. Your calculated daily sources will appear here as the calculation layer comes online.` : "Save step A and Cosmic will keep your daily prompts, source signals, and reflections in one private place."}</p><div className="mt-9 flex flex-wrap gap-3"><Button onClick={handleSaveDailyPrompt} disabled={savePatternBriefReport.isPending} className="h-11 rounded-none bg-[#EF5D3F] px-5 font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#D75D7F] disabled:opacity-60">{savePatternBriefReport.isPending ? "SAVING…" : "SAVE THIS READING"}<FileText className="ml-2" size={14} /></Button><Button onClick={openProfile} variant="outline" className="h-11 rounded-none border-white/25 bg-transparent px-5 font-mono text-[9px] tracking-[.14em] text-white hover:bg-white/10 hover:text-white">{hasProfile ? "VIEW MY DETAILS" : "COMPLETE STEP A"}</Button></div></div></div></section>

    <section className="border-t border-[#102936]/10 px-5 py-12 md:px-9 lg:px-12"><div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 md:flex-row md:items-end"><div><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">MORE WAYS TO REFLECT</p><h2 className="mt-3 font-serif text-3xl tracking-[-.05em]">Use a studio when you want a different lens.</h2></div><div className="flex flex-wrap gap-3"><Link href="/tarot" className="inline-flex h-11 items-center gap-2 border border-[#102936]/15 bg-white/50 px-5 font-mono text-[9px] tracking-[.14em] hover:border-[#EF5D3F] hover:text-[#B63C5E]">TAROT STUDIO <ArrowUpRight size={14} /></Link><Link href="/palmistry" className="inline-flex h-11 items-center gap-2 border border-[#102936]/15 bg-white/50 px-5 font-mono text-[9px] tracking-[.14em] hover:border-[#EF5D3F] hover:text-[#B63C5E]">PALM GUIDE <ArrowUpRight size={14} /></Link></div></div></section>

    <footer className="bg-[#211B2A] px-5 py-10 text-[#F3F0E9] md:px-9 lg:px-12"><div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-6 md:flex-row md:items-end"><div className="flex items-center gap-3"><img src="/manus-storage/cosmic-orbit-mark_02e07e29.png" alt="" className="h-10 w-10 scale-[1.42] object-cover" /><div><p className="font-sans text-[10px] font-extrabold tracking-[.3em]">COSMIC WISDOM</p><p className="mt-1 font-mono text-[8px] tracking-[.14em] text-[#BFC8E3]">A CLEARER WAY TO READ YOURSELF</p></div></div><p className="font-mono text-[8px] tracking-[.14em] text-[#BFC8E3]">© 2026 COSMIC WISDOM</p></div></footer>

    {profileOpen && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211B2A]/70 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="profile-title"><form onSubmit={handleProfileSubmit} className="relative max-h-[calc(100vh-2rem)] w-full max-w-[700px] overflow-y-auto bg-[#F3F0E9] p-6 shadow-[0_26px_90px_rgba(0,0,0,.35)] sm:p-9"><button type="button" onClick={() => setProfileOpen(false)} aria-label="Close personal details" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center border border-[#102936]/15 hover:border-[#EF5D3F] hover:text-[#EF5D3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]"><X size={17} /></button><div className="pr-10"><PathLabel accent>STEP A / YOUR PERSONAL FIELD</PathLabel><h2 id="profile-title" className="mt-4 font-serif text-4xl leading-[.94] tracking-[-.055em]">Four details. Then Cosmic does the translating.</h2><p className="mt-3 max-w-xl font-sans text-[13px] leading-6 text-[#55707d]">Your date, time, and place are used to build your private calculation context. No public profile is created, and you can update these details later.</p></div><div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="block sm:col-span-2" htmlFor="fullName"><span className="font-mono text-[9px] font-semibold tracking-[.12em] text-[#55707d]">YOUR NAME</span><input id="fullName" required name="fullName" defaultValue={profile?.displayName ?? ""} placeholder="Your name" className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-base outline-none placeholder:text-[#8b9ba2] focus:border-[#EF5D3F]" /></label><label className="block" htmlFor="birthDate"><span className="font-mono text-[9px] font-semibold tracking-[.12em] text-[#55707d]">BIRTH DATE</span><input id="birthDate" required name="birthDate" type="date" defaultValue={profile?.birthDate ?? ""} className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-sm outline-none focus:border-[#EF5D3F]" /></label><label className="block" htmlFor="birthTime"><span className="font-mono text-[9px] font-semibold tracking-[.12em] text-[#55707d]">BIRTH TIME <em className="font-normal text-[#8B9BA2]">OPTIONAL</em></span><input id="birthTime" name="birthTime" type="time" defaultValue={profile?.birthTime ?? ""} className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-sm outline-none focus:border-[#EF5D3F]" /></label><label className="block sm:col-span-2" htmlFor="birthLocation"><span className="font-mono text-[9px] font-semibold tracking-[.12em] text-[#55707d]">BIRTH PLACE</span><input id="birthLocation" required name="birthLocation" defaultValue={profile?.birthLocation ?? ""} placeholder="City, country" className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-base outline-none placeholder:text-[#8b9ba2] focus:border-[#EF5D3F]" /></label></div><div className="mt-7 border-t border-[#102936]/10 pt-5"><div className="flex items-center justify-between gap-4"><div><p className="font-mono text-[9px] font-semibold tracking-[.13em] text-[#EF5D3F]">PRIVATE FILES / OPTIONAL</p><p className="mt-1 font-sans text-[11px] leading-5 text-[#55707d]">{hasProfile ? `${storedFileCount} protected file${storedFileCount === 1 ? "" : "s"} in your Cosmic space.` : "Save step A first, then attach a chart scan or supporting PDF."}</p></div><label className={`inline-flex cursor-pointer items-center gap-2 border px-3 py-2 font-mono text-[9px] tracking-[.13em] ${!isAuthenticated || !hasProfile || uploadProfileAsset.isPending ? "cursor-not-allowed border-[#102936]/10 text-[#8B9BA2]" : "border-[#102936]/20 text-[#102936] hover:border-[#EF5D3F] hover:text-[#EF5D3F]"}`}><FileUp size={14} />{uploadProfileAsset.isPending ? "UPLOADING…" : "ATTACH"}<input aria-label="Attach a private profile asset" disabled={!isAuthenticated || !hasProfile || uploadProfileAsset.isPending} accept="image/jpeg,image/png,image/webp,application/pdf" type="file" className="sr-only" onChange={handleProfileAssetUpload} /></label></div>{latestFile && <button type="button" onClick={handleOpenLatestFile} disabled={openPrivateFile.isPending} className="mt-3 flex w-full items-center justify-between border border-[#102936]/15 bg-[#211B2A] px-4 py-3 text-left text-white transition-colors hover:bg-[#EF5D3F] disabled:cursor-not-allowed disabled:opacity-50"><span><span className="block font-mono text-[9px] font-semibold tracking-[.13em]">OPEN LATEST PROTECTED FILE</span><span className="mt-1 block font-sans text-[11px] text-white/65">Only your signed-in Cosmic session can request this file.</span></span><ArrowUpRight size={16} /></button>}<button type="button" onClick={handleSaveDailyPrompt} disabled={!isAuthenticated || !hasProfile || savePatternBriefReport.isPending} className="mt-3 flex w-full items-center justify-between border border-[#102936]/15 bg-white/45 px-4 py-3 text-left transition-colors hover:border-[#EF5D3F] disabled:cursor-not-allowed disabled:opacity-50"><span><span className="block font-mono text-[9px] font-semibold tracking-[.13em] text-[#102936]">SAVE TODAY’S SIMPLE READING</span><span className="mt-1 block font-sans text-[11px] text-[#55707d]">Keep a private text copy in your Cosmic file space.</span></span><FileText className="text-[#EF5D3F]" size={16} /></button></div><div className="mt-8 flex flex-col justify-between gap-5 border-t border-[#102936]/10 pt-5 sm:flex-row sm:items-center"><p className="max-w-[290px] font-sans text-[11px] leading-5 text-[#55707d]">Cosmic starts with a clear translation. Detailed source terms remain available whenever you want to look underneath.</p><Button type="submit" disabled={saveProfile.isPending} className="h-12 rounded-none bg-[#102936] px-5 font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#EF5D3F] disabled:opacity-60">{saveProfile.isPending ? "SAVING…" : hasProfile ? "UPDATE MY DETAILS" : "SAVE STEP A"}<Sparkles className="ml-2" size={15} /></Button></div></form></div>}
  </main>;
}
