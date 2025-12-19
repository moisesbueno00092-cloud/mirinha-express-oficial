export const PREDEFINED_PRICES: { [key: string]: number } = {
  PP: 18.00,
  P: 20.00,
  M: 22.00,
  G: 24.00,
  GG: 26.00,
  KITM: 50.00,
  KITG: 60.00,
  PF: 28.00,
  SL: 5.00,
  SLKIT: 15.00,
  S: 42.90,
};

export const DELIVERY_FEE = 6.00;

export const BOMBONIERE_ITEMS_DEFAULT: { id: string; name: string; price: number; imageUrl: string, aiHint: string }[] = [
    { id: 'coca-lata', name: 'Coca-cola Lata', price: 5.00, imageUrl: 'https://picsum.photos/seed/coca-lata/200/200', aiHint: 'soda can' },
    { id: 'fanta-lata', name: 'Fanta Lata', price: 5.00, imageUrl: 'https://picsum.photos/seed/fanta-lata/200/200', aiHint: 'orange soda' },
    { id: 'guarana-lata', name: 'Guaraná Lata', price: 5.00, imageUrl: 'https://picsum.photos/seed/guarana-lata/200/200', aiHint: 'guarana soda' },
    { id: 'coca-2l', name: 'Coca-cola 2L', price: 12.00, imageUrl: 'https://picsum.photos/seed/coca-2l/200/200', aiHint: 'soda bottle' },
    { id: 'guarana-2l', name: 'Guaraná 2L', price: 10.00, imageUrl: 'https://picsum.photos/seed/guarana-2l/200/200', aiHint: 'soda bottle' },
    { id: 'agua-sem-gas', name: 'Água sem Gás', price: 3.00, imageUrl: 'https://picsum.photos/seed/agua-sem-gas/200/200', aiHint: 'water bottle' },
    { id: 'agua-com-gas', name: 'Água com Gás', price: 3.50, imageUrl: 'https://picsum.photos/seed/agua-com-gas/200/200', aiHint: 'sparkling water' },
    { id: 'chocolate', name: 'Chocolate', price: 4.00, imageUrl: 'https://picsum.photos/seed/chocolate/200/200', aiHint: 'chocolate bar' },
    { id: 'bala', name: 'Balas', price: 0.50, imageUrl: 'https://picsum.photos/seed/bala/200/200', aiHint: 'assorted candies' },
    { id: 'chiclete', name: 'Chiclete', price: 1.00, imageUrl: 'https://picsum.photos/seed/chiclete/200/200', aiHint: 'gum package' },
];
