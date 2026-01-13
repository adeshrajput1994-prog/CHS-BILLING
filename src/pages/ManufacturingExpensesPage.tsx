"use client";

import React from "react";
import ManufacturingExpensesForm from "@/components/ManufacturingExpensesForm";
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

const ManufacturingExpensesPage: React.FC = () => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  if (!currentCompanyId) {
    return (
      <div className="text-center py-8 text-lg">
        Please select a company from Company Settings to view manufacturing expenses.
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ManufacturingExpensesForm />
    </div>
  );
};

export default ManufacturingExpensesPage;