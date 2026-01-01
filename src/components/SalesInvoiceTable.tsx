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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye } from "lucide-react";
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
import { CompleteSalesInvoice } from "./SalesInvoiceForm"; // Import the interface
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings

interface SalesInvoiceTableProps {
  invoices: CompleteSalesInvoice[];
  onView: (invoice: CompleteSalesInvoice) => void;
  onEdit: (invoice: CompleteSalesInvoice) => void;
  onDelete: (id: string) => void;
}

const SalesInvoiceTable: React.FC<SalesInvoiceTableProps> = ({ invoices, onView, onEdit, onDelete }) => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("Invoice No", "चालान संख्या")}</TableHead>
            <TableHead>{t("Date", "दिनांक")}</TableHead>
            <TableHead>{t("Farmer Name", "किसान का नाम")}</TableHead>
            <TableHead>{t("Total Amount", "कुल राशि")}</TableHead>
            <TableHead>{t("Advance", "अग्रिम")}</TableHead>
            <TableHead>{t("Due", "देय")}</TableHead>
            <TableHead className="text-center">{t("Actions", "कार्यवाई")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                {t("No sales invoices found.", "कोई बिक्री चालान नहीं मिला।")}
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {invoice.invoiceNo}
                  </Badge>
                </TableCell>
                <TableCell>{invoice.invoiceDate}</TableCell>
                <TableCell>{invoice.farmer.farmerName}</TableCell>
                <TableCell>₹ {Number(invoice.totalAmount).toFixed(2)}</TableCell>
                <TableCell>₹ {Number(invoice.advance).toFixed(2)}</TableCell>
                <TableCell className={Number(invoice.due) >= 0 ? "text-red-600" : "text-green-600"}>
                  ₹ {Number(invoice.due).toFixed(2)}
                </TableCell>
                <TableCell className="flex justify-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(invoice)}>
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="sr-only">{t("View", "देखें")}</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(invoice)}>
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
                          {t("This action cannot be undone. This will permanently delete sales invoice", "यह कार्रवाई पूर्ववत नहीं की जा सकती। यह बिक्री चालान को स्थायी रूप से हटा देगा")}
                          <span className="font-bold"> {invoice.invoiceNo} </span>
                          {t("and remove its data from our records.", "और हमारे रिकॉर्ड से इसका डेटा हटा देगा।")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("Cancel", "रद्द करें")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(invoice.id)} className="bg-red-600 hover:bg-red-700">
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

export default SalesInvoiceTable;