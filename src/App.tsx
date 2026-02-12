import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Anagrafiche from "@/pages/Anagrafiche";
import ClienteDettaglio from "@/pages/ClienteDettaglio";
import UploadExcel from "@/pages/UploadExcel";
import Marchi from "@/pages/Marchi";
import Provvigioni from "@/pages/Provvigioni";
import GestioneUtenti from "@/pages/GestioneUtenti";
import Auth from "@/pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
              <Route path="/anagrafiche" element={<Anagrafiche />} />
              <Route path="/anagrafiche/:codice" element={<ClienteDettaglio />} />
              <Route path="/marchi" element={<Marchi />} />
              <Route path="/provvigioni" element={<Provvigioni />} />
              <Route path="/upload" element={<UploadExcel />} />
              <Route path="/gestione-utenti" element={<GestioneUtenti />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
