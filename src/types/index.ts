export type Group = 'Vendas salão' | 'Fiados salão' | 'Fiados rua' | 'Vendas rua';

export interface Item {
  id: string;
  name: string;
  quantity: number;
  price: number; // Preço base do item
  deliveryFee: number; // Taxa de entrega, se aplicável
  total: number; // (price * quantity) + deliveryFee
  group: Group;
  timestamp: string; // ISO string for date
}
