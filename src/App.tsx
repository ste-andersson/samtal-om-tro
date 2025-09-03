
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CaseProvider } from "@/contexts/CaseContext";
import Index from "./pages/Index";
import Cases from "./pages/Cases";
import Checklist from "./pages/Checklist";
import Files from "./pages/Files";
import NotFound from "./pages/NotFound";
import ProjectDetails from "./pages/ProjectDetails";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CaseProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/files" element={<Files />} />
            <Route path="/project-details/:conversationId" element={<ProjectDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </CaseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
