"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import FarmersForm from "@/components/FarmersForm";
import FarmerTable from "@/components/FarmerTable";
import { Input } from "@/components/ui/input";
import { showError } from "@/utils/toast";
import { useFirestore } from "@/hooks/use-firestore";
import { useCompany } from "@/context/CompanyContext";
import { getNextFarmerId } from "@/utils/idGenerators"; // Import ID generator

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
  companyId: string; // Add companyId field
}

const FarmersPage = () => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();
  
  // Pass currentCompanyId to useFirestore
  const { data: farmers, loading, error, addDocument, updateDocument, deleteDocument, fetchData } = useFirestore<Farmer>('farmers', currentCompanyId);
  
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // No need for manual filtering by companyId here, useFirestore handles it.
  const filteredFarmers = farmers.filter(farmer =>
    farmer.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.fathersName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.mobileNo.includes(searchTerm) ||
    farmer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFarmer = async (newFarmerData: Omit<Farmer, 'id' | 'companyId'>) => {
    if (!currentCompanyId) {
      showError("Please select a company before adding farmers.");
      return;
    }
    
    // Generate a new sequential ID
    const newId = getNextFarmerId(farmers);
    
    // companyId is automatically added by useFirestore hook
    const addedId = await addDocument({ ...newFarmerData, id: newId }); // Pass generated ID
    if (addedId) {
      setViewMode('list');
    }
  };

  const handleEditFarmer = async (updatedFarmerData: Farmer) => {
    if (updatedFarmerData.id) {
      await updateDocument(updatedFarmerData.id, updatedFarmerData);
      setEditingFarmer(null);
      setViewMode('list');
    } else {
      showError("Farmer ID is missing for update.");
    }
  };

  const handleDeleteFarmer = async (id: string) => {
    await deleteDocument(id);
  };

  const handleCancelForm = () => {
    setEditingFarmer(null);
    setViewMode('list');
  };

  const handleOpenEditForm = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setViewMode('edit');
  };

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  if (loading) {
    return <div className="text-center py-8 text-lg">Loading farmers...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-lg text-red-500">Error: {error}</div>;
  }

  if (!currentCompanyId) {
    return (
      <div className="text-center py-8 text-lg">
        Please select a company from Company Settings to view farmers.
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">Farmer Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print List
          </Button>
          {viewMode === 'list' && (
            <Button onClick={() => setViewMode('add')} className="bg-green-600 hover:bg-green-700">
              <Plus className="mr-2 h-4 w-4" /> Add New Farmer
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <Input
            placeholder="Search farmers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm print-hide"
          />
          <FarmerTable
            farmers={filteredFarmers}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteFarmer}
          />
        </>
      )}

      {(viewMode === 'add' || viewMode === 'edit') && (
        <FarmersForm
          initialData={editingFarmer}
          onSave={viewMode === 'add' ? handleAddFarmer : handleEditFarmer}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default FarmersPage;