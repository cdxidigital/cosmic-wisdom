import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Camera, CameraOff, Check, Hand, LockKeyhole, ScanLine } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

const prompts = [
  ["Heart line", "Notice whether the upper line feels direct, curved, or interrupted.", "Use this as a prompt about expression, boundaries, and the care you want to make visible."],
  ["Head line", "Notice its direction and spacing without measuring or diagnosing.", "Use this to reflect on attention, learning, and how you make a decision when several choices compete."],
  ["Life line", "Trace the broad arc around the thumb base with your eyes.", "This is a symbolic prompt about energy stewardship and support, never a statement about health or longevity."],
  ["Fate line", "If a vertical line appears, let it prompt a question about direction.", "Consider agency, chosen commitments, and the structures that make your work feel more like your own."],
] as const;

export default function PalmistryBeta() {
  const { isAuthenticated } = useAuth();
  const [consent, setConsent] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [selected, setSelected] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { data: profile } = trpc.cosmic.getMyProfile.useQuery(undefined, { enabled: isAuthenticated });
  const save = trpc.cosmic.saveReading.useMutation({ onSuccess: () => toast("Reflection saved", { description: "Only your chosen prompt was saved—never a palm image." }), onError: error => toast("We couldn’t save this reflection", { description: error.message }) });
  const stop = () => { streamRef.current?.getTracks().forEach(track => track.stop()); streamRef.current = null; setCameraActive(false); };
  useEffect(() => () => stop(), []);
  const start = async () => {
    if (!consent) { toast("Confirm camera consent first", { description: "Guidance is optional and remains on your device." }); return; }
    try {
      const stream = await navigator.mediaDevices?.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      if (!stream) throw new Error("Camera unavailable");
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setFallback(false); setCameraActive(true);
    } catch { stop(); setFallback(true); }
  };
  const usePrompts = () => document.getElementById("palm-prompts")?.scrollIntoView({ behavior: "smooth" });
  const [title, question, reflection] = prompts[selected];
  const persist = () => {
    if (!isAuthenticated) { startLogin(); return; }
    save.mutate({ profileId: profile?.id ?? null, readingType: "palmistry", title: `${title} reflection`, readingContext: title.toLowerCase(), narrative: reflection, inputData: { line: title, cameraGuidanceUsed: cameraActive, cameraMediaStored: false }, consentAccepted: true, consentVersion: "camera-guidance-v1" });
  };
  return <main className="min-h-screen bg-[#211B2A] text-[#F6F0E5]"><header className="border-b border-white/10 bg-[#211B2A]/90"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link href="/" className="flex items-center gap-3 font-mono text-[10px] tracking-[.15em]"><ArrowLeft size={14} /> COSMIC WISDOM</Link><span className="font-mono text-[9px] tracking-[.14em] text-[#E1A0B1]">PALMISTRY / BETA</span></div></header><section className="mx-auto grid max-w-6xl gap-9 px-5 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16"><div><p className="font-mono text-[10px] font-semibold tracking-[.16em] text-[#E1A0B1]">PALM GUIDE / OPTIONAL CAMERA</p><h1 className="mt-5 max-w-xl font-serif text-6xl leading-[.84] tracking-[-.065em]">Observe the hand. Keep the meaning yours.</h1><p className="mt-6 max-w-xl font-sans text-[16px] leading-7 text-[#D9D1EF]">Camera guidance simply helps frame your palm. It is not biometric recognition, image analysis, or a prediction engine.</p><label className="mt-7 flex gap-3 border border-white/15 bg-white/5 p-4"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} className="mt-1 accent-[#B63C5E]" /><span className="font-sans text-[13px] leading-5">I consent to temporary on-device camera guidance. <span className="block text-[#D9D1EF]">No palm image, face data, identity data, or biometric template is uploaded or retained.</span></span></label><div className="relative mt-5 aspect-[4/3] overflow-hidden border border-white/15 bg-[#120F17]"><video ref={videoRef} muted playsInline className={`h-full w-full object-cover ${cameraActive ? "opacity-100" : "opacity-20"}`} /><div className="pointer-events-none absolute inset-0 grid place-items-center"><div className="relative h-[74%] w-[45%] rounded-[48%] border-2 border-dashed border-[#E1A0B1]"><Hand className="absolute -left-5 -top-5 text-[#E1A0B1]" /><span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#211B2A] px-3 py-2 font-mono text-[9px] tracking-[.14em]">PLACE PALM IN FRAME</span></div></div>{!cameraActive && <ScanLine className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#E1A0B1]" size={36} />}</div>{fallback && <aside role="alert" className="mt-4 border border-[#E1A0B1]/45 bg-white/10 p-5"><p className="font-mono text-[9px] font-semibold tracking-[.14em] text-[#E1A0B1]">CAMERA ACCESS NOT GRANTED</p><h2 className="mt-3 font-serif text-3xl leading-none">Your reflection does not depend on camera access.</h2><p className="mt-3 font-sans text-[13px] leading-6 text-[#D9D1EF]">Nothing was captured, uploaded, or stored when access was declined. Continue with the prompts below, or retry after updating browser permissions.</p><ol className="mt-4 grid gap-2 font-sans text-[12px] sm:grid-cols-3"><li><b className="text-[#E1A0B1]">01</b> Find comfortable light.</li><li><b className="text-[#E1A0B1]">02</b> Choose one line.</li><li><b className="text-[#E1A0B1]">03</b> Keep the question private.</li></ol><div className="mt-5 flex flex-wrap gap-3"><Button onClick={start} className="rounded-none bg-[#B63C5E] font-mono text-[9px] tracking-[.13em]">TRY CAMERA AGAIN</Button><Button variant="outline" onClick={usePrompts} className="rounded-none border-white/30 bg-transparent font-mono text-[9px] tracking-[.13em] text-white">USE NO-CAMERA PROMPTS</Button></div></aside>}<div className="mt-5 flex flex-wrap gap-3"><Button onClick={cameraActive ? stop : start} className="rounded-none bg-[#B63C5E] font-mono text-[9px] tracking-[.13em]">{cameraActive ? <><CameraOff className="mr-2" size={14} />STOP GUIDE</> : <><Camera className="mr-2" size={14} />START CAMERA GUIDE</>}</Button><span className="flex items-center gap-2 font-mono text-[9px] tracking-[.13em] text-[#D9D1EF]"><Check size={14} /> ON-DEVICE / NO RAW IMAGE RETENTION</span></div></div><aside id="palm-prompts" className="border border-white/15 bg-[#F6F0E5] p-6 text-[#261F32] md:p-8"><p className="font-mono text-[10px] font-semibold tracking-[.16em] text-[#B63C5E]">REFLECTIVE LINE MAP</p><p className="mt-4 font-sans text-[13px] leading-6 text-[#604D67]">Choose one line to observe. The guide offers symbolic language only; it does not predict health, identity, longevity, or a fixed future.</p><div className="mt-6 grid gap-2">{prompts.map(([name, prompt], index) => <button key={name} onClick={() => setSelected(index)} className={`border p-4 text-left ${selected === index ? "border-[#261F32] bg-[#261F32] text-white" : "border-[#261F32]/10 bg-white"}`}><p className="font-mono text-[9px] tracking-[.14em] text-[#B63C5E]">{name.toUpperCase()}</p><p className="mt-2 font-sans text-[12px] leading-5">{prompt}</p></button>)}</div><article className="mt-7 border-t border-[#261F32]/10 pt-6"><p className="font-serif text-3xl leading-[.98]">{reflection}</p><Button onClick={persist} disabled={save.isPending} className="mt-6 rounded-none bg-[#261F32] font-mono text-[9px] tracking-[.13em]">{save.isPending ? "SAVING…" : "SAVE PRIVATE REFLECTION"}</Button></article><div className="mt-6 flex gap-3 border border-[#261F32]/10 bg-white/60 p-4"><LockKeyhole size={16} className="text-[#B63C5E]" /><p className="font-sans text-[12px] leading-5">Saved reflections are private to your account. Camera guidance never retains raw imagery.</p></div></aside></section></main>;
}
