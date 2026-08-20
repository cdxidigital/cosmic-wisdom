/**
 * Eclipse Almanac visual system: high-fashion editorial typography, warm paper contrast,
 * ink-plum reading fields, periwinkle signals, and carmine activation accents.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Asterisk,
  ChevronDown,
  CircleDot,
  Compass,
  FileText,
  FileUp,
  Crosshair,
  Menu,
  MoveUpRight,
  Orbit,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useState } from "react";

const navItems = ["Overview", "Today", "Systems", "Connection"];

const systems = [
  {
    key: "ASTRO",
    title: "Astrology",
    metric: "Moon in Taurus",
    detail: "12° 08′ · 8th house",
    copy: "A steadier emotional current is available if you let your body set the pace.",
    mark: "☌",
  },
  {
    key: "NUM",
    title: "Numerology",
    metric: "Personal Day 6",
    detail: "Harmony · responsibility",
    copy: "Invest in the arrangement that makes care feel sustainable, not performative.",
    mark: "06",
  },
  {
    key: "HD",
    title: "Human Design",
    metric: "Gate 57 activated",
    detail: "Spleen · instinct",
    copy: "The first quiet signal is enough. You do not need a committee to validate it.",
    mark: "57",
  },
];

const signalSources = [
  ["MOON", "Taurus", "12°08′"],
  ["PERSONAL DAY", "6", "Harmony"],
  ["HD TRANSIT", "57", "Instinct"],
];

function SignalTag({ children, accent = false }: { children: string; accent?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[9px] font-semibold leading-none tracking-[0.18em] ${
        accent
          ? "border-[#EF5D3F]/35 bg-[#EF5D3F]/10 text-[#EF5D3F]"
          : "border-[#1a2d3d]/15 bg-white/50 text-[#183448]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${accent ? "bg-[#EF5D3F]" : "bg-[#80a7bd]"}`} />
      {children}
    </span>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeSystem, setActiveSystem] = useState("ASTRO");
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const myProfile = trpc.cosmic.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const saveProfile = trpc.cosmic.saveProfile.useMutation({
    onSuccess: profile => {
      utils.cosmic.getMyProfile.setData(undefined, profile);
      setProfileOpen(false);
      toast("Your field has been saved", { description: "Your private Cosmic profile is now stored securely and ready for calculation." });
    },
    onError: error => toast("We couldn’t save your field", { description: error.message }),
  });
  const uploadProfileAsset = trpc.cosmic.uploadProfileAsset.useMutation({
    onSuccess: () => {
      utils.cosmic.listFiles.invalidate();
      toast("Profile asset attached", { description: "Your file is stored securely with your private Cosmic profile." });
    },
    onError: error => toast("We couldn’t attach that file", { description: error.message }),
  });
  const savePatternBriefReport = trpc.cosmic.uploadTextReport.useMutation({
    onSuccess: () => {
      utils.cosmic.listFiles.invalidate();
      toast("Pattern Brief saved", { description: "A private text report is now available in your Cosmic file history." });
    },
    onError: error => toast("We couldn’t save your Pattern Brief", { description: error.message }),
  });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setMenuOpen(false);
  };

  const handleProfileSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) {
      toast("Sign in to save your field", { description: "Cosmic protects your birth details inside your private member account." });
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
      toast("Sign in to attach a file", { description: "Cosmic keeps profile assets inside your private member account." });
      startLogin();
      return;
    }
    const profile = myProfile.data;
    if (!profile) {
      toast("Save your field first", { description: "Once your birth profile is saved, you can attach a chart scan, report, or supporting file." });
      return;
    }
    if (file.size > 7_500_000) {
      toast("That file is too large", { description: "Choose an image or PDF below 7.5 MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result.split(",")[1] : null;
      if (!result) {
        toast("We couldn’t read that file", { description: "Please try a PNG, JPG, WEBP, or PDF file." });
        return;
      }
      uploadProfileAsset.mutate({
        profileId: profile.id,
        fileName: file.name,
        mimeType: file.type as "image/jpeg" | "image/png" | "image/webp" | "application/pdf",
        contentBase64: result,
      });
    };
    reader.onerror = () => toast("We couldn’t read that file", { description: "Please choose a different file and try again." });
    reader.readAsDataURL(file);
  };

  const handlePatternBriefReport = () => {
    if (!isAuthenticated) {
      toast("Sign in to save your Pattern Brief", { description: "Cosmic stores reading exports inside your private member account." });
      startLogin();
      return;
    }
    const profile = myProfile.data;
    if (!profile) {
      toast("Save your field first", { description: "Once your birth profile is saved, you can keep a dated copy of this reading." });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const report = [
      "COSMIC WISDOM / PATTERN BRIEF",
      `Profile: ${profile.displayName}`,
      `Date: ${today}`,
      "",
      "The work is to make one clean decision — and let that decision restore your bandwidth.",
      "",
      "SOURCE SIGNALS",
      "Astrology: Moon in Taurus · 12°08′ · 8th house",
      "Numerology: Personal Day 6 · Harmony · responsibility",
      "Human Design: Gate 57 activated · Spleen · instinct",
    ].join("\n");
    savePatternBriefReport.mutate({
      profileId: profile.id,
      fileName: `cosmic-wisdom-pattern-brief-${today}.txt`,
      content: report,
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F3F0E9] text-[#102936] selection:bg-[#EF5D3F] selection:text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[76px] flex-col items-center border-r border-white/10 bg-[#071722] py-7 text-[#F3F0E9] lg:flex">
        <button
          className="group relative flex h-11 w-11 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]"
          aria-label="Return to Cosmic overview"
          onClick={() => scrollTo("overview")}
        >
          <img src="/manus-storage/cosmic-orbit-mark_02e07e29.png" alt="" className="h-11 w-11 scale-[1.42] object-cover transition-transform duration-200 group-hover:rotate-12" />
        </button>
        <div className="mt-10 flex flex-1 flex-col items-center gap-6">
          {navItems.map((item, index) => (
            <button
              key={item}
              onClick={() => scrollTo(["overview", "today", "systems", "connection"][index])}
              className="group relative flex h-8 w-8 items-center justify-center text-[9px] font-bold tracking-[0.12em] text-[#8fa7b5] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#EF5D3F]"
              aria-label={item}
            >
              <span className="absolute left-8 hidden whitespace-nowrap bg-[#071722] px-2 py-1.5 font-mono text-[9px] tracking-[0.12em] text-white group-hover:block">{item}</span>
              0{index + 1}
            </button>
          ))}
        </div>
        <button
          onClick={() => setProfileOpen(true)}
          aria-label="Create your profile"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-[#F3F0E9] transition-all duration-200 hover:border-[#EF5D3F] hover:bg-[#EF5D3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]"
        >
          <Plus size={16} />
        </button>
      </aside>

      <header className="relative z-30 mx-auto flex max-w-[1500px] items-center justify-between px-5 py-5 md:px-9 lg:ml-[76px] lg:max-w-none lg:px-12">
        <button onClick={() => scrollTo("overview")} className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F] lg:hidden">
          <img src="/manus-storage/cosmic-orbit-mark_02e07e29.png" alt="Cosmic" className="h-9 w-9 scale-[1.42] object-cover" />
          <span className="font-sans text-xs font-extrabold tracking-[0.28em] text-[#102936]">COSMIC</span>
        </button>
        <div className="hidden items-center gap-9 lg:flex">
          <span className="font-sans text-[11px] font-extrabold tracking-[0.34em] text-[#102936]">COSMIC / INDEX</span>
          <span className="h-3.5 w-px bg-[#102936]/20" />
          <span className="font-mono text-[10px] tracking-[0.12em] text-[#55707d]">DAILY SELF-PATTERN ENGINE</span>
        </div>
        <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
          {navItems.map((item, index) => (
            <button key={item} onClick={() => scrollTo(["overview", "today", "systems", "connection"][index])} className="font-sans text-[10px] font-semibold uppercase tracking-[0.16em] text-[#36515d] transition-colors hover:text-[#EF5D3F] focus-visible:outline-none focus-visible:text-[#EF5D3F]">
              {item}
            </button>
          ))}
          <Button onClick={() => setProfileOpen(true)} className="h-10 rounded-none bg-[#102936] px-5 font-sans text-[10px] font-bold tracking-[0.12em] text-white hover:bg-[#EF5D3F]">
            CREATE FIELD <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </nav>
        <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Open menu" className="flex h-10 w-10 items-center justify-center border border-[#102936]/20 text-[#102936] md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]">
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        {menuOpen && (
          <div className="absolute left-5 right-5 top-[72px] border border-[#102936]/10 bg-[#F3F0E9] p-4 shadow-[0_20px_50px_rgba(7,23,34,0.16)] md:hidden">
            {navItems.map((item, index) => (
              <button key={item} onClick={() => scrollTo(["overview", "today", "systems", "connection"][index])} className="flex w-full items-center justify-between border-b border-[#102936]/10 px-1 py-3 text-left font-sans text-xs font-bold tracking-[0.08em] text-[#102936] last:border-0">
                {item} <ArrowUpRight size={14} />
              </button>
            ))}
            <Button onClick={() => setProfileOpen(true)} className="mt-3 w-full rounded-none bg-[#102936] font-sans text-[10px] tracking-[0.14em] text-white">CREATE FIELD</Button>
          </div>
        )}
      </header>

      <section id="overview" className="relative px-5 pb-20 pt-5 md:px-9 lg:ml-[76px] lg:px-12 lg:pb-28 lg:pt-8">
        <div className="relative mx-auto max-w-[1500px] overflow-hidden bg-[#071722] shadow-[0_26px_80px_rgba(7,23,34,0.2)]">
          <img src="/manus-storage/cosmic-hero-field_09e49a6f.png" alt="Abstract orbital field in a midnight observatory palette" className="absolute inset-0 h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(33,27,42,0.98)_2%,rgba(33,27,42,0.86)_43%,rgba(33,27,42,0.28)_78%,rgba(33,27,42,0.2)_100%)]" />
          <div className="absolute left-0 top-0 h-full w-1 bg-[#EF5D3F]" />
          <div className="relative grid min-h-[620px] gap-8 px-6 py-8 sm:px-10 md:px-14 md:py-12 lg:grid-cols-[minmax(0,1.28fr)_minmax(340px,.72fr)] lg:px-16 lg:py-16">
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <SignalTag accent>TODAY / 20 AUG</SignalTag>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-[#9db3c0]">THURSDAY · PERSONAL DAY 6</span>
                </div>
                <h1 className="mt-10 max-w-[720px] font-serif text-[clamp(3.8rem,8vw,8.5rem)] leading-[0.84] tracking-[-0.068em] text-[#F3F0E9]">
                  Your inner weather,<br />
                  <em className="font-light text-[#9bc2d5]">in focus.</em>
                </h1>
                <p className="mt-8 max-w-[490px] font-sans text-[15px] font-medium leading-[1.75] text-[#c5d3d8] md:text-[17px]">
                  One daily lens for the three systems that shape your rhythm: astrology, numerology, and Human Design.
                </p>
                <div className="mt-9 flex flex-wrap gap-3">
                  <Button onClick={() => scrollTo("today")} className="h-12 rounded-none bg-[#EF5D3F] px-6 font-sans text-[10px] font-bold tracking-[0.14em] text-white hover:bg-[#ff7658]">
                    READ TODAY’S BRIEF <MoveUpRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button onClick={() => setProfileOpen(true)} variant="outline" className="h-12 rounded-none border-white/25 bg-transparent px-6 font-sans text-[10px] font-bold tracking-[0.14em] text-white hover:border-white hover:bg-white/10 hover:text-white">
                    BUILD YOUR FIELD
                  </Button>
                </div>
              </div>
              <div className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-white/15 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#EF5D3F]/60 text-[#EF5D3F]"><CircleDot size={14} /></div>
                  <div><p className="font-mono text-[9px] tracking-[0.14em] text-[#9db3c0]">SYSTEM STATUS</p><p className="mt-0.5 font-sans text-xs font-semibold text-white">3 signals aligned</p></div>
                </div>
                <span className="font-mono text-[9px] tracking-[0.13em] text-[#9db3c0]">UTC +08:00 · PERTH</span>
              </div>
            </div>

            <article className="self-end border border-white/15 bg-[#f3f0e9]/95 p-5 text-[#102936] shadow-[-14px_16px_0_rgba(239,93,63,0.88)] sm:p-7">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-mono text-[9px] font-semibold tracking-[0.16em] text-[#EF5D3F]">01 / PATTERN BRIEF</p><p className="mt-2 font-sans text-xs font-medium text-[#55707d]">A synthesis from your active systems</p></div>
                <Compass size={21} strokeWidth={1.4} className="text-[#102936]" />
              </div>
              <div className="my-7 h-px bg-[#102936]/10" />
              <blockquote className="font-serif text-[clamp(1.7rem,3vw,2.45rem)] leading-[1.04] tracking-[-0.04em] text-[#102936]">
                “The work is to make <em className="text-[#EF5D3F]">one clean decision</em> — and let that decision restore your bandwidth.”
              </blockquote>
              <div className="mt-7 grid gap-2 border-t border-[#102936]/10 pt-4 sm:grid-cols-3">
                {signalSources.map(([label, value, detail]) => <div key={label}><p className="font-mono text-[8px] tracking-[0.12em] text-[#6b828d]">{label}</p><p className="mt-1 font-sans text-xs font-bold">{value}</p><p className="mt-0.5 font-sans text-[10px] text-[#55707d]">{detail}</p></div>)}
              </div>
              <button onClick={() => scrollTo("systems")} className="mt-6 flex items-center gap-2 font-sans text-[10px] font-bold tracking-[0.13em] text-[#102936] transition-colors hover:text-[#EF5D3F] focus-visible:outline-none focus-visible:text-[#EF5D3F]">OPEN SIGNAL SOURCES <ArrowUpRight size={13} /></button>
            </article>
          </div>
          <div className="absolute bottom-0 right-5 hidden items-center gap-2 pb-5 font-mono text-[8px] tracking-[0.15em] text-[#a2b6c0] lg:flex"><Asterisk size={11} /> TRANSPARENT BY DESIGN</div>
        </div>
      </section>

      <section id="today" className="border-y border-[#102936]/10 px-5 py-16 md:px-9 lg:ml-[76px] lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div className="lg:pt-4">
            <div className="flex items-center gap-3"><span className="h-px w-9 bg-[#EF5D3F]" /><p className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#EF5D3F]">TODAY’S FIELD</p></div>
            <h2 className="mt-5 max-w-sm font-serif text-5xl leading-[0.89] tracking-[-0.06em] text-[#102936] md:text-6xl">The signal is more useful when you can see its source.</h2>
            <p className="mt-8 max-w-md font-sans text-[15px] leading-[1.8] text-[#55707d]">Cosmic does not flatten your data into a generic forecast. Each brief is an inspectable synthesis of calculated placements, activated gates, and your personal number cycle.</p>
            <button onClick={() => scrollTo("connection")} className="mt-8 flex items-center gap-2 font-sans text-[10px] font-bold tracking-[0.13em] text-[#102936] transition-colors hover:text-[#EF5D3F] focus-visible:outline-none focus-visible:text-[#EF5D3F]">HOW THE ENGINE THINKS <ArrowUpRight size={14} /></button>
          </div>
          <div className="relative grid gap-px overflow-hidden bg-[#102936]/15 md:grid-cols-3">
            {systems.map((system, index) => (
              <button key={system.key} onClick={() => setActiveSystem(system.key)} className={`group relative min-h-[320px] overflow-hidden p-6 text-left transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F] ${activeSystem === system.key ? "bg-[#102936] text-[#F3F0E9]" : "bg-[#F8F6F1] text-[#102936] hover:bg-[#e9eef0]"}`}>
                <span className={`absolute right-5 top-3 font-serif text-7xl leading-none tracking-[-0.1em] transition-colors ${activeSystem === system.key ? "text-white/10" : "text-[#102936]/5"}`}>{system.mark}</span>
                <div className="relative flex h-full flex-col justify-between">
                  <div><div className="flex items-center justify-between"><span className={`font-mono text-[9px] font-semibold leading-none tracking-[0.18em] ${activeSystem === system.key ? "text-[#EF5D3F]" : "text-[#55707d]"}`}>0{index + 1} / {system.key}</span><span className={`h-2 w-2 rounded-full ${activeSystem === system.key ? "bg-[#EF5D3F]" : "bg-[#91b6c6]"}`} /></div><h3 className="mt-10 font-serif text-3xl leading-[0.92] tracking-[-0.055em]">{system.title}</h3><p className={`mt-4 font-sans text-[13px] font-bold ${activeSystem === system.key ? "text-white" : "text-[#102936]"}`}>{system.metric}</p><p className={`mt-1.5 font-mono text-[8px] leading-none tracking-[0.15em] ${activeSystem === system.key ? "text-[#9db3c0]" : "text-[#6b828d]"}`}>{system.detail}</p></div>
                  <div><p className={`max-w-[240px] font-sans text-[13px] leading-[1.7] ${activeSystem === system.key ? "text-[#c5d3d8]" : "text-[#55707d]"}`}>{system.copy}</p><span className="mt-6 flex items-center gap-2 font-sans text-[9px] font-bold tracking-[0.16em]">VIEW SIGNAL <ArrowUpRight size={13} /></span></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="systems" className="relative px-5 py-16 md:px-9 lg:ml-[76px] lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-[1500px] gap-10 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch">
          <div className="relative min-h-[500px] overflow-hidden bg-[#e6ecec] p-7 md:p-10">
            <img src="/manus-storage/cosmic-bodygraph-study_817fa0dd.png" alt="Abstract technical visual inspired by interlinked personal pattern systems" className="absolute inset-0 h-full w-full object-cover mix-blend-multiply opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(230,236,236,.96),rgba(230,236,236,.6),rgba(230,236,236,.12))]" />
            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-center justify-between"><SignalTag>THE PATTERN STACK</SignalTag><span className="font-mono text-[9px] tracking-[0.12em] text-[#55707d]">V1.0 / READING LAYER</span></div>
              <div className="max-w-[490px]"><p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#EF5D3F]">THREE LENSES. ONE DAILY PRACTICE.</p><h2 className="mt-4 font-serif text-5xl leading-[0.92] tracking-[-0.06em] text-[#102936] md:text-6xl">No siloed systems. No black-box reading.</h2><p className="mt-6 max-w-md font-sans text-base leading-7 text-[#46616d]">Move from signal to meaning without losing the mathematics, timing, or context that generated it.</p></div>
              <div className="flex flex-wrap gap-2"><SignalTag>PLACEMENTS</SignalTag><SignalTag>GATES</SignalTag><SignalTag>CYCLES</SignalTag><SignalTag accent>ACTIVE NOW</SignalTag></div>
            </div>
          </div>
          <div className="flex flex-col justify-between bg-[#071722] p-7 text-[#F3F0E9] md:p-10">
            <div><div className="flex items-center gap-3"><Orbit size={17} className="text-[#EF5D3F]" /><p className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#EF5D3F]">YOUR PROFILE, UNFOLDED</p></div><h2 className="mt-7 font-serif text-5xl leading-[0.93] tracking-[-0.06em]">A field built around your exact moment.</h2><p className="mt-6 max-w-md font-sans text-base leading-7 text-[#c5d3d8]">Create your birth profile to unlock the calculation layer. Your natal positions, core numbers, Type, Strategy, Authority, and Profile become one evolving reference point.</p></div>
            <div className="mt-10 border-t border-white/15 pt-6"><div className="grid grid-cols-2 gap-6"><div><p className="font-mono text-[9px] tracking-[0.12em] text-[#9db3c0]">INPUT</p><p className="mt-1 font-sans text-sm font-semibold">Birth details</p></div><div><p className="font-mono text-[9px] tracking-[0.12em] text-[#9db3c0]">OUTPUT</p><p className="mt-1 font-sans text-sm font-semibold">Living pattern file</p></div></div><Button onClick={() => setProfileOpen(true)} className="mt-8 h-12 w-full rounded-none bg-[#EF5D3F] font-sans text-[10px] font-bold tracking-[0.13em] text-white hover:bg-[#ff7658]">CREATE MY FIELD <ArrowUpRight className="ml-2 h-4 w-4" /></Button></div>
          </div>
        </div>
      </section>

      <section id="connection" className="border-t border-[#102936]/10 px-5 py-16 md:px-9 lg:ml-[76px] lg:px-12 lg:py-24">
        <div className="mx-auto max-w-[1500px]">
          <div className="flex flex-col justify-between gap-8 border-b border-[#102936]/10 pb-8 md:flex-row md:items-end"><div><p className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#EF5D3F]">THE COSMIC METHOD</p><h2 className="mt-4 max-w-2xl font-serif text-5xl leading-[0.93] tracking-[-0.055em] text-[#102936] md:text-6xl">A transparent engine for self-pattern recognition.</h2></div><p className="max-w-sm font-sans text-sm leading-6 text-[#55707d]">The interface is a front-end prototype for the exact calculation architecture described in your dossier.</p></div>
          <div className="grid divide-y divide-[#102936]/10 md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ["01", "Calculate", "Ephemeris positions, personal number cycles, and BodyGraph factors are resolved into a structured personal profile."],
              ["02", "Connect", "The engine detects meaningful overlap between systems instead of presenting three isolated explanations."],
              ["03", "Translate", "A daily Pattern Brief names the present signal in plain language and preserves the exact sources behind it."],
            ].map(([number, title, body]) => <div key={number} className="py-8 md:px-8 md:first:pl-0 md:last:pr-0"><p className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#EF5D3F]">{number}</p><h3 className="mt-7 font-serif text-3xl tracking-[-0.04em] text-[#102936]">{title}</h3><p className="mt-3 max-w-sm font-sans text-sm leading-6 text-[#55707d]">{body}</p></div>)}
          </div>
        </div>
      </section>

      <footer className="bg-[#071722] px-5 py-10 text-[#F3F0E9] md:px-9 lg:ml-[76px] lg:px-12">
        <div className="mx-auto flex max-w-[1500px] flex-col justify-between gap-8 md:flex-row md:items-end"><div className="flex items-center gap-3"><img src="/manus-storage/cosmic-orbit-mark_02e07e29.png" alt="" className="h-12 w-12 scale-[1.42] object-cover" /><div><p className="font-sans text-xs font-extrabold tracking-[0.3em]">COSMIC WISDOM</p><p className="mt-1 font-mono text-[8px] tracking-[0.14em] text-[#9db3c0]"></p></div></div><div className="flex flex-wrap gap-x-7 gap-y-3 font-mono text-[9px] tracking-[0.13em] text-[#9db3c0]"><button onClick={() => toast("Coming in the product build", { description: "Relationship patterns will combine synastry, Human Design composites, and numerology bonds." })} className="transition-colors hover:text-white">RELATIONSHIP MODE</button><button onClick={() => toast("Coming in the product build", { description: "Calculation source notes will make the underlying systems inspectable." })} className="transition-colors hover:text-white">METHOD NOTES</button><span>© 2026 COSMIC WISDOM</span></div></div>
      </footer>

      {profileOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071722]/60 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="profile-title">
          <form onSubmit={handleProfileSubmit} className="relative w-full max-w-[680px] bg-[#F3F0E9] p-6 shadow-[0_24px_80px_rgba(0,0,0,.35)] sm:p-9">
            <button type="button" onClick={() => setProfileOpen(false)} aria-label="Close profile setup" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center border border-[#102936]/15 text-[#102936] hover:border-[#EF5D3F] hover:text-[#EF5D3F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5D3F]"><X size={17} /></button>
            <div className="pr-10"><p className="font-mono text-[10px] font-semibold tracking-[0.15em] text-[#EF5D3F]">NEW FIELD / PROTOTYPE</p><h2 id="profile-title" className="mt-3 font-serif text-4xl tracking-[-0.05em] text-[#102936]">Begin with the exact moment.</h2><p className="mt-3 max-w-lg font-sans text-sm leading-6 text-[#55707d]">This interface shows the MVP profile flow. In the live calculation build, these fields will generate your personal pattern file.</p></div>
            <div className="mt-7 grid gap-5 sm:grid-cols-2"><label className="block sm:col-span-2"><span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#55707d]">FULL NAME</span><input required name="fullName" placeholder="Your name" className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-base text-[#102936] outline-none placeholder:text-[#8b9ba2] focus:border-[#EF5D3F]" /></label><label className="block"><span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#55707d]">BIRTH DATE</span><input required name="birthDate" type="date" className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-sm text-[#102936] outline-none focus:border-[#EF5D3F]" /></label><label className="block"><span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#55707d]">BIRTH TIME</span><input required name="birthTime" type="time" className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-sm text-[#102936] outline-none focus:border-[#EF5D3F]" /></label><label className="block sm:col-span-2"><span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#55707d]">BIRTH LOCATION</span><input required name="birthLocation" placeholder="City, country" className="mt-2 h-12 w-full border-b border-[#102936]/25 bg-transparent px-0 font-sans text-base text-[#102936] outline-none placeholder:text-[#8b9ba2] focus:border-[#EF5D3F]" /></label></div>
            <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 border border-dashed border-[#102936]/20 bg-white/35 px-4 py-3 transition-colors hover:border-[#EF5D3F] disabled:cursor-not-allowed sm:px-5"><span className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#102936]/15 text-[#EF5D3F]"><FileUp size={15} /></span><span><span className="block font-mono text-[9px] font-semibold tracking-[0.12em] text-[#55707d]">PROFILE ASSET / OPTIONAL</span><span className="mt-1 block font-sans text-[11px] leading-4 text-[#46616d]">{myProfile.data ? "Attach a PNG, JPG, WEBP, or PDF under 7.5 MB." : "Save your field first, then attach a chart or report."}</span></span></span><span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-[#EF5D3F]">{uploadProfileAsset.isPending ? "UPLOADING…" : "ATTACH"}</span><input aria-label="Attach an optional Cosmic profile asset" disabled={!isAuthenticated || !myProfile.data || uploadProfileAsset.isPending} accept="image/jpeg,image/png,image/webp,application/pdf" type="file" className="sr-only" onChange={handleProfileAssetUpload} /></label>
            <button type="button" onClick={handlePatternBriefReport} disabled={!isAuthenticated || !myProfile.data || savePatternBriefReport.isPending} className="mt-3 flex w-full items-center justify-between gap-4 border border-[#102936]/15 bg-[#102936] px-4 py-3 text-left text-white transition-colors hover:bg-[#EF5D3F] disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"><span className="flex items-center gap-3"><FileText size={15} className="text-[#EF5D3F]" /><span><span className="block font-mono text-[9px] font-semibold tracking-[0.12em]">PATTERN BRIEF / TEXT REPORT</span><span className="mt-1 block font-sans text-[11px] leading-4 text-white/65">{myProfile.data ? "Store a dated copy of today’s brief in your private file history." : "Save your field to enable report exports."}</span></span></span><span className="font-mono text-[9px] font-semibold tracking-[0.12em]">{savePatternBriefReport.isPending ? "SAVING…" : "SAVE"}</span></button>
            <div className="mt-8 flex flex-col justify-between gap-5 border-t border-[#102936]/10 pt-5 sm:flex-row sm:items-center"><p className="max-w-[270px] font-sans text-[11px] leading-5 text-[#55707d]">Cosmic is designed to show its source signals, never to reduce you to a prediction.</p><Button type="submit" disabled={saveProfile.isPending} className="h-12 rounded-none bg-[#102936] px-5 font-sans text-[10px] font-bold tracking-[0.13em] text-white hover:bg-[#EF5D3F] disabled:cursor-wait disabled:opacity-60">{saveProfile.isPending ? "SAVING YOUR FIELD…" : "SAVE MY FIELD"} <Sparkles className="ml-2 h-4 w-4" /></Button></div>
          </form>
        </div>
      )}
    </main>
  );
}
