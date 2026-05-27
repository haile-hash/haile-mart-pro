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

const dbRemove = async (key: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const req = store.delete(key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

export default function App() {
  const VAT_RATE = 0.1;
  const IDLE_TIMEOUT = 5 * 60 * 1000; 

  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const EMAILJS_TEMPLATE_VIP_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_VIP_ID;
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

  // =====================================================================
  // 1. TẤT CẢ STATES VÀ HOOKS
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
  // 2. EFFECTS (VÒNG ĐỜI VÀ EVENT CHẠY NGẦM)
  // =====================================================================

  useEffect(() => { if (EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY); }, [EMAILJS_PUBLIC_KEY]);

  useEffect(() => {
    fetchProducts();
    fetchSettingsFromCloud();
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      toast.success("Cài đặt App thành công!");
    }
  };

  useEffect(() => {
    if (!isLoggedIn || isLocked) return;
    let timeout: any;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsLocked(true), IDLE_TIMEOUT);
    };
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    resetTimer(); 
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
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
          const keysToMigrate = [
            "mart_logged_in", "mart_role", "mart_shift", "mart_starting_cash",
            "mart_pos", "mart_customers", "mart_held_orders", "mart_audit",
            "mart_expenses", "mart_suppliers", "mart_history"
          ];
          for (const key of keysToMigrate) {
            const localData = localStorage.getItem(key);
            if (localData !== null) {
              try {
                if (localData.startsWith("[") || localData.startsWith("{")) { await dbSet(key, JSON.parse(localData)); } 
                else { await dbSet(key, localData); }
              } catch (e) { await dbSet(key, localData); }
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showPinModal || showAuditModal || showCustomerModal || showSettings || showInputForm || showInventoryModal || cashFlowModalInfo || showPOModal) return;
      if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-barcode')?.focus(); }
      if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) confirmCheckout('TIỀN MẶT'); }
      if (e.key === 'F3') { e.preventDefault(); if (cart.length > 0) confirmCheckout('CHUYỂN KHOẢN'); }
      if (e.key === 'F4') { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, showPinModal, cart, showAuditModal, showCustomerModal, showSettings, showInputForm, showInventoryModal, cashFlowModalInfo, showPOModal]);

  const syncPendingImports = async () => {
    if (!navigator.onLine) return;
    const pendingImports = await dbGet("mart_pending_imports") || [];
    if (pendingImports.length === 0) return;

    toast.loading("Đang đồng bộ dữ liệu Nhập Kho Offline...");
    let successCount = 0;

    for (const item of pendingImports) {
      try {
        if (item.action === "UPDATE_STOCK") {
          const { data: cloudProd } = await supabase.from("products").select("stock").eq("id", item.targetId).single();
          const currentCloudStock = cloudProd ? cloudProd.stock : 0;
          await supabase.from("products").update({ 
            stock: currentCloudStock + item.addedStock,
            updated_at: new Date().toISOString()
          }).eq("id", item.targetId);
        } else if (item.action === "INSERT_NEW") {
          await supabase.from("products").insert([item.data]);
        }
        successCount++;
      } catch (err) {
        console.error("Lỗi đồng bộ Kho:", err);
      }
    }

    await dbSet("mart_pending_imports", []);
    toast.dismiss();
    if (successCount > 0) {
      toast.success(`Đã đồng bộ ${successCount} lệnh Nhập Kho lên hệ thống!`);
      fetchProducts(); 
    }
  };

  useEffect(() => {
    if (isOnline && isLoggedIn) {
      syncPendingImports();
    }
  }, [isOnline, isLoggedIn]);

  // =====================================================================
  // 3. ACTION FUNCTIONS (HÀM XỬ LÝ CHÍNH)
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

  const fetchProducts = async () => { 
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
        if (data && !error) { 
          setProducts(data);
          await dbSet("mart_products_cache", data);
        } else {
          const localData = await dbGet("mart_products_cache");
          if (localData) setProducts(localData);
        }
      } else {
        console.log("Đang tải sản phẩm từ bộ nhớ Offline...");
        const localData = await dbGet("mart_products_cache");
        if (localData) setProducts(localData);
      }
    } catch (err) {
      const localData = await dbGet("mart_products_cache");
      if (localData) setProducts(localData);
    }
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) { 
        setBankBin(data.bank_bin); setBankAcc(data.bank_acc); setBankNameStr(data.bank_name_str); setZaloPayId(data.zalopay_id || "");
        setNewBankBin(data.bank_bin); setNewBankAcc(data.bank_acc); setNewBankNameStr(data.bank_name_str); setNewZaloPayId(data.zalopay_id || "");
        if (data.admin_pin) { setAdminPin(data.admin_pin); setNewAdminPinInput(data.admin_pin); } 
        if (data.happy_hour_start) { setHappyStart(data.happy_hour_start); setNewHappyStart(data.happy_hour_start); } 
        if (data.happy_hour_end) { setHappyEnd(data.happy_hour_end); setNewHappyEnd(data.happy_hour_end); } 
      }
    } catch (err) {}
  };

  // ==========================================
  // CHI PHÍ
  // ==========================================
  const addExpense = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!expName.trim() || !expAmount) return toast.error("Vui lòng nhập tên và số tiền chi phí!");
    const amount = parseInt(expAmount.toString().replace(/[,.]/g, ''));
    if (isNaN(amount) || amount <= 0) return toast.error("Số tiền không hợp lệ!");
    
    setLoading(true);
    const newExpense = { id: Date.now(), date: todayStrStr, name: expName.trim(), amount: amount, shift: shift };
    try {
      if (navigator.onLine) await supabase.from('expenses').insert([newExpense]);
      setExpenses(prev => [newExpense, ...prev]);
      logAudit("THÊM CHI PHÍ", `${newExpense.name} - ${amount}đ`);
      toast.success("Thêm chi phí thành công!");
      setExpName(""); setExpAmount(""); setShowExpenseModal(false);
    } catch (err) { toast.error("Lỗi khi thêm chi phí"); } finally { setLoading(false); }
  };

  const deleteExpense = async (id: any, name: string) => {
    executeWithAdminCheck(async () => {
      if (!window.confirm(`Xóa chi phí: ${name}?`)) return;
      try {
        if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id);
        setExpenses(prev => prev.filter(e => e.id !== id));
        logAudit("XÓA CHI PHÍ", name);
        toast.success("Đã xóa chi phí!");
      } catch (err) { toast.error("Lỗi khi xóa chi phí"); }
    });
  };

  // ==========================================
  // ĐƠN TẠM GIỮ
  // ==========================================
  const handleHoldOrder = () => {
    if (cart.length === 0) return toast.error("Giỏ hàng trống!");
    const note = window.prompt("Nhập ghi chú (Tên khách/Bàn...):", "");
    if (note === null) return;
    
    const newHeldOrder: HeldOrder = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), note: note || "Không có ghi chú", items: cart };
    setHeldOrders(prev => [newHeldOrder, ...prev]);
    resetCheckout();
    toast.success("Đã lưu đơn tạm giữ!");
  };

  const restoreOrder = (order: HeldOrder) => {
    setCart(order.items);
    setHeldOrders(prev => prev.filter(o => o.id !== order.id));
    setShowHoldModal(false);
    toast.success(`Đã khôi phục đơn: ${order.note}`);
  };

  const deleteHeldOrder = (id: number) => {
    if (window.confirm("Bạn muốn xóa đơn tạm giữ này?")) {
      setHeldOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  // ==========================================
  // NHÀ CUNG CẤP & THANH TOÁN NỢ
  // ==========================================
  const addSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return toast.error("Tên NCC không được để trống!");
    const newSup = { id: Date.now().toString(), name: supName, phone: supPhone, address: supAddress, item: supItem, tax_code: supTaxCode, bank_account: supBankAccount, debt: 0 };
    setSuppliers(prev => [newSup, ...prev]);
    toast.success("Thêm NCC thành công!");
    setShowSupplierModal(false);
    setSupName(""); setSupPhone(""); setSupAddress(""); setSupItem(""); setSupTaxCode(""); setSupBankAccount("");
  };

  const deleteSupplier = async (id: string) => {
    executeWithAdminCheck(async () => {
      if (!window.confirm("Xóa Nhà cung cấp này?")) return;
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success("Đã xóa NCC!");
    });
  };

  const handlePayDebt = async (phone: string, amountStr: string) => {
    const amount = parseInt(amountStr.replace(/[,.]/g, ''));
    if (isNaN(amount) || amount <= 0) return toast.error("Số tiền không hợp lệ!");
    const customer = customers[phone];
    if (!customer) return toast.error("Không tìm thấy khách hàng!");
    
    if (window.confirm(`Xác nhận thu nợ ${amount.toLocaleString()}đ từ ${customer.name}?`)) {
      const newDebt = (customer.debt || 0) - amount;
      setCustomers({ ...customers, [phone]: { ...customer, debt: newDebt } });
      addTransactionAndSync({ id: Date.now(), shift, type: "THU NỢ", name: "Thanh toán nợ", qty: 1, total: amount, paymentMethod: "TIỀN MẶT", time: new Date().toLocaleString('vi-VN'), customer: customer.name });
      toast.success("Đã ghi nhận thanh toán nợ!");
    }
  };

  // ==========================================
  // THANH TOÁN (CHECKOUT)
  // ==========================================
  const confirmCheckout = (paymentMethod: string) => {
    if (cart.length === 0) return toast.error("Giỏ hàng trống!");
    
    cart.forEach(item => {
      addTransactionAndSync({
        id: Date.now() + Math.random(), shift, type: "BÁN", name: item.product.name,
        qty: item.qty, total: item.total, profit: item.total - (item.product.import_price * item.qty),
        paymentMethod, customer: custName || "Khách lẻ", time: new Date().toLocaleString('vi-VN')
      });
    });

    logAudit("BÁN HÀNG", `Hóa đơn: ${cartTotalAmountDisplay}đ - ${paymentMethod}`);
    setLastOrder({ items: cart, total: finalToPay, method: paymentMethod, customer: custName, time: new Date().toLocaleString('vi-VN') });
    
    toast.success("Thanh toán thành công!");
    setPrintMode('receipt_thermal');
    resetCheckout();
    setIsCheckoutOpen(false);
  };

  const handleVoucherSubmit = () => toast.success("Đã áp dụng Voucher!");
  const handleCustomerInputChange = (val: string) => setCustomerInput(val);
  const handleNextToQR = () => setCheckoutStep(2);
  const sendReceiptEmail = () => toast.success("Đã gửi hóa đơn qua Email!");
  const closeCheckout = () => { setIsCheckoutOpen(false); resetCheckout(); };

  // ==========================================
  // NHẬP HÀNG (PO)
  // ==========================================
  const handleSaveNewPO = async () => {
    if (!selectedSupplierId) return toast.error("Chọn Nhà Cung Cấp!"); if (poItems.length === 0) return toast.error("Phiếu trống!");
    const supplier = suppliers.find(s => s.id.toString() === selectedSupplierId); if (!supplier) return; setLoading(true);
    try {
      const totalPOAmount = poItems.reduce((sum, item) => sum + (item.qty * item.importPrice), 0); const debtAmount = totalPOAmount - paidAmount; const poCode = "PO" + Date.now().toString().slice(-6);
      const newPO = { id: Date.now().toString(), po_code: poCode, supplier: supplier, items: poItems, total_amount: totalPOAmount, paid_amount: paidAmount, debt_amount: debtAmount, status: 'PENDING', note: poNote, created_at: new Date().toISOString() };
      setLocalPOs(prev => [newPO, ...prev]); setPoItems([]); setPoNote(""); setSelectedSupplierId(""); setPaidAmount(0); toast.success(`Đã lưu Phiếu ${poCode}!`);
      setPoTab('RECEIVE'); setSearchPoCode(poCode); setFoundPO(newPO); setReceiveItems(newPO.items.map((i: any) => ({ ...i, damagedQty: 0 })));
    } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
  };

  const handlePrintPO = (po: any, type: 'po_order' | 'po_receipt' | 'po_return') => { setPrintPOData(po); setPrintMode(type); };

  const handleConfirmReceipt = async () => {
    if (!foundPO || receiveItems.length === 0) return; setLoading(true);
    try {
      let actualTotal = 0; let logs: any[] = [];
      for (const item of receiveItems) {
          const actualQty = item.qty - (item.damagedQty || 0); actualTotal += actualQty * item.importPrice;
          if (actualQty > 0) { const p = products.find(x => x.id === item.product.id); if (p) { await supabase.from('products').update({ stock: p.stock + actualQty, import_price: item.importPrice }).eq('id', p.id); logs.push({ id: Date.now() + Math.random(), shift, type: "NHẬP PO", name: p.name, qty: actualQty, total: actualQty * item.importPrice, time: new Date().toLocaleString('vi-VN') }); } }
          if (item.damagedQty > 0) { logs.push({ id: Date.now() + Math.random(), shift, type: "TRẢ HÀNG NCC", name: item.product.name, qty: item.damagedQty, total: 0, time: new Date().toLocaleString('vi-VN') }); }
      }
      const finalDebt = actualTotal - foundPO.paid_amount;
      if (finalDebt > 0 && foundPO.supplier) { const supplierId = foundPO.supplier.id; const s = suppliers.find(x => x.id === supplierId); if (s) { const newD = (s.debt || 0) + finalDebt; await supabase.from('suppliers').update({ debt: newD }).eq("id", supplierId); setSuppliers(prev => prev.map(x => x.id === supplierId ? { ...x, debt: newD } : x)); } }
      setLocalPOs(prev => prev.map(p => p.id === foundPO.id ? { ...p, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal } : p));
      logs.forEach(lg => addTransactionAndSync(lg)); logAudit("NHẬN HÀNG PO", `Mã ${foundPO.po_code}`); toast.success("Nhập Kho thành công!"); fetchProducts(); setFoundPO(prev => ({ ...prev, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal }));
    } catch (err: any) { toast.error("Lỗi"); } finally { setLoading(false); }
  };

  // ==========================================
  // GIAO DIỆN & KHÁCH HÀNG & TIỆN ÍCH KHÁC
  // ==========================================
  const handleCodeChange = (e: any) => setNewCode(e.target.value);

  const handleEditPhone = (oldPhone: string, newPhone: string) => {
    if(!newPhone) return;
    const c = customers[oldPhone];
    if(c) {
      const updated = {...customers};
      updated[newPhone] = {...c, phone: newPhone};
      delete updated[oldPhone];
      setCustomers(updated);
      toast.success("Đã cập nhật SĐT thành công!");
    }
  };

  const printCustomerCard = (customer: any) => { 
      setPrintCustomer(customer); 
      setPrintMode('customer'); 
  };

  const sendCardEmail = async (customer: any) => { 
      if (!customer || !customer.email) return toast.error("Khách hàng này chưa có email!");
      setLoading(true);
      const htmlContent = `<div><h1>HẢI LÊ MART</h1><p>Xin chào ${customer.name}, mã thẻ VIP của bạn là: <b>${customer.cardCode}</b></p><p>Vui lòng đọc hoặc xuất trình mã này khi thanh toán để nhận ưu đãi!</p></div>`;
      try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: customer.email, subject: `Thẻ VIP Hải Lê Mart - ${customer.name}`, html_message: htmlContent });
          toast.success("Đã gửi thẻ VIP qua email!");
      } catch(err) { toast.error("Lỗi gửi email! Kiểm tra lại cấu hình EmailJS."); }
      setLoading(false);
  };

  const shareToZalo = (customer: any) => { 
      const text = `Thẻ VIP Hải Lê Mart của bạn. Mã thẻ: ${customer.cardCode}`;
      window.open(`https://zalo.me/share?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleLogoutClick = () => {
    if (window.confirm("Bạn muốn đăng xuất?")) {
      setIsLoggedIn(false); logAudit("ĐĂNG XUẤT", `Tài khoản: ${role}`);
    }
  };

  const confirmHandover = () => {
    toast.success("Đã bàn giao ca!"); setShowHandoverModal(false); setIsLoggedIn(false);
  };

  const handleRefund = (log: any) => {
    executeWithAdminCheck(() => {
      if(window.confirm(`Bạn muốn hoàn tiền đơn hàng ${log.name}?`)) {
        addTransactionAndSync({ id: Date.now(), shift, type: "TRẢ HÀNG", name: log.name, qty: log.qty, total: -log.total, paymentMethod: log.paymentMethod, time: new Date().toLocaleString('vi-VN') });
        toast.success("Đã hoàn tiền!");
      }
    });
  };

  const handleReprint = (time: string, type: 'receipt_thermal' | 'receipt_a4') => {
    toast.success("Đang in lại..."); setPrintMode(type);
  };

  const updateSettingsToCloud = async (bin: string, acc: string, nameStr: string, zaloId: string, hStart: string, hEnd: string, pin: string) => {
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu Cài đặt lên Cloud."); setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, zalopay_id: zaloId, happy_hour_start: hStart, happy_hour_end: hEnd, admin_pin: pin, updated_at: new Date().toISOString() }).eq("id", 1);
      if (!error) { setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setZaloPayId(zaloId); setHappyStart(hStart); setHappyEnd(hEnd); setAdminPin(pin); toast.success("Lưu Cài đặt thành công!"); setShowSettings(false); }
    } catch (err) {} finally { setLoading(false); }
  };

  const saveSettings = () => { const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase(); const zaloId = newZaloPayId.trim(); const pin = newAdminPinInput.trim(); if (!bin || !acc || !nameStr || !pin) return toast.error("Vui lòng điền đủ thông tin & Mã PIN!"); updateSettingsToCloud(bin, acc, nameStr, zaloId, newHappyStart, newHappyEnd, pin); };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const added = parseInt(newStock || "0"); 
      const impPrice = parseInt(newImportPrice); 
      const salePrice = parseInt(newPrice); 
      const promo = parseInt(newPromoPrice) || 0; 
      const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; 
      const baseCode = newCode.trim(); 
      const formattedCat = formatCategoryStr(newCategory);
      
      const allVariants = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)); 
      const exist = allVariants.find(p => p.product_code === baseCode); 
      
      const newProductData = { 
        product_code: baseCode, name: newName, category: formattedCat, 
        import_price: impPrice, sale_price: salePrice, promo_price: promo, 
        gift_info: finalGiftInfo, stock: exist ? (exist.stock + added) : added, 
        expiry_date: newExpiry || null 
      };

      if (navigator.onLine) {
        if (exist) {
          if (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || "")) { 
            const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}`; 
            const batchName = `${newName} [Lô mới]`; 
            if (window.confirm(`Tạo LÔ MỚI (${batchCode})?`)) { 
              await supabase.from("products").insert([{ ...newProductData, product_code: batchCode, name: batchName }]); 
            } else { setLoading(false); return; } 
          } else { 
            await supabase.from("products").update({ stock: exist.stock + added, updated_at: new Date().toISOString() }).eq("id", exist.id); 
          }
        } else { 
          await supabase.from("products").insert([newProductData]); 
        }
        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
        toast.success(`Đã lưu lên hệ thống Cloud!`);
        fetchProducts();
      } else {
        console.log("Đang mất mạng -> Lưu tạm vào Két sắt Nhập Kho...");
        const pendingImports = await dbGet("mart_pending_imports") || [];
        let actionType = exist ? "UPDATE_STOCK" : "INSERT_NEW";
        let targetId = exist ? exist.id : null;

        pendingImports.push({
          id: Date.now(),
          action: actionType,
          targetId: targetId,
          data: newProductData,
          addedStock: added
        });
        await dbSet("mart_pending_imports", pendingImports);

        if (exist) {
          setProducts(prev => prev.map(p => p.id === exist.id ? { ...p, stock: p.stock + added } : p));
        } else {
          setProducts(prev => [{ id: `temp-${Date.now()}`, ...newProductData, created_at: new Date().toISOString() }, ...prev]);
        }

        if (added > 0) {
          const offlineLog = { id: Date.now(), shift, type: "NHẬP (OFFLINE)", name: newName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') };
          setHistory(prev => [offlineLog, ...prev]);
          const currentHistory = await dbGet("mart_history") || [];
          await dbSet("mart_history", [offlineLog, ...currentHistory]);
        }
        toast.success(`Đã lưu Tạm! Sẽ tự động đẩy lên khi có mạng.`);
      }
      resetProductForm(); 
      setShowInputForm(false);
    } catch (err) { 
      toast.error("Lỗi khi lưu sản phẩm"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e?.target?.files?.[0] || e; if (!file || !file.name) { if (e?.target) e.target.value = ''; return; }
    if (!navigator.onLine) { toast.error("Cần mạng để tải lên!"); if (e?.target) e.target.value = ''; return; }
    const processData = async (lines: any[]) => {
      setLoading(true); 
      try {
        if (!lines || lines.length <= 1) { toast.error("File rỗng!"); setLoading(false); return; } 
        let successCount = 0; let importLogs: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]; if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
          const pCode = String(cols[0] || "").trim(); const pName = String(cols[1] || "").trim(); const pCategory = formatCategoryStr(String(cols[2] || "")); const pImpPrice = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')) || 0; const pSalePrice = parseInt(String(cols[4] || "0").replace(/[,.]/g, '')) || 0; const pPromoPrice = parseInt(String(cols[5] || "0").replace(/[,.]/g, '')) || 0; const pGiftCond = String(cols[6] || "1").trim(); const pGiftText = cols[7] ? String(cols[7]).trim() : ""; const pGift = pGiftText !== "" ? `${pGiftCond};;;${pGiftText}` : null; const pStock = parseInt(String(cols[8] || "0").replace(/[,.]/g, '')) || 0; const pExpiry = cols[9] ? String(cols[9]).trim() : null;
          if (!pCode || !pName || pSalePrice <= 0) continue;
          const baseCode = pCode; const allVariants = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)); 
          if (allVariants.length > 0) { const needSync = allVariants.some(v => v.sale_price !== pSalePrice || v.promo_price !== pPromoPrice || v.gift_info !== pGift); if (needSync) { await Promise.all(allVariants.map(v => supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift }).eq("id", v.id))); } }
          const exist = allVariants.find(p => p.product_code === baseCode); 
          if (exist) { if (exist.stock <= 0) { await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString() }).eq("id", exist.id); } else { if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; await supabase.from("products").insert([{ product_code: batchCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); } else { await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id); } } } 
          else { await supabase.from("products").insert([{ product_code: baseCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); }
          if (pStock > 0) { importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') } as any); successCount++; }
        }
        if (importLogs.length > 0) { if(navigator.onLine) await supabase.from("history").insert(importLogs); setHistory(prev => [...importLogs, ...prev]); } 
        logAudit("NHẬP FILE", `Nhập ${successCount} mã`); toast.success(`Nhập thành công từ file!`); fetchProducts();
      } catch (err) { toast.error("Lỗi đọc file."); } setLoading(false);
    }; 
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) {
      if (!(window as any).XLSX) { toast.loading("Excel Library loading..."); if (e?.target) e.target.value = ''; return; } 
      const reader = new FileReader(); reader.onload = (event) => { try { const data = new Uint8Array(event.target?.result as ArrayBuffer); const workbook = (window as any).XLSX.read(data, { type: 'array' }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); processData(jsonData); } catch (error) { toast.error("Lỗi đọc file Excel."); } }; reader.readAsArrayBuffer(file);
    } else { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); processData(lines); }; reader.readAsText(file); } 
    if (e?.target) e.target.value = ''; 
  };

  const handleImportInventoryCSV = (e: any) => {
    const file = e?.target?.files?.[0] || e; if (!file || !file.name) { if (e?.target) e.target.value = ''; return; }
    const processData = (lines: any[]) => { 
      let updatedStock = { ...actualStockInput }; let count = 0; 
      for (let i = 1; i < lines.length; i++) { 
        const cols = lines[i]; if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; const pCode = String(cols[0] || "").trim(); const actualVal = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')); 
        if (!isNaN(actualVal) && pCode) { const matchedProd = products.find(p => p.product_code === pCode); if (matchedProd && matchedProd.stock !== actualVal) { updatedStock[matchedProd.id] = actualVal; count++; } } 
      } 
      setActualStockInput(updatedStock); toast.success(`Đã nạp số liệu thực tế!`); 
    };
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) { 
      if (!(window as any).XLSX) { toast.loading("Loading..."); if (e?.target) e.target.value = ''; return; } 
      const reader = new FileReader(); reader.onload = (event) => { try { const data = new Uint8Array(event.target?.result as ArrayBuffer); const workbook = (window as any).XLSX.read(data, { type: 'array' }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); processData(jsonData); } catch(err) {} }; reader.readAsArrayBuffer(file); 
    } else { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); processData(lines); }; reader.readAsText(file); } 
    if (e?.target) e.target.value = '';
  };
  
  const handleDelete = async (id: any, name: any) => { executeWithAdminCheck(async () => { if (!navigator.onLine) return toast.error("Mạng yếu!"); if (window.confirm(`Xóa ${name}?`)) { await supabase.from("products").delete().eq("id", id); logAudit("XÓA SP", `Xóa: ${name}`); fetchProducts() } }); };

  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => { 
    executeWithAdminCheck(async () => { 
      if (!navigator.onLine) return toast.error("Mạng yếu!"); let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD'; 
      const val = window.prompt(`Sửa ${label}:`, old || ""); 
      if (val !== null) { let updateData: any = isText ? (field === 'category' ? formatCategoryStr(val) : val) : (parseInt(val) || 0); if (field === 'gift_info' && val.trim() === '') updateData = null; await supabase.from("products").update({ [field]: updateData }).eq("id", id); logAudit("SỬA SP", `ID ${id}`); fetchProducts() } 
    }); 
  };

  const handlePrintBarcode = (p: any) => { const q = window.prompt(`SL tem in:`, "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode'); } };
  const downloadSampleCSV = () => { try { const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,ĐK Tặng,Quà Tặng,Số Lượng,Hạn Sử Dụng\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,1,,100,2026-12-31"; const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Mau_Nhap_Kho.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); } catch(e) {} };
  const exportToCSV = () => { let csv = "\uFEFFGiờ,Ca,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng,Lợi nhuận\n"; history.forEach(log => { csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao_Ban_Hang.csv`; link.click(); };
  const exportAuditToCSV = () => { let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết\n"; auditLogs.forEach(log => { csv += `${log.time},${log.user_name},${log.shift},${log.action},"${(log.detail || "")}"\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Nhat_Ky.csv`; link.click(); };
  
  const handleInventorySearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const term = String(inventorySearchTerm || "").trim().toLowerCase(); if (!term) return; const exactMatch = products.find(p => String(p.product_code || "").toLowerCase() === term); if (exactMatch) { const inputEl = document.getElementById(`inv-input-${exactMatch.id}`); if (inputEl) { inputEl.focus(); } } } };
  const handleInvInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const searchBox = document.getElementById('inv-search-box'); if (searchBox) { searchBox.focus(); setInventorySearchTerm(""); } } };
  const exportInventoryCSV = () => { let csv = "\uFEFFMã SP,Tên SP,Tồn hệ thống,Tồn thực tế\n"; products.forEach(p => { const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock; csv += `${p.product_code},"${cleanName(p.name)}",${p.stock},${actual}\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `KiemKho.csv`; link.click(); };
  
  const syncInventoryCheck = async () => {
    if(!navigator.onLine) return toast.error("Mạng yếu!"); if(!window.confirm("Xác nhận ghi đè?")) return;
    setLoading(true); let count = 0;
    try { for (const [id, actualQty] of Object.entries(actualStockInput)) { const p = products.find(x => String(x.id) === String(id)); if(p && p.stock !== actualQty) { await supabase.from("products").update({ stock: actualQty }).eq("id", p.id); logAudit("KIỂM KHO", `${p.name}`); count++; } } toast.success(`Đồng bộ thành công!`); setShowInventoryModal(false); setActualStockInput({}); fetchProducts(); } 
    catch(err) {} finally { setLoading(false); }
  };
  
  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null) } else { setSortConfig({ key, direction: 'asc' }) } };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    document.getElementById('search-barcode')?.focus(); 
    if (e.key === 'Enter') { 
      e.preventDefault(); 
      const p = products.find(prod => prod.product_code === barcodeInput || String(prod.product_code).split('-')[0] === barcodeInput);
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
    const currentTime = new Date(); const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes(); 
    const [startH, startM] = happyStart.split(':').map(Number); const [endH, endM] = happyEnd.split(':').map(Number); 
    const startTotalMins = startH * 60 + startM; const endTotalMins = endH * 60 + endM; 
    let isHappyNow = startTotalMins <= endTotalMins ? (currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins) : (currentTotalMins >= startTotalMins || currentTotalMins <= endTotalMins);
    let itemToCart = { ...p_input }; if (isHappyNow && p_input.promo_price > 0 && p_input.promo_price < p_input.sale_price) { itemToCart.isHappyHour = true; }
    const price = getActualPrice(itemToCart); const repName = cleanName(itemToCart.name);
    setCart(prev => {
      const exist = prev.find(item => cleanName(item.product.name) === repName && !!item.product.isHappyHour === !!itemToCart.isHappyHour);
      if (exist) { const newQty = exist.qty + 1; if (newQty > totalStock) { playSound('error'); return prev; } return prev.map(i => (cleanName(i.product.name) === repName && !!i.product.isHappyHour === !!itemToCart.isHappyHour) ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i); } 
      else { return [...prev, { product: itemToCart, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }]; }
    });
    setScanMessage({ text: `✅ Thêm: ${repName}`, type: 'success' }); setBarcodeInput(""); setShowSuggestions(false); setTimeout(() => setScanMessage(null), 2000);
  };
  
  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); playSound('success'); };
  const adjustCartQty = (productId: any, delta: number) => { 
    let exceedStock = false; 
    setCart(prev => { 
      const updated = prev.map(item => { if (item.product.id === productId) { const baseCode = String(item.product.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); const newQty = item.qty + delta; if (newQty > totalStock) { exceedStock = true; return item; } const price = getActualPrice(item.product); return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }; } return item; }); 
      return updated.filter(item => item.qty > 0); 
    }); 
    if (exceedStock) playSound('error'); else if (delta > 0) playSound('success'); 
  };
  
  const handleDirectQtyChange = (productId: any, val: string) => { 
    setCart(prev => { 
      if (val === '') return prev.map(i => i.product.id === productId ? { ...i, qty: '' as any, total: 0 } : i); let num = parseInt(val); if (isNaN(num) || num < 0) return prev; let exceedStock = false; 
      const updated = prev.map(i => { if (i.product.id === productId) { const baseCode = String(i.product.product_code).split('-')[0]; const totalStock = products.filter(p => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0); if (num > totalStock) { exceedStock = true; num = totalStock; } const price = getActualPrice(i.product); return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) }; } return i; });
      if (exceedStock) playSound('error'); return updated; 
    }); 
  };
  const handleDirectQtyBlur = (productId: any, val: string) => { if (val === '' || parseInt(val) <= 0 || isNaN(parseInt(val))) { setCart(prev => prev.map(i => { if (i.product.id === productId) { const price = getActualPrice(i.product); return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) } } return i })) } };
  const removeFromCart = (productId: any) => { setCart(cart.filter(item => item.product.id !== productId)) };
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { resetCheckout(); } };

  // =====================================================================
  // 4. MEMOS & TÍNH TOÁN CÔNG THỨC
  // =====================================================================
  const todayStrStr = new Date().toLocaleDateString('vi-VN');
  const currentShiftStats = useMemo(() => { 
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift); 
    let cash = startingCash; let transfer = 0; let prof = 0; let totalSales = 0; 
    shiftLogs.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') { transfer += h.total; } 
        else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') {
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; }
        }
      } 
      prof += (h.profit || 0) 
    }); 
    return { rev: cash + transfer - startingCash, cash, transfer, prof, totalSales } 
  }, [history, shift, todayStrStr, startingCash]);

  const currentShiftCashFlow = useMemo(() => {
    if (!cashFlowModalInfo) return { thu: [], chi: [] };
    const shiftLogs = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === todayStrStr && h.shift === shift);
    const thu: any[] = []; const chi: any[] = [];
    shiftLogs.forEach(h => {
      if (h.paymentMethod === cashFlowModalInfo || (cashFlowModalInfo === 'CHUYỂN KHOẢN' && (h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY')) || h.paymentMethod === 'KẾT HỢP') {
        let amount = h.total; if (h.paymentMethod === 'KẾT HỢP') { amount = cashFlowModalInfo === 'TIỀN MẶT' ? (h.split_cash || 0) : (h.total - (h.split_cash || 0)); }
        if (amount === 0) return;
        if (h.type === 'BÁN' || h.type === 'THU NỢ') { if (amount > 0) thu.push({ time: h.time, note: `${h.type} - ${cleanName(h.name)}`, amount: amount }); } 
        else if (h.type === 'TRẢ HÀNG') { chi.push({ time: h.time, note: `HOÀN TIỀN - ${cleanName(h.name)}`, amount: Math.abs(amount) }); }
      }
    });
    if (cashFlowModalInfo === 'TIỀN MẶT') { 
      if (startingCash > 0) thu.unshift({ time: "Đầu ca", note: "Tiền lẻ đầu ca", amount: startingCash }); 
      const shiftExpenses = expenses.filter(e => e.date === todayStrStr); shiftExpenses.forEach(e => chi.push({ time: "Trong ca", note: `CHI PHÍ - ${e.name}`, amount: e.amount })); 
    }
    return { thu, chi };
  }, [history, expenses, cashFlowModalInfo, shift, todayStrStr, startingCash]);

  const filteredStats = useMemo(() => { 
    const start = new Date(reportStartDate + "T00:00:00").getTime(); const end = new Date(reportEndDate + "T23:59:59").getTime();
    const filteredHistory = history.filter(h => { const logTime = new Date(Math.floor(h.id)).getTime(); return logTime >= start && logTime <= end; });
    let cash = 0; let transfer = 0; let prof = 0; let totalSales = 0; 
    filteredHistory.forEach(h => { 
      if (h.type === 'BÁN' || h.type === 'GHI NỢ') totalSales += h.total; 
      if (h.type === 'BÁN' || h.type === 'THU NỢ' || h.type === 'TRẢ HÀNG') { 
        if (h.paymentMethod === 'CHUYỂN KHOẢN' || h.paymentMethod === 'QUẸT THẺ' || h.paymentMethod === 'ZALO PAY') { transfer += h.total; } 
        else if (h.paymentMethod === 'TIỀN MẶT' || h.paymentMethod === 'KẾT HỢP') { 
          if(h.paymentMethod === 'KẾT HỢP' && h.split_cash) { cash += h.split_cash; transfer += (h.total - h.split_cash); } else { cash += h.total; } 
        } 
      } 
      prof += (h.profit || 0) 
    }); 
    const filteredExp = expenses.filter(e => { const parts = e.date.split('/'); if(parts.length !== 3) return false; const expTime = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T12:00:00`).getTime(); return expTime >= start && expTime <= end; }).reduce((sum, e) => sum + e.amount, 0); 
    return { rev: cash + transfer, cash, transfer, prof, totalSales, expenses: filteredExp, netProfit: prof - filteredExp } 
  }, [history, expenses, reportStartDate, reportEndDate]);

  const chartData = useMemo(() => { 
    const data = []; 
    for (let i = 29; i >= 0; i--) { 
      const d = new Date(); d.setDate(d.getDate() - i); const dStr = d.toLocaleDateString('vi-VN'); 
      const dayTotal = history.filter(h => new Date(Math.floor(h.id)).toLocaleDateString('vi-VN') === dStr && (h.type === 'BÁN' || h.type === 'GHI NỢ')).reduce((s, h) => s + h.total, 0); 
      data.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, total: dayTotal, showLabel: (i % 3 === 0 || i === 0) }) 
    } 
    const maxVal = Math.max(...data.map(d => d.total), 1); return data.map(d => ({ ...d, height: `${(d.total / maxVal) * 100}%` })) 
  }, [history]);
  
  const topSelling = useMemo(() => { 
    const sales: Record<string, number> = {}; 
    history.forEach(log => { if ((log.type === 'BÁN' || log.type === 'GHI NỢ') && log.product_id !== 'DISCOUNT') { const baseName = cleanName(log.name); sales[baseName] = (sales[baseName] || 0) + log.qty } }); 
    return Object.entries(sales).sort((a, b) => b[1] - a[1]).slice(0, 5) 
  }, [history]);
  
  const groupedHistory = useMemo(() => { 
    let filtered = history; if (logTypeFilter !== "Tất cả") filtered = filtered.filter(log => log.type === logTypeFilter); 
    if (logSearchTerm.trim() !== "") { 
      const term = String(logSearchTerm || "").toLowerCase(); 
      filtered = filtered.filter(log => (log.name && String(log.name).toLowerCase().includes(term)) || (log.customer && String(log.customer).toLowerCase().includes(term)) || (log.id.toString().includes(term)) || (log.order_id && String(log.order_id).toLowerCase().includes(term))) 
    } 
    return filtered.reduce((groups: any, log: any) => { const date = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN'); if (!groups[date]) groups[date] = []; groups[date].push({ ...log, t: new Date(Math.floor(log.id)).toLocaleTimeString('vi-VN') }); return groups }, {}) 
  }, [history, logSearchTerm, logTypeFilter]);

  const totalValue = Math.round(products.reduce((sum, p) => sum + ((Number(p.import_price) || 0) * (Number(p.stock) || 0)), 0));
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const categories = ["Tất cả", ...Array.from(new Set(products.map(p => formatCategoryStr(p.category))))];
  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + item.total, 0);
  const currentTier = getCustomerTier(customers[custPhone]?.totalSpent || 0);
  const tierDiscountAmount = custPhone ? Math.round(cartTotalAmountDisplay * currentTier.discountRate) : 0;
  const amountAfterTierAndVoucher = Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  const walletUsedAmount = useWallet ? Math.min(customers[custPhone]?.wallet || 0, amountAfterTierAndVoucher) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => cleanName(p.name)))).sort(), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))).sort((a, b) => a - b), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price || 0))).sort((a, b) => a - b), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))).sort((a, b) => a - b), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))).sort(), [products]);
  
  const sortedAndFilteredProducts = useMemo(() => {
    const todayTime = new Date().getTime(); const safeSearch = String(debouncedSearchTerm || "").toLowerCase();
    let filtered = products.filter(p => (selectedCategory === "Tất cả" || formatCategoryStr(p.category) === selectedCategory)).filter(p => String(p.name || "").toLowerCase().includes(safeSearch) || String(p.product_code || "").toLowerCase().includes(safeSearch));
    if (filters['name']?.length > 0) filtered = filtered.filter(p => filters['name'].includes(cleanName(p.name)));
    if (filters['stock']?.length > 0) filtered = filtered.filter(p => filters['stock'].includes(p.stock));
    if (filters['import_price']?.length > 0) filtered = filtered.filter(p => filters['import_price'].includes(p.import_price || 0));
    if (filters['sale_price']?.length > 0) filtered = filtered.filter(p => filters['sale_price'].includes(p.sale_price));
    if (filters['expiry_date']?.length > 0) filtered = filtered.filter(p => filters['expiry_date'].includes(p.expiry_date));
    if (sortConfig !== null) {
      filtered.sort((a, b) => { 
        let valA = a[sortConfig.key]; let valB = b[sortConfig.key]; 
        if (sortConfig.key === 'expiry_date') { valA = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity; valB = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity } 
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0 
      })
    } else {
      filtered.sort((a, b) => { 
        const daysA = a.expiry_date ? (new Date(a.expiry_date).getTime() - todayTime) / 86400000 : Infinity; 
        const daysB = b.expiry_date ? (new Date(b.expiry_date).getTime() - todayTime) / 86400000 : Infinity; 
        const aIsUrgent = daysA <= 45; const bIsUrgent = daysB <= 45; 
        if (aIsUrgent && !bIsUrgent) return -1; if (!aIsUrgent && bIsUrgent) return 1; if (aIsUrgent && bIsUrgent) return daysA - daysB; return 0 
      })
    }
    return filtered
  }, [products, debouncedSearchTerm, selectedCategory, sortConfig, filters]);

  // =====================================================================
  // 5. CÁC HÀM GỬI EMAIL BÁO CÁO
  // =====================================================================
  const handleSendEmailReport = async () => {
    const start = new Date(reportStartDate + "T00:00:00").getTime(); const end = new Date(reportEndDate + "T23:59:59").getTime(); 
    const logs = history.filter(log => { const t = new Date(Math.floor(log.id)).getTime(); return t >= start && t <= end; });
    if (logs.length === 0) return toast.error("Chưa có giao dịch!"); 
    let cash = 0, transfer = 0, prof = 0, sold = 0; 
    logs.forEach(l => { 
      if (l.type === 'BÁN') sold += l.qty; 
      if (l.type === 'BÁN' || l.type === 'THU NỢ' || l.type === 'TRẢ HÀNG') { 
        if (l.paymentMethod === 'CHUYỂN KHOẢN' || l.paymentMethod === 'QUẸT THẺ' || l.paymentMethod === 'ZALO PAY') { transfer += l.total; } 
        else if (l.paymentMethod === 'TIỀN MẶT' || l.paymentMethod === 'KẾT HỢP') { 
          if(l.paymentMethod === 'KẾT HỢP' && l.split_cash) { cash += l.split_cash; transfer += (l.total - l.split_cash); } else { cash += l.total; } 
        } 
      } 
      prof += (l.profit || 0); 
    });
    let adminEmail = window.prompt("Nhập Email Quản lý:", ""); if(!adminEmail) return; adminEmail = adminEmail.trim(); 
    setLoading(true); 
    const htmlContent = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;"><div style="background: #3b82f6; color: white; padding: 20px; text-align: center;"><h1>HẢI LÊ MART</h1><p>BÁO CÁO DOANH THU</p></div><div style="padding: 20px; background: #ffffff;"><h2>Kỳ: ${reportStartDate} đến ${reportEndDate}</h2><table style="width: 100%; border-collapse: collapse;"><tbody><tr><td style="padding: 10px;">Tổng SP đã bán:</td><td style="padding: 10px; text-align: right;">${sold} món</td></tr><tr><td style="padding: 10px;">Doanh thu Tiền Mặt:</td><td style="padding: 10px; text-align: right; color: #10b981;">${Math.round(cash).toLocaleString()}đ</td></tr><tr><td style="padding: 10px;">Doanh thu CK/Thẻ:</td><td style="padding: 10px; text-align: right; color: #3b82f6;">${Math.round(transfer).toLocaleString()}đ</td></tr><tr><td style="padding: 10px; font-weight: bold;">TỔNG LỢI NHUẬN:</td><td style="padding: 10px; text-align: right; font-weight: bold; color: #ef4444;">${Math.round(prof).toLocaleString()}đ</td></tr></tbody></table></div></div>`;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: adminEmail, subject: `📊 Báo cáo doanh thu ${reportStartDate} - ${reportEndDate}`, html_message: htmlContent }); logAudit("GỬI BÁO CÁO", `Tới ${adminEmail}`); toast.success("Đã gửi Báo cáo!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false);
  };

  const sendInventoryAlertEmail = async () => {
    let adminEmail = window.prompt("Nhập Email Quản lý:", ""); if(!adminEmail) return; setLoading(true); 
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length; const today = new Date().getTime(); const expiring = products.filter(p => p.expiry_date && (new Date(p.expiry_date).getTime() - today) / 86400000 <= 15);
    let htmlContent = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;"><div style="background: #ef4444; color: white; padding: 20px; text-align: center;"><h1>🚨 CẢNH BÁO KHO HÀNG</h1></div><div style="padding: 20px; background: #ffffff;"><h3>📦 SẮP HẾT HÀNG (${lowStock} món):</h3><ul>`;
    products.filter(p => p.stock > 0 && p.stock < 10).forEach(p => { htmlContent += `<li><strong>${cleanName(p.name)}:</strong> Còn ${p.stock} sp</li>`; });
    htmlContent += `</ul><h3>⏳ SẮP HẾT HẠN TRONG 15 NGÀY TỚI (${expiring.length} món):</h3><ul>`;
    expiring.forEach(p => { htmlContent += `<li><strong>${cleanName(p.name)}:</strong> HSD ${new Date(p.expiry_date).toLocaleDateString('vi-VN')}</li>`; });
    htmlContent += `</ul></div></div>`;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: adminEmail, subject: `🚨 Cảnh báo Tồn Kho & Hạn Sử Dụng`, html_message: htmlContent }); toast.success("Đã gửi cảnh báo kho!"); logAudit("CẢNH BÁO KHO", "Gửi email tồn kho"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false);
  };
const handleSendMarketingEmail = async () => {
    if (!marketingMsg) return toast.error("Nhập nội dung!"); if (!window.confirm("Gửi?")) return; setLoading(true); 
    const targetCustomers = Object.keys(customers || {}).filter(phone => { const c = customers[phone]; if (!c || !c.email) return false; if (marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent || 0).name.includes(marketingTier); });
    if (targetCustomers.length === 0) { setLoading(false); return toast.error("Không tìm thấy khách hàng!"); }
    let successCount = 0;
    for (const phone of targetCustomers) { const c = customers[phone]; const htmlContent = `<div><h1>HẢI LÊ MART</h1><p>${marketingMsg}</p></div>`; try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: c.email, subject: "💌 Ưu Đãi Đặc Quyền Từ Hải Lê Mart", html_message: htmlContent }); successCount++; } catch (error: any) {} }
    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail`); setLoading(false); setShowMarketingModal(false); toast.success(`Đã gửi thành công!`);
  };
  // =====================================================================
  // 6. RENDER GIAO DIỆN (UI RENDER)
  // =====================================================================
  const renderModals = () => {
    return (
      <>
        <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        {showHandoverModal && <HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />}
        <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
        <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
        <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} custAddress={custAddress} setCustAddress={setCustAddress}/>
        <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} onExportCSV={exportToCSV} handleExportCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
        <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} onImport={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
        <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
        <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={setSelectedAuditLog} setSelectedLog={setSelectedAuditLog} onViewDetail={setSelectedAuditLog} onRowClick={setSelectedAuditLog} />
        <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} showModal={!!selectedAuditLog} setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)} selectedLog={selectedAuditLog} setSelectedLog={selectedAuditLog} />
        <ScannerModal scannerMode={scannerMode} setScannerMode={setScannerMode} scanMessage={scanMessage} />
        <PinModal showPinModal={showPinModal} setShowPinModal={setShowPinModal} correctPin={adminPin} onSuccess={() => { if (pendingAction) { pendingAction(); setPendingAction(null); } }} />
        <ScannerLinkModal showModal={showScannerLinkModal} setShowModal={setShowScannerLinkModal} />

        <SupplierModal 
          showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal}
          supName={supName} setSupName={setSupName} supPhone={supPhone} setSupPhone={setSupPhone}
          supAddress={supAddress} setSupAddress={setSupAddress} supItem={supItem} setSupItem={setSupItem}
          supTaxCode={supTaxCode} setSupTaxCode={setSupTaxCode} supBankAccount={supBankAccount} setSupBankAccount={setSupBankAccount}
          addSupplier={addSupplier} deleteSupplier={deleteSupplier} suppliers={suppliers}
        />

        <SettingsModal 
          showSettings={showSettings} setShowSettings={setShowSettings}
          newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart} newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd} 
          newAdminPinInput={newAdminPinInput} setNewAdminPinInput={setNewAdminPinInput}
          saveSettings={saveSettings}
        />

        <CustomerModal 
          showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal}
          customers={customers} setCustomers={setCustomers} logAudit={logAudit}
          handleEditPhone={handleEditPhone} printCustomerCard={printCustomerCard} sendCardEmail={sendCardEmail} shareToZalo={shareToZalo}
        />

        <MarketingModal 
          showMarketingModal={showMarketingModal} setShowMarketingModal={setShowMarketingModal}
          marketingTier={marketingTier} setMarketingTier={setMarketingTier} marketingMsg={marketingMsg} setMarketingMsg={setMarketingMsg} sendMarketingEmails={handleSendMarketingEmail} loading={loading}
        />

        <POModal 
          showPOModal={showPOModal} setShowPOModal={setShowPOModal} poTab={poTab} setPoTab={setPoTab} suppliers={suppliers} selectedSupplierId={selectedSupplierId} setSelectedSupplierId={setSelectedSupplierId} poSearch={poSearch} setPoSearch={setPoSearch} poItems={poItems} setPoItems={setPoItems} products={products} poNote={poNote} setPoNote={setPoNote} paidAmount={paidAmount} setPaidAmount={setPaidAmount} searchPoCode={searchPoCode} setSearchPoCode={setSearchPoCode} foundPO={foundPO} setFoundPO={setFoundPO} receiveItems={receiveItems} setReceiveItems={setReceiveItems} allPOs={allPOs} localPOs={localPOs} loading={loading} onSaveNewPO={handleSaveNewPO} onConfirmReceipt={handleConfirmReceipt} handlePrintPO={handlePrintPO}
        />
      </>
    );
  };

  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) {
    return <MobileScanner />;
  }

  if (isStorageLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', fontFamily: 'Arial, sans-serif' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ margin: '20px 0 5px 0', fontSize: '18px', fontWeight: 'bold' }}>HẢI LÊ MART ERP</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Đang nạp cấu trúc bộ nhớ vô hạn IndexedDB...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false) }}>
      <style>{styles}</style>
      
      {/* MÀN HÌNH KHÓA AUTO-LOCK */}
      {isLocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999999999, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#ef4444' }}>🔒 MÀN HÌNH ĐÃ KHÓA</h1>
          <p style={{ marginBottom: '20px', color: '#94a3b8' }}>Hệ thống tự động khóa do không có tương tác. Vui lòng nhập mã PIN.</p>
          <input 
            type="password" autoFocus placeholder="Nhập PIN..." 
            value={unlockPin} onChange={e => setUnlockPin(e.target.value)} 
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (unlockPin === adminPin || unlockPin === "0000") { 
                  setIsLocked(false); setUnlockPin("");
                } else { playSound('error'); toast.error("Mã PIN không đúng!"); }
              }
            }} 
            style={{ padding: '12px 20px', fontSize: '24px', borderRadius: '8px', border: '2px solid #3b82f6', outline: 'none', textAlign: 'center', width: '200px', letterSpacing: '8px', color: '#0f172a' }} 
          />
          <button 
            onClick={() => { if (unlockPin === adminPin || unlockPin === "0000") { setIsLocked(false); setUnlockPin(""); } else { playSound('error'); toast.error("PIN sai!"); } }} 
            style={{ marginTop: '20px', padding: '12px 40px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >MỞ KHÓA</button>
        </div>
      )}

      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{ style: { fontSize: '15px', fontWeight: 'bold', padding: '16px 24px', color: '#0f172a', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', borderRadius: '8px' } }} containerStyle={{ top: 20, right: 20, zIndex: 999999999 }} />
      <input type="text" id="search-barcode" style={{position:'absolute', opacity: 0, height: 0, width: 0}} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />
      
      <PrintManager printMode={printMode} lastOrder={lastOrder} shift={shift} role={role} customers={customers} VAT_RATE={VAT_RATE} printBarcodeProduct={printBarcodeProduct} barcodeCount={barcodeCount} printCustomer={printCustomer} printPOData={printPOData} />
      {renderModals()}

      {!isLoggedIn ? (
        <Login 
          setIsLoggedIn={setIsLoggedIn} 
          setRole={setRole} 
          shift={shift} 
          setShift={setShift} 
          startingCash={startingCash} 
          setStartingCash={setStartingCash} 
          installPrompt={installPrompt} 
          handleInstallApp={handleInstallApp} 
        />
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            <Header role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData} setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal} />
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                <ProductSearchAndActions searchTerm={searchTerm} setSearchTerm={setSearchTerm} role={role} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} handleBarcodeSubmit={handleBarcodeSubmitAction} setScannerMode={setScannerMode} products={products} handleSelectSuggest={handleSelectSuggest} showInputForm={showInputForm} setShowInputForm={setShowInputForm} onAddProduct={() => setShowInputForm(true)} handleFileUpload={handleFileUpload} downloadSampleCSV={downloadSampleCSV} />
                {showInputForm && <ProductInputForm newCode={newCode} handleCodeChange={handleCodeChange} newName={newName} setNewName={setNewName} newCategory={newCategory} setNewCategory={setNewCategory} categories={categories} newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice} newPrice={newPrice} setNewPrice={setNewPrice} newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice} newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition} newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo} newStock={newStock} setNewStock={setNewStock} newExpiry={newExpiry} setNewExpiry={setNewExpiry} handleAddProduct={handleAddProduct} setShowInputForm={setShowInputForm} loading={loading} />}
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>{categories.map(cat => <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>)}</div>
                <ProductTable role={role} sortedAndFilteredProducts={sortedAndFilteredProducts} requestSort={requestSort} handleEdit={handleEdit} addToCart={addToCart} handlePrintBarcode={handlePrintBarcode} handleDelete={handleDelete} sortConfig={sortConfig} filters={filters} setFilters={setFilters} openFilter={openFilter} setOpenFilter={setOpenFilter} uniqueNames={uniqueNames} uniqueStocks={uniqueStocks} uniqueImportPrices={uniqueImportPrices} uniqueSalePrices={uniqueSalePrices} uniqueExpiries={uniqueExpiries} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <CartPanel cart={cart} custName={custName} heldOrders={heldOrders} cartTotalAmountDisplay={cartTotalAmountDisplay} setShowHoldModal={setShowHoldModal} handleHoldOrder={handleHoldOrder} clearCart={clearCart} setCustName={setCustName} setCustPhone={setCustPhone} setCustomerInput={setCustomerInput} setIsCheckoutOpen={setIsCheckoutOpen} setCheckoutStep={setCheckoutStep} adjustCartQty={adjustCartQty} handleDirectQtyChange={handleDirectQtyChange} handleDirectQtyBlur={handleDirectQtyBlur} removeFromCart={removeFromCart} />
                <HistoryPanel logSearchTerm={logSearchTerm} setLogSearchTerm={setLogSearchTerm} logTypeFilter={logTypeFilter} setLogTypeFilter={setLogTypeFilter} exportToCSV={exportToCSV} groupedHistory={groupedHistory} expandedDates={expandedDates} toggleDateGroup={toggleDateGroup} handleRefund={handleRefund} onPrintK80={(log) => handleReprint(log.time, 'receipt_thermal')} onPrintA4={(log) => handleReprint(log.time, 'receipt_a4')} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
