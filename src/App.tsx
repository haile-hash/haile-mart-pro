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
import { Login } from "./components/auth/Login"; // ĐÃ IMPORT COMPONENT LOGIN MỚI

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
  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) {
    return <MobileScanner />;
  }

  const VAT_RATE = 0.1;
  const EMAILJS_SERVICE_ID = "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = "template_m1j9i7k";
  const EMAILJS_TEMPLATE_VIP_ID = "template_t91erhg";
  const EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";
  const IDLE_TIMEOUT = 5 * 60 * 1000; 

  // KHỞI TẠO EMAILJS
  useEffect(() => { emailjs.init(EMAILJS_PUBLIC_KEY); }, []);

  // =====================================================================
  // 1. TẤT CẢ STATES VÀ HOOKS
  // =====================================================================
  const [isStorageLoading, setIsStorageLoading] = useState(true); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPin, setUnlockPin] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null); // PWA Install Prompt State

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

  // PWA: Bắt sự kiện cài đặt App
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

  // AUTO-LOCK MÀN HÌNH SAU 5 PHÚT
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

  // DEBOUNCE SEARCH
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // KHỞI TẠO INDEXEDDB
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

  // ĐỒNG BỘ INDEXEDDB
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

  // CÁC EFFECTS HỆ THỐNG KHÁC
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

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts(); loadCloudData(); fetchSettingsFromCloud(); 
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "remote_scans" }, (payload) => { 
          setScanQueue(prev => [...prev, payload.new.code]); 
        }).subscribe();
        
      const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"; 
      script.onload = () => { if(EMAILJS_PUBLIC_KEY) { emailjs.init(EMAILJS_PUBLIC_KEY); } }; document.head.appendChild(script);
      const xlsxScript = document.createElement("script"); xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; document.head.appendChild(xlsxScript);
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn, EMAILJS_PUBLIC_KEY]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any; let lastScanTime = 0;
      const loadScanner = () => { 
        if ((window as any).Html5QrcodeScanner) { 
          scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); 
          scanner.render((text: string) => { 
            const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScanQueue(prev => [...prev, text]); 
          }, undefined) 
        } 
      };
      if (!(window as any).Html5QrcodeScanner) { 
        const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script) 
      } else { loadScanner(); }
      return () => { if (scanner) scanner.clear().catch(() => { }) }
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scanQueue.length > 0) {
      const currentCode = scanQueue[0];
      if (scannerMode === 'product' || scannerMode === null) { 
        const p = findProductByCode(currentCode); 
        if (p) { handleSelectSuggest(p); playSound('success'); } 
        else { 
          const matchedPhone = Object.keys(customers || {}).find(phone => phone === currentCode.trim() || customers[phone]?.cardCode === currentCode.trim()); 
          if (matchedPhone) { playSound('success'); setCustomerInput(customers[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customers[matchedPhone].name}`, type: 'success' }) } 
          else { playSound('error'); setScanMessage({ text: `❌ Lỗi mã`, type: 'error' }) } 
        } 
      }
      else if (scannerMode === 'voucher') { 
        const code = currentCode.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; 
        if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: 'success' }) } 
        else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); setScanMessage({ text: `✅ Giảm ${Number(code).toLocaleString()}đ`, type: 'success' }) } 
        else { playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) } 
      }
      else if (scannerMode === 'customer') { 
        const val = currentCode.trim(); setCustomerInput(val); 
        const matchedPhone = Object.keys(customers || {}).find(phone => phone === val || customers[phone]?.cardCode === val); 
        if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setCustAddress(customers[matchedPhone].address || ""); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customers[matchedPhone].name}`, type: 'success' }) } 
        else { setCustPhone(val); setCustName(""); setCustAddress(""); playSound('success'); setScanMessage({ text: `✅ Đã quét mã (Khách mới)`, type: 'success' }) } 
      }
      setTimeout(() => setScannerMode(null), 1000); setTimeout(() => setScanMessage(null), 1500); setScanQueue(prev => prev.slice(1));
    }
  }, [scanQueue, products, scannerMode]);

  useEffect(() => {
    if (!printMode) { isPrintingRef.current = false; return; }
    if (isPrintingRef.current) return; isPrintingRef.current = true;
    const handleAfterPrint = () => { setPrintMode(null); isPrintingRef.current = false; };
    window.addEventListener('afterprint', handleAfterPrint);
    const timer = setTimeout(() => { if (printMode) { window.print(); } }, 1500);
    return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); };
  }, [printMode, setPrintMode]);

  useEffect(() => {
    if (showPOModal && poTab === 'RECEIVE') {
      const fetchPOs = async () => {
        setLoading(true);
        try {
          if (navigator.onLine) {
            const { data } = await supabase.from('purchase_orders_v2').select('*').order('created_at', { ascending: false }).limit(50);
            if (data) {
               const merged = [...localPOs]; data.forEach(d => { if (!merged.find(m => m.id === d.id)) merged.push(d); });
               merged.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); setAllPOs(merged);
            } else { setAllPOs(localPOs); }
          } else { setAllPOs(localPOs); }
        } catch(e) { setAllPOs(localPOs); }
        setLoading(false);
      };
      fetchPOs();
    }
  }, [showPOModal, poTab, localPOs]);

  // =====================================================================
  // 3. ACTION FUNCTIONS (HÀM XỬ LÝ)
  // =====================================================================
  const addTransactionAndSync = async (logData: any) => {
    setHistory(prev => [logData, ...prev]);
    if (navigator.onLine) { try { await supabase.from("history").insert([logData]); } catch (err) {} }
  };

  const logAudit = async (action: string, detail: string, extraData: any = null) => { 
    const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: role === 'admin' ? 'Quản lý' : 'Thu ngân', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; 
    setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); 
  };

  const fetchProducts = async () => { 
    try {
      if (navigator.onLine) {
        // KHI CÓ MẠNG: Lấy dữ liệu mới nhất từ Cloud
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
        
        if (data && !error) { 
          setProducts(data);
          // Lén lưu một bản copy vào ổ cứng máy tính để dùng lúc rớt mạng
          await dbSet("mart_products_cache", data);
        } else {
          // Mạng chập chờn, lỗi truy vấn -> Lôi đồ dự phòng ra dùng
          const localData = await dbGet("mart_products_cache");
          if (localData) setProducts(localData);
        }
      } else {
        // KHI MẤT MẠNG HÀN TOÀN: Bốc thẳng từ ổ cứng ra
        console.log("Đang tải sản phẩm từ bộ nhớ Offline...");
        const localData = await dbGet("mart_products_cache");
        if (localData) setProducts(localData);
      }
    } catch (err) {
      // Lỗi bất ngờ -> Vẫn ưu tiên lôi đồ dự phòng ra để không bị sập App
      const localData = await dbGet("mart_products_cache");
      if (localData) setProducts(localData);
    }
  };
  const updateSettingsToCloud = async (bin: string, acc: string, nameStr: string, zaloId: string, hStart: string, hEnd: string) => {
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu cài đặt lên Cloud."); setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, zalopay_id: zaloId, happy_hour_start: hStart, happy_hour_end: hEnd, updated_at: new Date().toISOString() }).eq("id", 1);
      if (!error) { setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setZaloPayId(zaloId); setHappyStart(hStart); setHappyEnd(hEnd); toast.success("Lưu thành công!"); setShowSettings(false); }
    } catch (err) {} finally { setLoading(false); }
  };

  const saveSettings = () => { const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase(); const zaloId = newZaloPayId.trim(); if (!bin || !acc || !nameStr) return toast.error("Vui lòng điền đủ thông tin Ngân hàng!"); updateSettingsToCloud(bin, acc, nameStr, zaloId, newHappyStart, newHappyEnd); };
  
  const handleLogoutClick = () => setShowHandoverModal(true);
  const confirmHandover = async () => { try { if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) {} finally { await dbRemove("mart_logged_in"); await dbRemove("mart_role"); await dbRemove("mart_shift"); localStorage.removeItem("mart_was_logged_in"); setIsLoggedIn(false); window.location.reload(); } };
  const handleEditPhone = async (oldPhone: string) => { executeWithAdminCheck(() => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customers[newPhone]) return toast.error("SĐT đã tồn tại!"); const cData = customers[oldPhone]; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = { ...cData, phone: newPhone }; delete updated[oldPhone]; return updated }); toast.success("Cập nhật thành công!"); } }); };
  const addSupplier = async () => { if (!supName || !supPhone) return toast.error("Nhập đủ Tên/SĐT"); const newId = Date.now(); const newSupData = { id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, taxCode: supTaxCode, bankAccount: supBankAccount, debt: 0 }; setSuppliers(prev => [newSupData, ...prev]); if (navigator.onLine) { supabase.from('suppliers').insert([newSupData]).then(); } setSupName(""); setSupPhone(""); setSupAddress(""); setSupItem(""); setSupTaxCode(""); setSupBankAccount(""); toast.success("Thêm NCC thành công!"); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); };
  const addExpense = async () => { if (!expName || !expAmount) return toast.error("Nhập chi phiếu!"); setExpenses(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }, ...prev]); setExpName(""); setExpAmount(""); toast.success("Đã ghi nhận chi phí!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); };
  const closeCheckout = () => { resetCheckout() };
  const handleHoldOrder = async () => { if (cart.length === 0) return; const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }; setHeldOrders(prev => [...prev, newO]); logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); resetCheckout(); toast.success("Đã lưu tạm đơn hàng!"); };
  const restoreOrder = async (order: any) => { if (cart.length > 0) return toast.error("Vui lòng thanh toán giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); setShowHoldModal(false); toast.success("Đã mở lại đơn tạm!"); };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); logAudit("XÓA ĐƠN", `Xóa đơn lưu tạm`); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); toast.success("Đã xóa đơn tạm!"); };

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); toast.success(`Đã áp dụng mã giảm ${VOUCHERS[code].toLocaleString()}đ`); } 
      else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); toast.success(`Đã giảm trực tiếp ${Number(code).toLocaleString()}đ`); } 
      else { playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customers || {}).find(phone => phone === val.trim() || customers[phone]?.cardCode === val.trim());
    if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customers[matchedPhone].name); setCustAddress(customers[matchedPhone].address || ""); setUseWallet(false); } 
    else { setCustPhone(val); setCustName(""); setCustAddress(""); setUseWallet(false); }
  };

  const handleNextToQR = () => { if (cart.length === 0) return toast.error("Giỏ hàng trống!"); if (custPhone && !customers[custPhone] && !custName) return toast.error("Vui lòng nhập Tên khách mới!"); setCheckoutStep(2); };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return toast.error("Lỗi số lượng sản phẩm!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return toast.error("Thanh toán Ghi nợ cần SĐT Khách hàng!");
    setLoading(true); 
    try {
      let newLogs: any[] = []; const baseTotal = cartTotalAmountDisplay; const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); const vatTotal = baseTotal - subTotal; const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; const orderIdStr = "HD" + Date.now().toString().slice(-6);
      for (const item of cart) {
        if (navigator.onLine) await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.qty) }).eq("id", item.product.id);
        let splitCashAmt = 0; if(payMethod === 'KẾT HỢP') { splitCashAmt = Math.round((Number(customerGiven) / finalTotal) * Math.round(item.qty * getActualPrice(item.product) * (1 + VAT_RATE))); }
        const newLog = { id: Date.now() + Math.random(), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(item.product.name), qty: item.qty, total: item.total, profit: Math.round(item.qty * (getActualPrice(item.product) - (item.product.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN'), order_id: orderIdStr };
        newLogs.push(newLog);
      }
      if (custPhone) {
        const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
        const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (customers[custPhone]?.wallet || 0) : Math.round((customers[custPhone]?.wallet || 0) - walletUsedAmount + earned), debt: (customers[custPhone]?.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (customers[custPhone]?.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: customers[custPhone]?.email || "", address: custAddress || customers[custPhone]?.address || "", cardCode: customers[custPhone]?.cardCode || "" }; 
        setCustomers(prev => ({ ...prev, [custPhone]: updatedCust })); if (navigator.onLine) { await supabase.from("customers").upsert({ phone: custPhone, ...updatedCust }); }
      }
      setHistory(prev => [...newLogs, ...prev]); if (navigator.onLine) { try { await supabase.from("history").insert(newLogs); } catch(err) { console.log(err); } }
      setLastOrder({ orderId: orderIdStr, shift, cart: [...cart], subTotal, vatTotal, finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: appliedVoucherAmount + tierDiscountAmount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0, custPhone, custName });
      setCheckoutStep(3); fetchProducts(); 
    } catch (err) { toast.error("Lỗi thanh toán: " + err.message); } finally { setLoading(false); }
  };

  const handleRefund = async (logId: any) => { 
    executeWithAdminCheck(async () => { 
      const log = history.find(l => l.id === logId); if (!log || (log.type !== 'BÁN' && log.type !== 'GHI NỢ')) return;
      const qtyInput = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nSố lượng đã mua: ${log.qty}\n\nNhập SỐ LƯỢNG khách muốn trả lại:`, log.qty.toString()); if (qtyInput === null) return; 
      const refundQty = parseInt(qtyInput); if (isNaN(refundQty) || refundQty <= 0 || refundQty > log.qty) { return toast.error("Số lượng hoàn trả không hợp lệ!"); }
      const singlePrice = log.total / log.qty; const refundTotal = Math.round(singlePrice * refundQty); const singleProfit = (log.profit || 0) / log.qty; const refundProfit = Math.round(singleProfit * refundQty);
      let selectedMethod = "TIỀN MẶT";
      if (log.type === 'GHI NỢ') {
        if (!window.confirm(`Đơn mua nợ. Hệ thống tự trừ ${refundTotal.toLocaleString()}đ dư nợ?`)) return; selectedMethod = "TRỪ NỢ";
        const phoneMatch = log.customer.match(/\((.*?)\)/); const customerPhone = phoneMatch ? phoneMatch[1] : null;
        if (customerPhone && customers[customerPhone]) { const custData = customers[customerPhone]; const newDebt = Math.max(0, (custData.debt || 0) - refundTotal); setCustomers(prev => ({ ...prev, [customerPhone]: { ...custData, debt: newDebt } })); if (navigator.onLine) { await supabase.from("customers").update({ debt: newDebt }).eq("phone", customerPhone); } }
      } else {
        const choice = window.prompt(`Hình thức hoàn tiền:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN\n3. HOÀN VÀO VÍ VIP`, "1"); if (choice === null) return; 
        if (choice === "2") selectedMethod = "CHUYỂN KHOẢN"; if (choice === "3") selectedMethod = "VÍ WALLET";
        if (choice === "3") {
          const phoneMatch = log.customer.match(/\((.*?)\)/); const customerPhone = phoneMatch ? phoneMatch[1] : null; if (!customerPhone || !customers[customerPhone]) { return toast.error("Khách lẻ không hoàn Ví VIP được!"); }
          const custData = customers[customerPhone]; setCustomers(prev => ({ ...prev, [customerPhone]: { ...custData, wallet: Math.round((custData.wallet || 0) + refundTotal) } })); if (navigator.onLine) { await supabase.from("customers").update({ wallet: Math.round((custData.wallet || 0) + refundTotal) }).eq("phone", customerPhone); }
        }
      }
      if (log.product_id) { const currentProd = products.find(p => p.id === log.product_id); if (currentProd) { const updatedStock = (currentProd.stock || 0) + refundQty; if (navigator.onLine) { try { await supabase.from("products").update({ stock: updatedStock }).eq("id", log.product_id); } catch (e) {} } } }
      const lg = { id: Date.now(), shift, type: "TRẢ HÀNG", name: `HOÀN: ${cleanName(log.name)}`, qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, product_id: log.product_id, paymentMethod: selectedMethod, time: new Date().toLocaleString('vi-VN') };
      await addTransactionAndSync(lg); await fetchProducts(); toast.success(`Đã hoàn đơn thành công!`); 
    }); 
  };

  const handlePayDebt = async (phone: string) => { 
    const currentDebt = customers[phone]?.debt || 0; if (currentDebt <= 0) return toast.error("Khách không có nợ!"); 
    const inputAmount = window.prompt(`Khách: ${customers[phone].name}\nNợ cũ: ${currentDebt.toLocaleString()}đ\nSố tiền trả:`, currentDebt.toString()); if (inputAmount === null) return; 
    const paidAmount = parseInt(inputAmount.replace(/[,.]/g, '')); if (isNaN(paidAmount) || paidAmount <= 0 || paidAmount > currentDebt) { return toast.error("Số tiền trả không hợp lệ!"); }
    const methodChoice = window.prompt(`Hình thức:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN`, "1"); if (methodChoice === null) return; const selectedMethod = methodChoice === "2" ? "CHUYỂN KHOẢN" : "TIỀN MẶT";
    const remainingDebt = currentDebt - paidAmount; setCustomers(prev => ({ ...prev, [phone]: { ...prev[phone], debt: remainingDebt } })); 
    if (navigator.onLine) { await supabase.from("customers").update({ debt: remainingDebt }).eq("phone", phone); }
    const lg = { id: Date.now(), shift, type: "THU NỢ", name: remainingDebt === 0 ? "Thành toán hết nợ" : `Trả bớt nợ (Còn nợ: ${remainingDebt.toLocaleString()}đ)`, qty: 1, total: paidAmount, profit: 0, customer: `${customers[phone].name} (${phone})`, paymentMethod: selectedMethod, time: new Date().toLocaleString('vi-VN') }; addTransactionAndSync(lg); toast.success(`Thu nợ thành công!`);
  };

  const handleReprint = (timeStr: string, mode: 'receipt_thermal' | 'receipt_a4') => {
    const logsInBill = history.filter(h => h.time === timeStr && (h.type === 'BÁN' || h.type === 'GHI NỢ' || h.type === 'TRẢ HÀNG') && h.product_id !== 'DISCOUNT'); const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT'); if(logsInBill.length === 0) return toast.error("Lỗi hóa đơn!");
    const isRefundSlip = logsInBill[0].type === 'TRẢ HÀNG'; const reconstructedCart = logsInBill.map(l => ({ qty: Math.abs(l.qty || 1), product: { name: l.name.replace("HOÀN: ", ""), gift_info: null, isHappyHour: String(l.name).includes('[Giờ Vàng]') }, priceIncludingVat: Math.abs(l.total) / Math.abs(l.qty || 1) }));
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); const vatTotal = Math.round(subTotal * VAT_RATE); const discount = discountLog ? Math.abs(discountLog.total) : 0; const finalTotal = logsInBill.reduce((sum, l) => sum + Math.abs(l.total), 0) - discount; 
    let cPhone = ""; let cName = logsInBill[0].customer; if (cName && cName !== "Khách lẻ") { const match = cName.match(/\((.*?)\)/); if (match && match[1]) { cPhone = match[1]; cName = cName.replace(` (${cPhone})`, "").trim(); } else { cPhone = cName; } }
    const rOrder = { orderId: logsInBill[0].order_id || (isRefundSlip ? "PHIẾU_TRẢ_HÀNG" : "HD_COPY"), shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, debtAmount: logsInBill[0].type === 'GHI NỢ' ? finalTotal : 0, discount, time: timeStr, paymentMethod: logsInBill[0].paymentMethod, customerGiven: 0, custName: cName || "Khách lẻ", custPhone: cPhone };
    setLastOrder(rOrder); setPrintMode(mode); 
  };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return; let savedEmail = (lastOrder.custPhone && customers[lastOrder.custPhone] && customers[lastOrder.custPhone].email) ? customers[lastOrder.custPhone].email : ""; let email = window.prompt("Nhập Email khách hàng:", savedEmail); if (!email) return; email = email.trim(); 
    if (lastOrder.custPhone) { setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); }
    setLoading(true); let itemsHtml = ""; lastOrder.cart.forEach((item: any) => { const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE)); itemsHtml += `<tr><td style="padding: 10px; border-bottom: 1px solid #f1f5f9;">${cleanName(item.product.name)}</td><td style="padding: 10px; text-align: center; border-bottom: 1px solid #f1f5f9;">${item.qty}</td><td style="padding: 10px; text-align: right; border-bottom: 1px solid #f1f5f9;">${(priceToUse * item.qty).toLocaleString()}đ</td></tr>`; }); 
    const htmlContent = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;"><div style="background: #1e293b; color: white; padding: 20px; text-align: center;"><h1>HẢI LÊ MART</h1></div><div style="padding: 20px; background: #ffffff;"><p><strong>Mã HĐ:</strong> ${lastOrder.orderId}</p><table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: #f8fafc;"><th>Sản phẩm</th><th>SL</th><th>Thành tiền</th></tr></thead><tbody>${itemsHtml}</tbody></table><h2>TỔNG CỘNG: ${Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</h2></div></div>`;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: email, subject: `🧾 Hóa đơn mua hàng #${lastOrder.orderId}`, html_message: htmlContent }); toast.success("Đã gửi Hóa đơn thành công!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false)
  };

  const printCustomerCard = (phone: string) => { const cust = customers[phone]; if(!cust) return toast.error("Không tìm thấy dữ liệu khách!"); setPrintCustomer({ phone, ...cust }); setPrintMode('customer_card'); };
  const sendCardEmail = async (phone: string) => {
    const cust = customers[phone]; if(!cust) return toast.error("Không tìm thấy dữ liệu khách!");
    let email = cust.email || window.prompt(`Nhập Email của ${cust.name}:`, ""); if (!email) return; email = email.trim(); 
    if (!cust.email) { setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); } setLoading(true);
    const code = cust.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=2&height=10&includetext=false`; 
    const htmlContent = `<div style="font-family: Arial; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0;"><div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; text-align: center;"><h1>HẢI LÊ MART</h1></div><div style="padding: 30px 20px; background: #fff7ed; text-align: center;"><h2>Xin chào, ${cust.name}!</h2><img src="${barcodeUrl}" alt="Barcode" /><p>${code}</p></div></div>`;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: email, subject: `💳 Thẻ VIP Đặc Quyền - ${cust.name}`, html_message: htmlContent }, EMAILJS_PUBLIC_KEY); toast.success("Đã gửi Thẻ VIP thành công!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false);
  };
  
  const shareToZalo = (phone: string) => { const cust = customers[phone]; const code = cust.cardCode || phone; navigator.clipboard.writeText(`Chào ${cust.name},\nMã Thẻ VIP của bạn là: ${code}`).then(() => { toast.success(`Đang mở Zalo...`); window.open(`https://zalo.me/${phone}`, '_blank') }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank') }) };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const code = e.target.value; setNewCode(code); const p = products.find((x: any) => x.product_code === code); if (p) { setNewName(cleanName(p.name)); setNewCategory(formatCategoryStr(p.category)); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) } };
  
  // ==========================================
  // CỖ MÁY ĐỒNG BỘ KÉT SẮT NHẬP KHO OFFLINE
  // ==========================================
  const syncPendingImports = async () => {
    if (!navigator.onLine) return;
    const pendingImports = await dbGet("mart_pending_imports") || [];
    if (pendingImports.length === 0) return;

    toast.loading("Đang đồng bộ dữ liệu Nhập Kho Offline...");
    let successCount = 0;

    for (const item of pendingImports) {
      try {
        if (item.action === "UPDATE_STOCK") {
          // Lấy tồn kho THỰC TẾ TRÊN MẠNG lúc này
          const { data: cloudProd } = await supabase.from("products").select("stock").eq("id", item.targetId).single();
          const currentCloudStock = cloudProd ? cloudProd.stock : 0;
          
          // CỘNG DỒN số lượng đã nhập lúc mất mạng vào số trên mạng
          await supabase.from("products").update({ 
            stock: currentCloudStock + item.addedStock,
            updated_at: new Date().toISOString()
          }).eq("id", item.targetId);
          
        } else if (item.action === "INSERT_NEW") {
          // Đẩy sản phẩm tạo mới lên mạng
          await supabase.from("products").insert([item.data]);
        }
        successCount++;
      } catch (err) {
        console.error("Lỗi đồng bộ Kho:", err);
      }
    }

    // Xóa sạch két sắt sau khi đã đẩy lên mây thành công
    await dbSet("mart_pending_imports", []);
    toast.dismiss();
    if (successCount > 0) {
      toast.success(`Đã đồng bộ ${successCount} lệnh Nhập Kho lên hệ thống!`);
      fetchProducts(); // Tải lại kho chuẩn
    }
  };

  // Tự động chạy cỗ máy này ngay khi có mạng trở lại
  useEffect(() => {
    if (isOnline && isLoggedIn) {
      syncPendingImports();
    }
  }, [isOnline, isLoggedIn]);

  // ==========================================
  // HÀM XỬ LÝ THÊM/NHẬP SẢN PHẨM MỚI (BẤT TỬ)
  // ==========================================
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
        // TRƯỜNG HỢP 1: CÓ MẠNG (Chạy bình thường)
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
        // TRƯỜNG HỢP 2: MẤT MẠNG (Lưu vào Két sắt)
        console.log("Đang mất mạng -> Lưu tạm vào Két sắt Nhập Kho...");
        const pendingImports = await dbGet("mart_pending_imports") || [];
        
        let actionType = exist ? "UPDATE_STOCK" : "INSERT_NEW";
        let targetId = exist ? exist.id : null;

        // Lưu bản ghi vào Két
        pendingImports.push({
          id: Date.now(),
          action: actionType,
          targetId: targetId,
          data: newProductData,
          addedStock: added
        });
        await dbSet("mart_pending_imports", pendingImports);

        // Hiển thị ngay số lượng mới lên màn hình cho Thu ngân thấy
        if (exist) {
          setProducts(prev => prev.map(p => p.id === exist.id ? { ...p, stock: p.stock + added } : p));
        } else {
          setProducts(prev => [{ id: `temp-${Date.now()}`, ...newProductData, created_at: new Date().toISOString() }, ...prev]);
        }

        // Ghi log Lịch sử
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

  // MODAL HANDLERS
  const handleSendMarketingEmail = async () => {
    if (!marketingMsg) return toast.error("Nhập nội dung!"); if (!window.confirm("Gửi?")) return; setLoading(true); 
    const targetCustomers = Object.keys(customers || {}).filter(phone => { const c = customers[phone]; if (!c || !c.email) return false; if (marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent || 0).name.includes(marketingTier); });
    if (targetCustomers.length === 0) { setLoading(false); return toast.error("Không tìm thấy khách hàng!"); }
    let successCount = 0;
    for (const phone of targetCustomers) { const c = customers[phone]; const htmlContent = `<div><h1>HẢI LÊ MART</h1><p>${marketingMsg}</p></div>`; try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, subject: "💌 Ưu Đãi Đặc Quyền Từ Hải Lê Mart", html_message: htmlContent }); successCount++; } catch (error: any) {} }
    logAudit("GỬI MAIL MKT", `Gửi ${successCount} mail`); setLoading(false); setShowMarketingModal(false); toast.success(`Đã gửi thành công!`);
  };

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
      if (finalDebt > 0 && foundPO.supplier) { const supplierId = foundPO.supplier.id; const s = suppliers.find(x => x.id === supplierId); if (s) { const newD = (s.debt || 0) + finalDebt; await supabase.from('suppliers').update({ debt: newD }).eq('id', supplierId); setSuppliers(prev => prev.map(x => x.id === supplierId ? { ...x, debt: newD } : x)); } }
      setLocalPOs(prev => prev.map(p => p.id === foundPO.id ? { ...p, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal } : p));
      logs.forEach(lg => addTransactionAndSync(lg)); logAudit("NHẬN HÀNG PO", `Mã ${foundPO.po_code}`); toast.success("Nhập Kho thành công!"); fetchProducts(); setFoundPO(prev => ({ ...prev, status: 'COMPLETED', items: receiveItems, total_amount: actualTotal }));
    } catch (err: any) { toast.error("Lỗi"); } finally { setLoading(false); }
  };

  // =====================================================================
  // 4. MEMOS & TÍNH TOÁN CÔNG THỨC (CÓ CÁC HÀM KHÔI PHỤC)
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
        <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} showModal={!!selectedAuditLog} setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)} selectedLog={selectedAuditLog} setSelectedLog={setSelectedAuditLog} />
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
          newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart} newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd} saveSettings={saveSettings}
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
                if (unlockPin === adminPin || unlockPin === "0000") { // Mã sơ cua là 0000
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
