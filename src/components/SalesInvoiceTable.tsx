"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CompleteSalesInvoice } from "./SalesInvoiceForm"; // Import the interface

interface SalesInvoiceTableProps {
  invoices: CompleteSalesInvoice[];
  onView: (invoice: CompleteSalesInvoice) => void;
  onEdit: (invoice: CompleteSalesInvoice) => void;
  onDelete: (id: string) => void;
}

const SalesInvoiceTable: React.FC<SalesInvoiceTableProps> = ({ invoices, onView, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice No</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Farmer Name</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Advance</TableHead>
            <TableHead>Due</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No sales invoices found.
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {invoice.invoiceNo}
                  </Badge>
                </TableCell>
                <TableCell>{invoice.invoiceDate}</TableCell>
                <TableCell>{invoice.farmer.farmerName}</TableCell>
                <TableCell>₹ {Number(invoice.totalAmount).toFixed(2)}</TableCell>
                <TableCell>₹ {Number(invoice.advance).toFixed(2)}</TableCell>
                <TableCell className={Number(invoice.due) >= 0 ? "text-red-600" : "text-green-600"}>
                  ₹ {Number(invoice.due).toFixed(2)}
                </TableCell>
                <TableCell className="flex justify-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onView(invoice)}>
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(invoice)}>
                    <Pencil className="h-4 w-4 text-green-600" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-600" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete sales invoice
                          <span className="font-bold"> {invoice.invoiceNo} </span>
                          and remove its data from our records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(invoice.id)} className="bg-red-600 hover:bg-red-700">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SalesInvoiceTable;