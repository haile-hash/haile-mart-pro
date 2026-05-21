// src/types/index.ts

export interface Product {
  id: string | number;
  product_code: string;
  name: string;
  category: string;
  import_price: number;
  sale_price: number;
  promo_price: number;
  gift_info: string | null;
  stock: number;
  expiry_date: string | null;
  created_at?: string;
  isHappyHour?: boolean;
}

export interface CartItem {
  product: Product;
  qty: number;
  total: number;
  priceIncludingVat?: number;
}

export interface Customer {
  name: string;
  email: string;
  cardCode: string;
  totalSpent: number;
  wallet: number;
  debt: number;
}

export interface AuditLog {
  id: number;
  time: string;
  user_name: string;
  shift: string;
  action: string;
  detail: string;
  extra_data: string | null;
}

export interface TransactionLog {
  id: number;
  shift: string;
  type: 'BÁN' | 'GHI NỢ' | 'THU NỢ' | 'TRẢ HÀNG' | 'NHẬP' | 'HỆ THỐNG';
  name: string;
  qty: number;
  total: number;
  profit?: number;
  customer?: string;
  product_id?: string | number;
  refunded_qty?: number;
  paymentMethod?: string;
  split_cash?: number;
  time: string;
}

export interface HeldOrder {
  id: number;
  time: string;
  cart: CartItem[];
}
