"use client";

import React from "react";
import PurchaseInvoiceForm from "@/components/PurchaseInvoiceForm";

const PurchasePage: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <PurchaseInvoiceForm />
    </div>
  );
};

export default PurchasePage;