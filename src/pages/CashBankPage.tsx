"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import CashBankForm from "@/components/CashBankForm";
import CashBankTable from "@/components/CashBankTable";
import { CashBankTransaction } from "@/utils/balanceCalculations"; // Import the interface
import { showSuccess, showError } from "@/utils/toast"; // Import showError
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { useCompany } from "@/context/CompanyContext"; // Import useCompany
import { getNextTransactionId } from "@/utils/idGenerators"; // Import ID generator

const CashBankPage: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  // Pass currentCompanyId to useFirestore hook
  const { data: transactions, loading, error, addDocument, updateDocument, deleteDocument, fetchData } = useFirestore<CashBankTransaction>('cashBankTransactions', currentCompanyId);

  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list'); // Added 'edit' mode
  const [editingTransaction, setEditingTransaction] = useState<CashBankTransaction | null>(null); // State for transaction being edited

  const handleSaveTransaction = async (transactionToSave: Omit<CashBankTransaction, 'id'> & { id?: string }) => {
    if (!currentCompanyId) {
      showError("Please select a company before recording transactions.");
      return;
    }

    if (transactionToSave.id) {
      // Update existing transaction
      await updateDocument(transactionToSave.id, transactionToSave);
      showSuccess("Transaction updated successfully!");
    } else {
      // Add new transaction (Generate ID here)
      const newId = getNextTransactionId(transactions);
      await addDocument({ ...transactionToSave, id: newId }); // Pass generated ID
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

  if (!currentCompanyId) {
    return (
      <div className="text-center py-8 text-lg">
        Please select a company from Company Settings to view cash & bank transactions.
      </div>
    );
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