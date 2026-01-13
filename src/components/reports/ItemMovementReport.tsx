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
import { Input } from "@/components/ui/input";
import { Printer, Share2, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { Item as GlobalItem } from "@/components/ItemForm";
import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { DateRangePicker } from "@/components/DateRangePicker";
import { DateRange } from "react-day-picker";
import { isWithinInterval, parseISO, format } from "date-fns";
import { exportToExcel, exportToPdf } from "@/utils/fileExportImport";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface ItemMovementSummary {
  item: GlobalItem;
  totalSalesKg: number;
  totalPurchasesKg: number;
  netMovementKg: number;
  closingStockKg: number;
}

const ItemMovementReport: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();
  
  // Fetch data using useFirestore hook, passing currentCompanyId
  const { data: allItems, loading: loadingItems, error: itemsError } = useFirestore<GlobalItem>('items', currentCompanyId);
  const { data: salesInvoices, loading: loadingSales, error: salesError } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases, error: purchasesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const isLoading = loadingItems || loadingSales || loadingPurchases;
  const hasError = itemsError || salesError || purchasesError;

  const itemMovementData = useMemo(() => {
    const summaryMap = new Map<string, ItemMovementSummary>();

    allItems.forEach(item => {
      summaryMap.set(item.id, {
        item: item,
        totalSalesKg: 0,
        totalPurchasesKg: 0,
        netMovementKg: 0,
        closingStockKg: Number(item.stock), // Start with current stock
      });
    });

    const filterByDateRange = (itemDate: string) => {
      if (!dateRange?.from) return true;
      const itemDateTime = parseISO(itemDate);
      const start = dateRange.from;
      const end = dateRange.to || new Date();
      return isWithinInterval(itemDateTime, { start, end });
    };

    salesInvoices.filter(inv => filterByDateRange(inv.invoiceDate)).forEach(invoice => {
      invoice.items.forEach(saleItem => {
        const summary = summaryMap.get(saleItem.selectedItemId);
        if (summary) {
          summary.totalSalesKg += Number(saleItem.weight);
        }
      });
    });

    purchaseInvoices.filter(inv => filterByDateRange(inv.purchaseDate)).forEach(invoice => {
      invoice.items.forEach(purchaseItem => {
        const summary = summaryMap.get(purchaseItem.selectedItemId);
        if (summary) {
          summary.totalPurchasesKg += Number(purchaseItem.finalWeight);
        }
      });
    });

    const results: ItemMovementSummary[] = Array.from(summaryMap.values()).map(summary => {
      summary.netMovementKg = summary.totalPurchasesKg - summary.totalSalesKg;
      // Note: closingStockKg here is the *current* stock, not stock at the end of the date range.
      // To calculate stock at the end of the date range, we'd need to track opening stock and all movements.
      // For simplicity, we'll show current stock and movement within the range.
      return summary;
    });

    return results.filter(summary =>
      summary.item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allItems, salesInvoices, purchaseInvoices, searchTerm, dateRange]);

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const handleWhatsAppShare = () => {
    if (itemMovementData.length === 0) {
      showError("No item movement data to share.");
      return;
    }

    const dateRangeText = dateRange?.from
      ? dateRange.to
        ? ` for period ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}`
        : ` from ${format(dateRange.from, "PPP")}`
      : "";

    let message = `*Item Movement Report${dateRangeText}*\n\n`;
    itemMovementData.forEach(data => {
      message += `*${data.item.itemName}* (ID: ${data.item.id})\n`;
      message += `  Sales: ${data.totalSalesKg.toFixed(2)} KG\n`;
      message += `  Purchases: ${data.totalPurchasesKg.toFixed(2)} KG\n`;
      message += `  Net Movement: ${data.netMovementKg.toFixed(2)} KG\n`;
      message += `  Current Stock: ${data.closingStockKg.toFixed(2)} KG\n\n`;
    });
    message += `View full report in Vyapar app.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportToExcel = () => {
    const exportData = itemMovementData.map(data => ({
      "Item ID": data.item.id,
      "Item Name": data.item.itemName,
      "Total Sales (KG)": data.totalSalesKg,
      "Total Purchases (KG)": data.totalPurchasesKg,
      "Net Movement (KG)": data.netMovementKg,
      "Current Stock (KG)": data.closingStockKg,
    }));
    exportToExcel(exportData, "Item_Movement_Report", "ItemMovement");
  };

  const handleExportToPdf = () => {
    const tempDivId = "item-movement-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    const dateRangeTitle = dateRange?.from
      ? dateRange.to
        ? ` for ${format(dateRange.from, "PPP")} to ${format(dateRange.to, "PPP")}`
        : ` from ${format(dateRange.from, "PPP")}`
      : "";

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">${t("Item Movement Report", "आइटम आवाजाही रिपोर्ट")}${dateRangeTitle}</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Item ID", "आइटम आईडी")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Item Name", "आइटम का नाम")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Sales (KG)", "बिक्री (KG)")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Purchases (KG)", "खरीद (KG)")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Net Movement (KG)", "शुद्ध आवाजाही (KG)")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Current Stock (KG)", "वर्तमान स्टॉक (KG)")}</th>
          </tr>
        </thead>
        <tbody>
          ${itemMovementData.map(data => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${data.item.id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${data.item.itemName}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${data.totalSalesKg.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${data.totalPurchasesKg.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${data.netMovementKg.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${data.closingStockKg.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToPdf(tempDivId, "Item_Movement_Report", t("Item Movement Report", "आइटम आवाजाही रिपोर्ट") + dateRangeTitle).finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (isLoading) {
    return <div className="text-center py-8 text-lg">Loading item movement data...</div>;
  }

  if (hasError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading item movement data: {hasError}</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{t("Item Movement Report", "आइटम आवाजाही रिपोर्ट")}</CardTitle>
            <CardDescription>{t("Track sales and purchases of items over a selected period.", "चयनित अवधि में आइटमों की बिक्री और खरीद को ट्रैक करें।")}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground h-24 flex items-center justify-center">
            Please select a company from Company Settings to view item movement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{t("Item Movement Report", "आइटम आवाजाही रिपोर्ट")}</CardTitle>
          <CardDescription>{t("Track sales and purchases of items over a selected period.", "चयनित अवधि में आइटमों की बिक्री और खरीद को ट्रैक करें।")}</CardDescription>
        </div>
        <div className="flex space-x-2 print-hide">
          <Input
            placeholder={t("Search items...", "आइटम खोजें...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <DateRangePicker date={dateRange} setDate={setDateRange} />
          <Button onClick={handleExportToExcel} variant="outline" disabled={itemMovementData.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {t("Export Excel", "एक्सेल निर्यात करें")}
          </Button>
          <Button onClick={handleExportToPdf} variant="outline" disabled={itemMovementData.length === 0}>
            <FileTextIcon className="mr-2 h-4 w-4" /> {t("Export PDF", "पीडीएफ निर्यात करें")}
          </Button>
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={itemMovementData.length === 0}>
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
                <TableHead>{t("Item ID", "आइटम आईडी")}</TableHead>
                <TableHead>{t("Item Name", "आइटम का नाम")}</TableHead>
                <TableHead className="text-right">{t("Total Sales (KG)", "कुल बिक्री (KG)")}</TableHead>
                <TableHead className="text-right">{t("Total Purchases (KG)", "कुल खरीद (KG)")}</TableHead>
                <TableHead className="text-right">{t("Net Movement (KG)", "शुद्ध आवाजाही (KG)")}</TableHead>
                <TableHead className="text-right">{t("Current Stock (KG)", "वर्तमान स्टॉक (KG)")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itemMovementData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    {t("No item movement data found for the selected period.", "चयनित अवधि के लिए कोई आइटम आवाजाही डेटा नहीं मिला।")}
                  </TableCell>
                </TableRow>
              ) : (
                itemMovementData.map((data) => (
                  <TableRow key={data.item.id}>
                    <TableCell>{data.item.id}</TableCell>
                    <TableCell>{data.item.itemName}</TableCell>
                    <TableCell className="text-right">{data.totalSalesKg.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{data.totalPurchasesKg.toFixed(2)}</TableCell>
                    <TableCell className={`text-right ${data.netMovementKg >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.netMovementKg.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{data.closingStockKg.toFixed(2)}</TableCell>
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

export default ItemMovementReport;