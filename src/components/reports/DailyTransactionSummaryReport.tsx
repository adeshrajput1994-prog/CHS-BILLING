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
import { Calendar as CalendarIcon, Printer } from "lucide-react";
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

const DailyTransactionSummaryReport: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [salesInvoices, setSalesInvoices] = useState<CompleteSalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<CompletePurchaseInvoice[]>([]);
  const [cashBankTransactions, setCashBankTransactions] = useState<CashBankTransaction[]>([]);

  useEffect(() => {
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
    if (storedCashBankTransactions) setCashBankTransactions(JSON.parse(storedCashBankTransactions));
  }, []);

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

  const totalSalesAmount = dailySales.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPurchaseAmount = dailyPurchases.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCashIn = dailyCashBank.filter(txn => txn.type === "Payment In").reduce((sum, txn) => sum + txn.amount, 0);
  const totalCashOut = dailyCashBank.filter(txn => txn.type === "Payment Out").reduce((sum, txn) => sum + txn.amount, 0);

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">Daily Transaction Summary</CardTitle>
          <CardDescription>Overview of transactions for {displayDate}.</CardDescription>
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
                {date ? format(date, "PPP") : <span>Pick a date</span>}
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
          <Button onClick={handlePrint} variant="outline" disabled={!date}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {date ? (
          <>
            {/* Sales Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Sales Summary</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice No</TableHead>
                      <TableHead>Farmer Name</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailySales.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-12 text-center text-muted-foreground">
                          No sales recorded for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailySales.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.invoiceNo}</TableCell>
                          <TableCell>{invoice.farmer.farmerName}</TableCell>
                          <TableCell className="text-right">₹ {invoice.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={2}>Total Sales</TableCell>
                      <TableCell className="text-right">₹ {totalSalesAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Purchase Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Purchase Summary</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purchase No</TableHead>
                      <TableHead>Farmer Name</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyPurchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="h-12 text-center text-muted-foreground">
                          No purchases recorded for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyPurchases.map(invoice => (
                        <TableRow key={invoice.id}>
                          <TableCell>{invoice.purchaseNo}</TableCell>
                          <TableCell>{invoice.farmer.farmerName}</TableCell>
                          <TableCell className="text-right">₹ {invoice.totalAmount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={2}>Total Purchases</TableCell>
                      <TableCell className="text-right">₹ {totalPurchaseAmount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Cash & Bank Summary */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Cash & Bank Summary</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Farmer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyCashBank.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-12 text-center text-muted-foreground">
                          No cash/bank transactions for this date.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyCashBank.map(txn => (
                        <TableRow key={txn.id}>
                          <TableCell>{txn.type}</TableCell>
                          <TableCell>{txn.farmerName}</TableCell>
                          <TableCell>{txn.paymentMethod}</TableCell>
                          <TableCell className="text-right">₹ {txn.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>Total Payment In</TableCell>
                      <TableCell className="text-right text-green-600">₹ {totalCashIn.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>Total Payment Out</TableCell>
                      <TableCell className="text-right text-red-600">₹ {totalCashOut.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell colSpan={3}>Net Cash Flow</TableCell>
                      <TableCell className={`text-right ${ (totalCashIn - totalCashOut) >= 0 ? "text-green-600" : "text-red-600"}`}>
                        ₹ {(totalCashIn - totalCashOut).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground h-48 flex items-center justify-center">
            Please select a date to view the daily summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyTransactionSummaryReport;