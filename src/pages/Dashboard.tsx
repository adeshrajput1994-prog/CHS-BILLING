"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { calculateFarmerDueBalances, CashBankTransaction } from "@/utils/balanceCalculations";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { Banknote, ArrowUpCircle, ArrowDownCircle } from "lucide-react"; // Added missing imports

interface Farmer {
  id: string;
  farmerName: string;
  fathersName: string;
  village: string;
  mobileNo: string;
  aadharCardNo: string;
  accountName: string;
  accountNo: string;
  ifscCode: string;
}

const Dashboard = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<CompleteSalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<CompletePurchaseInvoice[]>([]);
  const [cashBankTransactions, setCashBankTransactions] = useState<CashBankTransaction[]>([]);

  useEffect(() => {
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) setFarmers(JSON.parse(storedFarmers));

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

  const { totalPaymentsIn, totalPaymentsOut, overallNetBusinessBalance } = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    cashBankTransactions.forEach(txn => {
      if (txn.type === "Payment In") {
        totalIn += txn.amount;
      } else {
        totalOut += txn.amount;
      }
    });

    const farmerBalancesMap = calculateFarmerDueBalances(
      farmers,
      salesInvoices,
      purchaseInvoices,
      cashBankTransactions
    );

    // Sum all individual farmer balances to get the overall net position of the business with its farmers
    let netBalance = 0;
    farmerBalancesMap.forEach(balance => {
      netBalance += balance;
    });

    return {
      totalPaymentsIn: totalIn,
      totalPaymentsOut: totalOut,
      overallNetBusinessBalance: netBalance,
    };
  }, [farmers, salesInvoices, purchaseInvoices, cashBankTransactions]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to Vyapar!</h1>
      <p className="text-lg text-muted-foreground">
        Enter details to make your first sale 🚀
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Business Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallNetBusinessBalance >= 0 ? "text-red-600" : "text-green-600"}`}>
              ₹ {overallNetBusinessBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net amount owed by/to all farmers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments In</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹ {totalPaymentsIn.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash/bank received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments Out</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹ {totalPaymentsOut.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash/bank paid
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>First sale is made in less than a minute on Vyapar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Invoice Number : 01</p>
              <p className="text-sm font-medium">Invoice Date : {new Date().toLocaleDateString('en-GB')}</p>
            </div>
            <div className="flex flex-col items-start md:items-end">
              <p className="text-sm font-medium mb-2">Bill To :</p>
              <Link to="/farmers">
                <Button variant="outline">Add Farmer Details</Button>
              </Link>
            </div>
          </div>
          <div className="border-dashed border-2 p-4 text-center rounded-md">
            <p className="text-muted-foreground">Add Sample Item</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Calculation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Invoice Amount*</p>
            <p className="text-lg font-semibold">₹ 0.00</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium">Received</p>
            <p className="text-lg font-semibold">₹ 0.00</p>
          </div>
          <div className="flex justify-between items-center border-t pt-4">
            <p className="text-xl font-bold">Balance</p>
            <p className="text-2xl font-bold text-green-600">₹ 0.00</p>
          </div>
          <Button className="w-full">Create Your First Invoice</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;