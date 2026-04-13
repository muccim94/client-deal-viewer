import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import { Loader2 } from "lucide-react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const FatturatoRiepilogo = lazy(() => import("@/pages/FatturatoRiepilogo"));
const Anagrafiche = lazy(() => import("@/pages/Anagrafiche"));
const IncentivazioniBrowser = lazy(() => import("@/pages/IncentivazioniBrowser"));
const ClienteDettaglio = lazy(() => import("@/pages/ClienteDettaglio"));
const ClienteMarchi = lazy(() => import("@/pages/ClienteMarchi"));
const UploadExcel = lazy(() => import("@/pages/UploadExcel"));
const Marchi = lazy(() => import("@/pages/Marchi"));
const MarchioDettaglio = lazy(() => import("@/pages/MarchioDettaglio"));
const Provvigioni = lazy(() => import("@/pages/Provvigioni"));
const Budget = lazy(() => import("@/pages/Budget"));
const GestioneUtenti = lazy(() => import("@/pages/GestioneUtenti"));
import Auth from "@/pages/Auth";
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route
                element={
                  <ProtectedRoute>
                    <DataProvider>
                      <AppLayout />
                    </DataProvider>
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Dashboard />} />
                <Route path="/fatturato" element={<FatturatoRiepilogo />} />
                <Route path="/anagrafiche" element={<Anagrafiche />} />
                <Route path="/anagrafiche/incentivazioni" element={<IncentivazioniBrowser />} />
                <Route path="/anagrafiche/:codice" element={<ClienteDettaglio />} />
                <Route path="/anagrafiche/:codice/marchi" element={<ClienteMarchi />} />
                <Route path="/marchi" element={<Marchi />} />
                <Route path="/marchi/:famiglia" element={<MarchioDettaglio />} />
                <Route path="/provvigioni" element={<Provvigioni />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/upload" element={<UploadExcel />} />
                <Route path="/gestione-utenti" element={<GestioneUtenti />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
