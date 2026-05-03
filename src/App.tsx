import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Title from "./pages/Title.tsx";
import Browse from "./pages/Browse.tsx";
import Library from "./pages/Library.tsx";
import Profile from "./pages/Profile.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import Analytics from "./pages/admin/Analytics.tsx";
import Content from "./pages/admin/Content.tsx";
import Coupons from "./pages/admin/Coupons.tsx";
import Users from "./pages/admin/Users.tsx";
import Support from "./pages/admin/Support.tsx";
import Payments from "./pages/admin/Payments.tsx";
import Settings from "./pages/admin/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/title/:id" element={<Title />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/library" element={<Library />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Analytics />} />
            <Route path="content" element={<Content />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="users" element={<Users />} />
            <Route path="support" element={<Support />} />
            <Route path="payments" element={<Payments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
