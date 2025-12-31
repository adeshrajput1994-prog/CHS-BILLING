"use client";

import React from "react";
import Sidebar from "./Sidebar";
import { MadeWithDyad } from "./made-with-dyad";
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { selectedCompany, selectedFinancialYear } = useCompany();

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-col flex-1">
        {/* Dynamic Header for Company Info */}
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700 print-hide">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              {selectedCompany ? (
                <>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCompany.name}</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCompany.address}</p>
                </>
              ) : (
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">No Company Selected</h1>
              )}
            </div>
            {selectedFinancialYear && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Financial Year: <span className="font-semibold">{selectedFinancialYear}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default Layout;