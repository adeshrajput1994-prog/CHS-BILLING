"use client";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { showSuccess, showError } from "@/utils/toast";

// Define interfaces for the data types you expect
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
  stock: number;
}

interface CashBankTransaction {
  id: string;
  type: "Payment In" | "Payment Out";
  farmerId: string;
  farmerName: string;
  amount: number;
  paymentMethod: "Cash" | "Bank";
  remarks?: string;
  date: string;
  time: string;
}

interface SalesItem {
  uniqueId: string;
  selectedItemId: string;
  itemName: string;
  weight: number;
  rate: number;
  amount: number;
}

interface CompleteSalesInvoice {
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

interface PurchaseItem {
  uniqueId: string;
  selectedItemId: string;
  itemName: string;
  grossWeight: number;
  tareWeight: number;
  mudDeduction: number;
  rate: number;
  netWeight: number;
  finalWeight: number;
  amount: number;
}

interface CompletePurchaseInvoice {
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

interface Company {
  id: string;
  name: string;
  address: string;
  financialYears: string[];
}

interface ManufacturingExpense {
  manufacturedItemName: string;
  totalPurchaseItemKg: number;
  manufacturedItemKg: number;
  plantLabourRate: number;
  khakhoraLabourRate: number;
  loadingLabourRate: number;
  freightRate: number;
}

const collectionsToMigrate = {
  farmers: "farmers",
  items: "items",
  cashBankTransactions: "cashBankTransactions",
  salesInvoices: "salesInvoices",
  purchaseInvoices: "purchaseInvoices",
  companies: "companies",
  manufacturingExpenses: "manufacturingExpenses",
};

export const migrateLocalStorageToFirestore = async () => {
  showSuccess("Starting data migration to Firebase Firestore...");
  let migrationSuccessful = true;

  for (const localStorageKey in collectionsToMigrate) {
    const firestoreCollectionName = (collectionsToMigrate as any)[localStorageKey];
    const storedData = localStorage.getItem(localStorageKey);

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);

        if (Array.isArray(parsedData) && parsedData.length > 0) {
          for (const item of parsedData) {
            // Check if an item with the same 'id' already exists in Firestore
            // This prevents duplicate entries if migration is run multiple times
            const q = query(collection(db, firestoreCollectionName), where("id", "==", item.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              // If no existing document with this ID, add it
              await addDoc(collection(db, firestoreCollectionName), item);
            } else {
              // Optionally, update existing document if you want to merge changes
              // For now, we'll just skip to avoid overwriting
              console.log(`Document with ID ${item.id} already exists in ${firestoreCollectionName}. Skipping.`);
            }
          }
          showSuccess(`Migrated ${parsedData.length} entries for ${localStorageKey}.`);
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          // Handle single objects if any, though most of our data is arrays
          // For now, we'll assume top-level keys are arrays of objects
          console.warn(`Skipping non-array data for ${localStorageKey}. Only arrays are migrated.`);
        }
      } catch (error) {
        console.error(`Error migrating ${localStorageKey} to Firestore:`, error);
        showError(`Failed to migrate ${localStorageKey} data.`);
        migrationSuccessful = false;
      }
    }
  }

  // Handle selectedCompanyId and selectedFinancialYear separately if needed,
  // as they are not collections but single values.
  // For now, we'll assume these will be handled by the CompanyContext once companies are migrated.

  if (migrationSuccessful) {
    showSuccess("All available localStorage data migrated to Firebase Firestore!");
    // Optionally, clear localStorage after successful migration
    // localStorage.clear(); // Uncomment this line if you want to clear localStorage after migration
  } else {
    showError("Data migration completed with some errors. Check console for details.");
  }
};