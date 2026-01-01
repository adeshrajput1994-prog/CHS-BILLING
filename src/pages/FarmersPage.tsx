"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import FarmersForm from "@/components/FarmersForm";
import FarmerTable from "@/components/FarmerTable";
import { Input } from "@/components/ui/input";
import { getNextFarmerId } from "@/utils/idGenerators";
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { showError } from "@/utils/toast"; // Import showError for validation

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

const FarmersPage = () => {
  // Replace localStorage state with useFirestore hook
  const { data: farmers, loading, error, addDocument, updateDocument, deleteDocument } = useFirestore<Farmer>('farmers');
  
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // No need for localStorage useEffects anymore, useFirestore handles fetching and updates

  const handleAddFarmer = async (newFarmerData: Omit<Farmer, 'id'>) => {
    // Firestore will generate the actual document ID, but we can still use getNextFarmerId
    // for a client-side generated 'id' property if needed for display or specific logic.
    // For now, we'll let Firestore handle the primary ID.
    const addedId = await addDocument(newFarmerData);
    if (addedId) {
      // useFirestore will refetch data, so no manual state update needed here
      setViewMode('list'); // Go back to list view after adding
    }
  };

  const handleEditFarmer = async (updatedFarmerData: Farmer) => {
    if (updatedFarmerData.id) {
      await updateDocument(updatedFarmerData.id, updatedFarmerData);
      // useFirestore will refetch data
      setEditingFarmer(null); // Clear editing state
      setViewMode('list'); // Go back to list view after editing
    } else {
      showError("Farmer ID is missing for update.");
    }
  };

  const handleDeleteFarmer = async (id: string) => {
    await deleteDocument(id);
    // useFirestore will refetch data
  };

  const handleCancelForm = () => {
    setEditingFarmer(null); // Clear editing state
    setViewMode('list'); // Go back to list view
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

  // Filter farmers based on search term
  const filteredFarmers = farmers.filter(farmer =>
    farmer.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.fathersName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.village.toLowerCase().includes(searchTerm.toLowerCase()) ||
    farmer.mobileNo.includes(searchTerm) ||
    farmer.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-lg">Loading farmers...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-lg text-red-500">Error: {error}</div>;
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