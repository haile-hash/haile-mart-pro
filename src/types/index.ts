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
  address?: string; // Bổ sung trường địa chỉ vừa nâng cấp
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
  // Bổ sung các loại giao dịch liên quan đến Nhập kho PO và Trả hàng NCC
  type: 'BÁN' | 'GHI NỢ' | 'THU NỢ' | 'TRẢ HÀNG' | 'NHẬP' | 'HỆ THỐNG' | 'NHẬP PO' | 'TRẢ HÀNG NCC';
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
  order_id?: string; // Bổ sung mã Hóa đơn
  t?: string;        // Biến thời gian phụ dùng trong HistoryPanel
}

export interface HeldOrder {
  id: number;
  time: string;
  cart: CartItem[];
}

// BỔ SUNG KHAI BÁO KIỂU CHO NHÀ CUNG CẤP VÀ PO
export interface Supplier {
  id: string | number;
  name: string;
  phone: string;
  address?: string;
  item?: string;
  taxCode?: string;      // Mã số thuế
  bankAccount?: string;  // Số tài khoản
  debt?: number;
}

export interface PurchaseOrder {
  id: string | number;
  po_code: string;
  supplier: Supplier;
  items: any[];
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
  status: 'PENDING' | 'COMPLETED';
  note?: string;
  created_at?: string;
}
