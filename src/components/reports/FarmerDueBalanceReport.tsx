"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateFarmerDueBalances, CashBankTransaction } from "@/utils/balanceCalculations";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { Input } from "@/components/ui/input";
import { Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { DateRangePicker } from "@/components/DateRangePicker"; // Import DateRangePicker
import { DateRange } from "react-day-picker";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook

interface Farmer {
  id: string;
  farmerName: string;
  fathersName: string;
  village: string;
  mobileNo: string;
}

interface FarmerBalance {
  farmer: Farmer;
  balance: number;
}

const FarmerDueBalanceReport: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  
  // Fetch data using useFirestore hook
  const { data: farmers, loading: loadingFarmers, error: farmersError } = useFirestore<Farmer>('farmers');
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices');
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices');
  const { data: cashBankTransactions, loading: loadingCashBank, error: cashBankError } = useFirestore<CashBankTransaction>('cashBankTransactions');

  const [filteredBalances, setFilteredBalances] = useState<FarmerBalance[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // New state for date range

  const isLoading = loadingFarmers || loadingSales || loadingPurchases || loadingCashBank;
  const hasError = farmersError || salesError || purchasesError || cashBankError;

  useEffect(() => {
    // For FarmerDueBalanceReport, the balance is always current, not date-range specific.
    // However, if we wanted to show "balance as of a certain date", the logic would go here.
    // For now, we calculate the current balance.
    const balancesMap = calculateFarmerDueBalances(
      farmers,
      salesInvoices,
      purchaseInvoices,
      cashBankTransactions
    );

    const allFarmerBalances: FarmerBalance[] = farmers.map(farmer => ({
      farmer,
      balance: balancesMap.get(farmer.id) || 0,
    }));

    const filtered = allFarmerBalances.filter(fb =>
      fb.farmer.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.farmer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.farmer.village.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBalances(filtered);
  }, [farmers, salesInvoices, purchaseInvoices, cashBankTransactions, searchTerm]);

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const handleWhatsAppShare = () => {
    if (filteredBalances.length === 0) {
      showError("No farmer balances to share.");
      return;
    }

    let message = `*Farmer Due Balance Report*\n\n`;
    filteredBalances.forEach(fb => {
      const balanceType = fb.balance >= 0 ? "Owed by Farmer" : "Owed to Farmer";
      message += `*${fb.farmer.farmerName}* (ID: ${fb.farmer.id}, Village: ${fb.farmer.village})\n`;
      message += `Balance: ₹${fb.balance.toFixed(2)} (${balanceType})\n\n`;
    });
    message += `View full report in Vyapar app.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading farmer balances...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading farmer balances: {hasError}</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">{t("Farmer Due Balances", "किसान देय शेष")}</CardTitle>
        <div className="flex space-x-2 print-hide">
          <Input
            placeholder={t("Search farmer...", "किसान खोजें...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          {/* DateRangePicker is added here but not actively used for balance calculation in this specific report */}
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={filteredBalances.length === 0}>
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
                <TableHead>{t("Farmer ID", "किसान आईडी")}</TableHead>
                <TableHead>{t("Farmer Name", "किसान का नाम")}</TableHead>
                <TableHead>{t("Village", "गाँव")}</TableHead>
                <TableHead className="text-right">{t("Due Balance", "देय शेष")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBalances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t("No farmers found or no balances to display.", "कोई किसान नहीं मिला या कोई शेष राशि प्रदर्शित करने के लिए नहीं है।")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBalances.map((fb) => (
                  <TableRow key={fb.farmer.id}>
                    <TableCell>
                      <Badge variant="outline">{fb.farmer.id}</Badge>
                    </TableCell>
                    <TableCell>{fb.farmer.farmerName}</TableCell>
                    <TableCell>{fb.farmer.village}</TableCell>
                    <TableCell className={`text-right font-semibold ${fb.balance >= 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹ {fb.balance.toFixed(2)}
                    </TableCell>
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

export default FarmerDueBalanceReport;