import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleProvider } from "@/hooks/useRole";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import RoutesPage from "./pages/RoutesPage";
import Cargo from "./pages/Cargo";
import Calculator from "./pages/Calculator";
import Viagens from "./pages/Viagens";
import Reports from "./pages/Reports";
import Simulations from "./pages/Simulations";
import SimulationCreate from "./pages/SimulationCreate";
import SimulationCompare from "./pages/SimulationCompare";
import Settings from "@/pages/Settings";
import Users from "@/pages/Users";
import Custos from "@/pages/Custos";
import Calculos from "@/pages/Calculos";
import ViagemDetalhe from "@/pages/ViagemDetalhe";
import Parameters from "@/pages/Parameters";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RoleProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Index />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/vehicles" element={
              <ProtectedRoute>
                <AppLayout>
                  <Vehicles />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/routes" element={
              <ProtectedRoute>
                <AppLayout>
                  <RoutesPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/cargo" element={
              <ProtectedRoute>
                <AppLayout>
                  <Cargo />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/calculator" element={
              <ProtectedRoute>
                <AppLayout>
                  <Calculator />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/viagens" element={
              <ProtectedRoute>
                <AppLayout>
                  <Viagens />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/viagens/:id" element={
              <ProtectedRoute>
                <AppLayout>
                  <ViagemDetalhe />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <AppLayout>
                  <Reports />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute>
                <AppLayout>
                  <Users />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/simulations" element={
              <ProtectedRoute>
                <AppLayout>
                  <Simulations />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/simulations/create" element={
              <ProtectedRoute>
                <AppLayout>
                  <SimulationCreate />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/simulations/compare/:id" element={
              <ProtectedRoute>
                <AppLayout>
                  <SimulationCompare />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/custos" element={
              <ProtectedRoute>
                <AppLayout>
                  <Custos />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/calculos" element={
              <ProtectedRoute>
                <AppLayout>
                  <Calculos />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/parameters" element={
              <ProtectedRoute>
                <AppLayout>
                  <Parameters />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </RoleProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
