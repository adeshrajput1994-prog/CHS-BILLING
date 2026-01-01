"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/context/CompanyContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Sun, Moon, Monitor } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useTheme } from "next-themes"; // Import useTheme
import { Switch } from "@/components/ui/switch"; // Import Switch
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Separator } from "@/components/ui/separator";

// Define Zod schema for company details editing
const companyEditSchema = z.object({
  companyName: z.string().min(1, { message: "Company Name is required." }),
  companyAddress: z.string().min(1, { message: "Company Address is required." }),
});

type CompanyEditFormValues = z.infer<typeof companyEditSchema>;

const SettingsPage: React.FC = () => {
  const { companies, selectedCompany, selectedFinancialYear, addCompany, selectCompany, selectFinancialYear } = useCompany();
  const { theme, setTheme } = useTheme(); // Use theme hook

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyStartYear, setNewCompanyStartYear] = useState(new Date().getFullYear());

  // Form for editing selected company details
  const companyEditForm = useForm<CompanyEditFormValues>({
    resolver: zodResolver(companyEditSchema),
    defaultValues: {
      companyName: selectedCompany?.name || "",
      companyAddress: selectedCompany?.address || "",
    },
  });

  // Update form defaults when selectedCompany changes
  useEffect(() => {
    if (selectedCompany) {
      companyEditForm.reset({
        companyName: selectedCompany.name,
        companyAddress: selectedCompany.address,
      });
    }
  }, [selectedCompany, companyEditForm]);

  const handleAddCompany = () => {
    if (newCompanyName.trim() === "" || newCompanyAddress.trim() === "") {
      showError("Company Name and Address cannot be empty.");
      return;
    }
    addCompany(newCompanyName, newCompanyAddress, newCompanyStartYear);
    setNewCompanyName("");
    setNewCompanyAddress("");
    setNewCompanyStartYear(new Date().getFullYear());
  };

  const handleUpdateCompanyDetails = (data: CompanyEditFormValues) => {
    if (!selectedCompany) {
      showError("No company selected to update.");
      return;
    }
    const updatedCompanies = companies.map(c =>
      c.id === selectedCompany.id
        ? { ...c, name: data.companyName, address: data.companyAddress }
        : c
    );
    localStorage.setItem('companies', JSON.stringify(updatedCompanies));
    // Manually update selectedCompany in context if it's the one being edited
    if (selectedCompany.id === selectedCompany.id) {
      selectCompany(selectedCompany.id); // Re-select to trigger context update
    }
    showSuccess("Company details updated successfully!");
  };

  const onErrorCompanyEditForm = (errors: any) => {
    console.error("Company edit form validation errors:", errors);
    showError("Please correct the errors in company details form.");
  };

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
          <CardDescription>Add new companies or select an active one.</CardDescription>
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

          <Separator className="my-4" />

          <CardTitle className="text-xl">Add New Company</CardTitle>
          <CardDescription>Create a new company profile with its initial financial year.</CardDescription>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newCompanyName">Company Name</Label>
              <Input
                id="newCompanyName"
                placeholder="e.g., My Business Inc."
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCompanyAddress">Company Address</Label>
              <Input
                id="newCompanyAddress"
                placeholder="e.g., 123 Business St, City, State"
                value={newCompanyAddress}
                onChange={(e) => setNewCompanyAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newCompanyStartYear">Financial Year Start (e.g., 2023 for 2023-2024)</Label>
              <Input
                id="newCompanyStartYear"
                type="number"
                value={newCompanyStartYear}
                onChange={(e) => setNewCompanyStartYear(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleAddCompany} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Company
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Selected Company Details */}
      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Current Company Details</CardTitle>
            <CardDescription>Update the name and address of the selected company.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={companyEditForm.handleSubmit(handleUpdateCompanyDetails, onErrorCompanyEditForm)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editCompanyName">Company Name</Label>
                <Input id="editCompanyName" {...companyEditForm.register("companyName")} />
                {companyEditForm.formState.errors.companyName && (
                  <p className="text-red-500 text-sm">{companyEditForm.formState.errors.companyName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCompanyAddress">Company Address</Label>
                <Input id="editCompanyAddress" {...companyEditForm.register("companyAddress")} />
                {companyEditForm.formState.errors.companyAddress && (
                  <p className="text-red-500 text-sm">{companyEditForm.formState.errors.companyAddress.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full">Update Company Details</Button>
            </form>
          </CardContent>
        </Card>
      )}

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
            <p className="text-sm text-muted-foreground">
              *Note: Implementing different print layouts requires significant development. This is a placeholder for future functionality.
            </p>
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="printInHindi">Print Invoices in Hindi</Label>
            <Switch id="printInHindi" disabled />
          </div>
          <p className="text-sm text-muted-foreground">
            *Note: Printing dynamic data in Hindi (or other regional languages) requires a robust backend with translation capabilities and specific font handling, which is beyond the scope of this client-side application. This is a placeholder for future functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;