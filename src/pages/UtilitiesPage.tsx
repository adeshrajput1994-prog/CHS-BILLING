"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { exportToJson, importFromJson } from "@/utils/fileExportImport"; // Import new JSON utilities
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UtilitiesPage: React.FC = () => {
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);

  const localStorageKeys = [
    "farmers",
    "items",
    "cashBankTransactions",
    "salesInvoices",
    "purchaseInvoices",
    "companies",
    "selectedCompanyId",
    "selectedFinancialYear",
    "manufacturingExpenses", // Assuming you might store this too
  ];

  const handleExportAllData = () => {
    const allData: Record<string, any> = {};
    localStorageKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          allData[key] = JSON.parse(data);
        } catch (e) {
          allData[key] = data; // Store as string if not valid JSON
        }
      }
    });
    exportToJson(allData, "vyapar_app_backup");
  };

  const handleBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedBackupFile(event.target.files[0]);
    } else {
      setSelectedBackupFile(null);
    }
  };

  const handleImportAllData = async () => {
    if (!selectedBackupFile) {
      showError("Please select a JSON backup file to import.");
      return;
    }

    const importedData = await importFromJson(selectedBackupFile);
    if (importedData) {
      // Clear existing data before importing
      localStorageKeys.forEach(key => localStorage.removeItem(key));

      // Import new data
      for (const key in importedData) {
        if (localStorageKeys.includes(key)) { // Only import recognized keys
          const value = importedData[key];
          if (typeof value === 'object' && value !== null) {
            localStorage.setItem(key, JSON.stringify(value));
          } else {
            localStorage.setItem(key, value as string);
          }
        }
      }
      showSuccess("All app data imported and restored successfully! Please refresh the page.");
      setSelectedBackupFile(null);
      // Suggest a full page refresh to re-initialize all components with new data
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const handleClearAllData = () => {
    localStorageKeys.forEach(key => localStorage.removeItem(key));
    showSuccess("All app data cleared successfully! Please refresh the page.");
    // Suggest a full page refresh to re-initialize all components with no data
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Utilities</h1>
      <p className="text-lg text-muted-foreground">
        Tools for managing your application data, including backup, restore, and clearing options.
      </p>

      {/* Data Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle>App Data Backup & Restore</CardTitle>
          <CardDescription>
            Export all your application data to a JSON file or import from a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Export All Data</h3>
            <Button onClick={handleExportAllData} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download Full Backup (JSON)
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will download all your farmers, items, transactions, invoices, and company settings.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium mb-2">Import Data from Backup</h3>
            <div className="flex items-center space-x-2">
              <Input type="file" accept=".json" onChange={handleBackupFileChange} className="flex-1" />
              <Button onClick={handleImportAllData} disabled={!selectedBackupFile}>
                <Upload className="mr-2 h-4 w-4" /> Import Backup
              </Button>
            </div>
            {selectedBackupFile && <p className="text-sm text-muted-foreground mt-1">Selected: {selectedBackupFile.name}</p>}
            <p className="text-sm text-red-500 mt-2">
              <AlertTriangle className="inline h-4 w-4 mr-1" /> Importing data will overwrite your current application data. Proceed with caution!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Clear All Data */}
      <Card>
        <CardHeader>
          <CardTitle>Clear All Application Data</CardTitle>
          <CardDescription>
            Permanently delete all data stored in this application. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All Data
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-6 w-6 mr-2" /> Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete ALL your farmers, items, transactions, invoices, and company settings from this device.
                  Make sure you have a backup before proceeding.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearAllData} className="bg-red-600 hover:bg-red-700">
                  Delete All Data
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default UtilitiesPage;