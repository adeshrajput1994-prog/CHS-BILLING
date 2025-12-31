"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react"; // Import Printer icon
import FarmersForm from "@/components/FarmersForm";
import FarmerTable from "@/components/FarmerTable";
import { Input } from "@/components/ui/input";
import { getNextFarmerId } from "@/utils/idGenerators"; // Import from new utility

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
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Load farmers from localStorage on initial mount
  useEffect(() => {
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) {
      setFarmers(JSON.parse(storedFarmers));
    }
  }, []);

  // Save farmers to localStorage whenever the farmers state changes
  useEffect(() => {
    localStorage.setItem("farmers", JSON.stringify(farmers));
  }, [farmers]);

  const handleAddFarmer = (newFarmerData: Omit<Farmer, 'id'>) => {
    const newId = getNextFarmerId(farmers);
    const newFarmer: Farmer = { id: newId, ...newFarmerData };
    setFarmers((prevFarmers) => [...prevFarmers, newFarmer]);
    setViewMode('list'); // Go back to list view after adding
  };

  const handleEditFarmer = (updatedFarmerData: Farmer) => {
    setFarmers((prevFarmers) =>
      prevFarmers.map((farmer) =>
        farmer.id === updatedFarmerData.id ? updatedFarmerData : farmer
      )
    );
    setEditingFarmer(null); // Clear editing state
    setViewMode('list'); // Go back to list view after editing
  };

  const handleDeleteFarmer = (id: string) => {
    setFarmers((prevFarmers) => prevFarmers.filter((farmer) => farmer.id !== id));
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