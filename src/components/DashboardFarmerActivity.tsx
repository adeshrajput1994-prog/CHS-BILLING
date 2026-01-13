"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign } from "lucide-react";
import { useFirestore } from "@/hooks/use-firestore";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { CashBankTransaction, calculateFarmerDueBalances } from "@/utils/balanceCalculations";
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface Farmer {
  id: string;
  farmerName: string;
  village: string;
  companyId: string;
}

interface FarmerActivitySummary {
  farmer: Farmer;
  totalSales: number;
  totalPurchases: number;
  netBalance: number;
}

const DashboardFarmerActivity: React.FC = () => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  // Pass currentCompanyId to useFirestore
  const { data: farmers, loading: loadingFarmers, error: farmersError } = useFirestore<Farmer>('farmers', currentCompanyId);
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);
  const { data: cashBankTransactions, loading: loadingCashBank, error: cashBankError } = useFirestore<CashBankTransaction>('cashBankTransactions', currentCompanyId);

  const farmerActivitySummaries = useMemo(() => {
    const balancesMap = calculateFarmerDueBalances(
      farmers,
      salesInvoices,
      purchaseInvoices,
      cashBankTransactions
    );

    const activityMap = new Map<string, { totalSales: number; totalPurchases: number }>();

    salesInvoices.forEach(invoice => {
      const current = activityMap.get(invoice.farmer.id) || { totalSales: 0, totalPurchases: 0 };
      current.totalSales += Number(invoice.totalAmount);
      activityMap.set(invoice.farmer.id, current);
    });

    purchaseInvoices.forEach(invoice => {
      const current = activityMap.get(invoice.farmer.id) || { totalSales: 0, totalPurchases: 0 };
      current.totalPurchases += Number(invoice.totalAmount);
      activityMap.set(invoice.farmer.id, current);
    });

    const results: FarmerActivitySummary[] = farmers.map(farmer => ({
      farmer,
      totalSales: activityMap.get(farmer.id)?.totalSales || 0,
      totalPurchases: activityMap.get(farmer.id)?.totalPurchases || 0,
      netBalance: balancesMap.get(farmer.id) || 0,
    }));

    // Sort by net balance (e.g., farmers who owe you the most)
    return results.sort((a, b) => b.netBalance - a.netBalance).slice(0, 5); // Top 5 active/due farmers
  }, [farmers, salesInvoices, purchaseInvoices, cashBankTransactions]);

  if (loadingFarmers || loadingSales || loadingPurchases || loadingCashBank) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Loading farmer activity...</div>;
  }

  if (farmersError || salesError || purchasesError || cashBankError) {
    return <div className="text-center py-4 text-sm text-red-500">Error loading farmer data.</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Farmer Activity</CardTitle>
          <CardDescription>Farmers with highest outstanding balances or recent activity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-muted-foreground">
            Please select a company from Company Settings to view farmer activity.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Farmer Activity</CardTitle>
        <CardDescription>Farmers with highest outstanding balances or recent activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Farmer Name</TableHead>
                <TableHead className="text-right">Total Sales (₹)</TableHead>
                <TableHead className="text-right">Total Purchases (₹)</TableHead>
                <TableHead className="text-right">Net Balance (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmerActivitySummaries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-12 text-center text-muted-foreground">
                    No farmer activity to display.
                  </TableCell>
                </TableRow>
              ) : (
                farmerActivitySummaries.map(summary => (
                  <TableRow key={summary.farmer.id}>
                    <TableCell>{summary.farmer.farmerName} ({summary.farmer.village})</TableCell>
                    <TableCell className="text-right text-green-600">{summary.totalSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-red-600">{summary.totalPurchases.toFixed(2)}</TableCell>
                    <TableCell className={`text-right font-semibold ${summary.netBalance > 0 ? "text-green-600" : "text-red-600"}`}>
                      {summary.netBalance.toFixed(2)}
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

export default DashboardFarmerActivity;