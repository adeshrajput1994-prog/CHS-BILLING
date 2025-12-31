"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { showSuccess, showError } from '@/utils/toast';

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
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string | null>(null);

  // Load companies and selections from localStorage on initial mount
  useEffect(() => {
    const storedCompanies = localStorage.getItem('companies');
    if (storedCompanies) {
      const parsedCompanies: Company[] = JSON.parse(storedCompanies);
      setCompanies(parsedCompanies);

      const storedSelectedCompanyId = localStorage.getItem('selectedCompanyId');
      const storedSelectedFinancialYear = localStorage.getItem('selectedFinancialYear');

      if (storedSelectedCompanyId) {
        const company = parsedCompanies.find(c => c.id === storedSelectedCompanyId);
        setSelectedCompany(company || null);
        if (company && storedSelectedFinancialYear && company.financialYears.includes(storedSelectedFinancialYear)) {
          setSelectedFinancialYear(storedSelectedFinancialYear);
        } else if (company && company.financialYears.length > 0) {
          setSelectedFinancialYear(company.financialYears[0]); // Default to first financial year if stored one is invalid
        }
      } else if (parsedCompanies.length > 0) {
        // If no company was previously selected, select the first one
        setSelectedCompany(parsedCompanies[0]);
        if (parsedCompanies[0].financialYears.length > 0) {
          setSelectedFinancialYear(parsedCompanies[0].financialYears[0]);
        }
      }
    }
  }, []);

  // Save companies to localStorage whenever the companies state changes
  useEffect(() => {
    localStorage.setItem('companies', JSON.stringify(companies));
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

  const addCompany = (name: string, address: string, startYear: number) => {
    const newId = `company-${Date.now()}`;
    const financialYear = `${startYear}-${startYear + 1}`;
    const newCompany: Company = {
      id: newId,
      name,
      address,
      financialYears: [financialYear],
    };
    setCompanies((prev) => [...prev, newCompany]);
    if (!selectedCompany) { // Automatically select the first company added
      setSelectedCompany(newCompany);
      setSelectedFinancialYear(financialYear);
    }
    showSuccess(`Company '${name}' added successfully for financial year ${financialYear}!`);
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
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        selectedFinancialYear,
        addCompany,
        selectCompany,
        selectFinancialYear,
      }}
    >
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