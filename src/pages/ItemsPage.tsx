"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Printer } from "lucide-react";
import ItemForm from "@/components/ItemForm";
import ItemTable from "@/components/ItemTable"; // Import the new ItemTable
import { Input } from "@/components/ui/input";

interface Item {
  id: string;
  itemName: string;
  ratePerKg: number;
}

// Helper function to get the next item ID (e.g., I001, I002)
const getNextItemId = (currentItems: Item[]) => {
  let maxIdNum = 0;
  currentItems.forEach(item => {
    const match = item.id.match(/^I(\d+)$/);
    if (match && match[1]) {
      const idNum = parseInt(match[1], 10);
      if (idNum > maxIdNum) {
        maxIdNum = idNum;
      }
    }
  });
  return `I${String(maxIdNum + 1).padStart(3, '0')}`;
};

const ItemsPage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'edit'>('list');
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Load items from localStorage on initial mount
  useEffect(() => {
    const storedItems = localStorage.getItem("items");
    if (storedItems) {
      setItems(JSON.parse(storedItems));
    }
  }, []);

  // Save items to localStorage whenever the items state changes
  useEffect(() => {
    localStorage.setItem("items", JSON.stringify(items));
  }, [items]);

  const handleAddItem = (newItemData: Omit<Item, 'id'>) => {
    const newId = getNextItemId(items);
    const newItem: Item = { id: newId, ...newItemData };
    setItems((prevItems) => [...prevItems, newItem]);
    setViewMode('list'); // Go back to list view after adding
  };

  const handleEditItem = (updatedItemData: Item) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItemData.id ? updatedItemData : item
      )
    );
    setEditingItem(null); // Clear editing state
    setViewMode('list'); // Go back to list view after editing
  };

  const handleDeleteItem = (id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
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