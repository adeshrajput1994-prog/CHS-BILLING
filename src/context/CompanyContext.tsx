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

export const CompanyProvider = ({ children }: { children: ReactNode }) => { // Corrected type definition here
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string | null>(null);
  
  // Fetch all companies, so pass null for companyId
  const { 
    data: companies, 
    loading, 
    error, 
    addDocument: addCompanyDocument,
    updateDocument: updateCompanyDocument,
    fetchData: fetchCompanies // Expose fetchData for explicit refresh if needed
  } = useFirestore<Company>('companies', null);

  // Load selected company from localStorage on initial mount
  useEffect(() => {
    const storedSelectedCompanyId = localStorage.getItem('selectedCompanyId');
    const storedSelectedFinancialYear = localStorage.getItem('selectedFinancialYear');
    
    if (companies.length > 0) {
      let companyToSelect = null;
      if (storedSelectedCompanyId) {
        companyToSelect = companies.find(c => c.id === storedSelectedCompanyId);
      }
      
      if (!companyToSelect) {
        // If stored company not found or no stored ID, default to the first company
        companyToSelect = companies[0];
      }

      setSelectedCompany(companyToSelect);
      if (companyToSelect.financialYears.length > 0) {
        if (storedSelectedFinancialYear && companyToSelect.financialYears.includes(storedSelectedFinancialYear)) {
          setSelectedFinancialYear(storedSelectedFinancialYear);
        } else {
          setSelectedFinancialYear(companyToSelect.financialYears[0]);
        }
      } else {
        setSelectedFinancialYear(null);
      }
    } else {
      setSelectedCompany(null);
      setSelectedFinancialYear(null);
    }
  }, [companies]); // Depend on companies from Firestore

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
      // After adding, re-fetch companies to ensure the list is updated and useEffect can pick it up
      await fetchCompanies(); 
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
    } else if (companyId === "") { // Option to clear selected company
      setSelectedCompany(null);
      setSelectedFinancialYear(null);
      showSuccess("No company selected.");
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

  // Filter data by currently selected company (this is now mostly redundant as useFirestore handles it)
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