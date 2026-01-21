"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Expense } from "./ExpenseForm"; // Import the Expense interface
import { usePrintSettings } from "@/hooks/use-print-settings";

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({ expenses, onEdit, onDelete }) => {
  const { printInHindi } = usePrintSettings();
  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">{t("ID", "आईडी")}</TableHead>
            <TableHead>{t("Date", "दिनांक")}</TableHead>
            <TableHead>{t("Time", "समय")}</TableHead>
            <TableHead>{t("Type", "प्रकार")}</TableHead>
            <TableHead>{t("Amount", "राशि")}</TableHead>
            <TableHead>{t("Method", "विधि")}</TableHead>
            <TableHead>{t("Remarks", "टिप्पणियाँ")}</TableHead>
            <TableHead className="text-center">{t("Actions", "कार्यवाई")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                {t("No expenses or cash entries recorded yet.", "अभी तक कोई खर्च या नकद प्रविष्टि दर्ज नहीं की गई है।")}
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>
                  <Badge variant="outline">
                    {expense.id}
                  </Badge>
                </TableCell>
                <TableCell>{expense.date}</TableCell>
                <TableCell>{expense.time}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      expense.type.includes("Cash In")
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : expense.type.includes("Cash Out")
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    }
                  >
                    {t(expense.type, expense.type === "Chai Pani" ? "चाय पानी" : expense.type === "Freight" ? "फ्रेट" : expense.type === "Labour" ? "लेबर" : expense.type === "Oil" ? "तेल" : expense.type === "Electricity Bill" ? "बिजली का बिल" : expense.type === "Rent" ? "किराया" : expense.type === "Salaries" ? "वेतन" : expense.type === "Repairs & Maintenance" ? "मरम्मत और रखरखाव" : expense.type === "Office Supplies" ? "कार्यालय की आपूर्ति" : expense.type === "Travel" ? "यात्रा" : expense.type === "Cash In (Bank/Home)" ? "नकद अंदर (बैंक/घर)" : expense.type === "Cash Out (Bank/Home)" ? "नकद बाहर (बैंक/घर)" : expense.type)}
                  </Badge>
                </TableCell>
                <TableCell>₹ {Number(expense.amount).toFixed(2)}</TableCell>
                <TableCell>{t(expense.paymentMethod, expense.paymentMethod === "Cash" ? "नकद" : expense.paymentMethod === "Bank" ? "बैंक" : "लागू नहीं")}</TableCell>
                <TableCell className="max-w-[200px] truncate">{expense.remarks || "-"}</TableCell>
                <TableCell className="flex justify-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(expense)}>
                    <Pencil className="h-4 w-4 text-green-600" />
                    <span className="sr-only">{t("Edit", "संपादित करें")}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="sr-only">{t("Delete", "हटाएँ")}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("Are you absolutely sure?", "क्या आप पूरी तरह से निश्चित हैं?")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("This action cannot be undone. This will permanently delete the entry", "यह कार्रवाई पूर्ववत नहीं की जा सकती। यह प्रविष्टि को स्थायी रूप से हटा देगा")}
                          <span className="font-bold"> (ID: {expense.id}) </span>
                          {t("and remove its data from our records.", "और हमारे रिकॉर्ड से इसका डेटा हटा देगा।")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(expense.id)} className="bg-red-600 hover:bg-red-700">
                          {t("Delete", "हटाएँ")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ExpenseTable;