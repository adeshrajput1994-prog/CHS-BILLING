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
import { Pencil, Trash2 } from "lucide-react";
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

interface FarmerTableProps {
  farmers: Farmer[]; // Now receives already filtered farmers
  onEdit: (farmer: Farmer) => void;
  onDelete: (id: string) => void;
}

const FarmerTable: React.FC<FarmerTableProps> = ({ farmers, onEdit, onDelete }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Farmer ID</TableHead>
            <TableHead>Farmer Name</TableHead>
            <TableHead>Father's Name</TableHead>
            <TableHead>Village</TableHead>
            <TableHead>Mobile No</TableHead>
            <TableHead>Bank</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {farmers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                No farmers found matching your search, or no farmers added yet.
              </TableCell>
            </TableRow>
          ) : (
            farmers.map((farmer) => (
              <TableRow key={farmer.id}>
                <TableCell>
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {farmer.id}
                  </Badge>
                </TableCell>
                <TableCell>{farmer.farmerName}</TableCell>
                <TableCell>{farmer.fathersName}</TableCell>
                <TableCell>{farmer.village}</TableCell>
                <TableCell>{farmer.mobileNo}</TableCell>
                <TableCell>{farmer.accountName}</TableCell>
                <TableCell className="flex justify-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(farmer)}>
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
                          This action cannot be undone. This will permanently delete the farmer
                          <span className="font-bold"> {farmer.farmerName} (ID: {farmer.id}) </span>
                          and remove their data from our records.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(farmer.id)} className="bg-red-600 hover:bg-red-700">
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

export default FarmerTable;