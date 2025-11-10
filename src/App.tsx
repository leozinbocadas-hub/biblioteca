import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SupportButton } from "@/components/SupportButton";
import { InstallPWA } from "@/components/InstallPWA";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Module from "./pages/Module";
import Feed from "./pages/Feed";
import Comunidade from "./pages/Comunidade";
import Perfil from "./pages/Perfil";
import Notificacoes from "./pages/Notificacoes";
import RoboOculto from "./pages/RoboOculto";
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
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/modulo/:slug" element={<Module />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/comunidade" element={<Comunidade />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/notificacoes" element={<Notificacoes />} />
            <Route path="/robo-oculto" element={<RoboOculto />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SupportButton />
          <InstallPWA />
          <UpdatePrompt />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
