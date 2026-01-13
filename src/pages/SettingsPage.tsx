"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/context/CompanyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Sun, Moon, Monitor } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore

interface Company {
  id: string;
  name: string;
  address: string;
  financialYears: string[];
}

const SettingsPage: React.FC = () => {
  const { companies, selectedCompany, selectedFinancialYear, selectCompany, selectFinancialYear, loading, error } = useCompany();
  const { theme, setTheme } = useTheme();
  const { printInHindi, setPrintInHindi } = usePrintSettings();

  // Use useFirestore for companies, but pass null for companyId as this page manages all companies
  const { loading: loadingCompaniesFirestore, error: errorCompaniesFirestore } = useFirestore<Company>('companies', null);

  // Show loading indicator while data is being fetched
  if (loading || loadingCompaniesFirestore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg">Loading company data...</p>
        </div>
      </div>
    );
  }

  // Show error message if there was an error fetching data
  if (error || errorCompaniesFirestore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-lg mb-4">{error || errorCompaniesFirestore}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="text-lg text-muted-foreground">
        Configure your application settings, personalize your experience, and manage company preferences.
      </p>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Customize the appearance of the application.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-toggle" className="flex items-center gap-2">
              {theme === "light" && <Sun className="h-4 w-4" />}
              {theme === "dark" && <Moon className="h-4 w-4" />}
              {theme === "system" && <Monitor className="h-4 w-4" />}
              <span>Current Theme: {theme?.charAt(0).toUpperCase() + theme?.slice(1)}</span>
            </Label>
            <Select value={theme} onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Company Management */}
      <Card>
        <CardHeader>
          <CardTitle>Company Management</CardTitle>
          <CardDescription>Select an active company and financial year.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selectCompany">Select Active Company</Label>
            <Select onValueChange={selectCompany} value={selectedCompany?.id || ""}>
              <SelectTrigger id="selectCompany">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompany && (
            <div className="space-y-2">
              <Label htmlFor="selectFinancialYear">Select Financial Year</Label>
              <Select onValueChange={selectFinancialYear} value={selectedFinancialYear || ""}>
                <SelectTrigger id="selectFinancialYear">
                  <SelectValue placeholder="Select financial year" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCompany.financialYears.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedCompany && (
            <div className="mt-4 p-4 border rounded-md bg-muted">
              <p className="text-sm font-medium">Current Company: <span className="font-bold">{selectedCompany.name}</span></p>
              <p className="text-sm text-muted-foreground">Address: {selectedCompany.address}</p>
              <p className="text-sm font-medium">Active Financial Year: <span className="font-bold">{selectedFinancialYear || "N/A"}</span></p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Printing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Printing Preferences</CardTitle>
          <CardDescription>Customize how your invoices and reports are printed.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="printFormat">Default Print Format</Label>
            <Select defaultValue="standard">
              <SelectTrigger id="printFormat" className="w-full">
                <SelectValue placeholder="Select a format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (A4)</SelectItem>
                <SelectItem value="thermal">Thermal (Small Receipt)</SelectItem>
                <SelectItem value="custom">Custom Layout</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              *Note: Implementing different print layouts requires significant development. This is a placeholder for future functionality.
            </p>
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="printInHindi">Print Invoices in Hindi</Label>
            <Switch id="printInHindi" checked={printInHindi} onCheckedChange={setPrintInHindi} />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            *Note: Enabling this will translate *static labels* in invoices to Hindi for printing. Dynamic data (like farmer names, item names, remarks) will remain in English as automatic translation is beyond the scope of this client-side application.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;