"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCompany } from "@/context/CompanyContext";

// Define the Zod schema for item details
const itemSchema = z.object({
  itemName: z.string().min(1, { message: "Item Name is required." }),
  ratePerKg: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Rate per KG must be a positive number." })
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Stock cannot be negative." })
  ),
});

type ItemFormValues = z.infer<typeof itemSchema>;

export interface Item {
  id: string;
  itemName: string;
  ratePerKg: number;
  stock: number;
  companyId: string;
}

interface ItemFormProps {
  initialData?: Item | null;
  onSave: (item: ItemFormValues & { id?: string }) => void; // Removed companyId from signature
  onCancel: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ initialData, onSave, onCancel }) => {
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();
  
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: initialData || {
      itemName: "",
      ratePerKg: 0,
      stock: 0,
    },
  });

  // Reset form fields when initialData changes
  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        itemName: "",
        ratePerKg: 0,
        stock: 0,
      });
    }
  }, [initialData, form]);

  const onSubmit = (data: ItemFormValues) => {
    if (!currentCompanyId) {
      showError("Please select a company before saving item details.");
      return;
    }
    
    // companyId is now handled by useFirestore hook
    const itemToSave = initialData 
      ? { ...data, id: initialData.id }
      : { ...data };
      
    onSave(itemToSave);
    showSuccess(`Item ${initialData ? "updated" : "added"} successfully!`);
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the errors in the form.");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? "Edit Item Details" : "Add New Item"}</CardTitle>
        <CardDescription>
          {initialData ? `Editing details for Item ID: ${initialData.id}` : "Enter the details for your item."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
          {initialData && (
            <div className="space-y-2">
              <Label htmlFor="itemId">Item ID</Label>
              <Input id="itemId" value={initialData.id} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
            </div>
          )}
          {!currentCompanyId && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-600 text-sm">⚠️ Please select a company first before adding items.</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input id="itemName" placeholder="Item Name" {...form.register("itemName")} />
            {form.formState.errors.itemName && (
              <p className="text-red-500 text-sm">{form.formState.errors.itemName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ratePerKg">Rate per KG</Label>
            <Input id="ratePerKg" placeholder="Rate per KG" type="number" step="0.01" {...form.register("ratePerKg")} />
            {form.formState.errors.ratePerKg && (
              <p className="text-red-500 text-sm">{form.formState.errors.ratePerKg.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="stock">Current Stock (KG)</Label>
            <Input id="stock" placeholder="0.00" type="number" step="0.01" {...form.register("stock")} />
            {form.formState.errors.stock && (
              <p className="text-red-500 text-sm">{form.formState.errors.stock.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" className="w-full" disabled={!currentCompanyId}>
              {initialData ? "Update Item Details" : "Save and Next"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ItemForm;