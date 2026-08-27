import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { buildNatalPatternReading } from "@/lib/natalPatterns";
import { Check, Sparkles } from "lucide-react";
import React, { useMemo, useState } from "react";

function localDateKey() {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default function DailyRitual() {
  const [noted, setNoted] = useState(false);
  const { isAuthenticated } = useAuth();
  const chart = trpc.cosmic.getNatalChart.useQuery(undefined, { enabled: isAuthenticated });
  const date = useMemo(localDateKey, []);
  const pattern = buildNatalPatternReading(chart.data?.chartData, date);

  return <section className="border-y border-[#102936]/10 bg-[#EDE5F0]/45 px-5 py-12 md:px-9"><div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-[.8fr_1.2fr] md:items-end"><div><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#B63C5E]">TODAY / PRIVATE PATTERN PRACTICE</p><h2 className="mt-4 font-serif text-5xl leading-[.9] tracking-[-.06em]">A return, not a streak.</h2><p className="mt-5 max-w-md font-sans text-[15px] leading-7 text-[#604D67]">Come back when it is useful. Each teaching is generated on demand from your calculated natal pattern and today’s date; it does not send prompts, create a score, or save a new record.</p></div><article className="border border-[#102936]/15 bg-[#F6F0E5] p-6 shadow-[-7px_8px_0_#B63C5E]"><p className="flex items-center gap-2 font-mono text-[9px] tracking-[.14em] text-[#B63C5E]"><Sparkles size={14} /> {pattern ? "TODAY’S PATTERN TEACHING" : "ONE SMALL QUESTION"}</p>{!isAuthenticated ? <><p className="mt-5 font-serif text-3xl leading-[.98]">Your daily teaching is private.</p><p className="mt-4 font-sans text-[13px] leading-6 text-[#604D67]">Sign in and calculate your natal chart to receive a practice aligned to your own pattern.</p><button onClick={startLogin} className="mt-6 font-mono text-[9px] font-semibold tracking-[.14em] text-[#102936] hover:text-[#B63C5E]">SIGN IN TO YOUR PRIVATE HOME →</button></> : chart.isLoading ? <p className="mt-5 font-serif text-3xl leading-[.98]">Preparing your pattern…</p> : pattern ? <><h3 className="mt-5 font-serif text-3xl leading-[.98]">{pattern.teaching.title}</h3><p className="mt-4 font-sans text-[13px] leading-6 text-[#604D67]">{pattern.teaching.pattern}</p><div className="mt-5 border-y border-[#102936]/10 py-4"><p className="font-mono text-[8px] tracking-[.14em] text-[#B63C5E]">PRACTICE</p><p className="mt-2 font-sans text-[14px] leading-6 text-[#102936]">{pattern.teaching.practice}</p></div><p className="mt-5 font-serif text-2xl leading-[1.02]">{pattern.teaching.question}</p><button onClick={() => setNoted(value => !value)} className={`mt-6 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] ${noted ? "text-[#B63C5E]" : "text-[#102936] hover:text-[#B63C5E]"}`}>{noted ? <Check size={15} /> : <span className="h-3.5 w-3.5 border border-current" />}{noted ? "NOTED FOR MYSELF" : "MARK AS NOTICED"}</button><p className="mt-4 font-sans text-[11px] leading-5 text-[#604D67]">{pattern.teaching.note}</p></> : <><p className="mt-5 font-serif text-3xl leading-[.98]">Start with your natal chart.</p><p className="mt-4 font-sans text-[13px] leading-6 text-[#604D67]">Once your private chart is calculated, this space will turn its placements into a daily practice.</p><a href="/" className="mt-6 inline-block font-mono text-[9px] font-semibold tracking-[.14em] text-[#102936] hover:text-[#B63C5E]">OPEN YOUR NATAL CHART →</a></>}</article></div></section>;
}
