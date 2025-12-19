export type Group = 'Vendas salão' | 'Fiados salão' | 'Fiados rua' | 'Vendas rua';

export interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number; // For single items, this is the price. For grouped KG items, this is the SUM of individualPrices.
  deliveryFee: number;
  total: number; // (price * quantity) + deliveryFee
  group: Group;
  timestamp: string; // ISO string for date
  individualPrices?: number[]; // Optional: To store individual prices for grouped KG items
}
