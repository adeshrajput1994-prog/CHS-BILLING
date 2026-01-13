"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import SalesInvoiceForm, { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import SalesInvoiceTable from "@/components/SalesInvoiceTable";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast"; // Import showError
import { Item as GlobalItem } from "@/components/ItemForm"; // Import Item interface
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

// Helper function to get the next sales invoice number (e.g., S-YYYYMMDD-001)
const getNextSalesInvoiceNumber = (currentInvoices: CompleteSalesInvoice[]) => {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  
  const invoicesToday = currentInvoices.filter(inv => inv.invoiceNo.startsWith(`S-${dateString}`));
  let maxCount = 0;
  invoicesToday.forEach(inv => {
    const match = inv.invoiceNo.match(/S-\d{8}-(\d+)$/);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count > maxCount) {
        maxCount = count;
      }
    }
  });
  return `S-${dateString}-${String(maxCount + 1).padStart(3, '0')}`;
};

const SalesInvoicesPage: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();
  
  // Pass currentCompanyId to useFirestore hook for sales invoices
  const { 
    data: invoices, 
    loading: loadingInvoices, 
    error: invoicesError, 
    addDocument: addInvoiceDocument, 
    updateDocument: updateInvoiceDocument, 
    deleteDocument: deleteInvoiceDocument 
  } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);

  // Fetch items data for stock management
  const { 
    data: items, 
    loading: loadingItems, 
    error: itemsError, 
    updateDocument: updateItemDocument 
  } = useFirestore<GlobalItem>('items', currentCompanyId);

  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>('list');
  const [editingInvoice, setEditingInvoice] = useState<CompleteSalesInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // State for current invoice details when adding/editing
  const [currentInvoiceNo, setCurrentInvoiceNo] = useState("");
  const [currentInvoiceDate, setCurrentInvoiceDate] = useState("");
  const [currentInvoiceTime, setCurrentInvoiceTime] = useState("");

  const generateNewInvoiceDetails = () => {
    const newInvoiceNo = getNextSalesInvoiceNumber(invoices);
    const today = new Date();
    setCurrentInvoiceNo(newInvoiceNo);
    setCurrentInvoiceDate(today.toLocaleDateString('en-CA')); // YYYY-MM-DD for input type="date"
    setCurrentInvoiceTime(today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  const handleAddInvoice = async (newInvoiceData: Omit<CompleteSalesInvoice, 'id'> & { id?: string }) => {
    if (!currentCompanyId) {
      showError("Please select a company before adding sales invoices.");
      return;
    }
    // companyId is automatically added by useFirestore hook
    const addedId = await addInvoiceDocument(newInvoiceData);
    if (addedId) {
      showSuccess("Sales Invoice added successfully!");
      setViewMode('list');
    }
  };

  const handleEditInvoice = async (updatedInvoiceData: CompleteSalesInvoice) => {
    if (updatedInvoiceData.id) {
      await updateInvoiceDocument(updatedInvoiceData.id, updatedInvoiceData);
      showSuccess("Sales Invoice updated successfully!");
      setEditingInvoice(null);
      setViewMode('list');
    } else {
      showError("Invoice ID is missing for update.");
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    const invoiceToDelete = invoices.find(inv => inv.id === id);
    if (invoiceToDelete) {
      // Revert stock for items in the deleted invoice
      for (const itemInDeletedInvoice of invoiceToDelete.items) {
        const storedItem = items.find(i => i.id === itemInDeletedInvoice.selectedItemId);
        if (storedItem) {
          const newStock = Number(storedItem.stock) + Number(itemInDeletedInvoice.weight);
          await updateItemDocument(storedItem.id, { stock: newStock });
        } else {
          console.warn(`Item with ID ${itemInDeletedInvoice.selectedItemId} not found for stock reversion.`);
        }
      }
      await deleteInvoiceDocument(id);
      showSuccess("Sales Invoice deleted successfully!");
    } else {
      showError("Invoice not found for deletion.");
    }
  };

  const handleOpenAddForm = () => {
    setEditingInvoice(null); // Ensure no old data is in form
    generateNewInvoiceDetails();
    setViewMode('add');
  };

  const handleOpenEditForm = (invoice: CompleteSalesInvoice) => {
    setEditingInvoice(invoice);
    setCurrentInvoiceNo(invoice.invoiceNo);
    setCurrentInvoiceDate(invoice.invoiceDate);
    setCurrentInvoiceTime(invoice.invoiceTime);
    setViewMode('edit');
  };

  const handleViewInvoice = (invoice: CompleteSalesInvoice) => {
    setEditingInvoice(invoice); // Use editingInvoice to hold the invoice to view
    setCurrentInvoiceNo(invoice.invoiceNo);
    setCurrentInvoiceDate(invoice.invoiceDate);
    setCurrentInvoiceTime(invoice.invoiceTime);
    setViewMode('view');
  };

  const handleCancelForm = () => {
    setEditingInvoice(null);
    setViewMode('list');
  };

  const handlePrintList = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  // Filter invoices based on search term
  const filteredInvoices = invoices.filter(invoice =>
    invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.farmer.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceDate.includes(searchTerm)
  );

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (loadingInvoices || loadingItems) {
    return <div className="text-center py-8 text-lg">Loading sales invoices and item data...</div>;
  }

  if (invoicesError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading invoices: {invoicesError}</div>;
  }

  if (itemsError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading items: {itemsError}</div>;
  }

  if (!currentCompanyId) {
    return (
      <div className="text-center py-8 text-lg">
        Please select a company from Company Settings to view sales invoices.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">{t("Sales Invoices", "बिक्री चालान")}</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrintList} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> {t("Print List", "सूची प्रिंट करें")}
          </Button>
          {viewMode === 'list' && (
            <Button onClick={handleOpenAddForm} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> {t("Create New Invoice", "नया चालान बनाएँ")}
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <Input
            placeholder={t("Search invoices by number or farmer name...", "चालान संख्या या किसान के नाम से खोजें...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm print-hide"
          />
          <SalesInvoiceTable
            invoices={filteredInvoices}
            onView={handleViewInvoice}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteInvoice}
          />
        </>
      )}

      {(viewMode === 'add' || viewMode === 'edit' || viewMode === 'view') && (
        <SalesInvoiceForm
          initialData={editingInvoice}
          onSave={viewMode === 'add' ? handleAddInvoice : handleEditInvoice}
          onCancel={handleCancelForm}
          currentInvoiceNo={currentInvoiceNo}
          currentInvoiceDate={currentInvoiceDate}
          currentInvoiceTime={currentInvoiceTime}
        />
      )}
    </div>
  );
};

export default SalesInvoicesPage;