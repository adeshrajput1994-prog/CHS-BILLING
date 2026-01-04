"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Printer, Save, Check, ChevronsUpDown, Share2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger, } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, } from "@/components/ui/dialog";
import FarmersForm from "./FarmersForm"; // Import FarmersForm
import { getNextFarmerId } from "@/utils/idGenerators"; // Import ID generator
import { useCompany } from "@/context/CompanyContext"; // Import useCompany
import { Item as GlobalItem } from "./ItemForm"; // Import Item interface from ItemForm
import { usePrintSettings } from "@/hooks/use-print-settings"; // Import usePrintSettings
import { useFirestore } from "@/hooks/use-firestore"; // Import useFirestore hook

// Interfaces for Farmer and Item data from localStorage
interface Farmer {
  id: string;
  farmerName: string;
  fathersName: string;
  village: string;
  mobileNo: string;
  aadharCardNo: string;
  accountName: string;
  accountNo: string;
  ifscCode: string;
}

// Zod schema for a single item within the sales invoice
const salesInvoiceItemSchema = z.object({
  selectedItemId: z.string().min(1, { message: "Item is required." }),
  weight: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: "Weight must be a positive number." })
  ),
});

type SalesInvoiceItemFormValues = z.infer<typeof salesInvoiceItemSchema>;

interface SalesItem extends SalesInvoiceItemFormValues {
  uniqueId: string; // Unique ID for the item within this invoice
  itemName: string;
  rate: number;
  amount: number;
}

// Zod schema for the overall sales invoice form
const salesInvoiceSchema = z.object({
  selectedFarmerId: z.string().min(1, { message: "Farmer is required." }),
  advance: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Advance cannot be negative." })
  ),
});

type SalesInvoiceFormValues = z.infer<typeof salesInvoiceSchema>;

// Define a type for the complete Sales Invoice
export interface CompleteSalesInvoice {
  // Exported for use in parent components
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  invoiceTime: string;
  farmer: Farmer;
  items: SalesItem[];
  totalAmount: number;
  advance: number;
  due: number;
}

interface SalesInvoiceFormProps {
  initialData?: CompleteSalesInvoice | null;
  onSave: (invoice: CompleteSalesInvoice) => void;
  onCancel: () => void;
  currentInvoiceNo: string;
  currentInvoiceDate: string;
  currentInvoiceTime: string;
}

