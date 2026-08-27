/**
 * Astral Index visual system: this top-level app fixes the Cosmic experience in its warm,
 * editorial paper-and-ink theme so the reading interface stays visually coherent.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const TarotStudio = lazy(() => import("./pages/ReadingStudio").then(module => ({ default: module.TarotStudio })));
const Account = lazy(() => import("./pages/Account"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const Compatibility = lazy(() => import("./pages/Compatibility"));
const DailyRitualPage = lazy(() => import("./pages/DailyRitualPage"));
const NatalDetails = lazy(() => import("./pages/NatalDetails"));
const Numerology = lazy(() => import("./pages/Numerology"));
const PalmistryBeta = lazy(() => import("./pages/PalmistryBeta"));

function StudioLoading() {
  return <main aria-busy="true" aria-live="polite" className="cosmic-route-loading flex min-h-screen items-center justify-center bg-[#F3F0E9] px-5 text-[#102936]"><div role="status" className="cosmic-route-loading__panel border border-[#102936]/15 bg-white/50 px-8 py-9 text-center shadow-sm"><div aria-hidden="true" className="cosmic-route-loading__orbit mx-auto mb-5 flex h-11 w-11 items-center justify-center border border-[#B63C5E]/50"><span className="block h-2 w-2 rounded-full bg-[#B63C5E]" /></div><p className="font-mono text-[10px] font-semibold tracking-[.16em]">OPENING YOUR COSMIC LENS…</p><p className="mt-3 font-sans text-xs text-[#6E6079]">Preparing a private reading surface.</p></div></main>;
}

function RouteTransition({ children }: { children: ReactNode }) {
  return <div className="cosmic-route-enter">{children}</div>;
}

function loadPage(Page: ComponentType) {
  return function LazyCosmicPage() {
    return <Suspense fallback={<StudioLoading />}><RouteTransition><Page /></RouteTransition></Suspense>;
  };
}

function TarotPage() {
  return <Suspense fallback={<StudioLoading />}><RouteTransition><TarotStudio /></RouteTransition></Suspense>;
}

const AccountPage = loadPage(Account);
const AccountSettingsPage = loadPage(AccountSettings);
const CompatibilityPage = loadPage(Compatibility);
const DailyRitual = loadPage(DailyRitualPage);
const NatalDetailsPage = loadPage(NatalDetails);
const NumerologyPage = loadPage(Numerology);
const PalmistryPage = loadPage(PalmistryBeta);

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/account" component={AccountPage} />
      <Route path="/account/settings" component={AccountSettingsPage} />
      <Route path="/tarot/placement" component={TarotPage} />
      <Route path="/tarot" component={TarotPage} />
      <Route path="/palmistry" component={PalmistryPage} />
      <Route path="/numerology" component={NumerologyPage} />
      <Route path="/compatibility" component={CompatibilityPage} />
      <Route path="/natal-details" component={NatalDetailsPage} />
      <Route path="/daily-ritual" component={DailyRitual} />
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
