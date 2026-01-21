"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import ExpenseForm, { Expense } from "@/components/ExpenseForm";
import ExpenseTable from "@/components/ExpenseTable";
import { Input } from "@/components/ui/input";
import { showSuccess, showError } from "@/utils/toast";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useFirestore } from "@/hooks/use-firestore";
import { useCompany } from "@/context/CompanyContext";
import { getNextExpenseId } from "@/utils/idGenerators";

const ExpensesPage: React.FC = () => {
  const { printInHindi } = usePrintSettings();
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  const { data: expenses, loading, error, addDocument, updateDocument, deleteDocument } = useFirestore<Expense>('expenses', currentCompanyId);

  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const handleSaveExpense = async (expenseToSave: Omit<Expense, 'id'> & { id?: string }) => {
    if (!currentCompanyId) {
      showError("Please select a company before recording expenses.");
      return;
    }

    if (expenseToSave.id) {
      await updateDocument(expenseToSave.id, expenseToSave);
      showSuccess("Expense/Cash entry updated successfully!");
    } else {
      const newId = getNextExpenseId(expenses);
      await addDocument({ ...expenseToSave, id: newId });
      showSuccess("Expense/Cash entry recorded successfully!");
    }
    setEditingExpense(null);
    setViewMode('list');
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteDocument(id);
    showSuccess("Expense/Cash entry deleted successfully!");
  };

  const handleOpenEditForm = (expense: Expense) => {
    setEditingExpense(expense);
    setViewMode('edit');
  };

  const handleCancelForm = () => {
    setEditingExpense(null);
    setViewMode('list');
  };

  const handlePrintList = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (loading) {
    return <div className="text-center py-8 text-lg">{t("Loading expenses...", "खर्च लोड हो रहे हैं...")}</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-lg text-red-500">{t("Error loading expenses:", "खर्च लोड करने में त्रुटि:")} {error}</div>;
  }

  if (!currentCompanyId) {
    return (
      <div className="text-center py-8 text-lg">
        {t("Please select a company from Company Settings to view expenses.", "खर्च देखने के लिए कृपया कंपनी सेटिंग्स से एक कंपनी चुनें।")}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">{t("Company Expenses & Cash Management", "कंपनी के खर्च और नकद प्रबंधन")}</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrintList} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> {t("Print List", "सूची प्रिंट करें")}
          </Button>
          {viewMode === 'list' && (
            <Button onClick={() => { setEditingExpense(null); setViewMode('add'); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> {t("Record New Entry", "नई प्रविष्टि दर्ज करें")}
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <Input
            placeholder={t("Search expenses by type or remarks...", "प्रकार या टिप्पणियों द्वारा खर्च खोजें...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm print-hide"
          />
          <ExpenseTable
            expenses={filteredExpenses}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteExpense}
          />
        </>
      )}

      {(viewMode === 'add' || viewMode === 'edit') && (
        <ExpenseForm
          initialData={editingExpense}
          onSave={handleSaveExpense}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default ExpensesPage;