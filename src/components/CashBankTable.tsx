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
import { CashBankTransaction } from "@/utils/balanceCalculations";
import { Pencil, Trash2 } from "lucide-react"; // Import icons
import { Button } from "@/components/ui/button"; // Import Button
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings

interface CashBankTableProps {
  transactions: CashBankTransaction[];
  onEdit: (transaction: CashBankTransaction) => void; // New prop for editing
  onDelete: (id: string) => void; // New prop for deleting
}

const CashBankTable: React.FC<CashBankTableProps> = ({ transactions, onEdit, onDelete }) => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
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
            <TableHead>{t("Farmer", "किसान")}</TableHead>
            <TableHead>{t("Amount", "राशि")}</TableHead>
            <TableHead>{t("Method", "विधि")}</TableHead>
            <TableHead>{t("Remarks", "टिप्पणियाँ")}</TableHead>
            <TableHead className="text-center">{t("Actions", "कार्यवाई")}</TableHead> {/* New column for actions */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                {t("No cash or bank transactions recorded yet.", "अभी तक कोई नकद या बैंक लेनदेन दर्ज नहीं किया गया है।")}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Badge variant="outline">
                    {transaction.id} {/* Display the custom generated ID */}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.time}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === "Payment In" ? "default" : "secondary"} className={transaction.type === "Payment In" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
                    {t(transaction.type, transaction.type === "Payment In" ? "भुगतान अंदर" : "भुगतान बाहर")}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.farmerName}</TableCell>
                <TableCell>₹ {Number(transaction.amount).toFixed(2)}</TableCell>
                <TableCell>{t(transaction.paymentMethod, transaction.paymentMethod === "Cash" ? "नकद" : "बैंक")}</TableCell>
                <TableCell className="max-w-[200px] truncate">{transaction.remarks || "-"}</TableCell>
                <TableCell className="flex justify-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
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
                          {t("This action cannot be undone. This will permanently delete the transaction", "यह कार्रवाई पूर्ववत नहीं की जा सकती। यह लेनदेन को स्थायी रूप से हटा देगा")}
                          <span className="font-bold"> (ID: {transaction.id}) </span>
                          {t("and remove its data from our records.", "और हमारे रिकॉर्ड से इसका डेटा हटा देगा।")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(transaction.id)} className="bg-red-600 hover:bg-red-700">
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

export default CashBankTable;