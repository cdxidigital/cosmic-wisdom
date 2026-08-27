/**
 * Astral Index visual system: this top-level app fixes the Cosmic experience in its warm,
 * editorial paper-and-ink theme so the reading interface stays visually coherent.
 */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { lazy, Suspense, type ComponentType } from "react";
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
const SavedItems = lazy(() => import("./pages/SavedItems"));

function StudioLoading() {
  return <main className="flex min-h-screen items-center justify-center bg-[#F3F0E9] text-[#102936]"><p className="font-mono text-[10px] font-semibold tracking-[.16em]">OPENING COSMIC STUDIO…</p></main>;
}

function loadPage(Page: ComponentType) {
  return function LazyCosmicPage() {
    return <Suspense fallback={<StudioLoading />}><Page /></Suspense>;
  };
}

function TarotPage() {
  return <Suspense fallback={<StudioLoading />}><TarotStudio /></Suspense>;
}

const AccountPage = loadPage(Account);
const AccountSettingsPage = loadPage(AccountSettings);
const CompatibilityPage = loadPage(Compatibility);
const DailyRitual = loadPage(DailyRitualPage);
const NatalDetailsPage = loadPage(NatalDetails);
const NumerologyPage = loadPage(Numerology);
const PalmistryPage = loadPage(PalmistryBeta);
const SavedItemsPage = loadPage(SavedItems);

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
      <Route path="/saved" component={SavedItemsPage} />
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
        <ThemeProvider defaultTheme="paper" switchable>
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
