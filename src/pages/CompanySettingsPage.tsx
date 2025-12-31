"use client";

import React, { useState } from "react";
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
import { Plus } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const CompanySettingsPage: React.FC = () => {
  const { companies, selectedCompany, selectedFinancialYear, addCompany, selectCompany, selectFinancialYear } = useCompany();
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyStartYear, setNewCompanyStartYear] = useState(new Date().getFullYear());

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

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Company Settings</h1>
      <p className="text-lg text-muted-foreground">
        Manage your companies and select the active financial year.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Add New Company</CardTitle>
          <CardDescription>Create a new company profile with its initial financial year.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Active Company & Financial Year</CardTitle>
          <CardDescription>Choose which company and financial year you are currently working with.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="selectCompany">Select Company</Label>
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
    </div>
  );
};

export default CompanySettingsPage;