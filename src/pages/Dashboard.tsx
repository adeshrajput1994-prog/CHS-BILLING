"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { calculateFarmerDueBalances, CashBankTransaction, calculateCompanyCashFlow } from "@/utils/balanceCalculations";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { Expense } from "@/components/ExpenseForm"; // Import Expense interface
import { Banknote, ArrowUpCircle, ArrowDownCircle, Package, Factory, CalendarDays, PlusCircle, Wallet } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { useFirestore } from "@/hooks/use-firestore";
import DashboardSalesPurchasesChart from "@/components/DashboardSalesPurchasesChart";
import DashboardTopItems from "@/components/DashboardTopItems";
import DashboardFarmerActivity from "@/components/DashboardFarmerActivity";
import { useCompany } from "@/context/CompanyContext";

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
  companyId: string;
}

interface ManufacturingExpense {
  manufacturedItemName: string;
  totalPurchaseItemKg: number;
  manufacturedItemKg: number;
  plantLabourRate: number;
  khakhoraLabourRate: number;
  loadingLabourRate: number;
  freightRate: number;
  companyId: string;
}

const Dashboard = () => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  // Fetch data using useFirestore hook, passing currentCompanyId
  const { data: farmers, loading: loadingFarmers, error: farmersError } = useFirestore<Farmer>('farmers', currentCompanyId);
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);
  const { data: cashBankTransactions, loading: loadingCashBank, error: cashBankError } = useFirestore<CashBankTransaction>('cashBankTransactions', currentCompanyId);
  const { data: manufacturingExpenses, loading: loadingManufacturing, error: manufacturingError } = useFirestore<ManufacturingExpense>('manufacturingExpenses', currentCompanyId);
  const { data: companyExpenses, loading: loadingCompanyExpenses, error: companyExpensesError } = useFirestore<Expense>('expenses', currentCompanyId); // New: Fetch company expenses

  const isLoading = loadingFarmers || loadingSales || loadingPurchases || loadingCashBank || loadingManufacturing || loadingCompanyExpenses;
  const hasError = farmersError || salesError || purchasesError || cashBankError || manufacturingError || companyExpensesError;

  const {
    totalPaymentsIn,
    totalPaymentsOut,
    overallNetBusinessBalance,
    totalPurchasedItemsKg,
    totalManufacturedItemsKg,
    dailySalesAmount,
    dailyPurchaseAmount,
    dailyCashIn,
    dailyCashOut,
    majorPayments,
    currentCashInHand, // New: Cash in Hand
    totalCompanyExpensesAmount, // New: Total Company Expenses
    totalCashInFromBankHome, // New: Cash In from Bank/Home
    totalCashOutToBankHome, // New: Cash Out to Bank/Home
  } = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let totalPurchasedKg = 0;
    let totalManufacturedKg = 0;
    let dailySales = 0;
    let dailyPurchases = 0;
    let dailyCashInTxn = 0;
    let dailyCashOutTxn = 0;

    const todayDate = format(new Date(), "yyyy-MM-dd");

    cashBankTransactions.forEach(txn => {
      if (txn.type === "Payment In") {
        totalIn += Number(txn.amount);
        if (txn.date === todayDate) dailyCashInTxn += Number(txn.amount);
      } else {
        totalOut += Number(txn.amount);
        if (txn.date === todayDate) dailyCashOutTxn += Number(txn.amount);
      }
    });

    purchaseInvoices.forEach(invoice => {
      totalPurchasedKg += invoice.items.reduce((sum, item) => sum + Number(item.finalWeight), 0);
      if (invoice.purchaseDate === todayDate) dailyPurchases += Number(invoice.totalAmount);
    });

    salesInvoices.forEach(invoice => {
      if (invoice.invoiceDate === todayDate) dailySales += Number(invoice.totalAmount);
    });

    manufacturingExpenses.forEach(expense => {
      totalManufacturedKg += Number(expense.manufacturedItemKg);
    });

    const farmerBalancesMap = calculateFarmerDueBalances(
      farmers,
      salesInvoices,
      purchaseInvoices,
      cashBankTransactions
    );

    let netBalance = 0;
    farmerBalancesMap.forEach(balance => {
      netBalance += balance;
    });

    const majorPaymentsList = [...cashBankTransactions]
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 5);

    // New: Calculate company cash flow
    const { cashInHand, totalCashInFromBankHome, totalCashOutToBankHome, totalCompanyExpenses } = calculateCompanyCashFlow(companyExpenses);

    return {
      totalPaymentsIn: totalIn,
      totalPaymentsOut: totalOut,
      overallNetBusinessBalance: netBalance,
      totalPurchasedItemsKg: totalPurchasedKg,
      totalManufacturedItemsKg: totalManufacturedKg,
      dailySalesAmount: dailySales,
      dailyPurchaseAmount: dailyPurchases,
      dailyCashIn: dailyCashInTxn,
      dailyCashOut: dailyCashOutTxn,
      majorPayments: majorPaymentsList,
      currentCashInHand: cashInHand,
      totalCompanyExpensesAmount: totalCompanyExpenses,
      totalCashInFromBankHome: totalCashInFromBankHome,
      totalCashOutToBankHome: totalCashOutToBankHome,
    };
  }, [farmers, salesInvoices, purchaseInvoices, cashBankTransactions, manufacturingExpenses, companyExpenses]);

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading dashboard data...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading dashboard data: {hasError}</div>;
  }

  if (!currentCompanyId) {
    return (
      <div className="text-center py-8 text-lg">
        Please select a company from Company Settings to view the dashboard.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome to CHS BILLING!</h1>
      <p className="text-lg text-muted-foreground">
        Enter details to make your first sale 🚀
      </p>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Perform common tasks quickly.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/sale">
            <Button className="w-full h-auto py-4 text-lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Sales Invoice
            </Button>
          </Link>
          <Link to="/purchase">
            <Button className="w-full h-auto py-4 text-lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Purchase Invoice
            </Button>
          </Link>
          <Link to="/cash-bank">
            <Button className="w-full h-auto py-4 text-lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Record Farmer Payment
            </Button>
          </Link>
          <Link to="/expenses">
            <Button className="w-full h-auto py-4 text-lg">
              <PlusCircle className="mr-2 h-5 w-5" /> Record Company Expense
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4"> {/* Updated grid-cols */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Business Balance</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overallNetBusinessBalance > 0 ? "text-green-600" : "text-red-600"}`}>
              ₹ {overallNetBusinessBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net amount owed by/to all farmers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments In (Farmers)</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹ {totalPaymentsIn.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash/bank received from farmers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments Out (Farmers)</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹ {totalPaymentsOut.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total cash/bank paid to farmers
            </p>
          </CardContent>
        </Card>

        {/* New Card for Cash in Hand */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash In Hand</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentCashInHand >= 0 ? "text-blue-600" : "text-red-600"}`}>
              ₹ {currentCashInHand.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Current physical cash balance
            </p>
          </CardContent>
        </Card>

        {/* New Cards for Total Purchased and Manufactured Items */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchased Items</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalPurchasedItemsKg.toFixed(2)} KG
            </div>
            <p className="text-xs text-muted-foreground">
              Total raw materials purchased
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Manufactured Items</CardTitle>
            <Factory className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {totalManufacturedItemsKg.toFixed(2)} KG
            </div>
            <p className="text-xs text-muted-foreground">
              Total items produced
            </p>
          </CardContent>
        </Card>

        {/* New Card for Total Company Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Company Expenses</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹ {totalCompanyExpensesAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total operational expenses
            </p>
          </CardContent>
        </Card>

        {/* New Card for Cash In/Out from Bank/Home */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Flow (Bank/Home)</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              In: ₹ {totalCashInFromBankHome.toFixed(2)}
            </div>
            <div className="text-lg font-bold text-red-600">
              Out: ₹ {totalCashOutToBankHome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Cash brought from/deposited to Bank/Home
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Daily Summary Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Daily Summary ({format(new Date(), "PPP")})</CardTitle>
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Daily Sales Amount:</p>
            <p className="text-lg font-bold text-green-600">₹ {dailySalesAmount.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Daily Purchase Amount:</p>
            <p className="text-lg font-bold text-red-600">₹ {dailyPurchaseAmount.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Daily Farmer Payments In:</p>
            <p className="text-lg font-bold text-green-600">₹ {dailyCashIn.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Daily Farmer Payments Out:</p>
            <p className="text-lg font-bold text-red-600">₹ {dailyCashOut.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Sales & Purchases Chart */}
      <DashboardSalesPurchasesChart />

      {/* Top Items Overview */}
      <DashboardTopItems />

      {/* Top Farmer Activity */}
      <DashboardFarmerActivity />

      {/* Major Payments Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Major Farmer Payments (Top 5)</CardTitle>
          <CardDescription>Recent large cash or bank transactions with farmers.</CardDescription>
        </CardHeader>
        <CardContent>
          {majorPayments.length === 0 ? (
            <p className="text-muted-foreground">No major farmer payments recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {majorPayments.map((txn) => (
                <div key={txn.id} className="flex justify-between items-center border-b pb-2 last:border-b-0 last:pb-0">
                  <div>
                    <p className="font-medium">{txn.farmerName}</p>
                    <p className="text-sm text-muted-foreground">{txn.type} ({txn.paymentMethod}) - {txn.date}</p>
                  </div>
                  <p className={`font-bold ${txn.type === "Payment In" ? "text-green-600" : "text-red-600"}`}>
                    ₹ {Number(txn.amount).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;