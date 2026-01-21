import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import FarmersPage from "./pages/FarmersPage";
import ItemsPage from "./pages/ItemsPage";
import PurchaseInvoicesPage from "./pages/PurchaseInvoicesPage";
import SalesInvoicesPage from "./pages/SalesInvoicesPage";
import ManufacturingExpensesPage from "./pages/ManufacturingExpensesPage";
import CashBankPage from "./pages/CashBankPage";
import ExpensesPage from "./pages/ExpensesPage"; // New import
import ReportsPage from "./pages/ReportsPage";
import SyncBackupPage from "./pages/SyncBackupPage";
import UtilitiesPage from "./pages/UtilitiesPage";
import SettingsPage from "./pages/SettingsPage";
import CompanySettingsPage from "./pages/CompanySettingsPage";
import NotFound from "./pages/NotFound";
import { CompanyProvider } from "./context/CompanyContext";
import { ThemeProvider } from "./components/ThemeProvider";
import React from "react";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <CompanyProvider>
            <BrowserRouter>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/farmers" element={<FarmersPage />} />
                  <Route path="/items" element={<ItemsPage />} />
                  <Route path="/purchase" element={<PurchaseInvoicesPage />} />
                  <Route path="/sale" element={<SalesInvoicesPage />} />
                  <Route path="/manufacturing-expenses" element={<ManufacturingExpensesPage />} />
                  <Route path="/cash-bank" element={<CashBankPage />} />
                  <Route path="/expenses" element={<ExpensesPage />} /> {/* New Route */}
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/sync-backup" element={<SyncBackupPage />} />
                  <Route path="/utilities" element={<UtilitiesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/company-settings" element={<CompanySettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </CompanyProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;