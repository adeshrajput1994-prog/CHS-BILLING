"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CompletePurchaseInvoice } from "./PurchaseInvoiceForm"; // Import the interface
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook

// Define the Zod schema for manufacturing expenses
const manufacturingExpensesSchema = z.object({
  manufacturedItemName: z.string().min(1, { message: "Manufactured Item Name is required." }),
  plantLabourRate: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Plant Labour Rate cannot be negative." })
  ),
  khakhoraLabourRate: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Khakhora Labour Rate cannot be negative." })
  ),
  loadingLabourRate: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Loading Labour Rate cannot be negative." })
  ),
  freightRate: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Freight Rate cannot be negative." })
  ),
});

type ManufacturingExpensesFormValues = z.infer<typeof manufacturingExpensesSchema>;

const ManufacturingExpensesForm: React.FC = () => {
  // Fetch purchase invoices using useFirestore
  const { data: purchaseInvoices, loading: loadingPurchaseInvoices, error: purchaseInvoicesError } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices');
  // Removed useFirestore for 'manufacturingExpenses' as we are no longer saving.

  const form = useForm<ManufacturingExpensesFormValues>({
    resolver: zodResolver(manufacturingExpensesSchema),
    defaultValues: {
      manufacturedItemName: localStorage.getItem('manufacturedItemName') || "",
      plantLabourRate: Number(localStorage.getItem('plantLabourRate')) || 0,
      khakhoraLabourRate: Number(localStorage.getItem('khakhoraLabourRate')) || 0,
      loadingLabourRate: Number(localStorage.getItem('loadingLabourRate')) || 0,
      freightRate: Number(localStorage.getItem('freightRate')) || 0,
    },
  });

  const { watch, formState: { errors } } = form;

  const manufacturedItemName = watch("manufacturedItemName");
  const plantLabourRate = watch("plantLabourRate");
  const khakhoraLabourRate = watch("khakhoraLabourRate");
  const loadingLabourRate = watch("loadingLabourRate");
  const freightRate = watch("freightRate");

  const [totalPurchaseItemKg, setTotalPurchaseItemKg] = useState(0);
  const [manufacturedItemKg, setManufacturedItemKg] = useState(0);

  // Effect to load purchase invoices and calculate initial values
  useEffect(() => {
    if (purchaseInvoices.length > 0) {
      const totalFinalWeight = purchaseInvoices.reduce((sum, invoice) => {
        return sum + invoice.items.reduce((itemSum, item) => itemSum + Number(item.finalWeight), 0);
      }, 0);
      setTotalPurchaseItemKg(totalFinalWeight);
      setManufacturedItemKg(totalFinalWeight / 4); // Assuming 1/4th conversion
    } else {
      setTotalPurchaseItemKg(0);
      setManufacturedItemKg(0);
    }
  }, [purchaseInvoices]); // Depend on purchaseInvoices from Firestore

  // Effect to persist form values to local storage
  useEffect(() => {
    localStorage.setItem('manufacturedItemName', manufacturedItemName);
    localStorage.setItem('plantLabourRate', String(plantLabourRate));
    localStorage.setItem('khakhoraLabourRate', String(khakhoraLabourRate));
    localStorage.setItem('loadingLabourRate', String(loadingLabourRate));
    localStorage.setItem('freightRate', String(freightRate));
  }, [manufacturedItemName, plantLabourRate, khakhoraLabourRate, loadingLabourRate, freightRate]);

  // Calculations based on the image
  const manufacturedItemStock = manufacturedItemKg; // This is the output of the manufacturing process
  const plantLabourCost = totalPurchaseItemKg * Number(plantLabourRate);
  const khakhoraLabourCost = totalPurchaseItemKg * Number(khakhoraLabourRate);
  const loadingLabourCost = manufacturedItemKg * Number(loadingLabourRate);
  const freightCost = manufacturedItemKg * Number(freightRate);

  const totalManufacturingExpense = plantLabourCost + khakhoraLabourCost + loadingLabourCost + freightCost;

  // Removed onSubmit function as we are no longer saving.
  // The calculations are now live based on watched form values.

  if (loadingPurchaseInvoices) {
    return <div className="text-center py-8 text-lg">Loading purchase data for calculations...</div>;
  }

  if (purchaseInvoicesError) {
    return <div className="text-center py-8 text-lg text-red-500">Error loading purchase data: {purchaseInvoicesError}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Manufacturing Expenses and Stock</h1>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Manufacturing Details</CardTitle>
          <CardDescription>Enter details to calculate manufacturing expenses and stock dynamically.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6"> {/* Removed onSubmit handler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturedItemName">Manufactured Item Name</Label>
                <Input id="manufacturedItemName" placeholder="e.g., Wheat Flour" {...form.register("manufacturedItemName")} />
                {errors.manufacturedItemName && (
                  <p className="text-red-500 text-sm">{errors.manufacturedItemName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPurchaseItemKg">Total Purchase Item (KG)</Label>
                <Input id="totalPurchaseItemKg" type="number" step="0.01" value={totalPurchaseItemKg.toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturedItemKg">Manufactured Item (KG)</Label>
                <Input id="manufacturedItemKg" type="number" step="0.01" value={manufacturedItemKg.toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-6 mt-6">
              <h3 className="col-span-full text-lg font-semibold mb-2">Labour & Freight Costs</h3>
              
              <div className="space-y-2">
                <Label htmlFor="plantLabourRate">Plant Labour Rate (per KG of Purchase)</Label>
                <Input id="plantLabourRate" type="number" step="0.01" placeholder="0.00" {...form.register("plantLabourRate")} />
                {errors.plantLabourRate && (
                  <p className="text-red-500 text-sm">{errors.plantLabourRate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Plant Labour Cost</Label>
                <Input value={`₹ ${plantLabourCost.toFixed(2)}`} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="khakhoraLabourRate">Khakhora Labour Rate (per KG of Purchase)</Label>
                <Input id="khakhoraLabourRate" type="number" step="0.01" placeholder="0.00" {...form.register("khakhoraLabourRate")} />
                {errors.khakhoraLabourRate && (
                  <p className="text-red-500 text-sm">{errors.khakhoraLabourRate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Khakhora Labour Cost</Label>
                <Input value={`₹ ${khakhoraLabourCost.toFixed(2)}`} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="loadingLabourRate">Loading Labour Rate (per KG of Manufactured)</Label>
                <Input id="loadingLabourRate" type="number" step="0.01" placeholder="0.00" {...form.register("loadingLabourRate")} />
                {errors.loadingLabourRate && (
                  <p className="text-red-500 text-sm">{errors.loadingLabourRate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Loading Labour Cost</Label>
                <Input value={`₹ ${loadingLabourCost.toFixed(2)}`} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="freightRate">Freight Rate (per KG of Manufactured)</Label>
                <Input id="freightRate" type="number" step="0.01" placeholder="0.00" {...form.register("freightRate")} />
                {errors.freightRate && (
                  <p className="text-red-500 text-sm">{errors.freightRate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Freight Cost</Label>
                <Input value={`₹ ${freightCost.toFixed(2)}`} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>

            <div className="border-t pt-6 mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-medium">Manufactured Item Stock</p>
                <p className="text-xl font-semibold">{manufacturedItemStock.toFixed(2)} KG</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xl font-bold">Total Manufacturing Expense</p>
                <p className="text-2xl font-bold text-blue-600">₹ {totalManufacturingExpense.toFixed(2)}</p>
              </div>
            </div>

            {/* Removed the submit button as calculations are now dynamic and not saved */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManufacturingExpensesForm;