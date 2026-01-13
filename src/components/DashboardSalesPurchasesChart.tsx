"use client";

import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays } from "date-fns";
import { useFirestore } from "@/hooks/use-firestore";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface ChartData {
  date: string;
  sales: number;
  purchases: number;
}

const DashboardSalesPurchasesChart: React.FC = () => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  // Pass currentCompanyId to useFirestore
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);

  const chartData = useMemo(() => {
    const today = new Date();
    const dataMap = new Map<string, { sales: number; purchases: number }>();

    // Initialize data for the last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const formattedDate = format(date, "MMM dd");
      dataMap.set(formattedDate, { sales: 0, purchases: 0 });
    }

    // Aggregate sales data
    salesInvoices.forEach(invoice => {
      const invoiceDate = format(new Date(invoice.invoiceDate), "MMM dd");
      if (dataMap.has(invoiceDate)) {
        const current = dataMap.get(invoiceDate)!;
        current.sales += Number(invoice.totalAmount);
        dataMap.set(invoiceDate, current);
      }
    });

    // Aggregate purchase data
    purchaseInvoices.forEach(invoice => {
      const purchaseDate = format(new Date(invoice.purchaseDate), "MMM dd");
      if (dataMap.has(purchaseDate)) {
        const current = dataMap.get(purchaseDate)!;
        current.purchases += Number(invoice.totalAmount);
        dataMap.set(purchaseDate, current);
      }
    });

    return Array.from(dataMap.entries()).map(([date, values]) => ({
      date,
      sales: parseFloat(values.sales.toFixed(2)),
      purchases: parseFloat(values.purchases.toFixed(2)),
    }));
  }, [salesInvoices, purchaseInvoices]);

  if (loadingSales || loadingPurchases) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Loading chart data...</div>;
  }

  if (salesError || purchasesError) {
    return <div className="text-center py-4 text-sm text-red-500">Error loading chart data.</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales & Purchases</CardTitle>
          <CardDescription>Last 7 days overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-muted-foreground">
            Please select a company from Company Settings to view sales and purchases chart.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Sales & Purchases</CardTitle>
        <CardDescription>Last 7 days overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value: number) => `₹ ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="sales" fill="#22c55e" name="Sales Amount" />
              <Bar dataKey="purchases" fill="#ef4444" name="Purchase Amount" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardSalesPurchasesChart;