"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, FileText, Store, QrCode, Upload, Download, FileSpreadsheet, FileText as FileTextIcon, Info } from "lucide-react";
import { exportToExcel, importFromExcel, exportToPdf } from "@/utils/fileExportImport";
import { showSuccess, showError } from "@/utils/toast";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Item as GlobalItem } from "@/components/ItemForm"; // Import Item interface

// Define interfaces for all data types (matching existing components)
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

interface Item {
  id: string;
  itemName: string;
  ratePerKg: number;
  stock: number; // Added stock
}

interface CashBankTransaction {
  id: string; // This will now be the custom generated ID like T001
  type: "Payment In" | "Payment Out";
  farmerId: string;
  farmerName: string;
  amount: number;
  paymentMethod: "Cash" | "Bank";
  remarks?: string;
  date: string;
  time: string;
}

interface SalesItem {
  uniqueId: string;
  selectedItemId: string;
  itemName: string;
  weight: number;
  rate: number;
  amount: number;
}

interface CompleteSalesInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceTime: string;
  farmer: Farmer;
  items: SalesItem[];
  totalAmount: number;
  advance: number;
  due: number;
}

interface PurchaseItem {
  uniqueId: string;
  selectedItemId: string;
  itemName: string;
  grossWeight: number;
  tareWeight: number;
  mudDeduction: number;
  rate: number;
  netWeight: number;
  finalWeight: number;
  amount: number;
}

interface CompletePurchaseInvoice {
  id: string;
  purchaseNo: string;
  purchaseDate: string;
  purchaseTime: string;
  farmer: Farmer;
  items: PurchaseItem[];
  totalAmount: number;
  advance: number;
  due: number;
}

