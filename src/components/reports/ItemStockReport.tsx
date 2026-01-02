"use client";

import React, { useState, useEffect } from "react";
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
import { Printer, Share2, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react"; // Added FileSpreadsheet and FileTextIcon
import { Button } from "@/components/ui/button";
import { showError } from "@/utils/toast";
import { Item as GlobalItem } from "@/components/ItemForm"; // Import Item interface
import { exportToExcel, exportToPdf } from "@/utils/fileExportImport";
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings

const ItemStockReport: React.FC = () => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const [items, setItems] = useState<GlobalItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const storedItems = localStorage.getItem("items");
    if (storedItems) {
      const parsedItems: GlobalItem[] = JSON.parse(storedItems);
      const processedItems = parsedItems.map(item => ({
        ...item,
        ratePerKg: Number(item.ratePerKg),
        stock: Number(item.stock || 0),
      }));
      setItems(processedItems);
    }
  }, []);

  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const handleWhatsAppShare = () => {
    if (filteredItems.length === 0) {
      showError("No items to share in stock report.");
      return;
    }

    let message = `*Item Stock Report*\n\n`;
    filteredItems.forEach(item => {
      message += `*${item.itemName}* (ID: ${item.id})\n`;
      message += `Current Stock: ${item.stock.toFixed(2)} KG\n`;
      message += `Rate: ₹${item.ratePerKg.toFixed(2)}/KG\n\n`;
    });
    message += `View full report in Vyapar app.`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleExportToExcel = () => {
    exportToExcel(filteredItems, "Item_Stock_Report", "ItemStock");
  };

  const handleExportToPdf = () => {
    const tempDivId = "item-stock-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">${t("Item Stock Report", "आइटम स्टॉक रिपोर्ट")}</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Item ID", "आइटम आईडी")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${t("Item Name", "आइटम का नाम")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Rate per KG (₹)", "दर प्रति KG (₹)")}</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">${t("Current Stock (KG)", "वर्तमान स्टॉक (KG)")}</th>
          </tr>
        </thead>
        <tbody>
          ${filteredItems.map(item => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${item.itemName}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹ ${item.ratePerKg.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.stock.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToPdf(tempDivId, "Item_Stock_Report", t("Item Stock Report", "आइटम स्टॉक रिपोर्ट")).finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-2xl font-bold">{t("Item Stock Report", "आइटम स्टॉक रिपोर्ट")}</CardTitle>
          <CardDescription>{t("Overview of current stock levels for all items.", "सभी आइटमों के लिए वर्तमान स्टॉक स्तरों का अवलोकन।")}</CardDescription>
        </div>
        <div className="flex space-x-2 print-hide">
          <Input
            placeholder={t("Search items...", "आइटम खोजें...")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleExportToExcel} variant="outline" disabled={filteredItems.length === 0}>
            <FileSpreadsheet className="mr-2 h-4 w-4" /> {t("Export Excel", "एक्सेल निर्यात करें")}
          </Button>
          <Button onClick={handleExportToPdf} variant="outline" disabled={filteredItems.length === 0}>
            <FileTextIcon className="mr-2 h-4 w-4" /> {t("Export PDF", "पीडीएफ निर्यात करें")}
          </Button>
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={filteredItems.length === 0}>
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
                <TableHead className="text-right">{t("Rate per KG (₹)", "दर प्रति KG (₹)")}</TableHead>
                <TableHead className="text-right">{t("Current Stock (KG)", "वर्तमान स्टॉक (KG)")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    {t("No items found or no stock to display.", "कोई आइटम नहीं मिला या कोई स्टॉक प्रदर्शित करने के लिए नहीं है।")}
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.id}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell className="text-right">₹ {item.ratePerKg.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{item.stock.toFixed(2)}</TableCell>
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

export default ItemStockReport;