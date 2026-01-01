"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Printer, Check, ChevronsUpDown, Share2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem,} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,} from "@/components/ui/dialog";
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
  aadharCardNo: string; // Not displayed but part of data
  accountName: string;
  accountNo: string;
  ifscCode: string;
}

// Zod schema for a single item within the purchase invoice
const purchaseInvoiceItemSchema = z.object({
  selectedItemId: z.string().min(1, { message: "Item is required." }),
  grossWeight: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Gross Weight cannot be negative." })
  ),
  tareWeight: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Tare Weight cannot be negative." })
  ),
  mudDeduction: z.preprocess(
    (val) => Number(val),
    z.number().min(0).max(100, { message: "Mud Deduction must be between 0 and 100." })
  ),
});

type PurchaseInvoiceItemFormValues = z.infer<typeof purchaseInvoiceItemSchema>;

interface PurchaseItem extends PurchaseInvoiceItemFormValues {
  uniqueId: string; // Unique ID for the item within this invoice
  itemName: string;
  rate: number;
  netWeight: number;
  finalWeight: number;
  amount: number;
}

// Zod schema for the overall purchase invoice form
const purchaseInvoiceSchema = z.object({
  selectedFarmerId: z.string().min(1, { message: "Farmer is required." }),
  advance: z.preprocess(
    (val) => Number(val),
    z.number().min(0, { message: "Advance cannot be negative." })
  ),
});

type PurchaseInvoiceFormValues = z.infer<typeof purchaseInvoiceSchema>;

// Define a type for the complete Purchase Invoice
export interface CompletePurchaseInvoice {
  // Exported for use in parent components
  id: string;
  purchaseNo: string;
  purchaseDate: string;
  purchaseTime: string;
  farmer: Farmer;
  items: PurchaseItem[];
  totalAmount: number;
  advance: number;
  due: number;
}

interface PurchaseInvoiceFormProps {
  initialData?: CompletePurchaseInvoice | null;
  onSave: (invoice: CompletePurchaseInvoice) => void;
  onCancel: () => void;
  currentPurchaseNo: string;
  currentPurchaseDate: string;
  currentPurchaseTime: string;
}