const SyncBackupPage: React.FC = () => {
  const [allAvailableFarmers, setAllAvailableFarmers] = useState<Farmer[]>([]); // All farmers for lookup
  const [allAvailableItems, setAllAvailableItems] = useState<Item[]>([]); // All items for lookup

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [items, setItems] = useState<Item[]>([]); // State for items
  const [cashBankTransactions, setCashBankTransactions] = useState<CashBankTransaction[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<CompleteSalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<CompletePurchaseInvoice[]>([]);

  const [selectedFarmerFile, setSelectedFarmerFile] = useState<File | null>(null);
  const [selectedItemFile, setSelectedItemFile] = useState<File | null>(null); // New state for item file
  const [selectedCashBankFile, setSelectedCashBankFile] = useState<File | null>(null);
  const [selectedSalesInvoiceFile, setSelectedSalesInvoiceFile] = useState<File | null>(null);
  const [selectedPurchaseInvoiceFile, setSelectedPurchaseInvoiceFile] = useState<File | null>(null);

  // Load all data from localStorage on initial mount
  useEffect(() => {
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) {
      const parsedFarmers = JSON.parse(storedFarmers);
      setFarmers(parsedFarmers);
      setAllAvailableFarmers(parsedFarmers); // Also set for lookup
    }

    const storedItems = localStorage.getItem("items");
    if (storedItems) {
      const parsedItems: Item[] = JSON.parse(storedItems);
      const processedItems = parsedItems.map(item => ({
        ...item,
        ratePerKg: Number(item.ratePerKg),
        stock: Number(item.stock || 0), // Ensure stock is number
      }));
      setItems(processedItems);
      setAllAvailableItems(processedItems); // Set for lookup
    }

    const storedCashBankTransactions = localStorage.getItem("cashBankTransactions");
    if (storedCashBankTransactions) setCashBankTransactions(JSON.parse(storedCashBankTransactions));

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
  }, []);

  // --- Farmer Handlers ---
  const handleFarmerFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFarmerFile(event.target.files[0]);
    } else {
      setSelectedFarmerFile(null);
    }
  };

  const handleImportFarmers = async () => {
    if (!selectedFarmerFile) {
      showError("Please select an Excel file to import farmers.");
      return;
    }

    const importedData = await importFromExcel<Farmer>(selectedFarmerFile);
    if (importedData) {
      const isValid = importedData.every(item =>
        item.id && item.farmerName && item.village && item.mobileNo
      );

      if (!isValid) {
        showError("Imported Excel data format is incorrect for Farmers. Required columns: 'id', 'farmerName', 'village', 'mobileNo'.");
        return;
      }

      setFarmers(importedData);
      setAllAvailableFarmers(importedData); // Update lookup list
      localStorage.setItem("farmers", JSON.stringify(importedData));
      showSuccess("Farmers imported and saved successfully!");
      setSelectedFarmerFile(null);
    }
  };

  const handleExportFarmersToExcel = () => {
    exportToExcel(farmers, "Farmers_Data", "Farmers");
  };

  const handleExportFarmersToPdf = () => {
    const tempDivId = "farmers-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">Farmer List</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Father's Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Village</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Mobile No</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Aadhar No</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Account Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Account No</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">IFSC Code</th>
          </tr>
        </thead>
        <tbody>
          ${farmers.map(f => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.farmerName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.fathersName || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.village}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.mobileNo || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.aadharCardNo || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.accountName || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.accountNo || '-'}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.ifscCode || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToPdf(tempDivId, "Farmers_List", "Farmer List").finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  // --- Item Handlers ---
  const handleItemFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedItemFile(event.target.files[0]);
    } else {
      setSelectedItemFile(null);
    }
  };

  const handleImportItems = async () => {
    if (!selectedItemFile) {
      showError("Please select an Excel file to import items.");
      return;
    }

    const importedData = await importFromExcel<Item>(selectedItemFile);
    if (importedData) {
      const isValid = importedData.every(item =>
        item.id && item.itemName && item.ratePerKg !== undefined && item.stock !== undefined
      );

      if (!isValid) {
        showError("Imported Excel data format is incorrect for Items. Required columns: 'id', 'itemName', 'ratePerKg', 'stock'.");
        return;
      }

      setItems(importedData);
      setAllAvailableItems(importedData); // Update lookup list
      localStorage.setItem("items", JSON.stringify(importedData));
      showSuccess("Items imported and saved successfully!");
      setSelectedItemFile(null);
    }
  };

  const handleExportItemsToExcel = () => {
    exportToExcel(items, "Items_Data", "Items");
  };

  const handleExportItemsToPdf = () => {
    const tempDivId = "items-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">Item List</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Rate per KG (₹)</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Current Stock (KG)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
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

    exportToPdf(tempDivId, "Items_List", "Item List").finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  // --- Cash & Bank Transaction Handlers ---
  const handleCashBankFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedCashBankFile(event.target.files[0]);
    } else {
      setSelectedCashBankFile(null);
    }
  };

  const handleImportCashBank = async () => {
    if (!selectedCashBankFile) {
      showError("Please select an Excel file to import cash/bank transactions.");
      return;
    }

    const importedData = await importFromExcel<CashBankTransaction>(selectedCashBankFile);
    if (importedData) {
      const isValid = importedData.every(item =>
        item.id && item.type && item.farmerId && item.farmerName && item.amount !== undefined && item.paymentMethod && item.date && item.time
      );

      if (!isValid) {
        showError("Imported Excel data format is incorrect for Cash/Bank Transactions. Required columns: 'id', 'type', 'farmerId', 'farmerName', 'amount', 'paymentMethod', 'date', 'time'.");
        return;
      }

      setCashBankTransactions(importedData);
      localStorage.setItem("cashBankTransactions", JSON.stringify(importedData));
      showSuccess("Cash/Bank Transactions imported and saved successfully!");
      setSelectedCashBankFile(null);
    }
  };

  const handleExportCashBankToExcel = () => {
    exportToExcel(cashBankTransactions, "CashBank_Transactions_Data", "CashBankTransactions");
  };

  const handleExportCashBankToPdf = () => {
    const tempDivId = "cashbank-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">Cash & Bank Transactions</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Date</th>
            <th style="1px solid #ddd; padding: 8px; text-align: left;">Time</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Type</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Farmer Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Amount</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Method</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Remarks</th>
          </tr>
        </thead>
        <tbody>
          ${cashBankTransactions.map(t => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.date}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.time}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.type}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.farmerName}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹ ${t.amount.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.paymentMethod}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${t.remarks || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToPdf(tempDivId, "CashBank_Transactions_List", "Cash & Bank Transactions").finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  // --- Sales Invoice Handlers ---
  const handleSalesInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedSalesInvoiceFile(event.target.files[0]);
    } else {
      setSelectedSalesInvoiceFile(null);
    }
  };

  const handleImportSalesInvoices = async () => {
    if (!selectedSalesInvoiceFile) {
      showError("Please select an Excel file to import sales invoices.");
      return;
    }

    const importedRawData = await importFromExcel<any>(selectedSalesInvoiceFile);
    if (!importedRawData) return;

    const newSalesInvoices: CompleteSalesInvoice[] = [];
    const invoiceMap = new Map<string, CompleteSalesInvoice>();

    for (const row of importedRawData) {
      const invoiceNo = row.invoiceNo;
      if (!invoiceNo) {
        showError("Each row must have an 'invoiceNo'. Skipping row.");
        continue;
      }

      let invoice = invoiceMap.get(invoiceNo);
      if (!invoice) {
        const farmerId = row.farmerId;
        const farmer = allAvailableFarmers.find(f => f.id === farmerId);
        if (!farmer) {
          showError(`Farmer with ID '${farmerId}' not found for invoice '${invoiceNo}'. Please import farmers first.`);
          continue; // Skip this invoice if farmer not found
        }

        invoice = {
          id: invoiceNo, // Using invoiceNo as ID for simplicity
          invoiceNo: invoiceNo,
          invoiceDate: row.invoiceDate || new Date().toLocaleDateString('en-CA'),
          invoiceTime: row.invoiceTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          farmer: farmer,
          items: [],
          totalAmount: 0, // Will be calculated
          advance: Number(row.advance) || 0,
          due: 0, // Will be calculated
        };
        invoiceMap.set(invoiceNo, invoice);
        newSalesInvoices.push(invoice);
      }

      // Add item to invoice
      const selectedItemId = row.selectedItemId;
      const itemDetails = allAvailableItems.find(i => i.id === selectedItemId);
      if (!itemDetails) {
        showError(`Item with ID '${selectedItemId}' not found for invoice '${invoiceNo}'. Skipping item.`);
        continue;
      }

      const weight = Number(row.weight) || 0;
      const rate = Number(row.rate) || itemDetails.ratePerKg; // Use imported rate or default
      const amount = weight * rate;

      const salesItem: SalesItem = {
        uniqueId: `sales-item-${invoiceNo}-${invoice.items.length + 1}`,
        selectedItemId: selectedItemId,
        itemName: row.itemName || itemDetails.itemName,
        weight: weight,
        rate: rate,
        amount: amount,
      };
      invoice.items.push(salesItem);
      invoice.totalAmount += amount;
    }

    // Finalize due amounts
    newSalesInvoices.forEach(invoice => {
      invoice.due = invoice.totalAmount - invoice.advance;
    });

    setSalesInvoices(prev => [...prev, ...newSalesInvoices]);
    localStorage.setItem("salesInvoices", JSON.stringify([...salesInvoices, ...newSalesInvoices]));
    showSuccess("Sales Invoices imported and saved successfully!");
    setSelectedSalesInvoiceFile(null);
  };

  const handleExportSalesInvoicesToExcel = () => {
    if (salesInvoices.length === 0) {
      showError("No sales invoices to export.");
      return;
    }

    // Flatten sales invoices for Excel export
    const flattenedSalesData = salesInvoices.flatMap(invoice =>
      invoice.items.map(item => ({
        invoiceNo: invoice.invoiceNo,
        invoiceDate: invoice.invoiceDate,
        invoiceTime: invoice.invoiceTime,
        farmerId: invoice.farmer.id,
        farmerName: invoice.farmer.farmerName,
        selectedItemId: item.selectedItemId,
        itemName: item.itemName,
        weight: item.weight,
        rate: item.rate,
        amount: item.amount,
        totalAmount: invoice.totalAmount,
        advance: invoice.advance,
        due: invoice.due,
      }))
    );
    exportToExcel(flattenedSalesData, "Sales_Invoices_Data", "SalesInvoices");
  };

  const handleExportSalesInvoicesToPdf = () => {
    const tempDivId = "sales-invoices-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">Sales Invoices</h1>
      ${salesInvoices.length === 0 ? '<p style="text-align: center;">No sales invoices to display.</p>' : salesInvoices.map(invoice => `
        <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 10px; border-radius: 5px;">
          <h2 style="font-size: 1.2em; margin-bottom: 5px;">Invoice No: ${invoice.invoiceNo}</h2>
          <p><strong>Date:</strong> ${invoice.invoiceDate} <strong>Time:</strong> ${invoice.invoiceTime}</p>
          <p><strong>Farmer:</strong> ${invoice.farmer.farmerName} (ID: ${invoice.farmer.id})</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f9f9f9;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Item</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Weight (KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Rate (₹/KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${item.itemName}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.weight.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.rate.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="text-align: right; margin-top: 10px;"><strong>Total:</strong> ₹${invoice.totalAmount.toFixed(2)}</p>
          <p style="text-align: right;"><strong>Advance:</strong> ₹${invoice.advance.toFixed(2)}</p>
          <p style="text-align: right;"><strong>Due:</strong> ₹${invoice.due.toFixed(2)}</p>
        </div>
      `).join('')}
    `;

    exportToPdf(tempDivId, "Sales_Invoices_List", "Sales Invoices").finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };

  // --- Purchase Invoice Handlers ---
  const handlePurchaseInvoiceFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedPurchaseInvoiceFile(event.target.files[0]);
    } else {
      setSelectedPurchaseInvoiceFile(null);
    }
  };

  const handleImportPurchaseInvoices = async () => {
    if (!selectedPurchaseInvoiceFile) {
      showError("Please select an Excel file to import purchase invoices.");
      return;
    }

    const importedRawData = await importFromExcel<any>(selectedPurchaseInvoiceFile);
    if (!importedRawData) return;

    const newPurchaseInvoices: CompletePurchaseInvoice[] = [];
    const invoiceMap = new Map<string, CompletePurchaseInvoice>();

    for (const row of importedRawData) {
      const purchaseNo = row.purchaseNo;
      if (!purchaseNo) {
        showError("Each row must have a 'purchaseNo'. Skipping row.");
        continue;
      }

      let invoice = invoiceMap.get(purchaseNo);
      if (!invoice) {
        const farmerId = row.farmerId;
        const farmer = allAvailableFarmers.find(f => f.id === farmerId);
        if (!farmer) {
          showError(`Farmer with ID '${farmerId}' not found for purchase invoice '${purchaseNo}'. Please import farmers first.`);
          continue; // Skip this invoice if farmer not found
        }

        invoice = {
          id: purchaseNo, // Using purchaseNo as ID for simplicity
          purchaseNo: purchaseNo,
          purchaseDate: row.purchaseDate || new Date().toLocaleDateString('en-CA'),
          purchaseTime: row.purchaseTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          farmer: farmer,
          items: [],
          totalAmount: 0, // Will be calculated
          advance: Number(row.advance) || 0,
          due: 0, // Will be calculated
        };
        invoiceMap.set(purchaseNo, invoice);
        newPurchaseInvoices.push(invoice);
      }

      // Add item to invoice
      const selectedItemId = row.selectedItemId;
      const itemDetails = allAvailableItems.find(i => i.id === selectedItemId);
      if (!itemDetails) {
        showError(`Item with ID '${selectedItemId}' not found for purchase invoice '${purchaseNo}'. Skipping item.`);
        continue;
      }

      const grossWeight = Number(row.grossWeight) || 0;
      const tareWeight = Number(row.tareWeight) || 0;
      const mudDeduction = Number(row.mudDeduction) || 0;
      const rate = Number(row.rate) || itemDetails.ratePerKg; // Use imported rate or default

      const netWeight = grossWeight - tareWeight;
      const finalWeight = netWeight - (netWeight * mudDeduction / 100);
      const amount = finalWeight * rate;

      const purchaseItem: PurchaseItem = {
        uniqueId: `purchase-item-${purchaseNo}-${invoice.items.length + 1}`,
        selectedItemId: selectedItemId,
        itemName: row.itemName || itemDetails.itemName,
        grossWeight: grossWeight,
        tareWeight: tareWeight,
        mudDeduction: mudDeduction,
        rate: rate,
        netWeight: netWeight,
        finalWeight: finalWeight,
        amount: amount,
      };
      invoice.items.push(purchaseItem);
      invoice.totalAmount += amount;
    }

    // Finalize due amounts
    newPurchaseInvoices.forEach(invoice => {
      invoice.due = invoice.totalAmount - invoice.advance;
    });

    setPurchaseInvoices(prev => [...prev, ...newPurchaseInvoices]);
    localStorage.setItem("purchaseInvoices", JSON.stringify([...purchaseInvoices, ...newPurchaseInvoices]));
    showSuccess("Purchase Invoices imported and saved successfully!");
    setSelectedPurchaseInvoiceFile(null);
  };

  const handleExportPurchaseInvoicesToExcel = () => {
    if (purchaseInvoices.length === 0) {
      showError("No purchase invoices to export.");
      return;
    }

    // Flatten purchase invoices for Excel export
    const flattenedPurchaseData = purchaseInvoices.flatMap(invoice =>
      invoice.items.map(item => ({
        purchaseNo: invoice.purchaseNo,
        purchaseDate: invoice.purchaseDate,
        purchaseTime: invoice.purchaseTime,
        farmerId: invoice.farmer.id,
        farmerName: invoice.farmer.farmerName,
        selectedItemId: item.selectedItemId,
        itemName: item.itemName,
        grossWeight: item.grossWeight,
        tareWeight: item.tareWeight,
        mudDeduction: item.mudDeduction,
        netWeight: item.netWeight,
        finalWeight: item.finalWeight,
        rate: item.rate,
        amount: item.amount,
        totalAmount: invoice.totalAmount,
        advance: invoice.advance,
        due: invoice.due,
      }))
    );
    exportToExcel(flattenedPurchaseData, "Purchase_Invoices_Data", "PurchaseInvoices");
  };

  const handleExportPurchaseInvoicesToPdf = () => {
    const tempDivId = "purchase-invoices-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">Purchase Invoices</h1>
      ${purchaseInvoices.length === 0 ? '<p style="text-align: center;">No purchase invoices to display.</p>' : purchaseInvoices.map(invoice => `
        <div style="margin-bottom: 20px; border: 1px solid #eee; padding: 10px; border-radius: 5px;">
          <h2 style="font-size: 1.2em; margin-bottom: 5px;">Purchase No: ${invoice.purchaseNo}</h2>
          <p><strong>Date:</strong> ${invoice.purchaseDate} <strong>Time:</strong> ${invoice.purchaseTime}</p>
          <p><strong>Farmer:</strong> ${invoice.farmer.farmerName} (ID: ${invoice.farmer.id})</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f9f9f9;">
                <th style="border: 1px solid #ddd; padding: 6px; text-align: left;">Item</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Gross Wt (KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Tare Wt (KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Net Wt (KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Mud (%)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Final Wt (KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Rate (₹/KG)</th>
                <th style="border: 1px solid #ddd; padding: 6px; text-align: right;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 6px;">${item.itemName}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.grossWeight.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.tareWeight.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.netWeight.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.mudDeduction.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.finalWeight.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.rate.toFixed(2)}</td>
                  <td style="border: 1px solid #ddd; padding: 6px; text-align: right;">${item.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="text-align: right; margin-top: 10px;"><strong>Total:</strong> ₹${invoice.totalAmount.toFixed(2)}</p>
          <p style="text-align: right;"><strong>Advance:</strong> ₹${invoice.advance.toFixed(2)}</p>
          <p style="text-align: right;"><strong>Due:</strong> ₹${invoice.due.toFixed(2)}</p>
        </div>
      `).join('')}
    `;

    exportToPdf(tempDivId, "Purchase_Invoices_List", "Purchase Invoices").finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv);
      }
    });
  };


  return (
    <div className="space-y-8 p-4">
      <h1 className="text-4xl font-bold text-center mb-6">Sync, Share & Backup</h1>
      <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
        Manage data synchronization, share your business data, and configure backup options to keep your information safe and accessible.
        Below are client-side tools for basic data import/export. Advanced sharing and online store features require a backend database and API integrations to function.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Data Export Section */}
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Data Export</CardTitle>
            <Download className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Export your current data to Excel or PDF for backup or sharing.
            </CardDescription>
            <div className="space-y-6">
              {/* Farmers Export */}
              <div>
                <h3 className="font-medium mb-2">Farmers Data:</h3>
                <div className="flex space-x-2">
                  <Button onClick={handleExportFarmersToExcel} className="flex-1" disabled={farmers.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Farmers to Excel
                  </Button>
                  <Button onClick={handleExportFarmersToPdf} className="flex-1" disabled={farmers.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Export Farmers to PDF
                  </Button>
                </div>
              </div>

              {/* Items Export */}
              <div>
                <h3 className="font-medium mb-2">Items Data:</h3>
                <div className="flex space-x-2">
                  <Button onClick={handleExportItemsToExcel} className="flex-1" disabled={items.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Items to Excel
                  </Button>
                  <Button onClick={handleExportItemsToPdf} className="flex-1" disabled={items.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Export Items to PDF
                  </Button>
                </div>
              </div>

              {/* Cash & Bank Transactions Export */}
              <div>
                <h3 className="font-medium mb-2">Cash & Bank Transactions:</h3>
                <div className="flex space-x-2">
                  <Button onClick={handleExportCashBankToExcel} className="flex-1" disabled={cashBankTransactions.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Transactions to Excel
                  </Button>
                  <Button onClick={handleExportCashBankToPdf} className="flex-1" disabled={cashBankTransactions.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Export Transactions to PDF
                  </Button>
                </div>
              </div>

              {/* Sales Invoices Export */}
              <div>
                <h3 className="font-medium mb-2">Sales Invoices:</h3>
                <div className="flex space-x-2">
                  <Button onClick={handleExportSalesInvoicesToExcel} className="flex-1" disabled={salesInvoices.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Sales to Excel
                  </Button>
                  <Button onClick={handleExportSalesInvoicesToPdf} className="flex-1" disabled={salesInvoices.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Export Sales to PDF
                  </Button>
                </div>
              </div>

              {/* Purchase Invoices Export */}
              <div>
                <h3 className="font-medium mb-2">Purchase Invoices:</h3>
                <div className="flex space-x-2">
                  <Button onClick={handleExportPurchaseInvoicesToExcel} className="flex-1" disabled={purchaseInvoices.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Purchases to Excel
                  </Button>
                  <Button onClick={handleExportPurchaseInvoicesToPdf} className="flex-1" disabled={purchaseInvoices.length === 0}>
                    <FileTextIcon className="mr-2 h-4 w-4" /> Export Purchases to PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Import Section */}
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Data Import</CardTitle>
            <Upload className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Import data from Excel files. Ensure the file format matches the expected structure.
            </CardDescription>
            <div className="space-y-6">
              {/* Farmers Import */}
              <div>
                <h3 className="font-medium mb-2">Farmers Data:</h3>
                <div className="flex items-center space-x-2">
                  <Input type="file" accept=".xlsx, .xls" onChange={handleFarmerFileChange} className="flex-1" />
                  <Button onClick={handleImportFarmers} disabled={!selectedFarmerFile}>
                    <Upload className="mr-2 h-4 w-4" /> Import Farmers
                  </Button>
                </div>
                {selectedFarmerFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFarmerFile.name}</p>}
                <div className="mt-2 text-sm text-muted-foreground flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 mr-1 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-semibold">Expected Excel Columns for Farmers:</p>
                        <p><code>id</code> (e.g., F001), <code>farmerName</code>, <code>fathersName</code>, <code>village</code>, <code>mobileNo</code>, <code>aadharCardNo</code>, <code>accountName</code>, <code>accountNo</code>, <code>ifscCode</code></p>
                        <p className="mt-1">All columns are expected as text. 'id', 'farmerName', 'village', 'mobileNo' are crucial.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>Click <Info /> for expected Excel format.</span>
                </div>
              </div>

              {/* Items Import */}
              <div>
                <h3 className="font-medium mb-2">Items Data:</h3>
                <div className="flex items-center space-x-2">
                  <Input type="file" accept=".xlsx, .xls" onChange={handleItemFileChange} className="flex-1" />
                  <Button onClick={handleImportItems} disabled={!selectedItemFile}>
                    <Upload className="mr-2 h-4 w-4" /> Import Items
                  </Button>
                </div>
                {selectedItemFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedItemFile.name}</p>}
                <div className="mt-2 text-sm text-muted-foreground flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 mr-1 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-semibold">Expected Excel Columns for Items:</p>
                        <p><code>id</code> (e.g., I001), <code>itemName</code>, <code>ratePerKg</code> (number), <code>stock</code> (number)</p>
                        <p className="mt-1">All columns are expected as text, except 'ratePerKg' and 'stock' as numbers.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>Click <Info /> for expected Excel format.</span>
                </div>
              </div>

              {/* Cash & Bank Transactions Import */}
              <div>
                <h3 className="font-medium mb-2">Cash & Bank Transactions:</h3>
                <div className="flex items-center space-x-2">
                  <Input type="file" accept=".xlsx, .xls" onChange={handleCashBankFileChange} className="flex-1" />
                  <Button onClick={handleImportCashBank} disabled={!selectedCashBankFile}>
                    <Upload className="mr-2 h-4 w-4" /> Import Transactions
                  </Button>
                </div>
                {selectedCashBankFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedCashBankFile.name}</p>}
                <div className="mt-2 text-sm text-muted-foreground flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 mr-1 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-semibold">Expected Excel Columns for Cash/Bank Transactions:</p>
                        <p><code>id</code> (e.g., T001), <code>type</code> (e.g., "Payment In" or "Payment Out"), <code>farmerId</code> (e.g., F001), <code>farmerName</code>, <code>amount</code> (number), <code>paymentMethod</code> (e.g., "Cash" or "Bank"), <code>remarks</code>, <code>date</code> (YYYY-MM-DD), <code>time</code> (HH:MM AM/PM)</p>
                        <p className="mt-1">All columns are expected as text, except 'amount' as a number.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>Click <Info /> for expected Excel format.</span>
                </div>
              </div>

              {/* Sales Invoices Import */}
              <div>
                <h3 className="font-medium mb-2">Sales Invoices:</h3>
                <div className="flex items-center space-x-2">
                  <Input type="file" accept=".xlsx, .xls" onChange={handleSalesInvoiceFileChange} className="flex-1" />
                  <Button onClick={handleImportSalesInvoices} disabled={!selectedSalesInvoiceFile}>
                    <Upload className="mr-2 h-4 w-4" /> Import Sales Invoices
                  </Button>
                </div>
                {selectedSalesInvoiceFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedSalesInvoiceFile.name}</p>}
                <div className="mt-2 text-sm text-muted-foreground flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 mr-1 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-semibold">Expected Excel Columns for Sales Invoices (one row per item):</p>
                        <p><code>invoiceNo</code> (string, e.g., S-YYYYMMDD-001), <code>invoiceDate</code> (YYYY-MM-DD), <code>invoiceTime</code> (HH:MM AM/PM), <code>farmerId</code> (e.g., F001), <code>farmerName</code>, <code>selectedItemId</code> (e.g., I001), <code>itemName</code>, <code>weight</code> (number), <code>rate</code> (number), <code>amount</code> (number), <code>totalAmount</code> (number), <code>advance</code> (number), <code>due</code> (number)</p>
                        <p className="mt-1"><code>farmerId</code> and <code>selectedItemId</code> must exist in your current Farmers and Items data. <code>invoiceNo</code> is crucial for grouping items into one invoice.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>Click <Info /> for expected Excel format.</span>
                </div>
              </div>

              {/* Purchase Invoices Import */}
              <div>
                <h3 className="font-medium mb-2">Purchase Invoices:</h3>
                <div className="flex items-center space-x-2">
                  <Input type="file" accept=".xlsx, .xls" onChange={handlePurchaseInvoiceFileChange} className="flex-1" />
                  <Button onClick={handleImportPurchaseInvoices} disabled={!selectedPurchaseInvoiceFile}>
                    <Upload className="mr-2 h-4 w-4" /> Import Purchase Invoices
                  </Button>
                </div>
                {selectedPurchaseInvoiceFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedPurchaseInvoiceFile.name}</p>}
                <div className="mt-2 text-sm text-muted-foreground flex items-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 mr-1 text-blue-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="font-semibold">Expected Excel Columns for Purchase Invoices (one row per item):</p>
                        <p><code>purchaseNo</code> (string, e.g., P-YYYYMMDD-001), <code>purchaseDate</code> (YYYY-MM-DD), <code>purchaseTime</code> (HH:MM AM/PM), <code>farmerId</code> (e.g., F001), <code>farmerName</code>, <code>selectedItemId</code> (e.g., I001), <code>itemName</code>, <code>grossWeight</code> (number), <code>tareWeight</code> (number), <code>mudDeduction</code> (number, 0-100), <code>netWeight</code> (number), <code>finalWeight</code> (number), <code>rate</code> (number), <code>amount</code> (number), <code>totalAmount</code> (number), <code>advance</code> (number), <code>due</code> (number)</p>
                        <p className="mt-1"><code>farmerId</code> and <code>selectedItemId</code> must exist in your current Farmers and Items data. <code>purchaseNo</code> is crucial for grouping items into one invoice.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span>Click <Info /> for expected Excel format.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Backend-dependent Features */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Transaction Sharing</CardTitle>
            <Share2 className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Send Invoices, Estimates, and Payment Reminders directly via WhatsApp, Email, or SMS.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Share Transactions (Requires Backend)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Report Sharing</CardTitle>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share all 50+ reports (Profit & Loss, Stock Summary, Party Ledger) in PDF or Excel (.xlsx) formats.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Share Reports (Requires Backend)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Online Store Link</CardTitle>
            <Store className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share your "Online Store" link via social media so customers can view your catalog and place orders directly.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Manage Online Store (Requires Backend)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Payment Links</CardTitle>
            <QrCode className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Share UPI QR codes or payment links for easy collection of payments.
            </CardDescription>
            <Button variant="outline" className="w-full" disabled>
              Generate Payment Links (Requires Backend)
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8">
        <p className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
          Features like Transaction Sharing, Report Sharing, Online Store, and Payment Links require a backend database and API integrations.
        </p>
      </div>
    </div>
  );
};

export default SyncBackupPage;