"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import CashBankForm from "@/components/CashBankForm";
import CashBankTable from "@/components/CashBankTable";
import { CashBankTransaction } from "@/utils/balanceCalculations"; // Import the interface
import { showSuccess } from "@/utils/toast";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings

const CashBankPage: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const [transactions, setTransactions] = useState<CashBankTransaction[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list'); // Added 'edit' mode
  const [editingTransaction, setEditingTransaction] = useState<CashBankTransaction | null>(null); // State for transaction being edited

  // Load transactions from localStorage on initial mount
  useEffect(() => {
    const storedTransactions = localStorage.getItem("cashBankTransactions");
    if (storedTransactions) {
      setTransactions(JSON.parse(storedTransactions));
    }
  }, []);

  // Save transactions to localStorage whenever the transactions state changes
  useEffect(() => {
    localStorage.setItem("cashBankTransactions", JSON.stringify(transactions));
  }, [transactions]);

  const handleSaveTransaction = (transactionToSave: CashBankTransaction) => {
    if (editingTransaction) {
      // Update existing transaction
      setTransactions((prevTransactions) =>
        prevTransactions.map((t) =>
          t.id === transactionToSave.id ? transactionToSave : t
        )
      );
      showSuccess("Transaction updated successfully!");
    } else {
      // Add new transaction
      setTransactions((prevTransactions) => [...prevTransactions, transactionToSave]);
      showSuccess("Transaction recorded successfully!");
    }
    setEditingTransaction(null); // Clear editing state
    setViewMode('list'); // Go back to list view
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prevTransactions) => prevTransactions.filter((t) => t.id !== id));
    showSuccess("Transaction deleted successfully!");
  };

  const handleOpenEditForm = (transaction: CashBankTransaction) => {
    setEditingTransaction(transaction);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setEditingTransaction(null); // Clear editing state
    setViewMode('list'); // Go back to list view
  };

  const handlePrintList = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">{t("Cash & Bank Transactions", "नकद और बैंक लेनदेन")}</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrintList} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> {t("Print List", "सूची प्रिंट करें")}
          </Button>
          {viewMode === 'list' && (
            <Button onClick={() => { setEditingTransaction(null); setViewMode('add'); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> {t("Record New Transaction", "नया लेनदेन दर्ज करें")}
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <CashBankTable
          transactions={transactions}
          onEdit={handleOpenEditForm}
          onDelete={handleDeleteTransaction}
        />
      )}

      {(viewMode === 'add' || viewMode === 'edit') && (
        <CashBankForm
          initialData={editingTransaction}
          onSave={handleSaveTransaction}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default CashBankPage;