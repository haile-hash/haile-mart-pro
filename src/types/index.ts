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
  updated_at?: string; // Bổ sung để track đồng bộ offline
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
  address?: string;
  phone?: string;
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
  // Đã bổ sung 'NHẬP (OFFLINE)' để khớp với App.tsx
  type: 'BÁN' | 'GHI NỢ' | 'THU NỢ' | 'TRẢ HÀNG' | 'NHẬP' | 'HỆ THỐNG' | 'NHẬP PO' | 'TRẢ HÀNG NCC' | 'NHẬP (OFFLINE)';
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
  order_id?: string; 
  t?: string;        
}

export interface HeldOrder {
  id: number;
  time: string;
  cart: CartItem[];
}

export interface Supplier {
  id: string | number;
  name: string;
  phone: string;
  address?: string;
  item?: string;
  taxCode?: string;      
  bankAccount?: string;  
  debt?: number;
}

export interface PurchaseOrder {
  id: string | number;
  po_code: string;
  supplier_id: string | number; // Đã thêm để khớp với logic tìm kiếm supplier
  supplier?: Supplier;
  items: any[]; // Có thể tạo thêm type POItem nếu cần thiết
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
  status: 'PENDING' | 'COMPLETED';
  note?: string;
  created_at?: string;
}

// BỔ SUNG CÁC TYPE MỚI ĐỂ LOẠI BỎ 'any' TRONG APP.TSX

export interface Expense {
  id: number;
  date: string;
  name: string;
  amount: number;
}

export interface OrderReceipt {
  orderId: string;
  shift: string;
  cart: CartItem[];
  subTotal: number;
  vatTotal: number;
  finalTotal: number;
  debtAmount: number;
  discount: number;
  time: string;
  paymentMethod: string;
  customerGiven: number;
  custName: string;
  custPhone?: string;
  isRefund?: boolean;
}

export interface StoreInfo {
  id?: string | number;
  owner_id?: string;
  store_name?: string;
  phone?: string;
  address?: string;
  tax_code?: string;
  [key: string]: any; // Mở rộng nếu Cloud trả về thêm data
}
