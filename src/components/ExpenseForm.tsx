"use client";

import React, { useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { usePrintSettings } from "@/hooks/use-print-settings";
import { useCompany } from "@/context/CompanyContext";
import { getNextExpenseId } from "@/utils/idGenerators";
import { useFirestore } from "@/hooks/use-firestore";

// Define the Expense interface
export interface Expense {
  id: string;
  type: string; // e.g., "Chai Pani", "Freight", "Labour", "Oil", "Cash In (Bank/Home)", "Cash Out (Bank/Home)"
  amount: number;
  date: string;
  time: string;
  paymentMethod: "Cash" | "Bank" | "N/A"; // N/A for Cash In (Bank/Home)
  remarks?: string;
  companyId: string;
}

// Zod schema for expense form
const expenseSchema = z.object({
  expenseCategory: z.string().min(1, { message: "Expense category is required." }),
  customExpenseType: z.string().optional(), // For 'Other' category
  amount: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Amount must be a positive number." })
  ),
  paymentMethod: z.enum(["Cash", "Bank", "N/A"], {
    required_error: "Payment method is required.",
  }),
  remarks: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: Expense | null;
  onSave: (expense: Omit<Expense, 'id'> & { id?: string }) => void;
  onCancel: () => void;
}

const commonExpenseTypes = [
  "Chai Pani",
  "Freight",
  "Labour",
  "Oil",
  "Electricity Bill",
  "Rent",
  "Salaries",
  "Repairs & Maintenance",
  "Office Supplies",
  "Travel",
  "Other",
];

const cashManagementTypes = [
  "Cash In (Bank/Home)",
  "Cash Out (Bank/Home)",
];

const ExpenseForm: React.FC<ExpenseFormProps> = ({ initialData, onSave, onCancel }) => {
  const { printInHindi } = usePrintSettings();
  const { getCurrentCompanyId } = useCompany();
  const currentCompanyId = getCurrentCompanyId();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: initialData
      ? {
          expenseCategory: commonExpenseTypes.includes(initialData.type) || cashManagementTypes.includes(initialData.type) ? initialData.type : "Other",
          customExpenseType: commonExpenseTypes.includes(initialData.type) || cashManagementTypes.includes(initialData.type) ? "" : initialData.type,
          amount: Number(initialData.amount),
          paymentMethod: initialData.paymentMethod,
          remarks: initialData.remarks,
        }
      : {
          expenseCategory: "Chai Pani",
          customExpenseType: "",
          amount: 0,
          paymentMethod: "Cash",
          remarks: "",
        },
  });

  const { watch, handleSubmit, setValue, reset, formState: { errors } } = form;
  const expenseCategory = watch("expenseCategory");

  useEffect(() => {
    if (initialData) {
      reset({
        expenseCategory: commonExpenseTypes.includes(initialData.type) || cashManagementTypes.includes(initialData.type) ? initialData.type : "Other",
        customExpenseType: commonExpenseTypes.includes(initialData.type) || cashManagementTypes.includes(initialData.type) ? "" : initialData.type,
        amount: Number(initialData.amount),
        paymentMethod: initialData.paymentMethod,
        remarks: initialData.remarks,
      });
    } else {
      reset({
        expenseCategory: "Chai Pani",
        customExpenseType: "",
        amount: 0,
        paymentMethod: "Cash",
        remarks: "",
      });
    }
  }, [initialData, reset]);

  // Adjust payment method options based on expense category
  useEffect(() => {
    if (expenseCategory === "Cash In (Bank/Home)") {
      setValue("paymentMethod", "N/A");
    } else if (watch("paymentMethod") === "N/A") {
      setValue("paymentMethod", "Cash");
    }
  }, [expenseCategory, setValue, watch]);

  const onSubmit = (data: ExpenseFormValues) => {
    if (!currentCompanyId) {
      showError("Please select a company before recording expenses.");
      return;
    }

    const expenseType = data.expenseCategory === "Other" ? data.customExpenseType : data.expenseCategory;
    if (!expenseType) {
      showError("Please specify the custom expense type.");
      return;
    }

    const baseExpense = {
      type: expenseType,
      amount: Number(data.amount),
      date: initialData?.date || new Date().toLocaleDateString('en-CA'),
      time: initialData?.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      paymentMethod: data.paymentMethod,
      remarks: data.remarks,
      companyId: currentCompanyId,
    };

    const expenseToSave = initialData
      ? { ...baseExpense, id: initialData.id }
      : baseExpense;

    onSave(expenseToSave);
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the errors in the form.");
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? t("Edit Expense/Cash Entry", "खर्च/नकद प्रविष्टि संपादित करें") : t("Record New Expense/Cash Entry", "नया खर्च/नकद प्रविष्टि दर्ज करें")}</CardTitle>
        <CardDescription>
          {initialData ? t(`Editing entry ID: ${initialData.id}`, `प्रविष्टि आईडी संपादित कर रहा है: ${initialData.id}`) : t("Add a new company expense or manage cash flow.", "एक नया कंपनी खर्च जोड़ें या नकद प्रवाह प्रबंधित करें।")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
          {initialData && (
            <div className="space-y-2">
              <Label htmlFor="expenseIdDisplay">{t("Entry ID", "प्रविष्टि आईडी")}</Label>
              <Input id="expenseIdDisplay" value={initialData.id} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
            </div>
          )}
          {!currentCompanyId && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-red-600 text-sm">⚠️ {t("Please select a company first before recording expenses.", "खर्च दर्ज करने से पहले कृपया एक कंपनी चुनें।")}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expenseCategory">{t("Type", "प्रकार")}</Label>
            <Select onValueChange={(value) => {
              setValue("expenseCategory", value, { shouldValidate: true });
              if (value !== "Other") {
                setValue("customExpenseType", "");
              }
            }} value={expenseCategory}>
              <SelectTrigger id="expenseCategory">
                <SelectValue placeholder={t("Select expense type or cash management", "खर्च का प्रकार या नकद प्रबंधन चुनें")} />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>{t("Company Expenses", "कंपनी के खर्च")}</SelectLabel>
                  {commonExpenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(type, type === "Chai Pani" ? "चाय पानी" : type === "Freight" ? "फ्रेट" : type === "Labour" ? "लेबर" : type === "Oil" ? "तेल" : type === "Electricity Bill" ? "बिजली का बिल" : type === "Rent" ? "किराया" : type === "Salaries" ? "वेतन" : type === "Repairs & Maintenance" ? "मरम्मत और रखरखाव" : type === "Office Supplies" ? "कार्यालय की आपूर्ति" : type === "Travel" ? "यात्रा" : "अन्य")}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>{t("Cash Management", "नकद प्रबंधन")}</SelectLabel>
                  {cashManagementTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(type, type === "Cash In (Bank/Home)" ? "नकद अंदर (बैंक/घर)" : "नकद बाहर (बैंक/घर)")}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.expenseCategory && (
              <p className="text-red-500 text-sm">{errors.expenseCategory.message}</p>
            )}
          </div>

          {expenseCategory === "Other" && (
            <div className="space-y-2">
              <Label htmlFor="customExpenseType">{t("Custom Expense Type", "कस्टम खर्च का प्रकार")}</Label>
              <Input id="customExpenseType" placeholder={t("e.g., Marketing Expenses", "उदाहरण: मार्केटिंग खर्च")} {...form.register("customExpenseType")} />
              {errors.customExpenseType && (
                <p className="text-red-500 text-sm">{errors.customExpenseType.message}</p>
              )}
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
              onValueChange={(value: "Cash" | "Bank" | "N/A") => setValue("paymentMethod", value, { shouldValidate: true })}
              value={watch("paymentMethod")}
              className="flex space-x-4"
              disabled={expenseCategory === "Cash In (Bank/Home)"}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Cash" id="cash" />
                <Label htmlFor="cash">{t("Cash", "नकद")}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Bank" id="bank" />
                <Label htmlFor="bank">{t("Bank", "बैंक")}</Label>
              </div>
              {expenseCategory === "Cash In (Bank/Home)" && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="N/A" id="n/a" />
                  <Label htmlFor="n/a">{t("N/A", "लागू नहीं")}</Label>
                </div>
              )}
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
            <Button type="submit" disabled={!currentCompanyId}>
              {initialData ? t("Update Entry", "प्रविष्टि अपडेट करें") : t("Record Entry", "प्रविष्टि दर्ज करें")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ExpenseForm;