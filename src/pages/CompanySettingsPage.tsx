"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/context/CompanyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
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
import { useFirestore } from "@/hooks/use-firestore";

interface Company {
  id: string;
  name: string;
  address: string;
  financialYears: string[];
}

const CompanySettingsPage: React.FC = () => {
  const { companies, selectedCompany, selectedFinancialYear, addCompany, selectCompany, selectFinancialYear, loading, error } = useCompany();
  const { updateDocument, deleteDocument } = useFirestore<Company>('companies', null); // Pass null for companyId as this is for managing companies themselves

  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");
  const [newCompanyStartYear, setNewCompanyStartYear] = useState(new Date().getFullYear());
  const [newFinancialYearStart, setNewFinancialYearStart] = useState(new Date().getFullYear());

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

  const handleAddFinancialYear = async () => {
    if (!selectedCompany) {
      showError("Please select a company first.");
      return;
    }
    const newYearString = `${newFinancialYearStart}-${newFinancialYearStart + 1}`;
    if (selectedCompany.financialYears.includes(newYearString)) {
      showError(`Financial year ${newYearString} already exists for this company.`);
      return;
    }

    const updatedFinancialYears = [...selectedCompany.financialYears, newYearString].sort();
    try {
      await updateDocument(selectedCompany.id, { financialYears: updatedFinancialYears });
      showSuccess(`Financial year ${newYearString} added to ${selectedCompany.name}!`);
      // Re-select company to refresh context with updated financial years
      selectCompany(selectedCompany.id);
      setNewFinancialYearStart(new Date().getFullYear());
    } catch (err) {
      console.error("Error adding financial year:", err);
      showError("Failed to add financial year.");
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!companyId) {
      showError("Company ID is required for deletion.");
      return;
    }

    try {
      await deleteDocument(companyId);
      showSuccess("Company deleted successfully!");
      
      // If the deleted company was the selected one, clear the selection
      if (selectedCompany?.id === companyId) {
        selectCompany("");
      }
    } catch (error) {
      console.error("Error deleting company:", error);
      showError("Failed to delete company.");
    }
  };

  // Show loading indicator while data is being fetched
  if (loading) {
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
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="text-lg mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

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
            <Input id="newCompanyName" placeholder="e.g., My Business Inc." value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newCompanyAddress">Company Address</Label>
            <Input id="newCompanyAddress" placeholder="e.g., 123 Business St, City, State" value={newCompanyAddress} onChange={(e) => setNewCompanyAddress(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newCompanyStartYear">Financial Year Start (e.g., 2023 for 2023-2024)</Label>
            <Input id="newCompanyStartYear" type="number" value={newCompanyStartYear} onChange={(e) => setNewCompanyStartYear(Number(e.target.value))} />
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
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Current Company: <span className="font-bold">{selectedCompany.name}</span></p>
                  <p className="text-sm text-muted-foreground">Address: {selectedCompany.address}</p>
                  <p className="text-sm font-medium">Active Financial Year: <span className="font-bold">{selectedFinancialYear || "N/A"}</span></p>
                  <p className="text-sm text-muted-foreground mt-2">Available Financial Years: {selectedCompany.financialYears.join(", ")}</p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" /> Delete Company
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the company <span className="font-bold">"{selectedCompany.name}"</span>?
                        <br />
                        <br />
                        <span className="text-red-600 font-medium">This action cannot be undone.</span> All company data, including financial years and settings, will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleDeleteCompany(selectedCompany.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Company
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedCompany && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Financial Year</CardTitle>
            <CardDescription>Add a new financial year to the selected company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newFinancialYearStart">Financial Year Start (e.g., 2024 for 2024-2025)</Label>
              <Input 
                id="newFinancialYearStart" 
                type="number" 
                value={newFinancialYearStart} 
                onChange={(e) => setNewFinancialYearStart(Number(e.target.value))} 
              />
            </div>
            <Button onClick={handleAddFinancialYear} className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Financial Year
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Company List with Delete Options */}
      {companies.length > 0 && ( // Show this section if there's at least one company
        <Card>
          <CardHeader>
            <CardTitle>All Companies</CardTitle>
            <CardDescription>Manage all your registered companies.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companies.map((company) => (
                <div key={company.id} className="flex justify-between items-center p-3 border rounded-md">
                  <div>
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground">{company.address}</p>
                    <p className="text-xs text-gray-500">Financial Years: {company.financialYears.join(", ")}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => selectCompany(company.id)}
                      disabled={selectedCompany?.id === company.id}
                    >
                      {selectedCompany?.id === company.id ? "Selected" : "Select"}
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={companies.length === 1}> {/* Disable delete if only one company */}
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-red-600 flex items-center">
                            <AlertTriangle className="h-5 w-5 mr-2" /> Delete Company
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the company <span className="font-bold">"{company.name}"</span>?
                            <br />
                            <br />
                            <span className="text-red-600 font-medium">This action cannot be undone.</span> All company data, including financial years and settings, will be permanently deleted.
                            {companies.length === 1 && <p className="text-orange-500 mt-2">You cannot delete the last remaining company.</p>}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteCompany(company.id)}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={companies.length === 1}
                          >
                            Delete Company
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CompanySettingsPage;