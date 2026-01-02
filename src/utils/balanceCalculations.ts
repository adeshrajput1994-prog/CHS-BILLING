import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";

interface Farmer {
  id: string;
  farmerName: string;
  // Add other necessary farmer properties if needed for display in calculations
}

export interface CashBankTransaction {
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

export const calculateFarmerDueBalances = (
  farmers: Farmer[],
  salesInvoices: CompleteSalesInvoice[],
  purchaseInvoices: CompletePurchaseInvoice[],
  cashBankTransactions: CashBankTransaction[]
): Map<string, number> => {
  const balances = new Map<string, number>();

  farmers.forEach(farmer => {
    let totalDue = 0; // Positive means farmer owes you, negative means you owe farmer

    // Calculate from Sales Invoices
    salesInvoices
      .filter(invoice => invoice.farmer.id === farmer.id)
      .forEach(invoice => {
        totalDue += (Number(invoice.totalAmount) - Number(invoice.advance)); // Sales increase what farmer owes you
      });

    // Calculate from Purchase Invoices
    purchaseInvoices
      .filter(invoice => invoice.farmer.id === farmer.id)
      .forEach(invoice => {
        totalDue -= (Number(invoice.totalAmount) - Number(invoice.advance)); // Purchases increase what you owe farmer
      });

    // Calculate from Cash/Bank Transactions
    cashBankTransactions
      .filter(transaction => transaction.farmerId === farmer.id)
      .forEach(transaction => {
        if (transaction.type === "Payment In") {
          totalDue -= Number(transaction.amount); // Farmer paid you, so their due decreases
        } else { // Payment Out
          totalDue += Number(transaction.amount); // You paid farmer, so their due increases (or your debt to them decreases)
        }
      });

    balances.set(farmer.id, totalDue);
  });

  return balances;
};