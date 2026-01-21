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
import { Share2 } from "lucide-react"; // Import Share2 icon
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook
import { useCompany } from "@/context/CompanyContext"; // Import useCompany

interface Farmer {
  id: string;
  farmerName: string;
  mobileNo?: string; // Added mobileNo for WhatsApp sharing
  companyId: string;
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
  onSave: (transaction: Omit<CashBankTransaction, 'id'> & { id?: string }) => void; // Modified onSave signature
  onCancel: () => void;
}

const CashBankForm: React.FC<CashBankFormProps> = ({ initialData, onSave, onCancel }) => {
  const { printInHindi } = usePrintSettings(); // Use print settings hook
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();
  
  // Pass currentCompanyId to useFirestore
  const { data: allFarmers, loading: loadingFarmers } = useFirestore<Farmer>('farmers', currentCompanyId);
  const { data: salesInvoices, loading: loadingSales } = useFirestore<CompleteSalesInvoice>('salesInvoices', currentCompanyId);
  const { data: purchaseInvoices, loading: loadingPurchases } = useFirestore<CompletePurchaseInvoice>('purchaseInvoices', currentCompanyId);
  const { data: cashBankTransactions, loading: loadingCashBank } = useFirestore<CashBankTransaction>('cashBankTransactions', currentCompanyId);

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

  // Reset form fields when initialData changes (e.g., switching from add to edit, or clearing edit)
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        amount: Number(initialData.amount), // Ensure amount is number
      });
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

    const baseTransaction = {
      type: data.transactionType,
      farmerId: data.farmerId,
      farmerName: selectedFarmer.farmerName,
      amount: Number(data.amount), // Ensure amount is number
      paymentMethod: data.paymentMethod,
      remarks: data.remarks,
      date: initialData?.date || new Date().toLocaleDateString('en-CA'), // Keep original date/time if editing
      time: initialData?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      companyId: currentCompanyId || '', // Ensure companyId is passed
    };

    const transactionToSave = initialData
      ? { ...baseTransaction, id: initialData.id } // If editing, include the existing ID
      : baseTransaction; // If adding, omit the ID

    onSave(transactionToSave);
    // No form.reset() here, as onSave will trigger a view change in parent
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the errors in the form.");
  };

  const handleWhatsAppShare = () => {
    if (!selectedFarmer || !selectedFarmer.mobileNo) {
      showError("Please select a farmer with a mobile number to share via WhatsApp.");
      return;
    }

    const transactionData = initialData || form.getValues(); // Use initialData if editing, otherwise current form values
    const farmerName = selectedFarmer.farmerName;
    const transactionType = transactionData.transactionType;
    const amount = Number(transactionData.amount); // Ensure amount is number
    const paymentMethod = transactionData.paymentMethod;
    const remarks = transactionData.remarks || "N/A";
    const date = initialData?.date || new Date().toLocaleDateString('en-GB');
    const time = initialData?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const message = `*Cash/Bank Transaction Details*\n\n` +
                    `*Date:* ${date}\n` +
                    `*Time:* ${time}\n` +
                    `*Farmer:* ${farmerName} (ID: ${selectedFarmer.id})\n` +
                    `*Type:* ${transactionType}\n` +
                    `*Amount:* ₹${amount.toFixed(2)}\n` +
                    `*Method:* ${paymentMethod}\n` +
                    `*Remarks:* ${remarks}\n\n` +
                    `Current Due Balance for ${farmerName}: ₹${currentFarmerDue.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/${selectedFarmer.mobileNo}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (loadingFarmers || loadingSales || loadingPurchases || loadingCashBank) {
    return <div className="text-center py-8 text-lg">Loading dependent data...</div>;
  }

  if (!currentCompanyId) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">{t("Record Payment", "भुगतान दर्ज करें")}</CardTitle>
          <CardDescription>{t("Add a new payment in or out transaction.", "नया भुगतान अंदर या बाहर लेनदेन जोड़ें।")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-600 text-sm">⚠️ Please select a company first before recording transactions.</p>
          </div>
          <div className="flex justify-end space-x-2 print-hide mt-4">
            <Button type="button" variant="outline" onClick={onCancel}>{t("Cancel", "रद्द करें")}</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? t("Edit Transaction", "लेनदेन संपादित करें") : t("Record Payment", "भुगतान दर्ज करें")}</CardTitle>
        <CardDescription>
          {initialData ? t(`Editing transaction ID: ${initialData.id.substring(0, 8)}...`, `लेनदेन आईडी संपादित कर रहा है: ${initialData.id.substring(0, 8)}...`) : t("Add a new payment in or out transaction.", "नया भुगतान अंदर या बाहर लेनदेन जोड़ें।")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="transactionType">{t("Transaction Type", "लेनदेन का प्रकार")}</Label>
            <RadioGroup
              onValueChange={(value: "Payment In" | "Payment Out") => setValue("transactionType", value, { shouldValidate: true })}
              value={watch("transactionType")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Payment In" id="payment-in" />
                <Label htmlFor="payment-in">{t("Payment In", "भुगतान अंदर")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Payment Out" id="payment-out" />
                <Label htmlFor="payment-out">{t("Payment Out", "भुगतान बाहर")}</Label>
              </div>
            </RadioGroup>
            {errors.transactionType && (
              <p className="text-red-500 text-sm">{errors.transactionType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="farmerId">{t("Select Farmer", "किसान चुनें")}</Label>
            <Select onValueChange={(value) => setValue("farmerId", value, { shouldValidate: true })} value={selectedFarmerId}>
              <SelectTrigger id="farmerId">
                <SelectValue placeholder={t("Select a farmer", "एक किसान चुनें")} />
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
              <p className="text-sm font-medium">{t(`Current Due Balance for ${selectedFarmer.farmerName}:`, `${selectedFarmer.farmerName} के लिए वर्तमान देय शेष:`)}</p>
              <p className={`text-lg font-semibold ${currentFarmerDue > 0 ? "text-green-600" : "text-red-600"}`}>
                ₹ {currentFarmerDue.toFixed(2)}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">{t("Amount", "राशि")}</Label>
            <Input id="amount" type="number" step="0.01" placeholder="0.00" {...form.register("amount")} />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">{t("Payment Method", "भुगतान विधि")}</Label>
            <RadioGroup
              onValueChange={(value: "Cash" | "Bank") => setValue("paymentMethod", value, { shouldValidate: true })}
              value={watch("paymentMethod")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cash" id="cash" />
                <Label htmlFor="cash">{t("Cash", "नकद")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Bank" id="bank" />
                <Label htmlFor="bank">{t("Bank", "बैंक")}</Label>
              </div>
            </RadioGroup>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm">{errors.paymentMethod.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="remarks">{t("Remarks (Optional)", "टिप्पणियाँ (वैकल्पिक)")}</Label>
            <Textarea id="remarks" placeholder={t("Add any notes here...", "यहां कोई भी नोट जोड़ें...")} {...form.register("remarks")} />
          </div>

          <div className="flex justify-end space-x-2 print-hide">
            <Button type="button" variant="outline" onClick={onCancel}>{t("Cancel", "रद्द करें")}</Button>
            <Button type="submit">{initialData ? t("Update Transaction", "लेनदेन अपडेट करें") : t("Record Transaction", "लेनदेन दर्ज करें")}</Button>
            {initialData && ( // Only show WhatsApp button if editing/viewing an existing transaction
              <Button type="button" onClick={handleWhatsAppShare} variant="outline" disabled={!selectedFarmer || !selectedFarmer.mobileNo}>
                <Share2 className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CashBankForm;