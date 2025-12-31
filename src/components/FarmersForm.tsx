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

// Define the Zod schema for farmer details
const farmerSchema = z.object({
  farmerName: z.string().min(1, { message: "Farmer Name is required." }),
  fathersName: z.string().optional(), // Made optional
  village: z.string().min(1, { message: "Village is required." }),
  mobileNo: z.string()
    .optional() // Made optional
    .refine((val) => !val || /^\d{10}$/.test(val), { message: "Mobile No. must be 10 digits if provided." }),
  aadharCardNo: z.string()
    .optional() // Made optional
    .refine((val) => !val || /^\d{12}$/.test(val), { message: "Aadhar Card No. must be 12 digits if provided." }),
  accountName: z.string().optional(), // Made optional
  accountNo: z.string()
    .optional() // Made optional
    .refine((val) => !val || /^\d{9,18}$/.test(val), { message: "Account No. must be between 9 and 18 digits if provided." }),
  ifscCode: z.string()
    .optional() // Made optional
    .refine((val) => !val || /^[A-Z]{4}0[A-Z0-9]{6}$/.test(val), { message: "Invalid IFSC Code format if provided." }),
});

type FarmerFormValues = z.infer<typeof farmerSchema>;

interface Farmer {
  id: string;
  farmerName: string;
  fathersName?: string; // Made optional
  village: string;
  mobileNo?: string; // Made optional
  aadharCardNo?: string; // Made optional
  accountName?: string; // Made optional
  accountNo?: string; // Made optional
  ifscCode?: string; // Made optional
}

interface FarmersFormProps {
  initialData?: Farmer | null;
  onSave: (farmer: FarmerFormValues & { id?: string }) => void; // id is optional for new farmers
  onCancel: () => void;
}

const FarmersForm: React.FC<FarmersFormProps> = ({ initialData, onSave, onCancel }) => {
  const form = useForm<FarmerFormValues>({
    resolver: zodResolver(farmerSchema),
    defaultValues: initialData || {
      farmerName: "",
      fathersName: "",
      village: "",
      mobileNo: "",
      aadharCardNo: "",
      accountName: "",
      accountNo: "",
      ifscCode: "",
    },
  });

  // Reset form fields when initialData changes (e.g., switching from add to edit, or clearing edit)
  React.useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        farmerName: "",
        fathersName: "",
        village: "",
        mobileNo: "",
        aadharCardNo: "",
        accountName: "",
        accountNo: "",
        ifscCode: "",
      });
    }
  }, [initialData, form]);

  const onSubmit = (data: FarmerFormValues) => {
    // If initialData exists, we are editing, so include the existing ID
    const farmerToSave = initialData ? { ...data, id: initialData.id } : data;
    onSave(farmerToSave);
    showSuccess(`Farmer ${initialData ? "updated" : "added"} successfully!`);
  };

  const onError = (errors: any) => {
    console.error("Form validation errors:", errors);
    showError("Please correct the errors in the form.");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{initialData ? "Edit Farmer Details" : "Add New Farmer"}</CardTitle>
        <CardDescription>
          {initialData ? `Editing details for Farmer ID: ${initialData.id}` : "Enter the billing information for your farmer."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
          {initialData && ( // Only show Farmer ID field if editing
            <div className="space-y-2">
              <Label htmlFor="farmerId">Farmer ID</Label>
              <Input id="farmerId" value={initialData.id} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="farmerName">Farmer Name</Label>
            <Input id="farmerName" placeholder="Farmer Name" {...form.register("farmerName")} />
            {form.formState.errors.farmerName && (
              <p className="text-red-500 text-sm">{form.formState.errors.farmerName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fathersName">Father's Name (Optional)</Label>
            <Input id="fathersName" placeholder="Father's Name" {...form.register("fathersName")} />
            {form.formState.errors.fathersName && (
              <p className="text-red-500 text-sm">{form.formState.errors.fathersName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="village">Village</Label>
            <Input id="village" placeholder="Village" {...form.register("village")} />
            {form.formState.errors.village && (
              <p className="text-red-500 text-sm">{form.formState.errors.village.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobileNo">Mobile No. (Optional)</Label>
            <Input id="mobileNo" placeholder="Mobile No." type="tel" {...form.register("mobileNo")} />
            {form.formState.errors.mobileNo && (
              <p className="text-red-500 text-sm">{form.formState.errors.mobileNo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="aadharCardNo">Aadhar Card No. (Optional)</Label>
            <Input id="aadharCardNo" placeholder="Aadhar Card No." {...form.register("aadharCardNo")} />
            {form.formState.errors.aadharCardNo && (
              <p className="text-red-500 text-sm">{form.formState.errors.aadharCardNo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Name (Optional)</Label>
            <Input id="accountName" placeholder="Account Name" {...form.register("accountName")} />
            {form.formState.errors.accountName && (
              <p className="text-red-500 text-sm">{form.formState.errors.accountName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountNo">Account No. (Optional)</Label>
            <Input id="accountNo" placeholder="Account No." {...form.register("accountNo")} />
            {form.formState.errors.accountNo && (
              <p className="text-red-500 text-sm">{form.formState.errors.accountNo.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ifscCode">IFSC Code (Optional)</Label>
            <Input id="ifscCode" placeholder="IFSC Code" {...form.register("ifscCode")} />
            {form.formState.errors.ifscCode && (
              <p className="text-red-500 text-sm">{form.formState.errors.ifscCode.message}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">{initialData ? "Update Farmer Details" : "Save Farmer Details"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default FarmersForm;