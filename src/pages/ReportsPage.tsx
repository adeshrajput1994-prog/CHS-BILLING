"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FarmerDueBalanceReport from "@/components/reports/FarmerDueBalanceReport";
import FarmerStatementReport from "@/components/reports/FarmerStatementReport";
import DailyTransactionSummaryReport from "@/components/reports/DailyTransactionSummaryReport";
import ItemStockReport from "@/components/reports/ItemStockReport"; // New import
import ItemMovementReport from "@/components/reports/ItemMovementReport"; // New import
import ConsolidatedTransactionReport from "@/components/reports/ConsolidatedTransactionReport"; // New import

const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Business Reports</h1>
      <p className="text-lg text-muted-foreground">
        Gain insights into your business performance with various detailed reports.
      </p>

      <Tabs defaultValue="farmer-balances" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-fit lg:grid-cols-6"> {/* Updated grid-cols */}
          <TabsTrigger value="farmer-balances">Farmer Balances</TabsTrigger>
          <TabsTrigger value="farmer-statement">Farmer Statement</TabsTrigger>
          <TabsTrigger value="daily-summary">Daily Summary</TabsTrigger>
          <TabsTrigger value="item-stock">Item Stock</TabsTrigger> {/* New Tab */}
          <TabsTrigger value="item-movement">Item Movement</TabsTrigger> {/* New Tab */}
          <TabsTrigger value="consolidated-transactions">All Transactions</TabsTrigger> {/* New Tab */}
        </TabsList>

        <TabsContent value="farmer-balances">
          <FarmerDueBalanceReport />
        </TabsContent>
        <TabsContent value="farmer-statement">
          <FarmerStatementReport />
        </TabsContent>
        <TabsContent value="daily-summary">
          <DailyTransactionSummaryReport />
        </TabsContent>
        <TabsContent value="item-stock"> {/* New Tab Content */}
          <ItemStockReport />
        </TabsContent>
        <TabsContent value="item-movement"> {/* New Tab Content */}
          <ItemMovementReport />
        </TabsContent>
        <TabsContent value="consolidated-transactions"> {/* New Tab Content */}
          <ConsolidatedTransactionReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsPage;