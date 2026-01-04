"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { showSuccess, showError } from '@/utils/toast';
import { useFirestore } from '@/hooks/use-firestore';

interface Company {
  id: string;
  name: string;
  address: string;
  financialYears: string[];
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: Company | null;
  selectedFinancialYear: string | null;
  addCompany: (name: string, address: string, startYear: number) => void;
  selectCompany: (companyId: string) => void;
  selectFinancialYear: (year: string) => void;
  loading: boolean;
  error: string | null;
  // Add methods to filter data by company
  filterByCompany: <T extends { companyId?: string }>(data: T[]) => T[];
  getCurrentCompanyId: () => string | null;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string | null>(null);
  
  const { 
    data: companies, 
    loading, 
    error, 
    addDocument: addCompanyDocument,
    updateDocument: updateCompanyDocument
  } = useFirestore<Company>('companies');

  // Load selected company from localStorage on initial mount
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
          setSelectedFinancialYear(company.financialYears[0]);
        }
      }
    } else if (companies.length > 0) {
      setSelectedCompany(companies[0]);
      if (companies[0].financialYears.length > 0) {
        setSelectedFinancialYear(companies[0].financialYears[0]);
      }
    }
  }, [companies]);

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
      if (!selectedCompany) {
        // Auto-select the new company if none was selected
        selectCompany(addedId);
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
        setSelectedFinancialYear(company.financialYears[0]);
      } else {
        setSelectedFinancialYear(null);
      }
      showSuccess(`Company changed to '${company.name}'.`);
    } else if (companyId === "") {
      setSelectedCompany(null);
      setSelectedFinancialYear(null);
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

  // Filter data by currently selected company
  const filterByCompany = <T extends { companyId?: string }>(data: T[]): T[] => {
    if (!selectedCompany) return [];
    return data.filter(item => item.companyId === selectedCompany.id);
  };

  // Get current company ID
  const getCurrentCompanyId = (): string | null => {
    return selectedCompany?.id || null;
  };

  return (
    <CompanyContext.Provider value={{
      companies,
      selectedCompany,
      selectedFinancialYear,
      addCompany,
      selectCompany,
      selectFinancialYear,
      loading,
      error,
      filterByCompany,
      getCurrentCompanyId
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