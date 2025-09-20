export interface Product {
  id: string;
  name: string;
  icon: string;
  basePrice: number;
  baseDemand: number;
}

export interface InventoryItem {
  productId: string;
  quantity: number;
}

export interface ForSaleItem {
  productId: string;
  quantity: number;
  sellingPrice: number;
}

export interface EndOfDayReportData {
  day: number;
  revenue: number;
  expenses: number;
  profit: number;
  electricityBill: number;
  salesSummary: {
    productName: string;
    quantity: number;
    revenue: number;
  }[];
}

export enum GameState {
  START_MENU,
  PLAYING,
  SIMULATING,
  THIEF_EVENT,
  END_DAY_REPORT,
  GAME_OVER,
}
