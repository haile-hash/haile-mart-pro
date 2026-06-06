// ==========================================
// 1. DỮ LIỆU CỐT LÕI (SẢN PHẨM, KHÁCH HÀNG, NCC)
// ==========================================

export interface Product {
  id?: string;                 // ID gốc từ Supabase
  barcode: string;             // Mã vạch (Giao diện mới dùng)
  product_code?: string;       // Mã SP (Database cũ dùng)
  name: string;
  category: string;
  stock: number;
  minStock: number;            // Định mức tồn kho tối thiểu (Mới)
  packageUnit: string;         // Đơn vị (Gói, Hộp, Lon...) (Mới)
  costPrice: number;           // Giá vốn (Giao diện mới dùng)
  import_price?: number;       // Giá vốn (Database cũ dùng)
  sellingPrice: number;        // Giá bán (Giao diện mới dùng)
  sale_price?: number;         // Giá bán (Database cũ dùng)
  promo_price?: number;        // Giá khuyến mãi (Cũ)
  gift_info?: string | null;   // Thông tin quà tặng (Cũ)
  expiryDate: string;          // HSD format YYYY-MM-DD (Giao diện mới)
  expiry_date?: string | null; // HSD (Database cũ)
  supplierId: string;          // ID Nhà cung cấp (Mới)
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;                  // ID khách hàng (Mới)
  name: string;
  phone: string;
  email: string;
  points: number;              // Điểm Loyalty (Mới)
  tier: 'Standard' | 'Silver' | 'Gold' | 'Platinum'; // Hạng thành viên (Mới)
  joinDate: string;            // Ngày tham gia (Mới)
  debt?: number;               // Nợ công
  wallet?: number;             // Ví VIP trả trước
  address?: string;            // Địa chỉ (Cũ)
  totalSpent?: number;         // Tổng chi tiêu (Cũ)
  cardCode?: string;           // Mã thẻ cứng (Cũ)
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  address: string;
  item?: string;               // Ngành hàng cung cấp (Cũ)
  taxCode?: string;            // Mã số thuế (Cũ)
  bankAccount?: string;        // Số tài khoản (Cũ)
  debt?: number;               // Công nợ với NCC (Cũ)
}

// ==========================================
// 2. QUY TRÌNH KHO & ĐẶT HÀNG (PO, STOCK COUNT)
// ==========================================

export interface POItem {
  productId: string;
  orderedQty: number;
  receivedQty: number;
  costPrice: number;
}

export interface PurchaseOrder {
  id: string;
  po_code?: string;            // Mã PO database cũ
  supplierId: string;
  orderDate: string;
  items: POItem[];
  status: 'draft' | 'ordered' | 'received';
  receivedDate?: string;
  note?: string;               // Ghi chú (Cũ)
  total_amount?: number;       // Tổng tiền (Cũ)
  paid_amount?: number;        // Đã thanh toán (Cũ)
  created_at?: string;
}

export interface StockCountItem {
  productId: string;
  expectedQty: number;
  countedQty: number;
  variance: number;            // Độ lệch
}

export interface StockCount {
  id: string;
  countDate: string;
  items: StockCountItem[];
  status: 'draft' | 'approved';
  notes?: string;
}

// ==========================================
// 3. QUY TRÌNH BÁN HÀNG & KHIẾU NẠI
// ==========================================

export interface CartItem {
  product: Product;
  qty: number;
  total?: number;
  priceIncludingVat?: number;
}

export interface SaleItem {
  productId: string;
  qty: number;
  price: number;
}

export interface CustomerOrder {
  id: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  orderDate: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: 'cash' | 'card' | 'momo' | 'vnpay' | 'qr';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  shippingStatus: 'assembling' | 'shipping' | 'delivered' | 'returned';
  shippingAddress: string;
  deliveryDriver?: {
    name: string;
    phone: string;
    avatar: string;
  };
  deliveryProgress: number; // Từ 0 đến 100 cho thanh tracking GPS
  timestamp: string;
}

export interface RefundItem {
  productId: string;
  qty: number;
  reason: string;
}

export interface RefundTicket {
  id: string;
  orderId: string;
  requestDate: string;
  items: RefundItem[];
  status: 'pending' | 'approved' | 'rejected';
  totalRefundAmount: number;
  restockMethod: 'salvage' | 'scrap'; // salvage: tái nhập kho, scrap: bỏ
}

export interface HeldOrder {
  id: number;
  time: string;
  cart: CartItem[];
  note: string;
}

// ==========================================
// 4. NHẬT KÝ & BÁO CÁO (LỊCH SỬ, CHI PHÍ, THỐNG KÊ)
// ==========================================

export interface TransactionLog {
  id: string | number;
  shift: string;
  type: string;                // 'BÁN', 'GHI NỢ', 'TRẢ HÀNG', 'THU NỢ', 'NHẬP'...
  name: string;
  qty: number;
  total: number;
  profit?: number;
  customer?: string;
  product_id?: string;
  paymentMethod?: string;
  split_cash?: number;         // Cho phương thức KẾT HỢP
  time: string;
  order_id?: string;
}

export interface AuditLog {
  id: number;
  time: string;
  user_name: string;
  shift: string;
  action: string;
  detail: string;
  extra_data?: string | null;
}

export interface ExpenseLog {
  id: string | number;
  date?: string;
  timestamp?: string;
  name?: string;
  note?: string;
  amount: number;
}

export interface DailyReport {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  salesCount: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  orderId?: string;
  read: boolean;
}
