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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { CashBankTransaction } from "@/utils/balanceCalculations";
import { showError } from "@/utils/toast";
import { DateRangePicker } from "@/components/DateRangePicker"; // Import DateRangePicker
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook

interface Farmer {
  id: string;
  farmerName: string;
  fathersName: string;
  village: string;
  mobileNo: string;
  accountName: string;
  accountNo: string;
  ifscCode: string;
}

interface StatementEntry {
  date: string;
  time: string;
  type: "Sale" | "Purchase" | "Payment In" | "Payment Out";
  description: string;
  debit: number; // Amount farmer owes you (e.g., sales total, payment out)
  credit: number; // Amount you owe farmer (e.g., purchase total, payment in)
  balance: number; // Running balance
}

const FarmerStatementReport: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  
  // Fetch data using useFirestore hook
  const { data: allFarmers, loading: loadingFarmers, error: farmersError } = useFirestore<Farmer>('farmers');
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices');
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices');
  const { data: cashBankTransactions, loading: loadingCashBank, error: cashBankError } = useFirestore<CashBankTransaction>('cashBankTransactions');

  const [selectedFarmerId, setSelectedFarmerId] = useState<string | undefined>(undefined);
  const [statement, setStatement] = useState<StatementEntry[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // New state for date range

  const isLoading = loadingFarmers || loadingSales || loadingPurchases || loadingCashBank;
  const hasError = farmersError || salesError || purchasesError || cashBankError;

  const selectedFarmer = useMemo(() => {
    return allFarmers.find(f => f.id === selectedFarmerId);
  }, [selectedFarmerId, allFarmers]);

  useEffect(() => {
    if (!selectedFarmerId) {
      setStatement([]);
      return;
    }

    let entries: StatementEntry[] = [];

    const filterByDateRange = (itemDate: string) => {
      if (!dateRange?.from) return true; // No start date, include all
      const itemDateTime = parseISO(itemDate);
      const start = dateRange.from;
      const end = dateRange.to || new Date(); // If no end date, use today

      return isWithinInterval(itemDateTime, { start, end });
    };

    salesInvoices
      .filter(inv => inv.farmer.id === selectedFarmerId && filterByDateRange(inv.invoiceDate))
      .forEach(invoice => {
        entries.push({
          date: invoice.invoiceDate,
          time: invoice.invoiceTime,
          type: "Sale",
          description: `Sale Invoice ${invoice.invoiceNo} (Total: ₹${invoice.totalAmount.toFixed(2)}, Advance: ₹${invoice.advance.toFixed(2)})`,
          debit: invoice.totalAmount - invoice.advance,
          credit: 0,
          balance: 0, // Will be calculated later
        });
      });

    purchaseInvoices
      .filter(inv => inv.farmer.id === selectedFarmerId && filterByDateRange(inv.purchaseDate))
      .forEach(invoice => {
        entries.push({
          date: invoice.purchaseDate,
          time: invoice.purchaseTime,
          type: "Purchase",
          description: `Purchase Invoice ${invoice.purchaseNo} (Total: ₹${invoice.totalAmount.toFixed(2)}, Advance: ₹${invoice.advance.toFixed(2)})`,
          debit: 0,
          credit: invoice.totalAmount - invoice.advance,
          balance: 0, // Will be calculated later
        });
      });

    cashBankTransactions
      .filter(txn => txn.farmerId === selectedFarmerId && filterByDateRange(txn.date))
      .forEach(txn => {
        entries.push({
          date: txn.date,
          time: txn.time,
          type: txn.type,
          description: `${txn.type} (${txn.paymentMethod}) ${txn.remarks ? `- ${txn.remarks}` : ''}`,
          debit: txn.type === "Payment Out" ? txn.amount : 0,
          credit: txn.type === "Payment In" ? txn.amount : 0,
          balance: 0, // Will be calculated later
        });
      });

    // Sort entries chronologically
    entries.sort((a, b) => {
      const dateTimeA = new Date(`${a.date} ${a.time}`);
      const dateTimeB = new Date(`${b.date} ${b.time}`);
      return dateTimeA.getTime() - dateTimeB.getTime();
    });

    // Calculate running balance
    let runningBalance = 0;
    const statementWithBalances = entries.map(entry => {
      runningBalance += entry.debit; // Farmer owes you more
      runningBalance -= entry.credit; // You owe farmer more (or farmer owes you less)
      return { ...entry, balance: runningBalance };
    });

    setStatement(statementWithBalances);
  }, [selectedFarmerId, salesInvoices, purchaseInvoices, cashBankTransactions, dateRange]);

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const netBalance = statement.length > 0 ? statement[statement.length - 1].balance : 0;

  const handleWhatsAppShare = () => {
    if (!selectedFarmer || !selectedFarmer.mobileNo) {
      showError("Please select a farmer with a mobile number to share their statement summary.");
      return;
    }

    const balanceType = netBalance >= 0 ? "Owed by Farmer" : "Owed to Farmer";
    const dateRangeText = dateRange?.from
      ? dateRange.to
        ? ` for period ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}`
        : ` from ${format(dateRange.from, "PPP")}`
      : "";

    const message = `*Farmer Statement Summary for ${selectedFarmer.farmerName}${dateRangeText}*\n\n` +
                    `*Net Balance:* ₹${netBalance.toFixed(2)} (${balanceType})\n\n` +
                    `This summary reflects transactions up to ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}.\n` +
                    `For full details, please refer to the complete statement in the Vyapar app.`;

    const whatsappUrl = `https://wa.me/${selectedFarmer.mobileNo}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading farmer statement data...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading farmer statement: {hasError}</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{t("Farmer Statement", "किसान विवरण")}</CardTitle>
          <CardDescription>{t("View detailed transaction history for a farmer.", "एक किसान के लिए विस्तृत लेनदेन इतिहास देखें।")}</CardDescription>
        </div>
        <div className="flex space-x-2 print-hide">
          <Select onValueChange={setSelectedFarmerId} value={selectedFarmerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("Select a farmer", "एक किसान चुनें")} />
            </SelectTrigger>
            <SelectContent>
              {allFarmers.map((farmer) => (
                <SelectItem key={farmer.id} value={farmer.id}>
                  {farmer.farmerName} (ID: {farmer.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={!selectedFarmer || statement.length === 0}>
            <Share2 className="mr-2 h-4 w-4" /> {t("Share Summary", "सारांश साझा करें")}
          </Button>
          <Button onClick={handlePrint} variant="outline" disabled={!selectedFarmerId}>
            <Printer className="mr-2 h-4 w-4" /> {t("Print", "प्रिंट करें")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedFarmer ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>
                <p><span className="font-semibold">{t("Farmer Name:", "किसान का नाम:")}</span> {selectedFarmer.farmerName}</p>
                <p><span className="font-semibold">{t("Father's Name:", "पिता का नाम:")}</span> {selectedFarmer.fathersName}</p>
                <p><span className="font-semibold">{t("Village:", "गाँव:")}</span> {selectedFarmer.village}</p>
              </div>
              <div>
                <p><span className="font-semibold">{t("Mobile No:", "मोबाइल नंबर:")}</span> {selectedFarmer.mobileNo}</p>
                <p><span className="font-semibold">{t("Account Name:", "खाता नाम:")}</span> {selectedFarmer.accountName}</p>
                <p><span className="font-semibold">{t("Account No:", "खाता संख्या:")}</span> {selectedFarmer.accountNo}</p>
                <p><span className="font-semibold">{t("IFSC Code:", "आईएफएससी कोड:")}</span> {selectedFarmer.ifscCode}</p>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Date", "दिनांक")}</TableHead>
                    <TableHead>{t("Time", "समय")}</TableHead>
                    <TableHead>{t("Type", "प्रकार")}</TableHead>
                    <TableHead>{t("Description", "विवरण")}</TableHead>
                    <TableHead className="text-right">{t("Debit (₹)", "डेबिट (₹)")}</TableHead>
                    <TableHead className="text-right">{t("Credit (₹)", "क्रेडिट (₹)")}</TableHead>
                    <TableHead className="text-right">{t("Balance (₹)", "शेष (₹)")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        {t("No transactions found for this farmer in the selected date range.", "इस किसान के लिए चयनित तिथि सीमा में कोई लेनदेन नहीं मिला।")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    statement.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.time}</TableCell>
                        <TableCell>{t(entry.type, entry.type === "Sale" ? "बिक्री" : entry.type === "Purchase" ? "खरीद" : entry.type === "Payment In" ? "भुगतान अंदर" : "भुगतान बाहर")}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell className="text-right">{entry.debit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{entry.credit.toFixed(2)}</TableCell>
                        <TableCell className={`text-right font-semibold ${entry.balance >= 0 ? "text-red-600" : "text-green-600"}`}>
                          {entry.balance.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {statement.length > 0 && (
              <div className="flex justify-end items-center mt-4 p-3 bg-muted rounded-md">
                <p className="text-lg font-bold mr-4">{t("Net Balance:", "शुद्ध शेष:")}</p>
                <p className={`text-xl font-bold ${netBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
                  ₹ {netBalance.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground h-24 flex items-center justify-center">
            {t("Please select a farmer to view their statement.", "कृपया उनका विवरण देखने के लिए एक किसान चुनें।")}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FarmerStatementReport;