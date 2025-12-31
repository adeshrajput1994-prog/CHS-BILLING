"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { calculateFarmerDueBalances, CashBankTransaction } from "@/utils/balanceCalculations";
import { CompleteSalesInvoice } from "./SalesInvoiceForm";
import { CompletePurchaseInvoice } from "./PurchaseInvoiceForm";

interface Farmer {
  id: string;
  farmerName: string;
  // Add other necessary farmer details if needed for display
}

const transactionSchema = z.object({
  transactionType: z.enum(["Payment In", "Payment Out"], {
    required_error: "Transaction type is required.",
  }),
  farmerId: z.string().min(1, { message: "Farmer is required." }),
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Amount must be a positive number." })
  ),
  paymentMethod: z.enum(["Cash", "Bank"], {
    required_error: "Payment method is required.",
  }),
  remarks: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface CashBankFormProps {
  initialData?: CashBankTransaction | null; // New prop for initial data
  onSave: (transaction: CashBankTransaction) => void;
  onCancel: () => void;
}

const CashBankForm: React.FC<CashBankFormProps> = ({ initialData, onSave, onCancel }) => {
  const [allFarmers, setAllFarmers] = useState<Farmer[]>([]);
  const [salesInvoices, setSalesInvoices] = useState<CompleteSalesInvoice[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<CompletePurchaseInvoice[]>([]);
  const [cashBankTransactions, setCashBankTransactions] = useState<CashBankTransaction[]>([]);
  const [farmerDueBalances, setFarmerDueBalances] = useState<Map<string, number>>(new Map());

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: initialData || { // Set default values from initialData if provided
      transactionType: "Payment In",
      farmerId: undefined,
      amount: 0,
      paymentMethod: "Cash",
      remarks: "",
    },
  });

  const { watch, handleSubmit, setValue, reset, formState: { errors } } = form;
  const selectedFarmerId = watch("farmerId");

  // Load all necessary data from localStorage
  useEffect(() => {
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) setAllFarmers(JSON.parse(storedFarmers));

    const storedSalesInvoices = localStorage.getItem("salesInvoices");
    if (storedSalesInvoices) setSalesInvoices(JSON.parse(storedSalesInvoices));

    const storedPurchaseInvoices = localStorage.getItem("purchaseInvoices");
    if (storedPurchaseInvoices) setPurchaseInvoices(JSON.parse(storedPurchaseInvoices));

    const storedCashBankTransactions = localStorage.getItem("cashBankTransactions");
    if (storedCashBankTransactions) setCashBankTransactions(JSON.parse(storedCashBankTransactions));
  }, []);

  // Reset form fields when initialData changes (e.g., switching from add to edit, or clearing edit)
  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        transactionType: "Payment In",
        farmerId: undefined,
        amount: 0,
        paymentMethod: "Cash",
        remarks: "",
      });
    }
  }, [initialData, reset]);


  // Recalculate balances whenever dependencies change
  useEffect(() => {
    // Filter out the current transaction if in edit mode to avoid self-referencing in balance calculation
    const transactionsForBalance = initialData 
      ? cashBankTransactions.filter(t => t.id !== initialData.id) 
      : cashBankTransactions;

    const balances = calculateFarmerDueBalances(
      allFarmers,
      salesInvoices,
      purchaseInvoices,
      transactionsForBalance
    );
    setFarmerDueBalances(balances);
  }, [allFarmers, salesInvoices, purchaseInvoices, cashBankTransactions, initialData]);

  const selectedFarmer = useMemo(() => {
    return allFarmers.find(f => f.id === selectedFarmerId);
  }, [selectedFarmerId, allFarmers]);

  const currentFarmerDue = selectedFarmerId ? farmerDueBalances.get(selectedFarmerId) || 0 : 0;

  const onSubmit = (data: TransactionFormValues) => {
    if (!selectedFarmer) {
      showError("Please select a farmer.");
      return;
    }

    const transactionToSave: CashBankTransaction = {
      id: initialData?.id || `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, // Use existing ID if editing, otherwise generate new
      type: data.transactionType,
      farmerId: data.farmerId,
      farmerName: selectedFarmer.farmerName,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      remarks: data.remarks,
      date: initialData?.date || new Date().toLocaleDateString('en-CA'), // Keep original date/time if editing
      time: initialData?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    onSave(transactionToSave);
    showSuccess(`Transaction ${initialData ? "updated" : "recorded"} successfully!`);
    // No form.reset() here, as onSave will trigger a view change in parent
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the errors in the form.");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? "Edit Transaction" : "Record Payment"}</CardTitle>
        <CardDescription>
          {initialData ? `Editing transaction ID: ${initialData.id.substring(0, 8)}...` : "Add a new payment in or out transaction."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="transactionType">Transaction Type</Label>
            <RadioGroup
              onValueChange={(value: "Payment In" | "Payment Out") => setValue("transactionType", value, { shouldValidate: true })}
              value={watch("transactionType")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Payment In" id="payment-in" />
                <Label htmlFor="payment-in">Payment In</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Payment Out" id="payment-out" />
                <Label htmlFor="payment-out">Payment Out</Label>
              </div>
            </RadioGroup>
            {errors.transactionType && (
              <p className="text-red-500 text-sm">{errors.transactionType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmerId">Select Farmer</Label>
            <Select onValueChange={(value) => setValue("farmerId", value, { shouldValidate: true })} value={selectedFarmerId}>
              <SelectTrigger id="farmerId">
                <SelectValue placeholder="Select a farmer" />
              </SelectTrigger>
              <SelectContent>
                {allFarmers.map((farmer) => (
                  <SelectItem key={farmer.id} value={farmer.id}>
                    {farmer.farmerName} (ID: {farmer.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.farmerId && (
              <p className="text-red-500 text-sm">{errors.farmerId.message}</p>
            )}
          </div>

          {selectedFarmer && (
            <div className="flex justify-between items-center p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">Current Due Balance for {selectedFarmer.farmerName}:</p>
              <p className={`text-lg font-semibold ${currentFarmerDue >= 0 ? "text-red-600" : "text-green-600"}`}>
                ₹ {currentFarmerDue.toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" {...form.register("amount")} />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <RadioGroup
              onValueChange={(value: "Cash" | "Bank") => setValue("paymentMethod", value, { shouldValidate: true })}
              value={watch("paymentMethod")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cash" id="cash" />
                <Label htmlFor="cash">Cash</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Bank" id="bank" />
                <Label htmlFor="bank">Bank</Label>
              </div>
            </RadioGroup>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks (Optional)</Label>
            <Textarea id="remarks" placeholder="Add any notes here..." {...form.register("remarks")} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{initialData ? "Update Transaction" : "Record Transaction"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CashBankForm;