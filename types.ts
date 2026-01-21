export enum PaymentMethod {
  CREDIT = 'Crédito',
  DEBIT = 'Débito',
  CASH = 'Dinheiro',
  PIX = 'Pix'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface User {
  id: string;
  name: string;
  password: string; // Em um app real, isso seria criptografado
  role: 'admin' | 'staff' | 'kitchen' | 'display';
}

export interface Transaction {
  id: string;
  orderNumber: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid?: number; // Valor entregue pelo cliente
  change?: number;     // Troco calculado
  sellerName?: string; // Nome do funcionário que vendeu
  status: 'completed' | 'cancelled';
  kitchenStatus: 'pending' | 'done'; // Sincronizado via banco de dados
}

export interface DailySummary {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  methodBreakdown: Record<string, number>;
}