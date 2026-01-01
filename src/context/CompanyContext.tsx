"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { useFirestore } from '@/hooks/use-firestore'; // Import useFirestore hook

interface Company {
  id: string;
  name: string;
  address: string;
  financialYears: string[]; // e.g., ["2023-2024", "2024-2025"]
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  selectedFinancialYear: string | null;
  addCompany: (name: string, address: string, startYear: number) => void;
  selectCompany: (companyId: string) => void;
  selectFinancialYear: (year: string) => void;
  loading: boolean; // Add loading state
  error: string | null; // Add error state
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string | null>(null);
  
  // Use useFirestore hook for companies
  const { 
    data: companies, 
    loading, 
    error, 
    addDocument: addCompanyDocument,
    updateDocument: updateCompanyDocument
  } = useFirestore<Company>('companies');

  // Load selected company and financial year from localStorage on initial mount
  useEffect(() => {
    const storedSelectedCompanyId = localStorage.getItem('selectedCompanyId');
    const storedSelectedFinancialYear = localStorage.getItem('selectedFinancialYear');
    
    if (storedSelectedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === storedSelectedCompanyId);
      if (company) {
        setSelectedCompany(company);
        if (company.financialYears.includes(storedSelectedFinancialYear || "")) {
          setSelectedFinancialYear(storedSelectedFinancialYear);
        } else if (company.financialYears.length > 0) {
          setSelectedFinancialYear(company.financialYears[0]); // Default to first financial year if stored one is invalid
        }
      }
    } else if (companies.length > 0) {
      // If no company was previously selected, select the first one
      setSelectedCompany(companies[0]);
      if (companies[0].financialYears.length > 0) {
        setSelectedFinancialYear(companies[0].financialYears[0]);
      }
    }
  }, [companies]); // Depend on companies data from Firestore

  // Save selected company ID to localStorage
  useEffect(() => {
    if (selectedCompany) {
      localStorage.setItem('selectedCompanyId', selectedCompany.id);
    } else {
      localStorage.removeItem('selectedCompanyId');
    }
  }, [selectedCompany]);

  // Save selected financial year to localStorage
  useEffect(() => {
    if (selectedFinancialYear) {
      localStorage.setItem('selectedFinancialYear', selectedFinancialYear);
    } else {
      localStorage.removeItem('selectedFinancialYear');
    }
  }, [selectedFinancialYear]);

  const addCompany = async (name: string, address: string, startYear: number) => {
    const financialYear = `${startYear}-${startYear + 1}`;
    const newCompany: Omit<Company, 'id'> = {
      name,
      address,
      financialYears: [financialYear],
    };

    const addedId = await addCompanyDocument(newCompany);
    if (addedId) {
      // The useFirestore hook will automatically update the companies list
      if (!selectedCompany) {
        // If no company was previously selected, the new one will be selected automatically by the useEffect
      }
      showSuccess(`Company '${name}' added successfully for financial year ${financialYear}!`);
    } else {
      showError("Failed to add company.");
    }
  };

  const selectCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
      if (company.financialYears.length > 0) {
        setSelectedFinancialYear(company.financialYears[0]); // Default to first financial year
      } else {
        setSelectedFinancialYear(null);
      }
      showSuccess(`Company changed to '${company.name}'.`);
    } else {
      showError("Company not found.");
    }
  };

  const selectFinancialYear = (year: string) => {
    if (selectedCompany && selectedCompany.financialYears.includes(year)) {
      setSelectedFinancialYear(year);
      showSuccess(`Financial year changed to '${year}'.`);
    } else {
      showError("Invalid financial year for selected company.");
    }
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      selectedCompany,
      selectedFinancialYear,
      addCompany,
      selectCompany,
      selectFinancialYear,
      loading, // Provide loading state
      error // Provide error state
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};