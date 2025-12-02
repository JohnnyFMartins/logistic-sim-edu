import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Vehicles from "./pages/Vehicles";
import RoutesPage from "./pages/RoutesPage";
import Cargo from "./pages/Cargo";
import Pedidos from "./pages/Pedidos";
import Settings from "@/pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute><AppLayout><Vehicles /></AppLayout></ProtectedRoute>} />
            <Route path="/routes" element={<ProtectedRoute><AppLayout><RoutesPage /></AppLayout></ProtectedRoute>} />
            <Route path="/cargo" element={<ProtectedRoute><AppLayout><Cargo /></AppLayout></ProtectedRoute>} />
            <Route path="/pedidos" element={<ProtectedRoute><AppLayout><Pedidos /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
