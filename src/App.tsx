import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SongbookView from "./pages/SongbookView";
import SongView from "./pages/SongView";
import PresentationMode from "./pages/PresentationMode";
import EditSong from "./pages/EditSong";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/songbook/:id" element={<SongbookView />} />
          <Route path="/songbook/:id/add" element={<EditSong />} />
          <Route path="/song/:number" element={<SongView />} />
          <Route path="/song/:number/edit" element={<EditSong />} />
          <Route path="/presentation" element={<PresentationMode />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
