"use client";

import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FarmerDueBalanceReport from "@/components/reports/FarmerDueBalanceReport";
import FarmerStatementReport from "@/components/reports/FarmerStatementReport";
import DailyTransactionSummaryReport from "@/components/reports/DailyTransactionSummaryReport";
import ItemStockReport from "@/components/reports/ItemStockReport"; // New import
import ItemMovementReport from "@/components/reports/ItemMovementReport"; // New import
import ConsolidatedTransactionReport from "@/components/reports/ConsolidatedTransactionReport"; // New import
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings

const ReportsPage: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">{t("Business Reports", "व्यापार रिपोर्ट")}</h1>
      <p className="text-lg text-muted-foreground">
        {t("Gain insights into your business performance with various detailed reports.", "विभिन्न विस्तृत रिपोर्टों के साथ अपने व्यवसाय के प्रदर्शन में अंतर्दृष्टि प्राप्त करें।")}
      </p>

      <Tabs defaultValue="farmer-balances" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-fit lg:grid-cols-6"> {/* Updated grid-cols */}
          <TabsTrigger value="farmer-balances">{t("Farmer Balances", "किसान शेष")}</TabsTrigger>
          <TabsTrigger value="farmer-statement">{t("Farmer Statement", "किसान विवरण")}</TabsTrigger>
          <TabsTrigger value="daily-summary">{t("Daily Summary", "दैनिक सारांश")}</TabsTrigger>
          <TabsTrigger value="item-stock">{t("Item Stock", "आइटम स्टॉक")}</TabsTrigger> {/* New Tab */}
          <TabsTrigger value="item-movement">{t("Item Movement", "आइटम आवाजाही")}</TabsTrigger> {/* New Tab */}
          <TabsTrigger value="consolidated-transactions">{t("All Transactions", "सभी लेनदेन")}</TabsTrigger> {/* New Tab */}
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