const PurchaseInvoiceForm: React.FC<PurchaseInvoiceFormProps> = ({
  initialData,
  onSave,
  onCancel,
  currentPurchaseNo,
  currentPurchaseDate,
  currentPurchaseTime,
}) => {
  const { selectedCompany } = useCompany(); // Use company context
  const { printInHindi } = usePrintSettings(); // Use print settings hook

  // Fetch data using useFirestore
  const { data: allFarmers, loading: loadingFarmers, addDocument: addFarmerDocument } = useFirestore<Farmer>('farmers');
  const { data: allItems, loading: loadingItems, updateDocument: updateItemDocument } = useFirestore<GlobalItem>('items');

  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>(initialData?.items || []);
  const [nextUniqueItemId, setNextUniqueItemId] = useState(
    initialData?.items
      ? Math.max(...initialData.items.map(item => parseInt(item.uniqueId.split('-')[2]))) + 1
      : 1
  );
  const [openFarmerSelect, setOpenFarmerSelect] = useState(false);
  const [isAddFarmerDialogOpen, setIsAddFarmerDialogOpen] = useState(false);

  const itemForm = useForm<PurchaseInvoiceItemFormValues>({
    resolver: zodResolver(purchaseInvoiceItemSchema),
    defaultValues: {
      selectedItemId: undefined,
      grossWeight: 0,
      tareWeight: 0,
      mudDeduction: 0,
    },
  });

  const purchaseForm = useForm<PurchaseInvoiceFormValues>({
    resolver: zodResolver(purchaseInvoiceSchema),
    defaultValues: initialData
      ? {
        selectedFarmerId: initialData.farmer.id,
        advance: initialData.advance,
      }
      : {
        selectedFarmerId: undefined,
        advance: 0,
      },
  });

  const selectedFarmerId = purchaseForm.watch("selectedFarmerId");
  const selectedFarmer = useMemo(() => {
    return allFarmers.find(f => f.id === selectedFarmerId);
  }, [selectedFarmerId, allFarmers]);

  const selectedItemForAdd = itemForm.watch("selectedItemId");
  const currentItemRate = useMemo(() => {
    const item = allItems.find(i => i.id === selectedItemForAdd);
    return item ? item.ratePerKg : 0;
  }, [selectedItemForAdd, allItems]);

  // Reset item form when initialData changes (e.g., switching from add to edit)
  useEffect(() => {
    if (initialData) {
      setPurchaseItems(initialData.items);
      purchaseForm.reset({
        selectedFarmerId: initialData.farmer.id,
        advance: initialData.advance,
      });
      setNextUniqueItemId(Math.max(...initialData.items.map(item => parseInt(item.uniqueId.split('-')[2]))) + 1);
    } else {
      setPurchaseItems([]);
      purchaseForm.reset({
        selectedFarmerId: undefined,
        advance: 0,
      });
      setNextUniqueItemId(1);
    }
    itemForm.reset({
      selectedItemId: undefined,
      grossWeight: 0,
      tareWeight: 0,
      mudDeduction: 0,
    });
  }, [initialData, purchaseForm, itemForm]);

  const handleAddItem = (data: PurchaseInvoiceItemFormValues) => {
    try {
      console.log("PurchaseForm: handleAddItem called with data:", data);
      const itemDetails = allItems.find(item => item.id === data.selectedItemId);
      if (!itemDetails) {
        showError("Selected item not found.");
        console.error("PurchaseForm: Selected item not found for ID:", data.selectedItemId);
        return;
      }

      const netWeight = data.grossWeight - data.tareWeight;
      const finalWeight = netWeight - (netWeight * data.mudDeduction / 100);
      const amount = finalWeight * itemDetails.ratePerKg;

      const newItem: PurchaseItem = {
        uniqueId: `purchase-item-${nextUniqueItemId}`,
        itemName: itemDetails.itemName,
        rate: itemDetails.ratePerKg,
        netWeight: netWeight,
        finalWeight: finalWeight,
        amount: amount,
        ...data,
      };

      setPurchaseItems((prevItems) => {
        const updatedItems = [...prevItems, newItem];
        console.log("PurchaseForm: Updated purchase items:", updatedItems);
        return updatedItems;
      });
      setNextUniqueItemId((prevId) => prevId + 1);
      itemForm.reset({
        selectedItemId: undefined,
        grossWeight: 0,
        tareWeight: 0,
        mudDeduction: 0,
      }); // Reset item form
      showSuccess("Item added to invoice!");
    } catch (error) {
      console.error("PurchaseForm: Error in handleAddItem:", error);
      showError("An unexpected error occurred while adding the item.");
    }
  };

  const handleDeleteItem = (uniqueId: string) => {
    setPurchaseItems((prevItems) => {
      const updatedItems = prevItems.filter((item) => item.uniqueId !== uniqueId);
      console.log("PurchaseForm: Items after deletion:", updatedItems);
      return updatedItems;
    });
    showSuccess("Item removed from invoice.");
  };

  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.amount, 0);
  const advanceAmount = purchaseForm.watch("advance");
  const dueAmount = totalAmount - advanceAmount;

  const updateItemStock = async (itemsToUpdate: PurchaseItem[], type: 'add' | 'deduct') => {
    for (const itemInInvoice of itemsToUpdate) {
      const storedItem = allItems.find(i => i.id === itemInInvoice.selectedItemId);
      if (storedItem) {
        const newStock = type === 'add'
          ? Number(storedItem.stock) + Number(itemInInvoice.finalWeight)
          : Number(storedItem.stock) - Number(itemInInvoice.finalWeight);
        await updateItemDocument(storedItem.id, { stock: newStock });
      } else {
        console.warn(`Item with ID ${itemInInvoice.selectedItemId} not found for stock update.`);
      }
    }
  };

  const onSubmitPurchaseInvoice = async (data: PurchaseInvoiceFormValues) => {
    try {
      console.log("PurchaseForm: Attempting to submit purchase invoice with data:", data);
      if (!selectedFarmer) {
        showError("Please select a farmer.");
        console.error("PurchaseForm: No farmer selected.");
        return;
      }

      if (purchaseItems.length === 0) {
        showError("Please add at least one item to the invoice.");
        console.error("PurchaseForm: No items added to invoice.");
        return;
      }

      const completeInvoice: CompletePurchaseInvoice = {
        id: initialData?.id || currentPurchaseNo, // Use existing ID if editing, otherwise new one
        purchaseNo: currentPurchaseNo,
        purchaseDate: currentPurchaseDate,
        purchaseTime: currentPurchaseTime,
        farmer: selectedFarmer,
        items: purchaseItems,
        totalAmount,
        advance: advanceAmount,
        due: dueAmount,
      };

      // Handle stock update
      if (initialData) {
        // If editing, first deduct stock for old items, then add for new items
        const oldItems = initialData.items;
        await updateItemStock(oldItems, 'deduct'); // Deduct old items' stock
        await updateItemStock(purchaseItems, 'add'); // Add new items' stock
      } else {
        // If adding new invoice, just add stock
        await updateItemStock(purchaseItems, 'add');
      }

      onSave(completeInvoice);
      showSuccess(`Purchase Invoice ${initialData ? "updated" : "created"} successfully!`);
      onCancel(); // Go back to list view
    } catch (error) {
      console.error("PurchaseForm: Error in onSubmitPurchaseInvoice:", error);
      showError("An unexpected error occurred while creating the invoice.");
    }
  };

  const onErrorItemForm = (errors: any) => {
    console.error("PurchaseForm: Item form validation errors:", errors);
    showError("Please correct the item details.");
  };

  const onErrorPurchaseForm = (errors: any) => {
    console.error("PurchaseForm: Purchase form validation errors:", errors);
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

    if (purchaseItems.length === 0) {
      showError("Please add items to the invoice before sharing.");
      return;
    }

    const message =
      `*Purchase Invoice Details*\n\n` +
      `*Purchase No:* ${currentPurchaseNo}\n` +
      `*Date:* ${currentPurchaseDate}\n` +
      `*Time:* ${currentPurchaseTime}\n` +
      `*Farmer:* ${selectedFarmer.farmerName} (ID: ${selectedFarmer.id})\n` +
      `*Village:* ${selectedFarmer.village}\n\n` +
      `*Items:*\n` +
      purchaseItems.map((item, index) =>
        `${index + 1}. ${item.itemName} - ${item.finalWeight.toFixed(2)} KG @ ₹${item.rate.toFixed(2)}/KG = ₹${item.amount.toFixed(2)}`
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
      purchaseForm.setValue("selectedFarmerId", newId, { shouldValidate: true }); // Select the newly added farmer
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
      <div className="flex justify-between items-center print-hide">
        <h1 className="text-3xl font-bold">{initialData ? t("Edit Purchase Invoice", "खरीद चालान संपादित करें") : t("Create Purchase Invoice", "खरीद चालान बनाएँ")}</h1>
        <div className="flex space-x-2">
          <Button onClick={handleWhatsAppShare} variant="outline" disabled={!selectedFarmer || purchaseItems.length === 0}>
            <Share2 className="mr-2 h-4 w-4" /> WhatsApp
          </Button>
          <Button onClick={handlePrint} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> {t("Print Invoice", "चालान प्रिंट करें")}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>{t("Cancel", "रद्द करें")}</Button>
        </div>
      </div>

      <form onSubmit={purchaseForm.handleSubmit(onSubmitPurchaseInvoice, onErrorPurchaseForm)} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-extrabold mb-2">{selectedCompany?.name || t("COMPANY NAME", "कंपनी का नाम")}</h2>
          <p className="text-md text-muted-foreground">{selectedCompany?.address || t("COMPANY ADDRESS", "कंपनी का पता")}</p>
        </div>

        {/* Invoice Details & Farmer Selection */}
        <Card>
          <CardHeader className="print-hide">
            <CardTitle>{t("Invoice & Farmer Details", "चालान और किसान विवरण")}</CardTitle>
            <CardDescription>{t("Select a farmer and view invoice information.", "एक किसान चुनें और चालान की जानकारी देखें।")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseNo">{t("PURCHASE NO", "खरीद संख्या")}</Label>
                <Input id="purchaseNo" value={currentPurchaseNo} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">{t("DATE", "दिनांक")}</Label>
                <Input id="purchaseDate" value={currentPurchaseDate} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseTime">{t("TIME", "समय")}</Label>
                <Input id="purchaseTime" value={currentPurchaseTime} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="space-y-2 print-hide">
                <Label htmlFor="selectedFarmerId">{t("FARMER", "किसान")}</Label>
                <div className="flex items-center space-x-2">
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
                                purchaseForm.setValue("selectedFarmerId", farmer.id, { shouldValidate: true });
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
                {purchaseForm.formState.errors.selectedFarmerId && (
                  <p className="text-red-500 text-sm col-span-2 text-right print-hide">{purchaseForm.formState.errors.selectedFarmerId.message}</p>
                )}
              </div>

              {selectedFarmer ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="farmerId">{t("FARMER ID", "किसान आईडी")}</Label>
                    <Input id="farmerId" value={selectedFarmer.id} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="farmerNameDisplay">{t("FARMER", "किसान")}</Label>
                    <Input id="farmerNameDisplay" value={selectedFarmer.farmerName} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fathersName">{t("FATHER", "पिता")}</Label>
                    <Input id="fathersName" value={selectedFarmer.fathersName} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="village">{t("VILLAGE", "गाँव")}</Label>
                    <Input id="village" value={selectedFarmer.village} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobileNo">{t("MOBILE NO", "मोबाइल नंबर")}</Label>
                    <Input id="mobileNo" value={selectedFarmer.mobileNo} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName">{t("ACCOUNT NAME", "खाता नाम")}</Label>
                    <Input id="accountName" value={selectedFarmer.accountName} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountNo">{t("ACCOUNT NO", "खाता संख्या")}</Label>
                    <Input id="accountNo" value={selectedFarmer.accountNo} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ifscCode">{t("IFSC", "आईएफएससी")}</Label>
                    <Input id="ifscCode" value={selectedFarmer.ifscCode} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank">{t("BANK", "बैंक")}</Label>
                    <Input id="bank" value={selectedFarmer.accountName} readOnly disabled className="bg-gray-100 dark:bg-gray-800" /> {/* Assuming bank name is account name */}
                  </div>
                </>
              ) : (
                <div className="flex items-end">
                  <Button variant="outline" className="w-full" disabled>{t("Select a farmer to view details", "विवरण देखने के लिए एक किसान चुनें")}</Button>
                </div>
              )}
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
                              {item.itemName} (₹{item.ratePerKg.toFixed(2)}/KG, Stock: {item.stock.toFixed(2)} KG)
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
                  <Label htmlFor="ratePerKgDisplay">{t("RATE", "दर")}</Label>
                  <Input id="ratePerKgDisplay" value={currentItemRate.toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grossWeight">{t("GROSS WEIGHT (KG)", "सकल वजन (KG)")}</Label>
                  <Input id="grossWeight" type="number" step="0.01" placeholder="0.00" {...itemForm.register("grossWeight")} />
                  {itemForm.formState.errors.grossWeight && (
                    <p className="text-red-500 text-sm">{itemForm.formState.errors.grossWeight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tareWeight">{t("TARE WEIGHT (KG)", "टारे वजन (KG)")}</Label>
                  <Input id="tareWeight" type="number" step="0.01" placeholder="0.00" {...itemForm.register("tareWeight")} />
                  {itemForm.formState.errors.tareWeight && (
                    <p className="text-red-500 text-sm">{itemForm.formState.errors.tareWeight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mudDeduction">{t("MUD DEDUCTION (%)", "मिट्टी कटौती (%)")}</Label>
                  <Input id="mudDeduction" type="number" step="0.01" placeholder="0.00" {...itemForm.register("mudDeduction")} />
                  {itemForm.formState.errors.mudDeduction && (
                    <p className="text-red-500 text-sm">{itemForm.formState.errors.mudDeduction.message}</p>
                  )}
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
            <CardTitle>{t("Purchase Items", "खरीद के आइटम")}</CardTitle>
            <CardDescription>{t("List of items in this purchase invoice.", "इस खरीद चालान में आइटमों की सूची।")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">{t("S.No", "क्र.सं.")}</TableHead>
                    <TableHead>{t("ITEM", "आइटम")}</TableHead>
                    <TableHead>{t("GROSS WEIGHT", "सकल वजन")}</TableHead>
                    <TableHead>{t("TARE WEIGHT", "टारे वजन")}</TableHead>
                    <TableHead>{t("NET WEIGHT", "शुद्ध वजन")}</TableHead>
                    <TableHead>{t("MUD DEDUCTION(%)", "मिट्टी कटौती(%)")}</TableHead>
                    <TableHead>{t("FINAL WEIGHT", "अंतिम वजन")}</TableHead>
                    <TableHead>{t("RATE", "दर")}</TableHead>
                    <TableHead className="text-right">{t("AMOUNT", "राशि")}</TableHead>
                    <TableHead className="text-center print-hide">{t("Actions", "कार्यवाई")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        {t("No items added yet.", "अभी तक कोई आइटम नहीं जोड़ा गया है।")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    purchaseItems.map((item, index) => (
                      <TableRow key={item.uniqueId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.grossWeight.toFixed(2)} KG</TableCell>
                        <TableCell>{item.tareWeight.toFixed(2)} KG</TableCell>
                        <TableCell>{item.netWeight.toFixed(2)} KG</TableCell>
                        <TableCell>{item.mudDeduction.toFixed(2)} %</TableCell>
                        <TableCell>{item.finalWeight.toFixed(2)} KG</TableCell>
                        <TableCell>₹ {item.rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹ {item.amount.toFixed(2)}</TableCell>
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
          <CardHeader className="print-hide">
            <CardTitle>{t("Invoice Summary", "चालान सारांश")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">{t("Total Amount", "कुल राशि")}</p>
              <p className="text-lg font-semibold">₹ {totalAmount.toFixed(2)}</p>
            </div>
            <div className="space-y-2 print-hide">
              <Label htmlFor="advance">{t("ADVANCE", "अग्रिम")}</Label>
              <Input id="advance" type="number" step="0.01" placeholder="0.00" {...purchaseForm.register("advance")} />
              {purchaseForm.formState.errors.advance && (
                <p className="text-red-500 text-sm">{purchaseForm.formState.errors.advance.message}</p>
              )}
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <p className="text-xl font-bold">{t("DUE", "देय")}</p>
              <p className={`text-2xl font-bold ${dueAmount >= 0 ? "text-red-600" : "text-green-600"}`}>
                ₹ {dueAmount.toFixed(2)}
              </p>
            </div>
            <Button type="submit" className="w-full print-hide">{initialData ? t("Update Purchase Invoice", "खरीद चालान अपडेट करें") : t("Create Purchase Invoice", "खरीद चालान बनाएँ")}</Button>
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

export default PurchaseInvoiceForm;