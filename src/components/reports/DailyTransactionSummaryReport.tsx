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
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Printer, Share2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { CashBankTransaction } from "@/utils/balanceCalculations";
import { showError } from "@/utils/toast";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

const DailyTransactionSummaryReport: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Fetch data using useFirestore hook, passing currentCompanyId
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);
  const { data: cashBankTransactions, loading: loadingCashBank, error: cashBankError } = useFirestore<CashBankTransaction>('cashBankTransactions', currentCompanyId);

  const isLoading = loadingSales || loadingPurchases || loadingCashBank;
  const hasError = salesError || purchasesError || cashBankError;

  const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
  const displayDate = date ? format(date, "PPP") : "Select a date";

  const dailySales = useMemo(() => {
    return salesInvoices.filter(invoice => invoice.invoiceDate === formattedDate);
  }, [salesInvoices, formattedDate]);

  const dailyPurchases = useMemo(() => {
    return purchaseInvoices.filter(invoice => invoice.purchaseDate === formattedDate);
  }, [purchaseInvoices, formattedDate]);

  const dailyCashBank = useMemo(() => {
    return cashBankTransactions.filter(txn => txn.date === formattedDate);
  }, [cashBankTransactions, formattedDate]);

  const totalSalesAmount = dailySales.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalPurchaseAmount = dailyPurchases.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
  const totalCashIn = dailyCashBank.filter(txn => txn.type === "Payment In").reduce((sum, txn) => sum + Number(txn.amount), 0);
  const totalCashOut = dailyCashBank.filter(txn => txn.type === "Payment Out").reduce((sum, txn) => sum + Number(txn.amount), 0);
  const netCashFlow = totalCashIn - totalCashOut;

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const handleWhatsAppShare = () => {
    if (!date) {
      showError("Please select a date to share the daily summary.");
      return;
    }

    const message = `*Daily Transaction Summary for ${displayDate}*\n\n` +
                    `*Sales Summary:*\n` +
                    `Total Sales Amount: ₹${totalSalesAmount.toFixed(2)}\n` +
                    `Number of Sales Invoices: ${dailySales.length}\n\n` +
                    `*Purchase Summary:*\n` +
                    `Total Purchase Amount: ₹${totalPurchaseAmount.toFixed(2)}\n` +
                    `Number of Purchase Invoices: ${dailyPurchases.length}\n\n` +
                    `*Cash & Bank Summary:*\n` +
                    `Total Payments In: ₹${totalCashIn.toFixed(2)}\n` +
                    `Total Payments Out: ₹${totalCashOut.toFixed(2)}\n` +
                    `Net Cash Flow: ₹${netCashFlow.toFixed(2)}\n\n` +
                    `View full report in Vyapar app.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading daily transaction summary...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading daily transaction summary: {hasError}</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{t("Daily Transaction Summary", "दैनिक लेनदेन सारांश")}</CardTitle>
            <CardDescription>{t(`Overview of transactions for ${displayDate}.`, `${displayDate} के लिए लेनदेन का अवलोकन।`)}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground h-48 flex items-center justify-center">
            Please select a company from Company Settings to view the daily summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{t("Daily Transaction Summary", "दैनिक लेनदेन सारांश")}</CardTitle>
          <CardDescription>{t(`Overview of transactions for ${displayDate}.`, `${displayDate} के लिए लेनदेन का अवलोकन।`)}</CardDescription>
        </div>
        <div className="flex space-x-2 print-hide">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>{t("Pick a date", "एक तारीख चुनें")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={!date}>
            <Share2 className="mr-2 h-4 w-4" /> {t("Share Summary", "सारांश साझा करें")}
          </Button>
          <Button onClick={handlePrint} variant="outline" disabled={!date}>
            <Printer className="mr-2 h-4 w-4" /> {t("Print", "प्रिंट करें")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {date ? (
          <>
            {/* Sales Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{t("Sales Summary", "बिक्री सारांश")}</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Invoice No", "चालान संख्या")}</TableHead>
                      <TableHead>{t("Farmer Name", "किसान का नाम")}</TableHead>
                      <TableHead className="text-right">{t("Total Amount", "कुल राशि")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-12 text-center text-muted-foreground">
                          {t("No sales recorded for this date.", "इस तारीख के लिए कोई बिक्री दर्ज नहीं की गई है।")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailySales.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNo}</TableCell>
                          <TableCell>{invoice.farmer.farmerName}</TableCell>
                          <TableCell className="text-right">₹ {Number(invoice.totalAmount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={2}>{t("Total Sales", "कुल बिक्री")}</TableCell>
                      <TableCell className="text-right">₹ {totalSalesAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{t("Purchase Summary", "खरीद सारांश")}</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Purchase No", "खरीद संख्या")}</TableHead>
                      <TableHead>{t("Farmer Name", "किसान का नाम")}</TableHead>
                      <TableHead className="text-right">{t("Total Amount", "कुल राशि")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPurchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-12 text-center text-muted-foreground">
                          {t("No purchases recorded for this date.", "इस तारीख के लिए कोई खरीद दर्ज नहीं की गई है।")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyPurchases.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.purchaseNo}</TableCell>
                          <TableCell>{invoice.farmer.farmerName}</TableCell>
                          <TableCell className="text-right">₹ {Number(invoice.totalAmount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={2}>{t("Total Purchases", "कुल खरीद")}</TableCell>
                      <TableCell className="text-right">₹ {totalPurchaseAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Cash & Bank Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{t("Cash & Bank Summary", "नकद और बैंक सारांश")}</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("Type", "प्रकार")}</TableHead>
                      <TableHead>{t("Farmer", "किसान")}</TableHead>
                      <TableHead>{t("Method", "विधि")}</TableHead>
                      <TableHead className="text-right">{t("Amount", "राशि")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyCashBank.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-12 text-center text-muted-foreground">
                          {t("No cash/bank transactions for this date.", "इस तारीख के लिए कोई नकद/बैंक लेनदेन नहीं है।")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyCashBank.map(txn => (
                        <TableRow key={txn.id}>
                          <TableCell>{t(txn.type, txn.type === "Payment In" ? "भुगतान अंदर" : "भुगतान बाहर")}</TableCell>
                          <TableCell>{txn.farmerName}</TableCell>
                          <TableCell>{t(txn.paymentMethod, txn.paymentMethod === "Cash" ? "नकद" : "बैंक")}</TableCell>
                          <TableCell className="text-right">₹ {Number(txn.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>{t("Total Payment In", "कुल भुगतान अंदर")}</TableCell>
                      <TableCell className="text-right text-green-600">₹ {totalCashIn.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>{t("Total Payment Out", "कुल भुगतान बाहर")}</TableCell>
                      <TableCell className="text-right text-red-600">₹ {totalCashOut.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>{t("Net Cash Flow", "शुद्ध नकद प्रवाह")}</TableCell>
                      <TableCell className={`text-right ${ netCashFlow >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ₹ {netCashFlow.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground h-48 flex items-center justify-center">
            {t("Please select a date to view the daily summary.", "दैनिक सारांश देखने के लिए कृपया एक तारीख चुनें।")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTransactionSummaryReport;