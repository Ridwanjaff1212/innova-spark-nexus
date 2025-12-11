import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";
import Auth from "./pages/Auth";
import MainLayout from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectUpload from "./pages/ProjectUpload";
import CreativeHub from "./pages/CreativeHub";
import Teams from "./pages/Teams";
import Achievements from "./pages/Achievements";
import Events from "./pages/Events";
import Admin from "./pages/Admin";
import AIAssistant from "./pages/AIAssistant";
import CodeAssistant from "./pages/CodeAssistant";
import CodeHub from "./pages/CodeHub";
import CodeBattle from "./pages/CodeBattle";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  if (isLoading) {
    return <LoadingScreen onComplete={() => setIsLoading(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/projects/new" element={<ProjectUpload />} />
                <Route path="/creative-hub" element={<CreativeHub />} />
                <Route path="/code-hub" element={<CodeHub />} />
                <Route path="/teams" element={<Teams />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/events" element={<Events />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/assistant" element={<AIAssistant />} />
                <Route path="/code-assistant" element={<CodeAssistant />} />
                <Route path="/code-battle" element={<CodeBattle />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;