const SalesInvoiceForm: React.FC<SalesInvoiceFormProps> = ({
  initialData,
  onSave,
  onCancel,
  currentInvoiceNo,
  currentInvoiceDate,
  currentInvoiceTime,
}) => {
  const { selectedCompany } = useCompany(); // Use company context
  const { printInHindi } = usePrintSettings(); // Use print settings hook

  // Fetch data using useFirestore
  const { data: allFarmers, loading: loadingFarmers, addDocument: addFarmerDocument } = useFirestore<Farmer>('farmers');
  const { data: allItems, loading: loadingItems, updateDocument: updateItemDocument } = useFirestore<GlobalItem>('items');

  const [salesItems, setSalesItems] = useState<SalesItem[]>(initialData?.items || []);
  const [nextUniqueItemId, setNextUniqueItemId] = useState(
    initialData?.items
      ? Math.max(...initialData.items.map(item => parseInt(item.uniqueId.split('-')[2]))) + 1
      : 1
  );
  const [openFarmerSelect, setOpenFarmerSelect] = useState(false);
  const [isAddFarmerDialogOpen, setIsAddFarmerDialogOpen] = useState(false);

  const itemForm = useForm<SalesInvoiceItemFormValues>({
    resolver: zodResolver(salesInvoiceItemSchema),
    defaultValues: {
      selectedItemId: undefined,
      weight: 0,
    },
  });

  const salesForm = useForm<SalesInvoiceFormValues>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: initialData
      ? {
        selectedFarmerId: initialData.farmer.id,
        advance: Number(initialData.advance), // Ensure advance is number
      }
      : {
        selectedFarmerId: undefined,
        advance: 0,
      },
  });

  const selectedFarmerId = salesForm.watch("selectedFarmerId");
  const selectedFarmer = useMemo(() => {
    return allFarmers.find(f => f.id === selectedFarmerId);
  }, [selectedFarmerId, allFarmers]);

  const selectedItemForAdd = itemForm.watch("selectedItemId");
  const currentItemRate = useMemo(() => {
    const item = allItems.find(i => i.id === selectedItemForAdd);
    return item ? Number(item.ratePerKg) : 0;
  }, [selectedItemForAdd, allItems]);

  // Reset item form when initialData changes (e.g., switching from add to edit)
  useEffect(() => {
    if (initialData) {
      setSalesItems(initialData.items.map(item => ({
        ...item,
        weight: Number(item.weight),
        rate: Number(item.rate),
        amount: Number(item.amount),
      })));
      salesForm.reset({
        selectedFarmerId: initialData.farmer.id,
        advance: Number(initialData.advance),
      });
      setNextUniqueItemId(initialData.items.length > 0 ? Math.max(...initialData.items.map(item => parseInt(item.uniqueId.split('-')[2]))) + 1 : 1);
    } else {
      setSalesItems([]);
      salesForm.reset({
        selectedFarmerId: undefined,
        advance: 0,
      });
      setNextUniqueItemId(1);
    }
    itemForm.reset({
      selectedItemId: undefined,
      weight: 0,
    });
  }, [initialData, salesForm, itemForm]);

  const handleAddItem = (data: SalesInvoiceItemFormValues) => {
    try {
      console.log("SalesForm: handleAddItem called with data:", data);
      const itemDetails = allItems.find(item => item.id === data.selectedItemId);
      if (!itemDetails) {
        showError("Selected item not found.");
        console.error("SalesForm: Selected item not found for ID:", data.selectedItemId);
        return;
      }

      if (Number(itemDetails.stock) < Number(data.weight)) {
        showError(`Insufficient stock for ${itemDetails.itemName}. Available: ${Number(itemDetails.stock).toFixed(2)} KG`);
        return;
      }

      const amount = Number(data.weight) * Number(itemDetails.ratePerKg);
      const newItem: SalesItem = {
        uniqueId: `sales-item-${nextUniqueItemId}`,
        itemName: itemDetails.itemName,
        rate: Number(itemDetails.ratePerKg),
        amount: amount,
        selectedItemId: data.selectedItemId,
        weight: Number(data.weight),
      };

      setSalesItems((prevItems) => {
        const updatedItems = [...prevItems, newItem];
        console.log("SalesForm: Updated sales items:", updatedItems);
        return updatedItems;
      });
      setNextUniqueItemId((prevId) => prevId + 1);
      itemForm.reset({
        selectedItemId: undefined,
        weight: 0,
      }); // Reset item form
      showSuccess("Item added to invoice!");
    } catch (error) {
      console.error("SalesForm: Error in handleAddItem:", error);
      showError("An unexpected error occurred while adding the item.");
    }
  };

  const handleDeleteItem = (uniqueId: string) => {
    setSalesItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.uniqueId !== uniqueId);
      console.log("SalesForm: Items after deletion:", updatedItems);
      return updatedItems;
    });
    showSuccess("Item removed from invoice.");
  };

  const totalAmount = salesItems.reduce((sum, item) => sum + Number(item.amount), 0);
  const advanceAmount = Number(salesForm.watch("advance"));
  const dueAmount = totalAmount - advanceAmount;

  const updateItemStock = async (itemsToUpdate: SalesItem[], type: 'deduct' | 'add') => {
    for (const itemInInvoice of itemsToUpdate) {
      const storedItem = allItems.find(i => i.id === itemInInvoice.selectedItemId);
      if (storedItem) {
        const newStock = type === 'deduct'
          ? Number(storedItem.stock) - Number(itemInInvoice.weight)
          : Number(storedItem.stock) + Number(itemInInvoice.weight);
        await updateItemDocument(storedItem.id, { stock: newStock });
      } else {
        console.warn(`Item with ID ${itemInInvoice.selectedItemId} not found for stock update.`);
      }
    }
  };

  const onSubmitSalesInvoice = async (data: SalesInvoiceFormValues) => {
    try {
      console.log("SalesForm: Attempting to submit sales invoice with data:", data);
      if (!selectedFarmer) {
        showError("Please select a farmer.");
        console.error("SalesForm: No farmer selected.");
        return;
      }

      if (salesItems.length === 0) {
        showError("Please add at least one item to the invoice.");
        console.error("SalesForm: No items added to invoice.");
        return;
      }

      const completeInvoice: CompleteSalesInvoice = {
        id: initialData?.id || currentInvoiceNo, // Use existing ID if editing, otherwise new one
        invoiceNo: currentInvoiceNo,
        invoiceDate: currentInvoiceDate,
        invoiceTime: currentInvoiceTime,
        farmer: selectedFarmer,
        items: salesItems,
        totalAmount: totalAmount,
        advance: advanceAmount,
        due: dueAmount,
      };

      // Handle stock update
      if (initialData) {
        // If editing, first revert stock for old items, then deduct for new items
        const oldItems = initialData.items;
        await updateItemStock(oldItems, 'add'); // Add back old items' stock
        await updateItemStock(salesItems, 'deduct'); // Deduct new items' stock
      } else {
        // If adding new invoice, just deduct stock
        await updateItemStock(salesItems, 'deduct');
      }

      onSave(completeInvoice);
      showSuccess(`Sales Invoice ${initialData ? "updated" : "created"} successfully!`);
      onCancel(); // Go back to list view
    } catch (error) {
      console.error("SalesForm: Error in onSubmitSalesInvoice:", error);
      showError("An unexpected error occurred while creating the invoice.");
    }
  };

  const onErrorItemForm = (errors: any) => {
    console.error("SalesForm: Item form validation errors:", errors);
    showError("Please correct the item details.");
  };

  const onErrorSalesForm = (errors: any) => {
    console.error("SalesForm: Sales form validation errors:", errors);
    showError("Please correct the invoice details.");
  };

  const handlePrint = () => {
    document.body.classList.add('print-mode');
    window.print();
    document.body.classList.remove('print-mode');
  };

  const handleWhatsAppShare = () => {
    if (!selectedFarmer || !selectedFarmer.mobileNo) {
      showError("Please select a farmer with a mobile number to share via WhatsApp.");
      return;
    }

    if (salesItems.length === 0) {
      showError("Please add items to the invoice before sharing.");
      return;
    }

    const message =
      `*Sales Invoice Details*\n\n` +
      `*Invoice No:* ${currentInvoiceNo}\n` +
      `*Date:* ${currentInvoiceDate}\n` +
      `*Time:* ${currentInvoiceTime}\n` +
      `*Farmer:* ${selectedFarmer.farmerName} (ID: ${selectedFarmer.id})\n` +
      `*Village:* ${selectedFarmer.village}\n\n` +
      `*Items:*\n` +
      salesItems.map((item, index) =>
        `${index + 1}. ${item.itemName} - ${Number(item.weight).toFixed(2)} KG @ ₹${Number(item.rate).toFixed(2)}/KG = ₹${Number(item.amount).toFixed(2)}`
      ).join('\n') +
      `\n\n*Total Amount:* ₹${totalAmount.toFixed(2)}\n` +
      `*Advance Paid:* ₹${advanceAmount.toFixed(2)}\n` +
      `*Due Amount:* ₹${dueAmount.toFixed(2)}\n\n` +
      `Thank you for your business!`;

    const whatsappUrl = `https://wa.me/${selectedFarmer.mobileNo}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleQuickAddFarmerSave = async (newFarmerData: Omit<Farmer, 'id'>) => {
    const newId = getNextFarmerId(allFarmers); // Still use local ID generator for consistency
    const farmerWithId = { ...newFarmerData, id: newId };
    const addedDocId = await addFarmerDocument(farmerWithId); // Add to Firestore

    if (addedDocId) {
      salesForm.setValue("selectedFarmerId", newId, { shouldValidate: true }); // Select the newly added farmer
      setIsAddFarmerDialogOpen(false); // Close the dialog
      showSuccess(`Farmer ${newFarmerData.farmerName} added and selected!`);
    }
  };

  const handleQuickAddFarmerCancel = () => {
    setIsAddFarmerDialogOpen(false); // Close the dialog
  };

  const t = (english: string, hindi: string) => (printInHindi ? hindi : english);

  if (loadingFarmers || loadingItems) {
    return <div className="text-center py-8 text-lg">Loading farmers and items...</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-end items-center space-x-2 print-hide mb-4">
        <Button variant="outline" onClick={() => console.log("Save functionality not implemented yet.")}>
          <Save className="mr-2 h-4 w-4" /> {t("Save", "सहेजें")}
        </Button>
        <Button onClick={handleWhatsAppShare} variant="outline" disabled={!selectedFarmer || salesItems.length === 0}>
          <Share2 className="mr-2 h-4 w-4" /> WhatsApp
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> {t("Print", "प्रिंट करें")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("Cancel", "रद्द करें")}
        </Button>
      </div>

      <form onSubmit={salesForm.handleSubmit(onSubmitSalesInvoice, onErrorSalesForm)} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-extrabold mb-2">{selectedCompany?.name || t("COMPANY NAME", "कंपनी का नाम")}</h2>
          <p className="text-md text-muted-foreground">{selectedCompany?.address || t("COMPANY ADDRESS", "कंपनी का पता")}</p>
        </div>

        {/* Invoice Details & Farmer Selection */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label htmlFor="invoiceNo" className="text-right">{t("INVOICE NO", "चालान संख्या")}</Label>
              <Input id="invoiceNo" value={currentInvoiceNo} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="farmerId" className="text-right">{t("FARMER ID", "किसान आईडी")}</Label>
              <Input id="farmerId" value={selectedFarmer?.id || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="farmerNameDisplay" className="text-right">{t("FARMER", "किसान")}</Label>
              <div className="flex items-center space-x-2 print-hide">
                <Popover open={openFarmerSelect} onOpenChange={setOpenFarmerSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFarmerSelect}
                      className="w-full justify-between"
                    >
                      {selectedFarmer ? selectedFarmer.farmerName : t("Select farmer...", "किसान चुनें...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder={t("Search farmer...", "किसान खोजें...")} />
                      <CommandEmpty>{t("No farmer found.", "कोई किसान नहीं मिला।")}</CommandEmpty>
                      <CommandGroup>
                        {allFarmers.map((farmer) => (
                          <CommandItem
                            key={farmer.id}
                            value={`${farmer.farmerName} ${farmer.id} ${farmer.mobileNo}`}
                            onSelect={() => {
                              salesForm.setValue("selectedFarmerId", farmer.id, { shouldValidate: true });
                              setOpenFarmerSelect(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedFarmerId === farmer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {farmer.farmerName} (ID: {farmer.id})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>

                <Dialog open={isAddFarmerDialogOpen} onOpenChange={setIsAddFarmerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0">
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">{t("Add New Farmer", "नया किसान जोड़ें")}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>{t("Add New Farmer", "नया किसान जोड़ें")}</DialogTitle>
                      <DialogDescription>
                        {t("Fill in the details to add a new farmer.", "नया किसान जोड़ने के लिए विवरण भरें।")}
                      </DialogDescription>
                    </DialogHeader>
                    <FarmersForm onSave={handleQuickAddFarmerSave} onCancel={handleQuickAddFarmerCancel} />
                  </DialogContent>
                </Dialog>
              </div>
              {/* Display selected farmer name for print */}
              <Input
                id="farmerNameDisplayPrint"
                value={selectedFarmer?.farmerName || ""}
                readOnly
                disabled
                className="bg-gray-100 dark:bg-gray-800 print-only"
              />
              {salesForm.formState.errors.selectedFarmerId && (
                <p className="text-red-500 text-sm col-span-2 text-right print-hide">
                  {salesForm.formState.errors.selectedFarmerId.message}
                </p>
              )}

              <Label htmlFor="village" className="text-right">{t("VILLAGE", "गाँव")}</Label>
              <Input id="village" value={selectedFarmer?.village || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="accountName" className="text-right">{t("ACCOUNT NAME", "खाता नाम")}</Label>
              <Input id="accountName" value={selectedFarmer?.accountName || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="accountNo" className="text-right">{t("ACCOUNT NO", "खाता संख्या")}</Label>
              <Input id="accountNo" value={selectedFarmer?.accountNo || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="ifscCode" className="text-right">{t("IFSC", "आईएफएससी")}</Label>
              <Input id="ifscCode" value={selectedFarmer?.ifscCode || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              {/* Right column fields */}
              <div className="col-start-2 row-start-1 flex items-center space-x-2">
                <Label htmlFor="invoiceDate" className="w-1/2 text-right">{t("DATE", "दिनांक")}</Label>
                <Input id="invoiceDate" value={currentInvoiceDate} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-2 flex items-center space-x-2">
                <Label htmlFor="fathersName" className="w-1/2 text-right">{t("FATHER", "पिता")}</Label>
                <Input id="fathersName" value={selectedFarmer?.fathersName || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-3 flex items-center space-x-2">
                <Label htmlFor="mobileNo" className="w-1/2 text-right">{t("MOBILE NO", "मोबाइल नंबर")}</Label>
                <Input id="mobileNo" value={selectedFarmer?.mobileNo || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-4 flex items-center space-x-2">
                <Label htmlFor="invoiceTime" className="w-1/2 text-right">{t("TIME", "समय")}</Label>
                <Input id="invoiceTime" value={currentInvoiceTime} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-5 flex items-center space-x-2">
                <Label htmlFor="bank" className="w-1/2 text-right">{t("BANK", "बैंक")}</Label>
                <Input id="bank" value={selectedFarmer?.accountName || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" /> {/* Assuming bank name is account name */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Section */}
        <Card className="print-hide">
          <CardHeader>
            <CardTitle>{t("Add Items", "आइटम जोड़ें")}</CardTitle>
            <CardDescription>{t("Enter item details to add to the invoice.", "चालान में जोड़ने के लिए आइटम विवरण दर्ज करें।")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={itemForm.handleSubmit(handleAddItem, onErrorItemForm)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selectedItemId">{t("ITEM", "आइटम")}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedItemForAdd
                          ? allItems.find((item) => item.id === selectedItemForAdd)?.itemName
                          : t("Select item...", "आइटम चुनें...")}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder={t("Search item...", "आइटम खोजें...")} />
                        <CommandEmpty>{t("No item found.", "कोई आइटम नहीं मिला।")}</CommandEmpty>
                        <CommandGroup>
                          {allItems.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={item.itemName}
                              onSelect={() => {
                                itemForm.setValue("selectedItemId", item.id, { shouldValidate: true });
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedItemForAdd === item.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.itemName} (₹{Number(item.ratePerKg).toFixed(2)}/KG, Stock: {Number(item.stock).toFixed(2)} KG)
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {itemForm.formState.errors.selectedItemId && (
                    <p className="text-red-500 text-sm">{itemForm.formState.errors.selectedItemId.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t("WEIGHT (KG)", "वजन (KG)")}</Label>
                  <Input id="weight" type="number" step="0.01" placeholder="0.00" {...itemForm.register("weight")} />
                  {itemForm.formState.errors.weight && (
                    <p className="text-red-500 text-sm">{itemForm.formState.errors.weight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ratePerKgDisplay">{t("RATE", "दर")}</Label>
                  <Input id="ratePerKgDisplay" value={currentItemRate.toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountDisplay">{t("AMOUNT", "राशि")}</Label>
                  <Input id="amountDisplay" value={(Number(itemForm.watch("weight")) * currentItemRate).toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
              <Button type="button" onClick={itemForm.handleSubmit(handleAddItem, onErrorItemForm)} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> {t("Add Item", "आइटम जोड़ें")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader className="print-hide">
            <CardTitle>{t("Sales Items", "बिक्री के आइटम")}</CardTitle>
            <CardDescription>{t("List of items in this sales invoice.", "इस बिक्री चालान में आइटमों की सूची।")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{t("S.No", "क्र.सं.")}</TableHead>
                    <TableHead>{t("ITEM", "आइटम")}</TableHead>
                    <TableHead>{t("WEIGHT", "वजन")}</TableHead>
                    <TableHead>{t("RATE", "दर")}</TableHead>
                    <TableHead className="text-right">{t("AMOUNT", "राशि")}</TableHead>
                    <TableHead className="text-center print-hide">{t("Actions", "कार्यवाई")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        {t("No items added yet.", "अभी तक कोई आइटम नहीं जोड़ा गया है।")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesItems.map((item, index) => (
                      <TableRow key={item.uniqueId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{Number(item.weight).toFixed(2)} KG</TableCell>
                        <TableCell>₹ {Number(item.rate).toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹ {Number(item.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-center print-hide">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.uniqueId)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">{t("Delete", "हटाएँ")}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Summary & Actions */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label className="text-right font-medium">{t("TOTAL AMOUNT", "कुल राशि")}</Label>
              <Input value={`₹ ${totalAmount.toFixed(2)}`} readOnly disabled className="bg-gray-100 dark:bg-gray-800 text-lg font-semibold" />

              <Label htmlFor="advance" className="text-right font-medium print-hide">{t("ADVANCE", "अग्रिम")}</Label>
              <Input id="advance" type="number" step="0.01" placeholder="0.00" {...salesForm.register("advance")} className="print-hide" />
              {salesForm.formState.errors.advance && (
                <p className="text-red-500 text-sm col-span-2 text-right print-hide">
                  {salesForm.formState.errors.advance.message}
                </p>
              )}

              <Label className="text-right font-bold">{t("DUE", "देय")}</Label>
              <Input value={`₹ ${dueAmount.toFixed(2)}`} readOnly disabled className={`bg-gray-100 dark:bg-gray-800 text-2xl font-bold ${dueAmount > 0 ? "text-green-600" : "text-red-600"}`} />
            </div>
            <Button type="submit" className="w-full mt-6 print-hide">
              {initialData ? t("Update Sales Invoice", "बिक्री चालान अपडेट करें") : t("Create Sales Invoice", "बिक्री चालान बनाएँ")}
            </Button>
          </CardContent>
        </Card>

        {/* Signatures */}
        <div className="flex justify-between mt-8 pt-8 border-t border-dashed">
          <div className="text-center">
            <p className="font-semibold">{t("FARMER SIGN", "किसान के हस्ताक्षर")}</p>
            <div className="w-48 h-16 border-b border-gray-400 mt-4"></div>
          </div>
          <div className="text-center">
            <p className="font-semibold">{t("MANGER SIGN", "प्रबंधक के हस्ताक्षर")}</p>
            <div className="w-48 h-16 border-b border-gray-400 mt-4"></div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalesInvoiceForm;