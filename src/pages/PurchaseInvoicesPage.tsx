"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import PurchaseInvoiceForm, { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import PurchaseInvoiceTable from "@/components/PurchaseInvoiceTable";
import { Input } from "@/components/ui/input";
import { showSuccess } from "@/utils/toast";
import { Item as GlobalItem } from "@/components/ItemForm"; // Import Item interface
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings

// Helper function to get the next purchase number (e.g., P-YYYYMMDD-001)
const getNextPurchaseNumber = (currentInvoices: CompletePurchaseInvoice[]) => {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  
  const invoicesToday = currentInvoices.filter(inv => inv.purchaseNo.startsWith(`P-${dateString}`));
  let maxCount = 0;
  invoicesToday.forEach(inv => {
    const match = inv.purchaseNo.match(/P-\d{8}-(\d+)$/);
    if (match && match[1]) {
      const count = parseInt(match[1], 10);
      if (count > maxCount) {
        maxCount = count;
      }
    }
  });
  return `P-${dateString}-${String(maxCount + 1).padStart(3, '0')}`;
};

const PurchaseInvoicesPage: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const [invoices, setInvoices] = useState<CompletePurchaseInvoice[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit' | 'view'>('list');
  const [editingInvoice, setEditingInvoice] = useState<CompletePurchaseInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // State for current invoice details when adding/editing
  const [currentPurchaseNo, setCurrentPurchaseNo] = useState("");
  const [currentPurchaseDate, setCurrentPurchaseDate] = useState("");
  const [currentPurchaseTime, setCurrentPurchaseTime] = useState("");

  // Load invoices from localStorage on initial mount
  useEffect(() => {
    const storedInvoices = localStorage.getItem("purchaseInvoices");
    if (storedInvoices) {
      const parsedInvoices: CompletePurchaseInvoice[] = JSON.parse(storedInvoices);
      // Explicitly convert numeric fields to numbers
      const processedInvoices = parsedInvoices.map(invoice => ({
        ...invoice,
        totalAmount: Number(invoice.totalAmount),
        advance: Number(invoice.advance),
        due: Number(invoice.due),
      }));
      setInvoices(processedInvoices);
    }
  }, []);

  // Save invoices to localStorage whenever the invoices state changes
  useEffect(() => {
    localStorage.setItem("purchaseInvoices", JSON.stringify(invoices));
  }, [invoices]);

  const generateNewInvoiceDetails = () => {
    const newPurchaseNo = getNextPurchaseNumber(invoices);
    const today = new Date();
    setCurrentPurchaseNo(newPurchaseNo);
    setCurrentPurchaseDate(today.toLocaleDateString('en-CA')); // YYYY-MM-DD for input type="date"
    setCurrentPurchaseTime(today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
  };

  const handleAddInvoice = (newInvoiceData: CompletePurchaseInvoice) => {
    setInvoices((prevInvoices) => [...prevInvoices, newInvoiceData]);
    showSuccess("Purchase Invoice added successfully!");
    setViewMode('list');
  };

  const handleEditInvoice = (updatedInvoiceData: CompletePurchaseInvoice) => {
    setInvoices((prevInvoices) =>
      prevInvoices.map((invoice) =>
        invoice.id === updatedInvoiceData.id ? updatedInvoiceData : invoice
      )
    );
    showSuccess("Purchase Invoice updated successfully!");
    setEditingInvoice(null);
    setViewMode('list');
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prevInvoices) => {
      const invoiceToDelete = prevInvoices.find(inv => inv.id === id);
      if (invoiceToDelete) {
        // Revert stock for items in the deleted invoice
        const currentStoredItems: GlobalItem[] = JSON.parse(localStorage.getItem("items") || "[]");
        const updatedStoredItems = currentStoredItems.map(storedItem => {
          const itemInDeletedInvoice = invoiceToDelete.items.find(invItem => invItem.selectedItemId === storedItem.id);
          if (itemInDeletedInvoice) {
            return { ...storedItem, stock: storedItem.stock - itemInDeletedInvoice.finalWeight };
          }
          return storedItem;
        });
        localStorage.setItem("items", JSON.stringify(updatedStoredItems));
      }
      showSuccess("Purchase Invoice deleted successfully!");
      return prevInvoices.filter((invoice) => invoice.id !== id);
    });
  };

  const handleOpenAddForm = () => {
    setEditingInvoice(null); // Ensure no old data is in form
    generateNewInvoiceDetails();
    setViewMode('add');
  };

  const handleOpenEditForm = (invoice: CompletePurchaseInvoice) => {
    setEditingInvoice(invoice);
    setCurrentPurchaseNo(invoice.purchaseNo);
    setCurrentPurchaseDate(invoice.purchaseDate);
    setCurrentPurchaseTime(invoice.purchaseTime);
    setViewMode('edit');
  };

  const handleViewInvoice = (invoice: CompletePurchaseInvoice) => {
    setEditingInvoice(invoice); // Use editingInvoice to hold the invoice to view
    setCurrentPurchaseNo(invoice.purchaseNo);
    setCurrentPurchaseDate(invoice.purchaseDate);
    setCurrentPurchaseTime(invoice.purchaseTime);
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
    invoice.purchaseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.farmer.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.purchaseDate.includes(searchTerm)
  );

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">{t("Purchase Invoices", "खरीद चालान")}</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrintList} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> {t("Print List", "सूची प्रिंट करें")}
          </Button>
          {viewMode === 'list' && (
            <Button onClick={handleOpenAddForm} className="bg-green-600 hover:bg-green-700">
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
          <PurchaseInvoiceTable
            invoices={filteredInvoices}
            onView={handleViewInvoice}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteInvoice}
          />
        </>
      )}

      {(viewMode === 'add' || viewMode === 'edit' || viewMode === 'view') && (
        <PurchaseInvoiceForm
          initialData={editingInvoice}
          onSave={viewMode === 'add' ? handleAddInvoice : handleEditInvoice}
          onCancel={handleCancelForm}
          currentPurchaseNo={currentPurchaseNo}
          currentPurchaseDate={currentPurchaseDate}
          currentPurchaseTime={currentPurchaseTime}
        />
      )}
    </div>
  );
};

export default PurchaseInvoicesPage;