"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import CashBankForm from "@/components/CashBankForm";
import CashBankTable from "@/components/CashBankTable";
import { CashBankTransaction } from "@/utils/balanceCalculations"; // Import the interface
import { showSuccess } from "@/utils/toast";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook

const CashBankPage: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  // Replace localStorage state with useFirestore hook
  const { data: transactions, loading, error, addDocument, updateDocument, deleteDocument } = useFirestore<CashBankTransaction>('cashBankTransactions');

  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list'); // Added 'edit' mode
  const [editingTransaction, setEditingTransaction] = useState<CashBankTransaction | null>(null); // State for transaction being edited

  // No need for localStorage useEffects anymore, useFirestore handles fetching and updates

  const handleSaveTransaction = async (transactionToSave: CashBankTransaction) => {
    if (editingTransaction) {
      // Update existing transaction
      if (transactionToSave.id) {
        await updateDocument(transactionToSave.id, transactionToSave);
        showSuccess("Transaction updated successfully!");
      } else {
        // This case should ideally not happen if initialData is always provided for edits
        showError("Transaction ID is missing for update.");
      }
    } else {
      // Add new transaction
      await addDocument(transactionToSave);
      showSuccess("Transaction recorded successfully!");
    }
    setEditingTransaction(null); // Clear editing state
    setViewMode('list'); // Go back to list view
  };

  const handleDeleteTransaction = async (id: string) => {
    await deleteDocument(id);
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

  if (loading) {
    return <div className="text-center py-8 text-lg">Loading transactions...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-lg text-red-500">Error: {error}</div>;
  }

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