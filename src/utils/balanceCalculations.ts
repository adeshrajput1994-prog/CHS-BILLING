import { CompleteSalesInvoice } from "@/components/SalesInvoiceForm";
import { CompletePurchaseInvoice } from "@/components/PurchaseInvoiceForm";
import { Expense } from "@/components/ExpenseForm"; // Import Expense interface

interface Farmer {
  id: string;
  farmerName: string;
  companyId: string; // Add companyId
  // Add other necessary farmer properties if needed for display in calculations
}

export interface CashBankTransaction {
  id: string; // This will now be the custom generated ID like T001
  type: "Payment In" | "Payment Out";
  farmerId: string;
  farmerName: string;
  amount: number;
  paymentMethod: "Cash" | "Bank";
  remarks?: string;
  date: string;
  time: string;
  companyId: string; // Add companyId
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

export const calculateCompanyCashFlow = (
  expenses: Expense[]
): { cashInHand: number; totalCashInFromBankHome: number; totalCashOutToBankHome: number; totalCompanyExpenses: number } => {
  let cashInHand = 0; // Represents the current cash balance of the company
  let totalCashInFromBankHome = 0;
  let totalCashOutToBankHome = 0;
  let totalCompanyExpenses = 0;

  expenses.forEach(entry => {
    const amount = Number(entry.amount);

    if (entry.type === "Cash In (Bank/Home)") {
      cashInHand += amount;
      totalCashInFromBankHome += amount;
    } else if (entry.type === "Cash Out (Bank/Home)") {
      cashInHand -= amount;
      totalCashOutToBankHome += amount;
    } else {
      // Regular company expenses
      totalCompanyExpenses += amount;
      if (entry.paymentMethod === "Cash") {
        cashInHand -= amount; // Deduct from cash in hand if paid by cash
      }
      // If paid by Bank, it affects bank balance, not cash in hand directly.
      // For simplicity, we're only tracking 'cash in hand' here.
    }
  });

  return {
    cashInHand,
    totalCashInFromBankHome,
    totalCashOutToBankHome,
    totalCompanyExpenses,
  };
};