export interface FarmerIdGenerator {
  id: string;
}

export interface ItemIdGenerator {
  id: string;
}

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