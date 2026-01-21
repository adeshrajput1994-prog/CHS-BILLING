export interface FarmerIdGenerator {
  id: string;
}

export interface ItemIdGenerator {
  id: string;
}

export interface TransactionIdGenerator {
  id: string;
}

// Helper function to get the next farmer ID (e.g., F001, F002)
export const getNextFarmerId = (currentFarmers: FarmerIdGenerator[]) => {
  let maxIdNum = 0;
  currentFarmers.forEach(farmer => {
    const match = farmer.id.match(/^F(\d+)$/);
    if (match && match[1]) {
      const idNum = parseInt(match[1], 10);
      if (idNum > maxIdNum) {
        maxIdNum = idNum;
      }
    }
  });
  return `F${String(maxIdNum + 1).padStart(3, '0')}`;
};

// Helper function to get the next item ID (e.g., I001, I002)
export const getNextItemId = (currentItems: ItemIdGenerator[]) => {
  let maxIdNum = 0;
  currentItems.forEach(item => {
    const match = item.id.match(/^I(\d+)$/);
    if (match && match[1]) {
      const idNum = parseInt(match[1], 10);
      if (idNum > maxIdNum) {
        maxIdNum = idNum;
      }
    }
  });
  return `I${String(maxIdNum + 1).padStart(3, '0')}`;
};

// Helper function to get the next transaction ID (e.g., T001, T002)
export const getNextTransactionId = (currentTransactions: TransactionIdGenerator[]) => {
  let maxIdNum = 0;
  currentTransactions.forEach(transaction => {
    const match = transaction.id.match(/^T(\d+)$/);
    if (match && match[1]) {
      const idNum = parseInt(match[1], 10);
      if (idNum > maxIdNum) {
        maxIdNum = idNum;
      }
    }
  });
  return `T${String(maxIdNum + 1).padStart(3, '0')}`;
};