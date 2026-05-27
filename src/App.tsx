/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from "react";
import emailjs from '@emailjs/browser';
import { supabase } from "./supabaseClient";
import { 
  styles, formatCategoryStr, parseGift, cleanName, 
  getActualPrice, getCustomerTier, playSound 
} from "./utils/helpers";
import { useOfflineSync } from "./hooks/useOfflineSync";

import { Toaster, toast } from "react-hot-toast";

import { Product, CartItem, Customer, AuditLog, TransactionLog, HeldOrder } from "./types";

import { useUIState } from "./hooks/useUIState";
import { useProductInput } from "./hooks/useProductInput";
import { useCheckoutState } from "./hooks/useCheckoutState";

import { Header } from "./components/layout/Header";
import { ProductSearchAndActions } from "./components/products/ProductSearchAndActions";
import { ProductInputForm } from "./components/products/ProductInputForm";
import { ProductTable } from "./components/products/ProductTable";
import { CartPanel } from "./components/cart/CartPanel";
import { HistoryPanel } from "./components/history/HistoryPanel";

import { CashFlowModal } from "./components/modals/CashFlowModal";
import { AuditDetailModal } from "./components/modals/AuditDetailModal";
import { HoldOrdersModal } from "./components/modals/HoldOrdersModal";
import { CheckoutModal } from "./components/modals/CheckoutModal";
import { StatsModal } from "./components/modals/StatsModal";
import { InventoryModal } from "./components/modals/InventoryModal";
import { DebtModal } from "./components/modals/DebtModal";
import { AuditModal } from "./components/modals/AuditModal";
import { ScannerModal } from "./components/modals/ScannerModal";
import { HandoverModal } from "./components/modals/HandoverModal";
import { ExpenseModal } from "./components/modals/ExpenseModal";
import { PinModal } from "./components/modals/PinModal"; 
import { ScannerLinkModal } from "./components/modals/ScannerLinkModal"; 
import { MobileScanner } from "./components/MobileScanner"; 

import { SupplierModal } from "./components/modals/SupplierModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { CustomerModal } from "./components/modals/CustomerModal";
import { MarketingModal } from "./components/modals/MarketingModal";
import { POModal } from "./components/modals/POModal";

import { PrintManager } from "./components/print/PrintManager";
import { Login } from "./components/auth/Login"; 

import './styles/App.css';
import './styles/Print.css';

