"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, FileText, Store, QrCode, Upload, Download, FileSpreadsheet, FileText as FileTextIcon } from "lucide-react";
import { exportToExcel, importFromExcel, exportToPdf } from "@/utils/fileExportImport";
import { showSuccess, showError } from "@/utils/toast";
import { Input } from "@/components/ui/input";

// Define Farmer interface (should match the one used in FarmersPage)
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

const SyncBackupPage: React.FC = () => {
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) {
      setFarmers(JSON.parse(storedFarmers));
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleImportFarmers = async () => {
    if (!selectedFile) {
      showError("Please select an Excel file to import farmers.");
      return;
    }

    const importedData = await importFromExcel<Farmer>(selectedFile);
    if (importedData) {
      // Basic validation: check if imported data has expected fields
      const isValid = importedData.every(item => 
        item.id && item.farmerName && item.village && item.mobileNo
      );

      if (!isValid) {
        showError("Imported Excel data format is incorrect for Farmers. Please ensure it has 'id', 'farmerName', 'village', 'mobileNo' columns.");
        return;
      }

      // Merge or replace existing farmers. For simplicity, we'll replace for now.
      // In a real app, you might want to handle ID conflicts, updates, etc.
      setFarmers(importedData);
      localStorage.setItem("farmers", JSON.stringify(importedData));
      showSuccess("Farmers imported and saved successfully!");
      setSelectedFile(null); // Clear selected file
      // You might want to trigger a refresh of the FarmersPage if it's open
    }
  };

  const handleExportFarmersToExcel = () => {
    exportToExcel(farmers, "Farmers_Data", "Farmers");
  };

  const handleExportFarmersToPdf = () => {
    // For PDF export, we need an element to render.
    // Since this is a report, we'll create a temporary div with the data.
    // In a real scenario, you might have a dedicated printable component.
    const tempDivId = "farmers-pdf-content";
    let tempDiv = document.getElementById(tempDivId);
    if (!tempDiv) {
      tempDiv = document.createElement("div");
      tempDiv.id = tempDivId;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px"; // Hide it off-screen
      document.body.appendChild(tempDiv);
    }

    tempDiv.innerHTML = `
      <h1 style="text-align: center; margin-bottom: 20px;">Farmer List</h1>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">ID</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Name</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Village</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Mobile No</th>
          </tr>
        </thead>
        <tbody>
          ${farmers.map(f => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.id}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.farmerName}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.village}</td>
              <td style="border: 1px solid #ddd; padding: 8px;">${f.mobileNo}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    exportToPdf(tempDivId, "Farmers_List", "Farmer List").finally(() => {
      if (tempDiv && tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv); // Clean up the temporary div
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Data Export</CardTitle>
            <Download className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Export your current data to Excel or PDF for backup or sharing.
            </CardDescription>
            <div className="space-y-3">
              <h3 className="font-medium">Farmers Data:</h3>
              <div className="flex space-x-2">
                <Button onClick={handleExportFarmersToExcel} className="flex-1" disabled={farmers.length === 0}>
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Export Farmers to Excel
                </Button>
                <Button onClick={handleExportFarmersToPdf} className="flex-1" disabled={farmers.length === 0}>
                  <FileTextIcon className="mr-2 h-4 w-4" /> Export Farmers to PDF
                </Button>
              </div>
              {/* Add more export options here for other data types */}
              {/*
              <h3 className="font-medium mt-4">Sales Invoices:</h3>
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1" disabled>Export Sales to Excel</Button>
                <Button variant="outline" className="flex-1" disabled>Export Sales to PDF</Button>
              </div>
              */}
            </div>
          </CardContent>
        </Card>

        {/* Data Import Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-semibold">Data Import</CardTitle>
            <Upload className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">
              Import data from Excel files. Ensure the file format matches the expected structure.
            </CardDescription>
            <div className="space-y-3">
              <h3 className="font-medium">Farmers Data:</h3>
              <div className="flex items-center space-x-2">
                <Input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="flex-1" />
                <Button onClick={handleImportFarmers} disabled={!selectedFile}>
                  <Upload className="mr-2 h-4 w-4" /> Import Farmers
                </Button>
              </div>
              {selectedFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedFile.name}</p>}
              {/* Add more import options here for other data types */}
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