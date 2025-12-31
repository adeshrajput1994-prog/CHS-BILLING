"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Printer, Save, Check, ChevronsUpDown } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import FarmersForm from "./FarmersForm"; // Import FarmersForm
import { getNextFarmerId } from "@/utils/idGenerators"; // Import ID generator

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

interface Item {
  id: string;
  itemName: string;
  ratePerKg: number;
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
export interface CompleteSalesInvoice { // Exported for use in parent components
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
  const [allFarmers, setAllFarmers] = useState<Farmer[]>([]);
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [salesItems, setSalesItems] = useState<SalesItem[]>(initialData?.items || []);
  const [nextUniqueItemId, setNextUniqueItemId] = useState(
    initialData?.items ? Math.max(...initialData.items.map(item => parseInt(item.uniqueId.split('-')[2]))) + 1 : 1
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
    defaultValues: initialData ? {
      selectedFarmerId: initialData.farmer.id,
      advance: initialData.advance,
    } : {
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
    return item ? item.ratePerKg : 0;
  }, [selectedItemForAdd, allItems]);

  // Load farmers and items from localStorage on initial mount
  useEffect(() => {
    console.log("SalesForm: Loading data from localStorage...");
    const storedFarmers = localStorage.getItem("farmers");
    if (storedFarmers) {
      setAllFarmers(JSON.parse(storedFarmers));
      console.log("SalesForm: Loaded farmers:", JSON.parse(storedFarmers));
    }
    const storedItems = localStorage.getItem("items");
    if (storedItems) {
      setAllItems(JSON.parse(storedItems));
      console.log("SalesForm: Loaded items:", JSON.parse(storedItems));
    }
  }, []);

