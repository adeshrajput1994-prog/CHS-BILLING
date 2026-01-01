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
import CompanySettingsPage from "./pages/CompanySettingsPage"; // Import the new CompanySettingsPage
import NotFound from "./pages/NotFound";
import { CompanyProvider } from "./context/CompanyContext"; // Import CompanyProvider
import { ThemeProvider } from "./components/ThemeProvider"; // Import ThemeProvider
import { migrateLocalStorageToFirestore } from "./utils/migrateToFirestore"; // Import the migration utility
import React, { useState } from "react"; // Import React and useState

const queryClient = new QueryClient();

const App = () => {
  const [migrationAttempted, setMigrationAttempted] = useState(false);

  const handleMigrateData = async () => {
    if (!migrationAttempted) {
      await migrateLocalStorageToFirestore();
      setMigrationAttempted(true);
      // Optionally, you might want to refresh the page after migration to ensure all components re-fetch data from Firestore
      // setTimeout(() => window.location.reload(), 2000);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CompanyProvider>
              <Layout>
                {/* Migration Button - Render only if migration hasn't been attempted */}
                {!migrationAttempted && (
                  <div className="fixed bottom-4 right-4 z-50">
                    <button
                      onClick={handleMigrateData}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-full shadow-lg"
                    >
                      Migrate Local Data to Cloud
                    </button>
                  </div>
                )}
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