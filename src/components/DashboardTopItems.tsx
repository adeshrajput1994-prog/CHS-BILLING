"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, TrendingUp, TrendingDown } from "lucide-react";
import { useFirestore } from "@/hooks/use-firestore";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { Item as GlobalItem } from "@/components/ItemForm";
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface ItemSummary {
  id: string;
  name: string;
  totalSoldKg: number;
  totalPurchasedKg: number;
}

const DashboardTopItems: React.FC = () => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  // Pass currentCompanyId to useFirestore
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);
  const { data: allItems, loading: loadingItems, error: itemsError } = useFirestore<GlobalItem>('items', currentCompanyId);

  const itemSummaries = useMemo(() => {
    const summaryMap = new Map<string, ItemSummary>();

    allItems.forEach(item => {
      summaryMap.set(item.id, {
        id: item.id,
        name: item.itemName,
        totalSoldKg: 0,
        totalPurchasedKg: 0,
      });
    });

    salesInvoices.forEach(invoice => {
      invoice.items.forEach(saleItem => {
        const summary = summaryMap.get(saleItem.selectedItemId);
        if (summary) {
          summary.totalSoldKg += Number(saleItem.weight);
        }
      });
    });

    purchaseInvoices.forEach(invoice => {
      invoice.items.forEach(purchaseItem => {
        const summary = summaryMap.get(purchaseItem.selectedItemId);
        if (summary) {
          summary.totalPurchasedKg += Number(purchaseItem.finalWeight);
        }
      });
    });

    return Array.from(summaryMap.values());
  }, [salesInvoices, purchaseInvoices, allItems]);

  const topSellingItems = useMemo(() => {
    return [...itemSummaries]
      .sort((a, b) => b.totalSoldKg - a.totalSoldKg)
      .slice(0, 5);
  }, [itemSummaries]);

  const topPurchasedItems = useMemo(() => {
    return [...itemSummaries]
      .sort((a, b) => b.totalPurchasedKg - a.totalPurchasedKg)
      .slice(0, 5);
  }, [itemSummaries]);

  if (loadingSales || loadingPurchases || loadingItems) {
    return <div className="text-center py-4 text-sm text-muted-foreground">Loading top items...</div>;
  }

  if (salesError || purchasesError || itemsError) {
    return <div className="text-center py-4 text-sm text-red-500">Error loading item data.</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Items Overview</CardTitle>
          <CardDescription>Most sold and purchased items.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-muted-foreground">
            Please select a company from Company Settings to view top items.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Items Overview</CardTitle>
        <CardDescription>Most sold and purchased items.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-green-600" /> Top 5 Selling Items
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Total Sold (KG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-12 text-center text-muted-foreground">
                      No sales data.
                    </TableCell>
                  </TableRow>
                ) : (
                  topSellingItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.totalSoldKg.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <TrendingDown className="h-5 w-5 mr-2 text-red-600" /> Top 5 Purchased Items
          </h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead className="text-right">Total Purchased (KG)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPurchasedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-12 text-center text-muted-foreground">
                      No purchase data.
                    </TableCell>
                  </TableRow>
                ) : (
                  topPurchasedItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.totalPurchasedKg.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardTopItems;