"use client";

import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { showSuccess, showError } from "@/utils/toast";

// Modify interfaces to include companyId
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
  companyId: string;
}

interface Item {
  id: string;
  itemName: string;
  ratePerKg: number;
  stock: number;
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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
  companyId: string;
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

  // Get the first company ID to assign to existing data
  const companies = JSON.parse(localStorage.getItem("companies") || "[]");
  const defaultCompanyId = companies.length > 0 ? companies[0].id : "default-company";

  for (const localStorageKey in collectionsToMigrate) {
    const firestoreCollectionName = (collectionsToMigrate as any)[localStorageKey];
    const storedData = localStorage.getItem(localStorageKey);

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);

        if (Array.isArray(parsedData) && parsedData.length > 0) {
          for (const item of parsedData) {
            // Add companyId to the data
            const itemWithCompany = {
              ...item,
              companyId: item.companyId || defaultCompanyId
            };

            const q = query(collection(db, firestoreCollectionName), where("id", "==", item.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              await addDoc(collection(db, firestoreCollectionName), itemWithCompany);
            } else {
              console.log(`Document with ID ${item.id} already exists in ${firestoreCollectionName}. Skipping.`);
            }
          }
          showSuccess(`Migrated ${parsedData.length} entries for ${localStorageKey}.`);
        } else if (typeof parsedData === 'object' && parsedData !== null) {
          console.warn(`Skipping non-array data for ${localStorageKey}. Only arrays are migrated.`);
        }
      } catch (error) {
        console.error(`Error migrating ${localStorageKey} to Firestore:`, error);
        showError(`Failed to migrate ${localStorageKey} data.`);
        migrationSuccessful = false;
      }
    }
  }

  if (migrationSuccessful) {
    showSuccess("All available localStorage data migrated to Firebase Firestore!");
  } else {
    showError("Data migration completed with some errors. Check console for details.");
  }
};