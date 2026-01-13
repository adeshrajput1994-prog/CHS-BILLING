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
import ReportsPage from "./pages/ReportsPage";
import SyncBackupPage from "./pages/SyncBackupPage";
import UtilitiesPage from "./pages/UtilitiesPage";
import SettingsPage from "./pages/SettingsPage";
import CompanySettingsPage from "./pages/CompanySettingsPage";
import NotFound from "./pages/NotFound";
import { CompanyProvider } from "./context/CompanyContext";
import { ThemeProvider } from "./components/ThemeProvider";
// import { migrateLocalStorageToFirestore } from "./utils/migrateToFirestore"; // Removed import
import React, { useState, useEffect } from "react"; // Added useEffect

const queryClient = new QueryClient();

const App = () => {
  // const [migrationAttempted, setMigrationAttempted] = useState(false); // Removed state

  // Removed handleMigrateData function

  // Optional: You could add a useEffect here to trigger migration once if needed,
  // but it's generally better to handle migration as a one-time script or on first run.
  // For now, we'll assume migration is handled externally or not needed after initial setup.

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CompanyProvider>
              <Layout>
                {/* Migration Button removed */}
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/farmers" element={<FarmersPage />} />
                  <Route path="/items" element={<ItemsPage />} />
                  <Route path="/purchase" element={<PurchaseInvoicesPage />} />
                  <Route path="/sale" element={<SalesInvoicesPage />} />
                  <Route path="/manufacturing-expenses" element={<ManufacturingExpensesPage />} />
                  <Route path="/cash-bank" element={<CashBankPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/sync-backup" element={<SyncBackupPage />} />
                  <Route path="/utilities" element={<UtilitiesPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/company-settings" element={<CompanySettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </CompanyProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;