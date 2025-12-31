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
  const [allFarmers, setAllFarmers] = useState<Farmer[]>([]);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | undefined>(undefined);
  const [salesInvoices, setSalesInvoices] = useState<CompleteSalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<CompletePurchaseInvoice[]>([]);
  const [cashBankTransactions, setCashBankTransactions] = useState<CashBankTransaction[]>([]);
  const [statement, setStatement] = useState<StatementEntry[]>([]);

  useEffect(() => {
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) setAllFarmers(JSON.parse(storedFarmers));

    const storedSalesInvoices = localStorage.getItem("salesInvoices");
    if (storedSalesInvoices) {
      const parsedInvoices: CompleteSalesInvoice[] = JSON.parse(storedSalesInvoices);
      const processedInvoices = parsedInvoices.map(invoice => ({
        ...invoice,
        totalAmount: Number(invoice.totalAmount),
        advance: Number(invoice.advance),
        due: Number(invoice.due),
      }));
      setSalesInvoices(processedInvoices);
    }

    const storedPurchaseInvoices = localStorage.getItem("purchaseInvoices");
    if (storedPurchaseInvoices) {
      const parsedInvoices: CompletePurchaseInvoice[] = JSON.parse(storedPurchaseInvoices);
      const processedInvoices = parsedInvoices.map(invoice => ({
        ...invoice,
        totalAmount: Number(invoice.totalAmount),
        advance: Number(invoice.advance),
        due: Number(invoice.due),
      }));
      setPurchaseInvoices(processedInvoices);
    }

    const storedCashBankTransactions = localStorage.getItem("cashBankTransactions");
    if (storedCashBankTransactions) {
      const parsedTransactions: CashBankTransaction[] = JSON.parse(storedCashBankTransactions);
      const processedTransactions = parsedTransactions.map(txn => ({
        ...txn,
        amount: Number(txn.amount),
      }));
      setCashBankTransactions(processedTransactions);
    }
  }, []);

  const selectedFarmer = useMemo(() => {
    return allFarmers.find(f => f.id === selectedFarmerId);
  }, [selectedFarmerId, allFarmers]);

  useEffect(() => {
    if (!selectedFarmerId) {
      setStatement([]);
      return;
    }

    const farmerSales = salesInvoices.filter(inv => inv.farmer.id === selectedFarmerId);
    const farmerPurchases = purchaseInvoices.filter(inv => inv.farmer.id === selectedFarmerId);
    const farmerCashBank = cashBankTransactions.filter(txn => txn.farmerId === selectedFarmerId);

    let entries: StatementEntry[] = [];

    farmerSales.forEach(invoice => {
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

    farmerPurchases.forEach(invoice => {
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

    farmerCashBank.forEach(txn => {
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
  }, [selectedFarmerId, salesInvoices, purchaseInvoices, cashBankTransactions]);

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
    const message = `*Farmer Statement Summary for ${selectedFarmer.farmerName}*\n\n` +
                    `*Net Balance:* ₹${netBalance.toFixed(2)} (${balanceType})\n\n` +
                    `This summary reflects transactions up to ${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}.\n` +
                    `For full details, please refer to the complete statement in the Vyapar app.`;

    const whatsappUrl = `https://wa.me/${selectedFarmer.mobileNo}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">Farmer Statement</CardTitle>
          <CardDescription>View detailed transaction history for a farmer.</CardDescription>
        </div>
        <div className="flex space-x-2 print-hide">
          <Select onValueChange={setSelectedFarmerId} value={selectedFarmerId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a farmer" />
            </SelectTrigger>
            <SelectContent>
              {allFarmers.map((farmer) => (
                <SelectItem key={farmer.id} value={farmer.id}>
                  {farmer.farmerName} (ID: {farmer.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={!selectedFarmer || statement.length === 0}>
            <Share2 className="mr-2 h-4 w-4" /> Share Summary
          </Button>
          <Button onClick={handlePrint} variant="outline" disabled={!selectedFarmerId}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {selectedFarmer ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
              <div>
                <p><span className="font-semibold">Farmer Name:</span> {selectedFarmer.farmerName}</p>
                <p><span className="font-semibold">Father's Name:</span> {selectedFarmer.fathersName}</p>
                <p><span className="font-semibold">Village:</span> {selectedFarmer.village}</p>
              </div>
              <div>
                <p><span className="font-semibold">Mobile No:</span> {selectedFarmer.mobileNo}</p>
                <p><span className="font-semibold">Account Name:</span> {selectedFarmer.accountName}</p>
                <p><span className="font-semibold">Account No:</span> {selectedFarmer.accountNo}</p>
                <p><span className="font-semibold">IFSC Code:</span> {selectedFarmer.ifscCode}</p>
              </div>
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Debit (₹)</TableHead>
                    <TableHead className="text-right">Credit (₹)</TableHead>
                    <TableHead className="text-right">Balance (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statement.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No transactions found for this farmer.
                      </TableCell>
                    </TableRow>
                  ) : (
                    statement.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>{entry.date}</TableCell>
                        <TableCell>{entry.time}</TableCell>
                        <TableCell>{entry.type}</TableCell>
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
                <p className="text-lg font-bold mr-4">Net Balance:</p>
                <p className={`text-xl font-bold ${netBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
                  ₹ {netBalance.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-muted-foreground h-24 flex items-center justify-center">
            Please select a farmer to view their statement.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default FarmerStatementReport;