/**
 * Astral Index visual system: this top-level app fixes the Cosmic experience in its warm,
 * editorial paper-and-ink theme so the reading interface stays visually coherent.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Numerology from "./pages/Numerology";
import PalmistryBeta from "./pages/PalmistryBeta";
import Compatibility from "./pages/Compatibility";
import Account from "./pages/Account";
import AccountSettings from "./pages/AccountSettings";
import NatalDetails from "./pages/NatalDetails";
import DailyRitualPage from "./pages/DailyRitualPage";

const TarotStudio = lazy(() => import("./pages/ReadingStudio").then(module => ({ default: module.TarotStudio })));
const PalmistryStudio = lazy(() => import("./pages/ReadingStudio").then(module => ({ default: module.PalmistryStudio })));

function StudioLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#F3F0E9] text-[#102936]"><p className="font-mono text-[10px] font-semibold tracking-[.16em]">OPENING COSMIC STUDIO…</p></main>;
}

function TarotPage() {
  return <Suspense fallback={<StudioLoading />}><TarotStudio /></Suspense>;
}

function PalmistryPage() {
  return <PalmistryBeta />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/account" component={Account} />
      <Route path="/account/settings" component={AccountSettings} />
      <Route path="/tarot/placement" component={TarotPage} />
      <Route path="/tarot" component={TarotPage} />
      <Route path="/palmistry" component={PalmistryPage} />
      <Route path="/numerology" component={Numerology} />
      <Route path="/compatibility" component={Compatibility} />
      <Route path="/natal-details" component={NatalDetails} />
      <Route path="/daily-ritual" component={DailyRitualPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ChartDetailsShortcut() {
  const [location] = useLocation();
  if (location !== "/") return null;
  return <div className="fixed bottom-4 left-4 z-30 flex flex-wrap gap-2"><a href="/natal-details" className="border border-[#102936]/15 bg-[#F3F0E9]/95 px-3 py-2 font-mono text-[8px] tracking-[.13em] text-[#55707d] shadow-sm transition-colors hover:border-[#B63C5E] hover:text-[#B63C5E]">CHART DETAILS ↗</a><a href="/daily-ritual" className="border border-[#102936]/15 bg-[#F3F0E9]/95 px-3 py-2 font-mono text-[8px] tracking-[.13em] text-[#55707d] shadow-sm transition-colors hover:border-[#B63C5E] hover:text-[#B63C5E]">DAILY RITUAL ↗</a><a href="/account/settings" className="border border-[#102936]/15 bg-[#F3F0E9]/95 px-3 py-2 font-mono text-[8px] tracking-[.13em] text-[#55707d] shadow-sm transition-colors hover:border-[#B63C5E] hover:text-[#B63C5E]">ACCOUNT SETTINGS ↗</a></div>;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster theme="light" richColors position="bottom-right" />
          <Router />
          <ChartDetailsShortcut />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
