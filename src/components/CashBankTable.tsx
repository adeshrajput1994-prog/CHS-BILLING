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
import { Badge } from "@/components/ui/badge";
import { CashBankTransaction } from "@/utils/balanceCalculations";
import { Pencil, Trash2 } from "lucide-react"; // Import icons
import { Button } from "@/components/ui/button"; // Import Button
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
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

interface CashBankTableProps {
  transactions: CashBankTransaction[];
  onEdit: (transaction: CashBankTransaction) => void; // New prop for editing
  onDelete: (id: string) => void; // New prop for deleting
}

const CashBankTable: React.FC<CashBankTableProps> = ({ transactions, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Farmer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead className="text-center">Actions</TableHead> {/* New column for actions */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                No cash or bank transactions recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <Badge variant="outline">
                    {transaction.id.substring(0, 8)}...
                  </Badge>
                </TableCell>
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.time}</TableCell>
                <TableCell>
                  <Badge variant={transaction.type === "Payment In" ? "default" : "secondary"} className={transaction.type === "Payment In" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
                    {transaction.type}
                  </Badge>
                </TableCell>
                <TableCell>{transaction.farmerName}</TableCell>
                <TableCell>₹ {transaction.amount.toFixed(2)}</TableCell>
                <TableCell>{transaction.paymentMethod}</TableCell>
                <TableCell className="max-w-[200px] truncate">{transaction.remarks || "-"}</TableCell>
                <TableCell className="flex justify-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(transaction)}>
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
                          This action cannot be undone. This will permanently delete the transaction
                          <span className="font-bold"> (ID: {transaction.id.substring(0, 8)}...) </span>
                          and remove its data from our records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(transaction.id)} className="bg-red-600 hover:bg-red-700">
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

export default CashBankTable;