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
import NatalDetails from "./pages/NatalDetails";

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
      <Route path="/tarot/placement" component={TarotPage} />
      <Route path="/tarot" component={TarotPage} />
      <Route path="/palmistry" component={PalmistryPage} />
      <Route path="/numerology" component={Numerology} />
      <Route path="/compatibility" component={Compatibility} />
      <Route path="/natal-details" component={NatalDetails} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ChartDetailsShortcut() {
  const [location] = useLocation();
  if (location !== "/") return null;
  return <a href="/natal-details" className="fixed bottom-4 left-4 z-30 border border-[#102936]/15 bg-[#F3F0E9]/95 px-3 py-2 font-mono text-[8px] tracking-[.13em] text-[#55707d] shadow-sm transition-colors hover:border-[#B63C5E] hover:text-[#B63C5E]">CHART DETAILS ↗</a>;
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
