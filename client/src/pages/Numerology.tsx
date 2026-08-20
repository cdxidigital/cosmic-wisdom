import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Link } from "wouter";

export function reduceNumber(value: number): number {
  let result = value;
  while (result > 9 && result !== 11 && result !== 22 && result !== 33) {
    result = String(result).split("").reduce((total, digit) => total + Number(digit), 0);
  }
  return result;
}

export function calculateLifePath(date: string) {
  return reduceNumber(date.replace(/\D/g, "").split("").reduce((total, digit) => total + Number(digit), 0));
}

export function calculatePersonalYear(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  const currentYearDigits = String(new Date().getFullYear()).split("").reduce((total, digit) => total + Number(digit), 0);
  return reduceNumber(month + day + currentYearDigits);
}

const meanings: Record<number, { title: string; copy: string }> = {
  1: { title: "The initiator", copy: "You are invited to build self-trust through clear beginnings and original action." },
  2: { title: "The harmoniser", copy: "Your path often develops through listening, partnership, patience, and responsive timing." },
  3: { title: "The expressive", copy: "Expression, imagination, and connection are useful channels for your energy." },
  4: { title: "The builder", copy: "You tend to find strength in rhythm, practical systems, and steady commitments." },
  5: { title: "The explorer", copy: "Change, curiosity, and lived experience can become productive teachers for you." },
  6: { title: "The steward", copy: "Care, responsibility, and creating a sense of home can be important themes." },
  7: { title: "The seeker", copy: "Reflection, depth, and time alone can help you make sense of the world." },
  8: { title: "The organiser", copy: "You may learn through stewardship of resources, influence, and long-term goals." },
  9: { title: "The humanist", copy: "Compassion, perspective, and bringing a cycle to completion can be meaningful themes." },
  11: { title: "The illuminator", copy: "Sensitivity and imagination can become a source of insight when given practical grounding." },
  22: { title: "The master builder", copy: "A large vision can become useful when it is translated into patient, concrete systems." },
  33: { title: "The compassionate guide", copy: "Care and creative service can become powerful when balanced with honest boundaries." },
};

export default function Numerology() {
  const { isAuthenticated } = useAuth();
  const profileQuery = trpc.cosmic.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const profile = profileQuery.data;
  const lifePath = profile?.birthDate ? calculateLifePath(profile.birthDate) : null;
  const personalYear = profile?.birthDate ? calculatePersonalYear(profile.birthDate) : null;
  const meaning = lifePath ? meanings[lifePath] : null;

  return (
    <main className="min-h-screen bg-[#F3F0E9] px-5 py-6 text-[#102936] md:px-9 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between border-b border-[#102936]/10 pb-5">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[.14em] text-[#55707d] hover:text-[#EF5D3F]"><ArrowLeft size={14} /> MY MYSTIC HOME</Link>
          <span className="font-sans text-[10px] font-extrabold tracking-[.3em]">COSMIC</span>
        </header>

        {!profile ? (
          <section className="grid min-h-[70vh] place-items-center py-16 text-center">
            <div className="max-w-xl"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">NUMEROLOGY / YOUR PROFILE IS THE START</p><h1 className="mt-5 font-serif text-5xl leading-[.9] tracking-[-.06em] md:text-7xl">Your numbers begin with your birthday.</h1><p className="mx-auto mt-6 max-w-md font-sans text-[15px] leading-7 text-[#55707d]">Create one private profile in Cosmic and your birth date becomes the basis for your Life Path and year cycle.</p><Link href="/" className="mt-8 inline-flex h-12 items-center gap-2 bg-[#211B2A] px-6 font-mono text-[9px] tracking-[.14em] text-white hover:bg-[#EF5D3F]">CREATE MY PROFILE <ArrowRight size={14} /></Link></div>
          </section>
        ) : (
          <>
            <section className="py-14 md:py-20"><p className="font-mono text-[9px] font-semibold tracking-[.15em] text-[#EF5D3F]">NUMEROLOGY / SIMPLE PATTERN LENS</p><h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[.9] tracking-[-.06em] md:text-7xl">Hi {profile.displayName.split(" ")[0]}. Here are two useful numbers to start with.</h1><p className="mt-6 max-w-2xl font-sans text-[15px] leading-7 text-[#55707d]">These are symbolic reflections derived from your saved birth date. Keep what is useful and leave the rest.</p></section>
            <div className="grid gap-4 md:grid-cols-2"><article className="bg-[#211B2A] p-7 text-[#F3F0E9] shadow-[-10px_12px_0_#EF5D3F] md:p-10"><p className="font-mono text-[9px] tracking-[.14em] text-[#E1A0B1]">YOUR LIFE PATH</p><p className="mt-10 font-serif text-8xl leading-none tracking-[-.08em]">{lifePath}</p><h2 className="mt-7 font-serif text-4xl leading-none tracking-[-.05em]">{meaning?.title}</h2><p className="mt-5 max-w-md font-sans text-[14px] leading-6 text-[#D9D1EF]">{meaning?.copy}</p></article><article className="border border-[#102936]/15 bg-white/50 p-7 md:p-10"><p className="font-mono text-[9px] tracking-[.14em] text-[#EF5D3F]">YOUR {new Date().getFullYear()} PERSONAL YEAR</p><p className="mt-10 font-serif text-8xl leading-none tracking-[-.08em]">{personalYear}</p><h2 className="mt-7 font-serif text-4xl leading-none tracking-[-.05em]">A year to work with your current rhythm.</h2><p className="mt-5 max-w-md font-sans text-[14px] leading-6 text-[#55707d]">Use this number as a gentle prompt: notice where your life asks for new initiative, relationship, expression, structure, change, care, reflection, stewardship, or completion.</p></article></div>
            <section className="mt-14 border-t border-[#102936]/10 pt-8"><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#55707d]">YOUR DIGITAL MYSTIC HOME</p><div className="mt-4 grid gap-3 md:grid-cols-3"><Link href="/" className="flex items-center justify-between border border-[#102936]/15 bg-white/45 p-5 font-mono text-[10px] tracking-[.12em] hover:border-[#EF5D3F]">NATAL CHART <ArrowRight size={14} /></Link><Link href="/tarot" className="flex items-center justify-between border border-[#102936]/15 bg-white/45 p-5 font-mono text-[10px] tracking-[.12em] hover:border-[#EF5D3F]">TAROT <ArrowRight size={14} /></Link><Link href="/palmistry" className="flex items-center justify-between border border-[#102936]/15 bg-white/45 p-5 font-mono text-[10px] tracking-[.12em] hover:border-[#EF5D3F]">PALMISTRY <ArrowRight size={14} /></Link></div></section>
          </>
        )}
        <footer className="mt-16 border-t border-[#102936]/10 py-6 font-mono text-[8px] tracking-[.14em] text-[#55707d]"><span className="inline-flex items-center gap-2"><Sparkles size={12} className="text-[#EF5D3F]" /> COSMIC / A DIGITAL MYSTIC HOME</span></footer>
      </div>
    </main>
  );
}