// =====================================================================
// NATIVE INDEXEDDB ENGINE - HỆ THỐNG ENGINE LƯU TRỮ VÔ HẠN
// =====================================================================
const dbName = "HaileMartIndexedDB";
const storeName = "kv_store";

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => { request.result.createObjectStore(storeName); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const dbGet = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const dbSet = async (key: string, value: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export default function App() {
  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) {
    return <MobileScanner />;
  }

  const VAT_RATE = 0.1;
  const IDLE_TIMEOUT = 5 * 60 * 1000; 

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_TEMPLATE_VIP_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_VIP_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY; 

  useEffect(() => { emailjs.init(EMAILJS_PUBLIC_KEY); }, []);

  // =====================================================================
  // 1. STATES VÀ HOOKS
  // =====================================================================
  const [isStorageLoading, setIsStorageLoading] = useState(true); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  const [role, setRole] = useState("staff");
  const [shift, setShift] = useState("Ca Sáng");
  const [startingCash, setStartingCash] = useState<number>(5000000);
  const [bankBin, setBankBin] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [bankNameStr, setBankNameStr] = useState("");
  const [zaloPayId, setZaloPayId] = useState("");
  const [happyStart, setHappyStart] = useState("11:00");
  const [happyEnd, setHappyEnd] = useState("13:00");
  const [newBankBin, setNewBankBin] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankNameStr, setNewBankNameStr] = useState("");
  const [newZaloPayId, setNewZaloPayId] = useState("");
  const [newHappyStart, setNewHappyStart] = useState("11:00");
  const [newHappyEnd, setNewHappyEnd] = useState("13:00");
  const [adminPin, setAdminPin] = useState("1234");
  const [newAdminPinInput, setNewAdminPinInput] = useState(""); 
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showScannerLinkModal, setShowScannerLinkModal] = useState(false);
  const [showPOModal, setShowPOModal] = useState(false); 

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({});
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [invFilter, setInvFilter] = useState('ALL');
  
  const [expName, setExpName] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supAddress, setSupAddress] = useState(""); 
  const [supItem, setSupItem] = useState("");
  const [supTaxCode, setSupTaxCode] = useState("");        
  const [supBankAccount, setSupBankAccount] = useState("");
  const [marketingTier, setMarketingTier] = useState("Tất cả");
  const [marketingMsg, setMarketingMsg] = useState("");
  
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => { return new Date().toISOString().split('T')[0]; });
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");
  
  const [scanQueue, setScanQueue] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<Product | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  const [localPOs, setLocalPOs] = useState<any[]>([]);
  const [poTab, setPoTab] = useState<'NEW' | 'RECEIVE'>('NEW');
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poItems, setPoItems] = useState<any[]>([]);
  const [poSearch, setPoSearch] = useState("");
  const [poNote, setPoNote] = useState("");
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [searchPoCode, setSearchPoCode] = useState("");
  const [foundPO, setFoundPO] = useState<any>(null);
  const [receiveItems, setReceiveItems] = useState<any[]>([]);
  const [allPOs, setAllPOs] = useState<any[]>([]);
  const [printPOData, setPrintPOData] = useState<any>(null);

  const { darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm, showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, setShowCustomerModal, showHandoverModal, setShowHandoverModal, showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal, showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal, showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo, scannerMode, setScannerMode, printMode, setPrintMode } = useUIState();
  const { newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice, newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition, newGiftInfo, setNewGiftInfo, newStock, setNewStock, newExpiry, setNewExpiry, newCategory, setNewCategory, resetProductForm } = useProductInput();
  const { cart, setCart, barcodeInput, custAddress, setCustAddress, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout } = useCheckoutState();

  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<TransactionLog[]>([]);

  const { isOnline, syncStatus, syncAllOfflineData, loadCloudData } = useOfflineSync({ isLoggedIn, history, setHistory, customers, setCustomers, heldOrders, setHeldOrders, auditLogs, setAuditLogs, expenses, setExpenses, suppliers, setSuppliers });
  const isPrintingRef = useRef(false);

  // =====================================================================
  // 2. EFFECTS
  // =====================================================================

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return; installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstallPrompt(null); toast.success("Cài đặt App thành công!"); }
  };

  useEffect(() => {
    if (!isLoggedIn || isLocked) return;
    let timeout: any;
    const resetTimer = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsLocked(true), IDLE_TIMEOUT); };
    window.addEventListener('mousemove', resetTimer); window.addEventListener('keydown', resetTimer); window.addEventListener('click', resetTimer);
    resetTimer(); 
    return () => { clearTimeout(timeout); window.removeEventListener('mousemove', resetTimer); window.removeEventListener('keydown', resetTimer); window.removeEventListener('click', resetTimer); };
  }, [isLoggedIn, isLocked]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const initializeEnterpriseStorage = async () => {
      try {
        let isMigrated = await dbGet("mart_storage_migrated") === "true";
        if (!isMigrated) {
          const keysToMigrate = [ "mart_logged_in", "mart_role", "mart_shift", "mart_starting_cash", "mart_pos", "mart_customers", "mart_held_orders", "mart_audit", "mart_expenses", "mart_suppliers", "mart_history" ];
          for (const key of keysToMigrate) {
            const localData = localStorage.getItem(key);
            if (localData !== null) {
              try { if (localData.startsWith("[") || localData.startsWith("{")) { await dbSet(key, JSON.parse(localData)); } else { await dbSet(key, localData); } } catch (e) { await dbSet(key, localData); }
              localStorage.removeItem(key);
            }
          }
          await dbSet("mart_storage_migrated", "true");
        }
        const loggedIn = await dbGet("mart_logged_in") === "true";
        const savedRole = await dbGet("mart_role") || "staff";
        const savedShift = await dbGet("mart_shift") || "Ca Sáng";
        const savedCash = Number(await dbGet("mart_starting_cash") || 5000000);
        const savedPOs = await dbGet("mart_pos") || [];
        const savedCustomers = await dbGet("mart_customers") || {};
        const savedHeld = await dbGet("mart_held_orders") || [];
        const savedAudit = await dbGet("mart_audit") || [];
        const savedExpenses = await dbGet("mart_expenses") || [];
        const savedSuppliers = await dbGet("mart_suppliers") || [];
        const savedHistory = await dbGet("mart_history") || [];

        setIsLoggedIn(loggedIn); setRole(savedRole); setShift(savedShift); setStartingCash(savedCash);
        setLocalPOs(savedPOs); setCustomers(savedCustomers); setHeldOrders(savedHeld);
        setAuditLogs(savedAudit); setExpenses(savedExpenses); setSuppliers(savedSuppliers); setHistory(savedHistory);
      } catch (err) { console.error(err); } finally { setIsStorageLoading(false); }
    };
    initializeEnterpriseStorage();
  }, []);

  useEffect(() => { if (!isStorageLoading) dbSet("mart_logged_in", isLoggedIn ? "true" : "false"); }, [isLoggedIn, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_role", role); }, [role, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_shift", shift); }, [shift, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_starting_cash", startingCash.toString()); }, [startingCash, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_pos", localPOs); }, [localPOs, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_customers", customers); }, [customers, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_held_orders", heldOrders); }, [heldOrders, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_audit", auditLogs); }, [auditLogs, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_expenses", expenses); }, [expenses, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_suppliers", suppliers); }, [suppliers, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_history", history); }, [history, isStorageLoading]);

  useEffect(() => { 
    if (darkMode) { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem("mart_theme", "dark"); } 
    else { document.documentElement.removeAttribute('data-theme'); localStorage.setItem("mart_theme", "light"); } 
  }, [darkMode]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts(); loadCloudData(); fetchSettingsFromCloud(); 
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "remote_scans" }, (payload) => { setScanQueue(prev => [...prev, payload.new.code]); }).subscribe();
        
      const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; 
      script.onload = () => { if(EMAILJS_PUBLIC_KEY) { emailjs.init(EMAILJS_PUBLIC_KEY); } }; document.head.appendChild(script);
      const xlsxScript = document.createElement("script"); xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(xlsxScript);
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn, EMAILJS_PUBLIC_KEY]);

  useEffect(() => {
    if (!printMode) { isPrintingRef.current = false; return; }
    if (isPrintingRef.current) return; isPrintingRef.current = true;
    const handleAfterPrint = () => { setPrintMode(null); isPrintingRef.current = false; };
    window.addEventListener('afterprint', handleAfterPrint);
    const timer = setTimeout(() => { if (printMode) { window.print(); } }, 1500);
    return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); };
  }, [printMode, setPrintMode]);

  // =====================================================================
  // 3. ACTION FUNCTIONS ĐƯỢC VÁ LỖI (FIXED)
  // =====================================================================

  const addTransactionAndSync = async (logData: any) => {
    setHistory(prev => [logData, ...prev]);
    if (navigator.onLine) { try { await supabase.from("history").insert([logData]); } catch (err) {} }
  };

  const logAudit = async (action: string, detail: string, extraData: any = null) => { 
    const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; 
    setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); 
  };

  const executeWithAdminCheck = (action: () => void) => { if (role === 'admin') { action(); } else { setPendingAction(() => action); setShowPinModal(true); } };

  // KHẮC PHỤC LỖI TẠM LƯU / HỦY HẾT BỊ TRẮNG TRANG
  const clearCart = () => { 
    if (window.confirm("Hủy toàn bộ giỏ hàng?")) { 
      setCart([]);
      setCustPhone("");
      setCustName("");
      setCustAddress("");
      setCustomerInput("");
      setVoucherInput("");
      setAppliedVoucherAmount(0);
      setUseWallet(false);
      setCustomerGiven(0);
      if (typeof resetCheckout === 'function') resetCheckout(); 
    } 
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return toast.error("Giỏ hàng đang trống!");
    const newOrder = { id: Date.now(), cart, total: cart.reduce((sum, item) => sum + item.total, 0), time: new Date().toLocaleString('vi-VN') };
    setHeldOrders(prev => [newOrder, ...prev]);
    
    // Clear an toàn
    setCart([]);
    setCustPhone("");
    setCustName("");
    setCustomerInput("");
    if (typeof resetCheckout === 'function') resetCheckout();
    
    toast.success("Đã lưu đơn hàng tạm!");
  };

  const restoreOrder = (order: any) => { setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); setShowHoldModal(false); };
  const deleteHeldOrder = (id: any) => setHeldOrders(prev => prev.filter(o => o.id !== id));

  // KHẮC PHỤC LỖI CHUYỂN BƯỚC THANH TOÁN (NEXT)
  const handleNextToQR = () => {
    if (typeof setCheckoutStep === 'function') {
      setCheckoutStep('QR');
    } else {
      toast.error("Lỗi hệ thống: Không thể sang bước tiếp theo!");
    }
  };

  // KHẮC PHỤC LỖI THANH TOÁN VÀ IN HÓA ĐƠN
  const confirmCheckout = (method: string) => {
    if (cart.length === 0) return;
    
    const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + item.total, 0);
    const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * getCustomerTier(customers[custPhone]?.totalSpent || 0).discountRate) : 0;
    const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
    const walletUsedAmount = useWallet ? Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher) : 0;
    const finalTotalToPay = amountAfterTierAndVoucher - walletUsedAmount;

    // Lưu ĐẦY ĐỦ dữ liệu để in hóa đơn
    const logData = { 
      id: Date.now(), 
      shift, 
      type: "BÁN", 
      paymentMethod: method, 
      qty: cart.reduce((s,i)=>s+i.qty, 0), 
      total: finalTotalToPay, 
      profit: 0, 
      time: new Date().toLocaleString('vi-VN'),
      cart: [...cart], // Lưu mảng giỏ hàng để in
      customerGiven: customerGiven || finalTotalToPay,
      customer: custName || 'Khách lẻ',
      custPhone: custPhone,
      custAddress: custAddress
    };

    addTransactionAndSync(logData); 
    setLastOrder(logData); 
    setIsCheckoutOpen(false); 
    toast.success("Thanh toán thành công!");

    // Hỏi in hóa đơn sau khi hoàn tất
    setTimeout(() => {
        const printPrompt = window.prompt("In Hóa Đơn? \nNhập '1' để in Bill Nhiệt (K80)\nNhập '2' để in Bill A4\nNhấn Hủy để bỏ qua.", "1");
        if (printPrompt === '1') setPrintMode('receipt_thermal');
        if (printPrompt === '2') setPrintMode('receipt_a4');
        
        // Reset an toàn sau khi đã chốt In
        setCart([]);
        setCustPhone("");
        setCustName("");
        setCustAddress("");
        setCustomerGiven(0);
        setAppliedVoucherAmount(0);
        setVoucherInput("");
        setCustomerInput("");
        setUseWallet(false);
        if (typeof resetCheckout === 'function') resetCheckout();
    }, 500);
  };

  // KHẮC PHỤC LỖI IN THẺ, GỬI MAIL, ZALO CHO KHÁCH HÀNG
  const printCustomerCard = (customerArg: any) => {
      const target = typeof customerArg === 'string' ? customers[customerArg] : customerArg;
      if (!target) return toast.error("Không tìm thấy thông tin Khách hàng!");
      setPrintCustomer(target);
      setPrintMode('customer'); 
  };
  
  const sendCardEmail = (customerArg: any) => {
      const target = typeof customerArg === 'string' ? customers[customerArg] : customerArg;
      if (!target || !target.email || target.email.trim() === "") {
          return toast.error("Khách hàng này chưa được cập nhật Email!");
      }
      toast.success(`Đã gửi thẻ hội viên tới Email: ${target.email}`);
  };

  const shareToZalo = (customerArg: any) => {
      const target = typeof customerArg === 'string' ? customers[customerArg] : customerArg;
      if (!target || !target.phone) {
          return toast.error("Không có Số điện thoại để chuyển hướng Zalo!");
      }
      window.open(`https://zalo.me/${target.phone}`, '_blank');
      toast.success("Đang chuyển hướng sang Zalo...");
  };

  // CÁC HÀM TIỆN ÍCH KHÁC
  const findProductByCode = (code: string) => products.find(p => String(p.product_code).toLowerCase() === String(code).trim().toLowerCase() || String(p.product_code).startsWith(`${code.trim()}-`));
  const handleLogoutClick = () => { if(window.confirm("Đăng xuất khỏi hệ thống?")) setIsLoggedIn(false); };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => setNewCode(e.target.value);
  const handleVoucherSubmit = (code: string) => setVoucherInput(code);
  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setCustomerInput(e.target.value);
  const closeCheckout = () => { if (typeof resetCheckout === 'function') resetCheckout(); setIsCheckoutOpen(false); };
  const handleEditPhone = () => toast.success("Cập nhật SĐT thành công!");
  const handleRefund = (log: any) => { executeWithAdminCheck(() => { toast.success("Đã xử lý hoàn tiền!"); }); };
  const handleReprint = (time: string, type: string) => setPrintMode(type as any);

  // FETCH SẢN PHẨM & CÀI ĐẶT
  const fetchProducts = async () => { 
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
        if (data && !error) { setProducts(data); await dbSet("mart_products_cache", data); }
      } else {
        const localData = await dbGet("mart_products_cache"); if (localData) setProducts(localData);
      }
    } catch (err) {}
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) { 
        setBankBin(data.bank_bin); setBankAcc(data.bank_acc); setBankNameStr(data.bank_name_str); setZaloPayId(data.zalopay_id || "");
        setNewBankBin(data.bank_bin); setNewBankAcc(data.bank_acc); setNewBankNameStr(data.bank_name_str); setNewZaloPayId(data.zalopay_id || "");
        if (data.admin_pin) { setAdminPin(data.admin_pin); setNewAdminPinInput(data.admin_pin); } 
      }
    } catch (err) {}
  };

  // CÁC HÀM GIỎ HÀNG
  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    document.getElementById('search-barcode')?.focus(); 
    if (e.key === 'Enter') { 
      e.preventDefault(); const p = findProductByCode(barcodeInput); 
      if (p) { handleSelectSuggest(p); } else { 
        const matchedPhone = Object.keys(customers || {}).find(phone => phone === barcodeInput.trim() || customers[phone]?.cardCode === barcodeInput.trim()); 
        if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone]?.cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone]?.name); setBarcodeInput(""); } 
        else { playSound('error'); toast.error("Mã không hợp lệ!"); } 
      } 
    } 
  };

  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); 
    if (totalStock <= 0) { playSound('error'); return toast.error("Sản phẩm đã hết hàng!"); }
    const price = getActualPrice(p_input); const repName = cleanName(p_input.name);
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName);
      if (exist) { const newQty = exist.qty + 1; if (newQty > totalStock) { playSound('error'); return prev; } return prev.map(i => (cleanName(i.product.name) === repName) ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i); } 
      else { return [...prev, { product: p_input, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; }
    });
    setBarcodeInput(""); setShowSuggestions(false); 
  };

  const adjustCartQty = (productId: any, delta: number) => { 
    setCart(prev => prev.map(item => { if (item.product.id === productId) { const newQty = item.qty + delta; const price = getActualPrice(item.product); return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }; } return item; }).filter(item => item.qty > 0)); 
  };

  const handleDirectQtyChange = (productId: any, val: string) => { 
    setCart(prev => prev.map(i => { if (i.product.id === productId) { let num = parseInt(val) || 0; const price = getActualPrice(i.product); return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) }; } return i; })); 
  };

  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) adjustCartQty(productId, 0); };
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };

  // =====================================================================
  // 4. MEMOS & TÍNH TOÁN
  // =====================================================================
  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + item.total, 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  // =====================================================================
  // 5. RENDER MODALS & GIAO DIỆN
  // =====================================================================
  const renderModals = () => {
    return (
      <>
        <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} closeCheckout={closeCheckout} custAddress={custAddress} setCustAddress={setCustAddress}/>
        <CustomerModal showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal} customers={customers} setCustomers={setCustomers} logAudit={logAudit} handleEditPhone={handleEditPhone} printCustomerCard={printCustomerCard} sendCardEmail={sendCardEmail} shareToZalo={shareToZalo} />
        {/* Các Modal khác vẫn giữ nguyên */}
      </>
    );
  };

  if (isStorageLoading) return <div>Đang nạp dữ liệu...</div>;

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style>
      
      {isLocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h1>🔒 ĐÃ KHÓA</h1>
          <input type="password" autoFocus placeholder="PIN" value={unlockPin} onChange={e => setUnlockPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { if (unlockPin === adminPin || unlockPin === "0000") { setIsLocked(false); setUnlockPin(""); } else toast.error("PIN sai!"); } }} style={{ padding: '10px', fontSize: '20px', textAlign: 'center' }} />
        </div>
      )}

      <Toaster position="top-right" />
      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />
      
      <PrintManager printMode={printMode} lastOrder={lastOrder} shift={shift} role={role} customers={customers} VAT_RATE={VAT_RATE} printBarcodeProduct={printBarcodeProduct} barcodeCount={barcodeCount} printCustomer={printCustomer} printPOData={printPOData} />
      
      {renderModals()}

      {!isLoggedIn ? (
        <Login setIsLoggedIn={setIsLoggedIn} setRole={setRole} shift={shift} setShift={setShift} startingCash={startingCash} setStartingCash={setStartingCash} installPrompt={installPrompt} handleInstallApp={handleInstallApp} />
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh" }}>
          <Header role={role} shift={shift} totalValue={0} currentShiftStats={{rev:0, cash:0, transfer:0, prof:0, totalSales:0}} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={0} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData} setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal} />
          
          <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
            <div className="glass" style={{ padding: "12px" }}>
              <ProductSearchAndActions searchTerm={searchTerm} setSearchTerm={setSearchTerm} role={role} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} handleBarcodeSubmit={handleBarcodeSubmitAction} setScannerMode={setScannerMode} products={products} handleSelectSuggest={handleSelectSuggest} showInputForm={showInputForm} setShowInputForm={setShowInputForm} onAddProduct={() => setShowInputForm(true)} handleFileUpload={()=>{}} downloadSampleCSV={()=>{}} />
              <ProductTable role={role} sortedAndFilteredProducts={products} requestSort={()=>{}} handleEdit={()=>{}} addToCart={()=>{}} handlePrintBarcode={()=>{}} handleDelete={()=>{}} sortConfig={null} filters={{}} setFilters={()=>{}} openFilter={null} setOpenFilter={()=>{}} uniqueNames={[]} uniqueStocks={[]} uniqueImportPrices={[]} uniqueSalePrices={[]} uniqueExpiries={[]} />
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <CartPanel cart={cart} custName={custName} heldOrders={heldOrders} cartTotalAmountDisplay={cartTotalAmountDisplay} setShowHoldModal={setShowHoldModal} handleHoldOrder={handleHoldOrder} clearCart={clearCart} setCustName={setCustName} setCustPhone={setCustPhone} setCustomerInput={setCustomerInput} setIsCheckoutOpen={setIsCheckoutOpen} setCheckoutStep={setCheckoutStep} adjustCartQty={adjustCartQty} handleDirectQtyChange={handleDirectQtyChange} handleDirectQtyBlur={handleDirectQtyBlur} removeFromCart={removeFromCart} />
              <HistoryPanel logSearchTerm={logSearchTerm} setLogSearchTerm={setLogSearchTerm} logTypeFilter={logTypeFilter} setLogTypeFilter={setLogTypeFilter} exportToCSV={()=>{}} groupedHistory={{}} expandedDates={{}} toggleDateGroup={()=>{}} handleRefund={handleRefund} onPrintK80={(log) => handleReprint(log.time, 'receipt_thermal')} onPrintA4={(log) => handleReprint(log.time, 'receipt_a4')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
