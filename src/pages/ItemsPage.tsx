"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import ItemForm, { Item } from "@/components/ItemForm"; // Import Item interface from ItemForm
import ItemTable from "@/components/ItemTable"; // Import the new ItemTable
import { Input } from "@/components/ui/input";
import { getNextItemId } from "@/utils/idGenerators"; // Import from new utility
import { showSuccess } from "@/utils/toast";

const ItemsPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Load items from localStorage on initial mount
  useEffect(() => {
    const storedItems = localStorage.getItem("items");
    if (storedItems) {
      const parsedItems: Item[] = JSON.parse(storedItems);
      // Ensure stock is a number, default to 0 if missing
      const processedItems = parsedItems.map(item => ({
        ...item,
        ratePerKg: Number(item.ratePerKg),
        stock: Number(item.stock || 0), // Ensure stock is a number, default to 0
      }));
      setItems(processedItems);
    }
  }, []);

  // Save items to localStorage whenever the items state changes
  useEffect(() => {
    localStorage.setItem("items", JSON.stringify(items));
  }, [items]);

  const handleAddItem = (newItemData: Omit<Item, 'id'>) => {
    const newId = getNextItemId(items);
    const newItem: Item = { id: newId, ...newItemData, stock: Number(newItemData.stock || 0) }; // Ensure stock is number
    setItems((prevItems) => [...prevItems, newItem]);
    showSuccess("Item added successfully!");
    setViewMode('list'); // Go back to list view after adding
  };

  const handleEditItem = (updatedItemData: Item) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItemData.id ? { ...updatedItemData, stock: Number(updatedItemData.stock || 0) } : item // Ensure stock is number
      )
    );
    showSuccess("Item updated successfully!");
    setEditingItem(null); // Clear editing state
    setViewMode('list'); // Go back to list view after editing
  };

  const handleDeleteItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    showSuccess("Item deleted successfully!");
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