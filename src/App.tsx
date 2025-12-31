import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import FarmersPage from "./pages/FarmersPage";
import ItemsPage from "./pages/ItemsPage";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage"; // Import the new Purchase Invoices Page
import SalesInvoicesPage from "./pages/SalesInvoicesPage"; // Import the new Sales Invoices Page
import ManufacturingExpensesPage from "./pages/ManufacturingExpensesPage";
import CashBankPage from "./pages/CashBankPage";
import ReportsPage from "./pages/ReportsPage";
import SyncBackupPage from "./pages/SyncBackupPage";
import UtilitiesPage from "./pages/UtilitiesPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/farmers" element={<FarmersPage />} />
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/purchase" element={<PurchaseInvoicesPage />} /> {/* Update route path */}
            <Route path="/sale" element={<SalesInvoicesPage />} /> {/* Update route path */}
            <Route path="/manufacturing-expenses" element={<ManufacturingExpensesPage />} />
            <Route path="/cash-bank" element={<CashBankPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/sync-backup" element={<SyncBackupPage />} />
            <Route path="/utilities" element={<UtilitiesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;