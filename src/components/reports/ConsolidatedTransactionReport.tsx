"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Printer, Share2, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { CashBankTransaction } from "@/utils/balanceCalculations";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";
import { exportToExcel, exportToPdf } from "@/utils/fileExportImport";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface ConsolidatedEntry {
  date: string;
  time: string;
  type: "Sale" | "Purchase" | "Payment In" | "Payment Out";
  reference: string; // Invoice No, Purchase No, Transaction ID
  farmerName: string;
  amount: number;
  method?: string; // For cash/bank transactions
  details: string; // Item details or remarks
}

const ConsolidatedTransactionReport: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();
  
  // Fetch data using useFirestore hook, passing currentCompanyId
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);
  const { data: cashBankTransactions, loading: loadingCashBank, error: cashBankError } = useFirestore<CashBankTransaction>('cashBankTransactions', currentCompanyId);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const isLoading = loadingSales || loadingPurchases || loadingCashBank;
  const hasError = salesError || purchasesError || cashBankError;

  const consolidatedData = useMemo(() => {
    let entries: ConsolidatedEntry[] = [];

    const filterByDateRange = (itemDate: string) => {
      if (!dateRange?.from) return true;
      const itemDateTime = parseISO(itemDate);
      const start = dateRange.from;
      const end = dateRange.to || new Date();
      return isWithinInterval(itemDateTime, { start, end });
    };

    salesInvoices.filter(inv => filterByDateRange(inv.invoiceDate)).forEach(invoice => {
      entries.push({
        date: invoice.invoiceDate,
        time: invoice.invoiceTime,
        type: "Sale",
        reference: invoice.invoiceNo,
        farmerName: invoice.farmer.farmerName,
        amount: Number(invoice.totalAmount),
        details: invoice.items.map(item => `${item.itemName} (${Number(item.weight).toFixed(2)} KG)`).join(', '),
      });
    });

    purchaseInvoices.filter(inv => filterByDateRange(inv.purchaseDate)).forEach(invoice => {
      entries.push({
        date: invoice.purchaseDate,
        time: invoice.purchaseTime,
        type: "Purchase",
        reference: invoice.purchaseNo,
        farmerName: invoice.farmer.farmerName,
        amount: Number(invoice.totalAmount),
        details: invoice.items.map(item => `${item.itemName} (${Number(item.finalWeight).toFixed(2)} KG)`).join(', '),
      });
    });

    cashBankTransactions.filter(txn => filterByDateRange(txn.date)).forEach(txn => {
      entries.push({
        date: txn.date,
        time: txn.time,
        type: txn.type,
        reference: txn.id.substring(0, 8),
        farmerName: txn.farmerName,
        amount: Number(txn.amount),
        method: txn.paymentMethod,
        details: txn.remarks || "-",
      });
    });

    entries.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    return entries.filter(entry =>
      entry.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [salesInvoices, purchaseInvoices, cashBankTransactions, searchTerm, dateRange]);

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const handleWhatsAppShare = () => {
    if (consolidatedData.length === 0) {
      showError("No transactions to share.");
      return;
    }

    const dateRangeText = dateRange?.from
      ? dateRange.to
        ? ` for period ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}`
        : ` from ${format(dateRange.from, "PPP")}`
      : "";

    let message = `*Consolidated Transaction Report${dateRangeText}*\n\n`;
    consolidatedData.forEach(entry => {
      message += `*${entry.type}* - ${entry.reference}\n`;
      message += `  Date: ${entry.date} ${entry.time}\n`;
      message += `  Farmer: ${entry.farmerName}\n`;
      message += `  Amount: ₹${entry.amount.toFixed(2)}\n`;
      if (entry.method) message += `  Method: ${entry.method}\n`;
      message += `  Details: ${entry.details}\n\n`;
    });
    message += `View full report in Vyapar app.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportToExcel = () => {
    const exportData = consolidatedData.map(entry => ({
      "Date": entry.date,
      "Time": entry.time,
      "Type": entry.type,
      "Reference": entry.reference,
      "Farmer Name": entry.farmerName,
      "Amount": entry.amount,
      "Method": entry.method || "-",
      "Details": entry.details,
    }));
    exportToExcel(exportData, "Consolidated_Transaction_Report", "Transactions");
  };

  const handleExportToPdf = () => {
    const tempDivId = "consolidated-transactions-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    const dateRangeTitle = dateRange?.from
      ? dateRange.to
        ? ` for ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}`
        : ` from ${format(dateRange.from, "PPP")}`
      : "";

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">${t("Consolidated Transaction Report", "समग्र लेनदेन रिपोर्ट")}${dateRangeTitle}</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Date", "दिनांक")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Time", "समय")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Type", "प्रकार")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Reference", "संदर्भ")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Farmer Name", "किसान का नाम")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Amount (₹)", "राशि (₹)")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Method", "विधि")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Details", "विवरण")}</th>
          </tr>
        </thead>
        <tbody>
          ${consolidatedData.map((entry, index) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${entry.date}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${entry.time}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t(entry.type, entry.type === "Sale" ? "बिक्री" : entry.type === "Purchase" ? "खरीद" : entry.type === "Payment In" ? "भुगतान अंदर" : "भुगतान बाहर")}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${entry.reference}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${entry.farmerName}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right; color: ${entry.type === "Sale" || entry.type === "Payment In" ? "green" : "red"};">₹ ${entry.amount.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t(entry.method || '-', entry.method === "Cash" ? "नकद" : entry.method === "Bank" ? "बैंक" : "-")}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${entry.details}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToPdf(tempDivId, "Consolidated_Transaction_Report", t("Consolidated Transaction Report", "समग्र लेनदेन रिपोर्ट") + dateRangeTitle).finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading consolidated transaction data...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading consolidated transaction data: {hasError}</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{t("Consolidated Transaction Report", "समग्र लेनदेन रिपोर्ट")}</CardTitle>
            <CardDescription>{t("View all sales, purchases, and cash/bank transactions in one place.", "सभी बिक्री, खरीद और नकद/बैंक लेनदेन एक ही स्थान पर देखें।")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground h-24 flex items-center justify-center">
            Please select a company from Company Settings to view consolidated transactions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{t("Consolidated Transaction Report", "समग्र लेनदेन रिपोर्ट")}</CardTitle>
          <CardDescription>{t("View all sales, purchases, and cash/bank transactions in one place.", "सभी बिक्री, खरीद और नकद/बैंक लेनदेन एक ही स्थान पर देखें।")}</CardDescription>
        </div>
        <div className="flex space-x-2 print-hide">
          <Input
            placeholder={t("Search transactions...", "लेनदेन खोजें...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button onClick={handleExportToExcel} variant="outline" disabled={consolidatedData.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {t("Export Excel", "एक्सेल निर्यात करें")}
          </Button>
          <Button onClick={handleExportToPdf} variant="outline" disabled={consolidatedData.length === 0}>
            <FileTextIcon className="mr-2 h-4 w-4" /> {t("Export PDF", "पीडीएफ निर्यात करें")}
          </Button>
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={consolidatedData.length === 0}>
            <Share2 className="mr-2 h-4 w-4" /> {t("Share Summary", "सारांश साझा करें")}
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> {t("Print", "प्रिंट करें")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Date", "दिनांक")}</TableHead>
                <TableHead>{t("Time", "समय")}</TableHead>
                <TableHead>{t("Type", "प्रकार")}</TableHead>
                <TableHead>{t("Reference", "संदर्भ")}</TableHead>
                <TableHead>{t("Farmer Name", "किसान का नाम")}</TableHead>
                <TableHead className="text-right">{t("Amount (₹)", "राशि (₹)")}</TableHead>
                <TableHead>{t("Method", "विधि")}</TableHead>
                <TableHead>{t("Details", "विवरण")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consolidatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    {t("No transactions found for the selected period.", "चयनित अवधि के लिए कोई लेनदेन नहीं मिला।")}
                  </TableCell>
                </TableRow>
              ) : (
                consolidatedData.map((entry, index) => (
                  <TableRow key={index}>
                    <TableCell>{entry.date}</TableCell>
                    <TableCell>{entry.time}</TableCell>
                    <TableCell>{t(entry.type, entry.type === "Sale" ? "बिक्री" : entry.type === "Purchase" ? "खरीद" : entry.type === "Payment In" ? "भुगतान अंदर" : "भुगतान बाहर")}</TableCell>
                    <TableCell>{entry.reference}</TableCell>
                    <TableCell>{entry.farmerName}</TableCell>
                    <TableCell className={`text-right ${entry.type === "Sale" || entry.type === "Payment In" ? "text-green-600" : "text-red-600"}`}>
                      {entry.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>{t(entry.method || '-', entry.method === "Cash" ? "नकद" : entry.method === "Bank" ? "बैंक" : "-")}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{entry.details}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConsolidatedTransactionReport;