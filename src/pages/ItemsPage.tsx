"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import ItemForm, { Item } from "@/components/ItemForm"; // Import Item interface from ItemForm
import ItemTable from "@/components/ItemTable"; // Import the new ItemTable
import { Input } from "@/components/ui/input";
import { getNextItemId } from "@/utils/idGenerators"; // Import from new utility
import { showSuccess, showError } from "@/utils/toast";
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook

const ItemsPage = () => {
  // Replace localStorage state with useFirestore hook
  const { data: items, loading, error, addDocument, updateDocument, deleteDocument } = useFirestore<Item>('items');
  
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // No need for localStorage useEffects anymore, useFirestore handles fetching and updates

  const handleAddItem = async (newItemData: Omit<Item, 'id'>) => {
    // Firestore will generate the actual document ID.
    // We can still use getNextItemId for a client-side generated 'id' property if needed for display or specific logic,
    // but for Firestore, the document ID is primary.
    const addedId = await addDocument({ ...newItemData, stock: Number(newItemData.stock || 0) });
    if (addedId) {
      // useFirestore will refetch data, so no manual state update needed here
      setViewMode('list'); // Go back to list view after adding
    }
  };

  const handleEditItem = async (updatedItemData: Item) => {
    if (updatedItemData.id) {
      await updateDocument(updatedItemData.id, { ...updatedItemData, stock: Number(updatedItemData.stock || 0) });
      // useFirestore will refetch data
      setEditingItem(null); // Clear editing state
      setViewMode('list'); // Go back to list view after editing
    } else {
      showError("Item ID is missing for update.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    await deleteDocument(id);
    // useFirestore will refetch data
  };

  const handleCancelForm = () => {
    setEditingItem(null); // Clear editing state
    setViewMode('list'); // Go back to list view
  };

  const handleOpenEditForm = (item: Item) => {
    setEditingItem(item);
    setViewMode('edit');
  };

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  // Filter items based on search term
  const filteredItems = items.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8 text-lg">Loading items...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-lg text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">Item Management</h1>
        <div className="flex space-x-2">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print List
          </Button>
          {viewMode === 'list' && (
            <Button onClick={() => setViewMode('add')} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="mr-2 h-4 w-4" /> Add New Item
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'list' && (
        <>
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm print-hide"
          />
          <ItemTable
            items={filteredItems}
            onEdit={handleOpenEditForm}
            onDelete={handleDeleteItem}
          />
        </>
      )}

      {(viewMode === 'add' || viewMode === 'edit') && (
        <ItemForm
          initialData={editingItem}
          onSave={viewMode === 'add' ? handleAddItem : handleEditItem}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default ItemsPage;