  // Reset item form when initialData changes (e.g., switching from add to edit)
  useEffect(() => {
    if (initialData) {
      setSalesItems(initialData.items);
      salesForm.reset({
        selectedFarmerId: initialData.farmer.id,
        advance: initialData.advance,
      });
      setNextUniqueItemId(Math.max(...initialData.items.map(item => parseInt(item.uniqueId.split('-')[2]))) + 1);
    } else {
      setSalesItems([]);
      salesForm.reset({
        selectedFarmerId: undefined,
        advance: 0,
      });
      setNextUniqueItemId(1);
    }
    itemForm.reset({ selectedItemId: undefined, weight: 0 });
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

      const amount = data.weight * itemDetails.ratePerKg;

      const newItem: SalesItem = {
        uniqueId: `sales-item-${nextUniqueItemId}`,
        itemName: itemDetails.itemName,
        rate: itemDetails.ratePerKg,
        amount: amount,
        ...data,
      };
      setSalesItems((prevItems) => {
        const updatedItems = [...prevItems, newItem];
        console.log("SalesForm: Updated sales items:", updatedItems);
        return updatedItems;
      });
      setNextUniqueItemId((prevId) => prevId + 1);
      itemForm.reset({ selectedItemId: undefined, weight: 0 }); // Reset item form
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

  const totalAmount = salesItems.reduce((sum, item) => sum + item.amount, 0);
  const advanceAmount = salesForm.watch("advance");
  const dueAmount = totalAmount - advanceAmount;

  const onSubmitSalesInvoice = (data: SalesInvoiceFormValues) => {
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
        totalAmount,
        advance: advanceAmount,
        due: dueAmount,
      };

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

  const handleQuickAddFarmerSave = (newFarmerData: Omit<Farmer, 'id'>) => {
    const newId = getNextFarmerId(allFarmers);
    const newFarmer: Farmer = { id: newId, ...newFarmerData };
    setAllFarmers((prevFarmers) => [...prevFarmers, newFarmer]);
    salesForm.setValue("selectedFarmerId", newId, { shouldValidate: true }); // Select the newly added farmer
    setIsAddFarmerDialogOpen(false); // Close the dialog
    showSuccess(`Farmer ${newFarmer.farmerName} added and selected!`);
  };

  const handleQuickAddFarmerCancel = () => {
    setIsAddFarmerDialogOpen(false); // Close the dialog
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-end items-center space-x-2 print-hide mb-4">
        <Button variant="outline" onClick={() => console.log("Save functionality not implemented yet.")}>
          <Save className="mr-2 h-4 w-4" /> Save
        </Button>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>

      <form onSubmit={salesForm.handleSubmit(onSubmitSalesInvoice, onErrorSalesForm)} className="space-y-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-extrabold mb-2">SHRI RAM TRADERS</h2>
          <p className="text-md text-muted-foreground">HARCHANDPUR KALAN, POST-CHHACHHENA, ETAH</p>
        </div>

        {/* Invoice Details & Farmer Selection */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4 items-center">
              <Label htmlFor="invoiceNo" className="text-right">INVOICE NO</Label>
              <Input id="invoiceNo" value={currentInvoiceNo} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="farmerId" className="text-right">FARMER ID</Label>
              <Input id="farmerId" value={selectedFarmer?.id || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="farmerNameDisplay" className="text-right">FARMER</Label>
              <div className="flex items-center space-x-2">
                <Popover open={openFarmerSelect} onOpenChange={setOpenFarmerSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openFarmerSelect}
                      className="w-full justify-between"
                    >
                      {selectedFarmer
                        ? selectedFarmer.farmerName
                        : "Select farmer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-0">
                    <Command>
                      <CommandInput placeholder="Search farmer..." />
                      <CommandEmpty>No farmer found.</CommandEmpty>
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
                      <span className="sr-only">Add New Farmer</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                      <DialogTitle>Add New Farmer</DialogTitle>
                      <DialogDescription>
                        Fill in the details to add a new farmer.
                      </DialogDescription>
                    </DialogHeader>
                    <FarmersForm onSave={handleQuickAddFarmerSave} onCancel={handleQuickAddFarmerCancel} />
                  </DialogContent>
                </Dialog>
              </div>
              {salesForm.formState.errors.selectedFarmerId && (
                <p className="text-red-500 text-sm col-span-2 text-right">{salesForm.formState.errors.selectedFarmerId.message}</p>
              )}

              <Label htmlFor="village" className="text-right">VILLAGE</Label>
              <Input id="village" value={selectedFarmer?.village || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="accountName" className="text-right">ACCOUNT NAME</Label>
              <Input id="accountName" value={selectedFarmer?.accountName || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="accountNo" className="text-right">ACCOUNT NO</Label>
              <Input id="accountNo" value={selectedFarmer?.accountNo || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              <Label htmlFor="ifscCode" className="text-right">IFSC</Label>
              <Input id="ifscCode" value={selectedFarmer?.ifscCode || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />

              {/* Right column fields */}
              <div className="col-start-2 row-start-1 flex items-center space-x-2">
                <Label htmlFor="invoiceDate" className="w-1/2 text-right">DATE</Label>
                <Input id="invoiceDate" value={currentInvoiceDate} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-2 flex items-center space-x-2">
                <Label htmlFor="fathersName" className="w-1/2 text-right">FATHER</Label>
                <Input id="fathersName" value={selectedFarmer?.fathersName || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-3 flex items-center space-x-2">
                <Label htmlFor="mobileNo" className="w-1/2 text-right">MOBILE NO</Label>
                <Input id="mobileNo" value={selectedFarmer?.mobileNo || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-4 flex items-center space-x-2">
                <Label htmlFor="invoiceTime" className="w-1/2 text-right">TIME</Label>
                <Input id="invoiceTime" value={currentInvoiceTime} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
              <div className="col-start-2 row-start-5 flex items-center space-x-2">
                <Label htmlFor="bank" className="w-1/2 text-right">BANK</Label>
                <Input id="bank" value={selectedFarmer?.accountName || ""} readOnly disabled className="bg-gray-100 dark:bg-gray-800 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Item Section */}
        <Card className="print-hide">
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
            <CardDescription>Enter item details to add to the invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={itemForm.handleSubmit(handleAddItem, onErrorItemForm)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="selectedItemId">ITEM</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {selectedItemForAdd
                          ? allItems.find((item) => item.id === selectedItemForAdd)?.itemName
                          : "Select item..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search item..." />
                        <CommandEmpty>No item found.</CommandEmpty>
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
                              {item.itemName} (₹{item.ratePerKg.toFixed(2)}/KG)
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
                  <Label htmlFor="weight">WEIGHT (KG)</Label>
                  <Input id="weight" type="number" step="0.01" placeholder="0.00" {...itemForm.register("weight")} />
                  {itemForm.formState.errors.weight && (
                    <p className="text-red-500 text-sm">{itemForm.formState.errors.weight.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ratePerKgDisplay">RATE</Label>
                  <Input id="ratePerKgDisplay" value={currentItemRate.toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amountDisplay">AMOUNT</Label>
                  <Input id="amountDisplay" value={(itemForm.watch("weight") * currentItemRate).toFixed(2)} readOnly disabled className="bg-gray-100 dark:bg-gray-800" />
                </div>
              </div>
              <Button type="button" onClick={itemForm.handleSubmit(handleAddItem, onErrorItemForm)} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <CardHeader className="print-hide">
            <CardTitle>Sales Items</CardTitle>
            <CardDescription>List of items in this sales invoice.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">S.No</TableHead>
                    <TableHead>ITEM</TableHead>
                    <TableHead>WEIGHT</TableHead>
                    <TableHead>RATE</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                    <TableHead className="text-center print-hide">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No items added yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salesItems.map((item, index) => (
                      <TableRow key={item.uniqueId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.weight.toFixed(2)} KG</TableCell>
                        <TableCell>₹ {item.rate.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹ {item.amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center print-hide">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.uniqueId)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                            <span className="sr-only">Delete</span>
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
              <Label className="text-right font-medium">TOTAL AMOUNT</Label>
              <Input value={`₹ ${totalAmount.toFixed(2)}`} readOnly disabled className="bg-gray-100 dark:bg-gray-800 text-lg font-semibold" />

              <Label htmlFor="advance" className="text-right font-medium print-hide">ADVANCE</Label>
              <Input
                id="advance"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...salesForm.register("advance")}
                className="print-hide"
              />
              {salesForm.formState.errors.advance && (
                <p className="text-red-500 text-sm col-span-2 text-right print-hide">{salesForm.formState.errors.advance.message}</p>
              )}

              <Label className="text-right font-bold">DUE</Label>
              <Input
                value={`₹ ${dueAmount.toFixed(2)}`}
                readOnly
                disabled
                className={`bg-gray-100 dark:bg-gray-800 text-2xl font-bold ${dueAmount >= 0 ? "text-red-600" : "text-green-600"}`}
              />
            </div>
            <Button type="submit" className="w-full mt-6 print-hide">{initialData ? "Update Sales Invoice" : "Create Sales Invoice"}</Button>
          </CardContent>
        </Card>

        {/* Signatures */}
        <div className="flex justify-between mt-8 pt-8 border-t border-dashed print-hide">
          <div className="text-center">
            <p className="font-semibold">FARMER SIGN</p>
            <div className="w-48 h-16 border-b border-gray-400 mt-4"></div>
          </div>
          <div className="text-center">
            <p className="font-semibold">MANGER SIGN</p>
            <div className="w-48 h-16 border-b border-gray-400 mt-4"></div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SalesInvoiceForm;