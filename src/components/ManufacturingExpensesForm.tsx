"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CompletePurchaseInvoice } from "./PurchaseInvoiceForm"; // Import the interface

// Define the Zod schema for manufacturing expenses
const manufacturingExpensesSchema = z.object({
  manufacturedItemName: z.string().min(1, { message: "Manufactured Item Name is required." }),
  totalPurchaseItemKg: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Total Purchase Item (KG) cannot be negative." })
  ),
  manufacturedItemKg: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Manufactured Item (KG) cannot be negative." })
  ),
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
  const form = useForm<ManufacturingExpensesFormValues>({
    resolver: zodResolver(manufacturingExpensesSchema),
    defaultValues: {
      manufacturedItemName: "",
      totalPurchaseItemKg: 0,
      manufacturedItemKg: 0,
      plantLabourRate: 0,
      khakhoraLabourRate: 0,
      loadingLabourRate: 0,
      freightRate: 0,
    },
  });

  const { watch, handleSubmit, setValue, formState: { errors } } = form;

  const manufacturedItemName = watch("manufacturedItemName");
  const totalPurchaseItemKg = watch("totalPurchaseItemKg");
  const manufacturedItemKg = watch("manufacturedItemKg");
  const plantLabourRate = watch("plantLabourRate");
  const khakhoraLabourRate = watch("khakhoraLabourRate");
  const loadingLabourRate = watch("loadingLabourRate");
  const freightRate = watch("freightRate");

  // Effect to load purchase invoices and calculate initial values
  useEffect(() => {
    const storedInvoices = localStorage.getItem("purchaseInvoices");
    let totalFinalWeight = 0;
    if (storedInvoices) {
      try {
        const purchaseInvoices: CompletePurchaseInvoice[] = JSON.parse(storedInvoices);
        totalFinalWeight = purchaseInvoices.reduce((sum, invoice) => {
          return sum + invoice.items.reduce((itemSum, item) => itemSum + item.finalWeight, 0);
        }, 0);
      } catch (error) {
        console.error("Failed to parse purchase invoices from localStorage:", error);
        showError("Failed to load purchase data for calculations.");
      }
    }

    setValue("totalPurchaseItemKg", totalFinalWeight);
    setValue("manufacturedItemKg", totalFinalWeight / 4);
  }, [setValue]); // Depend on setValue to ensure it's stable

  // Calculations based on the image
  const manufacturedItemStock = totalPurchaseItemKg / 4; // This will now be the same as manufacturedItemKg
  const plantLabourCost = totalPurchaseItemKg * plantLabourRate;
  const khakhoraLabourCost = totalPurchaseItemKg * khakhoraLabourRate;
  const loadingLabourCost = manufacturedItemKg * loadingLabourRate;
  const freightCost = manufacturedItemKg * freightRate;

  const totalManufacturingExpense = plantLabourCost + khakhoraLabourCost + loadingLabourCost + freightCost;

  const onSubmit = (data: ManufacturingExpensesFormValues) => {
    console.log("Manufacturing Expenses Data:", {
      ...data,
      manufacturedItemStock,
      plantLabourCost,
      khakhoraLabourCost,
      loadingLabourCost,
      freightCost,
      totalManufacturingExpense,
    });
    showSuccess("Manufacturing expenses calculated and logged!");
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the errors in the form.");
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold">Manufacturing Expenses and Stock</h1>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Manufacturing Details</CardTitle>
          <CardDescription>Enter details to calculate manufacturing expenses and stock.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
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
                <Input id="totalPurchaseItemKg" type="number" step="0.01" placeholder="0.00" {...form.register("totalPurchaseItemKg")} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                {errors.totalPurchaseItemKg && (
                  <p className="text-red-500 text-sm">{errors.totalPurchaseItemKg.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="manufacturedItemKg">Manufactured Item (KG)</Label>
                <Input id="manufacturedItemKg" type="number" step="0.01" placeholder="0.00" {...form.register("manufacturedItemKg")} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                {errors.manufacturedItemKg && (
                  <p className="text-red-500 text-sm">{errors.manufacturedItemKg.message}</p>
                )}
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

            <Button type="submit" className="w-full">Calculate Expenses</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ManufacturingExpensesForm;