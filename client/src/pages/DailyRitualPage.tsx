import DailyRitual from "@/components/DailyRitual";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function DailyRitualPage() {
  return <main className="min-h-screen bg-[#F3F0E9] text-[#102936]"><header className="border-b border-[#102936]/10"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-3 font-mono text-[10px] tracking-[.14em]"><ArrowLeft size={14} /> COSMIC WISDOM</Link><span className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">DAILY / OPTIONAL</span></div></header><DailyRitual /></main>;
}
