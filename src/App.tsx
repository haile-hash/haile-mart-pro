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
  const IDLE_TIMEOUT = 5 * 60 * 1000; 
  const todayStrStr = new Date().toLocaleDateString('vi-VN');

  const EMAILJS_SERVICE_ID = "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = "template_m1j9i7k";
  const EMAILJS_TEMPLATE_VIP_ID = "template_t91erhg";
  const EMAILJS_PUBLIC_KEY = "5ric0kxuwNPlUleAv";

  useEffect(() => { 
    if (EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY); 
  }, [EMAILJS_PUBLIC_KEY]);

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
  const { cart, setCart, barcodeInput, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName, useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout, custAddress, setCustAddress } = useCheckoutState();

  const [customersData, setCustomers] = useState<Record<string, Customer>>({});
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<TransactionLog[]>([]);

  const { isOnline, syncStatus, syncAllOfflineData, loadCloudData } = useOfflineSync({ isLoggedIn, history, setHistory, customers: customersData, setCustomers, heldOrders, setHeldOrders, auditLogs, setAuditLogs, expenses, setExpenses, suppliers, setSuppliers });
  const isPrintingRef = useRef(false);

  const findProductByCode = (code: string) => products.find(p => p.product_code === code);

  const cartTotalAmountDisplay = cart.reduce((sum, item) => sum + (item.total || 0), 0);
  const tierDiscountAmount = 0; 
  const amountAfterTierAndVoucher = cartTotalAmountDisplay - tierDiscountAmount - appliedVoucherAmount;
  const walletUsedAmount = (useWallet && custPhone && customersData[custPhone]) ? Math.min(amountAfterTierAndVoucher, customersData[custPhone].wallet || 0) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const groupedHistory = useMemo(() => {
    const groups: Record<string, any[]> = {};
    let filteredLog = [...history];
    if (logSearchTerm) {
      const lower = logSearchTerm.toLowerCase();
      filteredLog = filteredLog.filter(l => (l.name && l.name.toLowerCase().includes(lower)) || (l.order_id && l.order_id.toLowerCase().includes(lower)));
    }
    if (logTypeFilter !== "Tất cả") {
      filteredLog = filteredLog.filter(l => l.type === logTypeFilter);
    }
    filteredLog.forEach(log => {
      let dateKey = "Khác";
      if (log.time) {
        const parts = log.time.split(' ');
        const datePart = parts.find(p => p.includes('/'));
        if (datePart) dateKey = datePart.replace(',', '').trim();
      } else {
        dateKey = new Date(Math.floor(log.id)).toLocaleDateString('vi-VN');
      }
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(log);
    });
    return groups;
  }, [history, logSearchTerm, logTypeFilter]);

  const currentShiftStats = useMemo(() => {
    let total = 0; let profit = 0; let ordersCount = 0;
    let cash = 0; let transfer = 0;
    const todayStr = todayStrStr || new Date().toLocaleDateString('vi-VN');

    history.forEach(log => {
      let logDate = "";
      if (log.time) {
        const parts = log.time.split(' ');
        const datePart = parts.find(p => p.includes('/'));
        if (datePart) logDate = datePart.replace(',', '').trim();
      }
      
      if (log.shift === shift && logDate === todayStr) {
        if (log.type === 'BÁN' || log.type === 'GHI NỢ') ordersCount += 1;
        total += (log.total || 0);
        profit += (log.profit || 0);
        
        if (log.paymentMethod === 'TIỀN MẶT') cash += (log.total || 0);
        else if (log.paymentMethod === 'CHUYỂN KHOẢN' || log.paymentMethod === 'QUẸT THẺ' || log.paymentMethod === 'ZALO PAY') transfer += (log.total || 0);
        else if (log.paymentMethod === 'KẾT HỢP') {
          cash += (log.split_cash || 0);
          transfer += ((log.total || 0) - (log.split_cash || 0));
        }
      }
    });
    return { total, profit, orders: ordersCount, cash, transfer };
  }, [history, shift, todayStrStr]);

  // LOGIC DÒNG TIỀN ĐÃ ĐƯỢC CHUẨN HÓA VÀ BÓC TÁCH HOÀN HẢO
  const currentShiftCashFlow = useMemo(() => {
    const thu: any[] = [];
    const chi: any[] = [];
    const todayStr = todayStrStr || new Date().toLocaleDateString('vi-VN');

    history.forEach(log => {
      let logDate = "";
      if (log.time) {
        const parts = log.time.split(' ');
        const datePart = parts.find(p => p.includes('/'));
        if (datePart) logDate = datePart.replace(',', '').trim();
      }

      if (log.shift === shift && logDate === todayStr) {
        // BÁN HÀNG & THU NỢ -> GHI NHẬN THU VÀO
        if (log.type === 'BÁN' || log.type === 'THU NỢ') {
           if (log.paymentMethod === 'TIỀN MẶT' || log.paymentMethod === 'CHUYỂN KHOẢN' || log.paymentMethod === 'ZALO PAY' || log.paymentMethod === 'QUẸT THẺ') {
              thu.push({ note: `[${log.type}] ${log.order_id || log.name}`, amount: log.total, time: log.time, method: log.paymentMethod === 'TIỀN MẶT' ? 'TIỀN MẶT' : 'CHUYỂN KHOẢN' });
           } else if (log.paymentMethod === 'KẾT HỢP') {
              if (log.split_cash && log.split_cash > 0) thu.push({ note: `[${log.type}] ${log.order_id || log.name} (Tiền mặt)`, amount: log.split_cash, time: log.time, method: 'TIỀN MẶT' });
              const transferAmt = (log.total || 0) - (log.split_cash || 0);
              if (transferAmt > 0) thu.push({ note: `[${log.type}] ${log.order_id || log.name} (CK)`, amount: transferAmt, time: log.time, method: 'CHUYỂN KHOẢN' });
           }
        }
        // HOÀN HÀNG LỖI -> GHI NHẬN CHI RA
        else if (log.type === 'TRẢ HÀNG') {
           const absTotal = Math.abs(log.total || 0);
           if (absTotal > 0 && log.paymentMethod !== 'VÍ WALLET' && log.paymentMethod !== 'TRỪ NỢ') {
              chi.push({ note: `[HOÀN HÀNG] ${log.name}`, amount: absTotal, time: log.time, method: log.paymentMethod === 'TIỀN MẶT' ? 'TIỀN MẶT' : 'CHUYỂN KHOẢN' });
           }
        }
      }
    });

    expenses.forEach(exp => {
      if (exp.date === todayStr) {
        chi.push({ note: `[CHI PHÍ] ${exp.name}`, amount: Number(exp.amount) || 0, time: exp.date, method: 'TIỀN MẶT' }); 
      }
    });

    return {
      thu_tien_mat: thu.filter(i => i.method === 'TIỀN MẶT'),
      chi_tien_mat: chi.filter(i => i.method === 'TIỀN MẶT'),
      thu_chuyen_khoan: thu.filter(i => i.method === 'CHUYỂN KHOẢN'),
      chi_chuyen_khoan: chi.filter(i => i.method === 'CHUYỂN KHOẢN')
    };
  }, [history, expenses, shift, todayStrStr]);

  const categories = useMemo(() => {
    const cats = new Set(["Tất cả"]);
    products.forEach(p => { if (p.category) cats.add(p.category); });
    return Array.from(cats);
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== "Tất cả") result = result.filter(p => p.category === selectedCategory);
    if (debouncedSearchTerm) {
      const lowerSearch = debouncedSearchTerm.toLowerCase();
      result = result.filter(p => (p.name && p.name.toLowerCase().includes(lowerSearch)) || (p.product_code && p.product_code.toLowerCase().includes(lowerSearch)));
    }
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key].length > 0) result = result.filter(p => filters[key].includes(String(p[key as keyof Product])));
    });
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof Product] || "";
        const bVal = b[sortConfig.key as keyof Product] || "";
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, selectedCategory, debouncedSearchTerm, sortConfig, filters]);

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => p.name))), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price))), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))), [products]);

  const totalValue = useMemo(() => products.reduce((sum, p) => sum + ((p.stock || 0) * (p.import_price || 0)), 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock < 10).length, [products]);

  const filteredStats = history;
  const chartData: any[] = [];
  const topSelling: any[] = [];

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setInstallPrompt(null); toast.success("Cài đặt App thành công!"); logAudit("HỆ THỐNG", "Cài đặt ứng dụng PWA"); }
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
          const keysToMigrate = ["mart_logged_in", "mart_role", "mart_shift", "mart_starting_cash", "mart_pos", "mart_customers", "mart_held_orders", "mart_audit", "mart_expenses", "mart_suppliers", "mart_history"];
          for (const key of keysToMigrate) {
            const localData = localStorage.getItem(key);
            if (localData !== null) { try { if (localData.startsWith("[") || localData.startsWith("{")) { await dbSet(key, JSON.parse(localData)); } else { await dbSet(key, localData); } } catch (e) { await dbSet(key, localData); } localStorage.removeItem(key); }
          }
          await dbSet("mart_storage_migrated", "true");
        }
        const loggedIn = await dbGet("mart_logged_in") === "true"; const savedRole = await dbGet("mart_role") || "staff"; const savedShift = await dbGet("mart_shift") || "Ca Sáng"; const savedCash = Number(await dbGet("mart_starting_cash") || 5000000); const savedPOs = await dbGet("mart_pos") || []; const savedCustomers = await dbGet("mart_customers") || {}; const savedHeld = await dbGet("mart_held_orders") || []; const savedAudit = await dbGet("mart_audit") || []; const savedExpenses = await dbGet("mart_expenses") || []; const savedSuppliers = await dbGet("mart_suppliers") || []; const savedHistory = await dbGet("mart_history") || [];

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
  useEffect(() => { if (!isStorageLoading) dbSet("mart_customers", customersData); }, [customersData, isStorageLoading]);
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
        
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

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
          const matchedPhone = Object.keys(customersData || {}).find(phone => phone === currentCode.trim() || customersData[phone]?.cardCode === currentCode.trim()); 
          if (matchedPhone) { playSound('success'); setCustomerInput(customersData[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customersData[matchedPhone].name); setScanMessage({ text: `✅ KH VIP: ${customersData[matchedPhone].name}`, type: 'success' }) } 
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
        const matchedPhone = Object.keys(customersData || {}).find(phone => phone === val || customersData[phone]?.cardCode === val); 
        if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customersData[matchedPhone].name); setCustAddress(customersData[matchedPhone].address || ""); playSound('success'); setScanMessage({ text: `✅ Nhận diện VIP: ${customersData[matchedPhone].name}`, type: 'success' }) } 
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
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); 
        if (data && !error) { 
          setProducts(data);
          await dbSet("mart_products_cache", data);
        } else {
          const localData = await dbGet("mart_products_cache");
          if (localData) setProducts(localData);
        }
      } else {
        const localData = await dbGet("mart_products_cache");
        if (localData) setProducts(localData);
      }
    } catch (err) {
      const localData = await dbGet("mart_products_cache");
      if (localData) setProducts(localData);
    }
  };

  const executeWithAdminCheck = (action: () => void) => { if (role === 'admin') { action(); } else { setPendingAction(() => action); setShowPinModal(true); } };
  
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

  const updateSettingsToCloud = async (bin: string, acc: string, nameStr: string, zaloId: string, hStart: string, hEnd: string, pin: string) => {
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu Cài đặt lên Cloud."); setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({ bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, zalopay_id: zaloId, happy_hour_start: hStart, happy_hour_end: hEnd, admin_pin: pin, updated_at: new Date().toISOString() }).eq("id", 1);
      if (!error) { setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setZaloPayId(zaloId); setHappyStart(hStart); setHappyEnd(hEnd); setAdminPin(pin); toast.success("Lưu Cài đặt thành công!"); setShowSettings(false); logAudit("CÀI ĐẶT", "Cập nhật hệ thống"); }
    } catch (err) {} finally { setLoading(false); }
  };

  const saveSettings = () => { const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase(); const zaloId = newZaloPayId.trim(); const pin = newAdminPinInput.trim(); if (!bin || !acc || !nameStr || !pin) return toast.error("Vui lòng điền đủ thông tin & Mã PIN!"); updateSettingsToCloud(bin, acc, nameStr, zaloId, newHappyStart, newHappyEnd, pin); };
  
  const handleLogoutClick = () => { logAudit("ĐĂNG XUẤT", `Thoát ca ${shift}`); setShowHandoverModal(true); };
  const confirmHandover = async () => { try { if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) {} finally { await dbRemove("mart_logged_in"); await dbRemove("mart_role"); await dbRemove("mart_shift"); localStorage.removeItem("mart_was_logged_in"); setIsLoggedIn(false); window.location.reload(); } };
  const handleEditPhone = async (oldPhone: string) => { executeWithAdminCheck(() => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customersData[newPhone]) return toast.error("SĐT đã tồn tại!"); const cData = customersData[oldPhone]; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = { ...cData, phone: newPhone }; delete updated[oldPhone]; return updated }); logAudit("SỬA KHÁCH HÀNG", `Đổi SĐT ${oldPhone} -> ${newPhone}`); toast.success("Cập nhật thành công!"); } }); };
  const addSupplier = async () => { if (!supName || !supPhone) return toast.error("Nhập đủ Tên/SĐT"); const newId = Date.now(); const newSupData = { id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, taxCode: supTaxCode, bankAccount: supBankAccount, debt: 0 }; setSuppliers(prev => [newSupData, ...prev]); if (navigator.onLine) { supabase.from('suppliers').insert([newSupData]).then(); } setSupName(""); setSupPhone(""); setSupAddress(""); setSupItem(""); setSupTaxCode(""); setSupBankAccount(""); toast.success("Thêm NCC thành công!"); logAudit("THÊM NCC", supName); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); logAudit("XÓA NCC", `ID: ${id}`); };
  
  const addExpense = async () => { if (!expName || !expAmount) return toast.error("Nhập chi phiếu!"); setExpenses(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }, ...prev]); logAudit("CHI TIỀN", `${expName}: ${expAmount}đ`); setExpName(""); setExpAmount(""); toast.success("Đã ghi nhận chi phí!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); logAudit("XÓA CHI PHÍ", `ID: ${id}`); };
  
  const closeCheckout = () => { resetCheckout() };
  const handleHoldOrder = async () => { if (cart.length === 0) return; const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart] }; setHeldOrders(prev => [...prev, newO]); logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); resetCheckout(); toast.success("Đã lưu tạm đơn hàng!"); };
  const restoreOrder = async (order: any) => { if (cart.length > 0) return toast.error("Vui lòng thanh toán giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); logAudit("MỞ ĐƠN TẠM", `ID: ${order.id}`); setShowHoldModal(false); toast.success("Đã mở lại đơn tạm!"); };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); logAudit("XÓA ĐƠN TẠM", `ID: ${id}`); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); toast.success("Đã xóa đơn tạm!"); };

  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 };
      if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); toast.success(`Đã áp dụng mã giảm ${VOUCHERS[code].toLocaleString()}đ`); logAudit("MÃ GIẢM GIÁ", `Áp dụng ${code}`); } 
      else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); toast.success(`Đã giảm trực tiếp ${Number(code).toLocaleString()}đ`); logAudit("GIẢM TRỰC TIẾP", `${Number(code).toLocaleString()}đ`); } 
      else { playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); }
    }
  };

  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customersData || {}).find(phone => phone === val.trim() || customersData[phone]?.cardCode === val.trim());
    if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customersData[matchedPhone].name); setCustAddress(customersData[matchedPhone].address || ""); setUseWallet(false); } 
    else { setCustPhone(val); setCustName(""); setCustAddress(""); setUseWallet(false); }
  };

  const handleNextToQR = () => { if (cart.length === 0) return toast.error("Giỏ hàng trống!"); if (custPhone && !customersData[custPhone] && !custName) return toast.error("Vui lòng nhập Tên khách mới!"); setCheckoutStep(2); };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return toast.error("Lỗi số lượng sản phẩm!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return toast.error("Thanh toán Ghi nợ cần SĐT Khách hàng!");
    setLoading(true); 
    try {
      let newLogs: any[] = []; const baseTotal = cartTotalAmountDisplay; const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); const vatTotal = baseTotal - subTotal; const finalTotal = amountAfterTierAndVoucher - walletUsedAmount; const orderIdStr = "HD" + Date.now().toString().slice(-6);
      
      for (const item of cart) {
        if (navigator.onLine) await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.qty) }).eq("id", item.product.id);
        
        let splitCashAmt = 0; 
        if(payMethod === 'KẾT HỢP') { 
          const safeRatio = finalTotal > 0 ? (Number(customerGiven) / finalTotal) : 0;
          splitCashAmt = Math.round(safeRatio * Math.round(item.qty * getActualPrice(item.product) * (1 + VAT_RATE))); 
        }
        const newLog = { id: Date.now() + Math.random(), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(item.product.name), qty: item.qty, total: item.total, profit: Math.round(item.qty * (getActualPrice(item.product) - (item.product.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, paymentMethod: payMethod, split_cash: splitCashAmt, time: new Date().toLocaleString('vi-VN'), order_id: orderIdStr };
        newLogs.push(newLog);
      }
      
      if (custPhone) {
        const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalTotal * 0.02);
        const currentCust = customersData[custPhone] || {};
        const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (currentCust.wallet || 0) : Math.round((currentCust.wallet || 0) - walletUsedAmount + earned), debt: (currentCust.debt || 0) + (payMethod === 'GHI NỢ' ? finalTotal : 0), totalSpent: (currentCust.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalTotal : 0), email: currentCust.email || "", address: custAddress || currentCust.address || "", cardCode: currentCust.cardCode || "" }; 
        setCustomers(prev => ({ ...prev, [custPhone]: updatedCust })); if (navigator.onLine) { await supabase.from("customers").upsert({ phone: custPhone, ...updatedCust }); }
      }
      
      setHistory(prev => [...newLogs, ...prev]); if (navigator.onLine) { try { await supabase.from("history").insert(newLogs); } catch(err) { console.log(err); } }
      setLastOrder({ orderId: orderIdStr, shift, cart: [...cart], subTotal, vatTotal, finalTotal, debtAmount: payMethod === 'GHI NỢ' ? finalTotal : 0, discount: appliedVoucherAmount + tierDiscountAmount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0, custPhone, custName });
      logAudit("THANH TOÁN", `${orderIdStr} - ${payMethod} - ${finalTotal.toLocaleString()}đ`);
      setCheckoutStep(3); fetchProducts(); 
    } catch (err) { toast.error("Lỗi thanh toán: " + err.message); } finally { setLoading(false); }
  };

  const handleRefund = async (logId: any) => { 
    executeWithAdminCheck(async () => { 
      const log = history.find(l => l.id === logId); 
      if (!log || (log.type !== 'BÁN' && log.type !== 'GHI NỢ')) return;

      const alreadyRefundedQty = history
        .filter(h => h.type === 'TRẢ HÀNG' && h.order_id === log.order_id && h.product_id === log.product_id)
        .reduce((sum, h) => sum + Math.abs(h.qty || 0), 0);
        
      const remainingQtyToRefund = (log.qty || 0) - alreadyRefundedQty;

      if (remainingQtyToRefund <= 0) return toast.error("Đơn này đã được hoàn trả toàn bộ số lượng!");

      const qtyInput = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nSố lượng có thể hoàn trả: ${remainingQtyToRefund}\n\nNhập SỐ LƯỢNG khách trả lại:`, remainingQtyToRefund.toString()); 
      if (!qtyInput) return; 
      
      const refundQty = parseInt(qtyInput); 
      if (isNaN(refundQty) || refundQty <= 0 || refundQty > remainingQtyToRefund) return toast.error("Số lượng hoàn trả không hợp lệ!"); 

      const singlePrice = log.total / log.qty; 
      const refundTotal = Math.round(singlePrice * refundQty); 
      const singleProfit = (log.profit || 0) / log.qty; 
      const refundProfit = Math.round(singleProfit * refundQty);
      let selectedMethod = "TIỀN MẶT";

      if (log.type === 'GHI NỢ') {
        if (!window.confirm(`Đơn này mua nợ. Trừ ${refundTotal.toLocaleString()}đ dư nợ của khách?`)) return; 
        selectedMethod = "TRỪ NỢ";
        const phoneMatch = log.customer?.match(/\((.*?)\)/); const customerPhone = phoneMatch ? phoneMatch[1] : log.customer;
        if (customerPhone && customersData[customerPhone]) { 
          const custData = customersData[customerPhone]; 
          const newDebt = Math.max(0, (custData.debt || 0) - refundTotal); 
          setCustomers(prev => ({ ...prev, [customerPhone]: { ...custData, debt: newDebt } })); 
          if (navigator.onLine) { await supabase.from("customers").update({ debt: newDebt }).eq("phone", customerPhone); } 
        }
      } else {
        const choice = window.prompt(`Hình thức trả tiền cho khách:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN\n3. HOÀN VÀO VÍ VIP`, "1"); 
        if (!choice) return; 
        if (choice === "2") selectedMethod = "CHUYỂN KHOẢN"; 
        if (choice === "3") selectedMethod = "VÍ WALLET";
        if (choice === "3") {
          const phoneMatch = log.customer?.match(/\((.*?)\)/); const customerPhone = phoneMatch ? phoneMatch[1] : null; 
          if (!customerPhone || !customersData[customerPhone]) { return toast.error("Khách lẻ không hoàn Ví VIP được!"); }
          const custData = customersData[customerPhone]; 
          setCustomers(prev => ({ ...prev, [customerPhone]: { ...custData, wallet: Math.round((custData.wallet || 0) + refundTotal) } })); 
          if (navigator.onLine) { await supabase.from("customers").update({ wallet: Math.round((custData.wallet || 0) + refundTotal) }).eq("phone", customerPhone); }
        }
      }
      
      if (log.product_id) { 
        const currentProd = products.find(p => p.id === log.product_id); 
        if (currentProd) { 
          const updatedStock = (currentProd.stock || 0) + refundQty; 
          setProducts(prev => prev.map(p => p.id === log.product_id ? { ...p, stock: updatedStock } : p));
          if (navigator.onLine) { try { await supabase.from("products").update({ stock: updatedStock }).eq("id", log.product_id); } catch (e) {} } 
        } 
      }
      
      const lg = { id: Date.now(), shift, type: "TRẢ HÀNG", name: `HOÀN: ${cleanName(log.name)}`, qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, product_id: log.product_id, paymentMethod: selectedMethod, time: new Date().toLocaleString('vi-VN'), order_id: log.order_id };
      await addTransactionAndSync(lg); 
      logAudit("HOÀN ĐƠN", `Trả ${refundQty} x ${cleanName(log.name)} (${selectedMethod})`);
      toast.success(`Hoàn tiền (${selectedMethod}): ${refundTotal.toLocaleString()}đ thành công!`); 
    }); 
  };

  const handlePayDebt = async (phone: string) => { 
    const currentDebt = customersData[phone]?.debt || 0; 
    if (currentDebt <= 0) return toast.error("Khách không có nợ!"); 
    
    const inputAmount = window.prompt(`Khách: ${customersData[phone].name}\nNợ cũ: ${currentDebt.toLocaleString()}đ\nSố tiền trả:`, currentDebt.toString()); 
    if (!inputAmount) return; 
    
    const paidAmount = Number(inputAmount.replace(/[^0-9]/g, '')); 
    if (isNaN(paidAmount) || paidAmount <= 0 || paidAmount > currentDebt) { return toast.error("Số tiền trả không hợp lệ!"); }
    
    const methodChoice = window.prompt(`Hình thức:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN`, "1"); 
    if (methodChoice === null) return; const selectedMethod = methodChoice === "2" ? "CHUYỂN KHOẢN" : "TIỀN MẶT";
    
    const remainingDebt = currentDebt - paidAmount; 
    setCustomers(prev => ({ ...prev, [phone]: { ...prev[phone], debt: remainingDebt } })); 
    if (navigator.onLine) { await supabase.from("customers").update({ debt: remainingDebt }).eq("phone", phone); }
    
    const lg = { id: Date.now(), shift, type: "THU NỢ", name: remainingDebt === 0 ? "Thanh toán hết nợ" : `Trả bớt nợ (Còn nợ: ${remainingDebt.toLocaleString()}đ)`, qty: 1, total: paidAmount, profit: 0, customer: `${customersData[phone].name} (${phone})`, paymentMethod: selectedMethod, time: new Date().toLocaleString('vi-VN') }; addTransactionAndSync(lg); 
    logAudit("THU NỢ", `${customersData[phone].name} trả ${paidAmount.toLocaleString()}đ`); toast.success(`Thu nợ thành công!`);
  };

  const handleReprint = (timeStr: string, mode: 'receipt_thermal' | 'receipt_a4') => {
    const logsInBill = history.filter(h => h.time === timeStr && (h.type === 'BÁN' || h.type === 'GHI NỢ' || h.type === 'TRẢ HÀNG') && h.product_id !== 'DISCOUNT'); 
    const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT'); 
    if(logsInBill.length === 0) return toast.error("Lỗi hóa đơn!");
    
    // BỌC GIÁP: Nhận diện đây là bill HOÀN HÀNG hay BÁN HÀNG
    const isRefundSlip = logsInBill[0].type === 'TRẢ HÀNG'; 
    
    const reconstructedCart = logsInBill.map(l => ({ qty: Math.abs(l.qty || 1), product: { name: l.name.replace("HOÀN: ", ""), gift_info: null, isHappyHour: String(l.name).includes('[Giờ Vàng]') }, priceIncludingVat: Math.abs(l.total) / Math.abs(l.qty || 1) }));
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); const vatTotal = Math.round(subTotal * VAT_RATE); const discount = discountLog ? Math.abs(discountLog.total) : 0; const finalTotal = logsInBill.reduce((sum, l) => sum + Math.abs(l.total), 0) - discount; 
    let cPhone = ""; let cName = logsInBill[0].customer; if (cName && cName !== "Khách lẻ") { const match = cName.match(/\((.*?)\)/); if (match && match[1]) { cPhone = match[1]; cName = cName.replace(` (${cPhone})`, "").trim(); } else { cPhone = cName; } }
    
    const rOrder = { 
      orderId: logsInBill[0].order_id || (isRefundSlip ? "PHIẾU_TRẢ_HÀNG" : "HD_COPY"), 
      shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, 
      debtAmount: logsInBill[0].type === 'GHI NỢ' ? finalTotal : 0, discount, time: timeStr, 
      paymentMethod: logsInBill[0].paymentMethod, customerGiven: 0, custName: cName || "Khách lẻ", custPhone: cPhone, 
      isRefund: isRefundSlip // TÍNH NĂNG MỚI: Báo cho máy in biết đây là phiếu Hoàn
    };
    
    setLastOrder(rOrder); setPrintMode(mode); logAudit("IN LẠI HÓA ĐƠN", `HĐ lúc ${timeStr}`);
  };
  const sendReceiptEmail = async () => {
    if (!lastOrder) return; 
    let savedEmail = customersData?.[lastOrder.custPhone]?.email || ""; 
    let email = window.prompt("Nhập Email khách hàng:", savedEmail); if (!email) return; email = email.trim(); 
    if (lastOrder.custPhone && customersData[lastOrder.custPhone]) { setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone]: { ...prev[lastOrder.custPhone], email: email } })); }
    setLoading(true); 
    
    let itemsHtml = ""; 
    (lastOrder.cart || []).forEach((item: any) => { 
      const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE)); 
      itemsHtml += `<tr><td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${cleanName(item.product.name)}</td><td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold;">${item.qty}</td><td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${(priceToUse * item.qty).toLocaleString()}đ</td></tr>`; 
    }); 

    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">HẢI LÊ MART</h1>
          <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Hóa Đơn Mua Hàng Điện Tử</p>
        </div>
        <div style="padding: 25px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 15px;">
            <div>
              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px;">Mã Đơn Hàng:</p>
              <p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 16px;">${lastOrder.orderId}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px;">Ngày mua:</p>
              <p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 14px;">${lastOrder.time}</p>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead><tr style="background: #f8fafc;"><th style="padding: 12px; text-align: left; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0;">Sản phẩm</th><th style="padding: 12px; text-align: center; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0;">SL</th><th style="padding: 12px; text-align: right; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0;">Thành tiền</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: right;">
            <h2 style="margin: 0; color: #0f172a; font-size: 22px;">
              <span style="font-size: 14px; color: #64748b; font-weight: normal; margin-right: 10px;">TỔNG THANH TOÁN:</span> 
              <span style="color: #dc2626;">${Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span>
            </h2>
            <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">Phương thức: ${lastOrder.paymentMethod}</p>
          </div>
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Cảm ơn quý khách đã mua sắm tại Hải Lê Mart!</p>
            <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">Hotline hỗ trợ: 09xx.xxx.xxx</p>
          </div>
        </div>
      </div>
    `;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: email, subject: `🧾 Hóa đơn mua hàng #${lastOrder.orderId}`, html_message: htmlContent }); logAudit("GỬI HÓA ĐƠN EMAIL", `Mã HĐ: ${lastOrder.orderId}`); toast.success("Đã gửi Hóa đơn thành công!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false)
  };

  const printCustomerCard = (phone: string) => { const cust = customersData[phone]; if(!cust) return toast.error("Không tìm thấy dữ liệu khách!"); setPrintCustomer({ phone, ...cust }); setPrintMode('customer_card'); logAudit("IN THẺ VIP", phone); };
  
  const sendCardEmail = async (phone: string) => {
    const font = customersData[phone]; if(!font) return toast.error("Không tìm thấy dữ liệu khách!");
    let email = font.email || window.prompt(`Nhập Email của ${font.name}:`, ""); if (!email) return; email = email.trim(); 
    if (!font.email) { setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); } setLoading(true);
    
    const code = font.cardCode || phone; 
    const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=3&height=15&includetext=false`; 
    
    const htmlContent = `
      <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9; padding: 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #0f172a; margin: 0;">Xin chào, ${font.name}!</h2>
          <p style="color: #64748b; margin: 5px 0 0 0;">Chào mừng bạn đến với chương trình Khách hàng thân thiết.</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 16px; padding: 25px; color: white; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3); position: relative; overflow: hidden; max-width: 400px; margin: 0 auto;">
          <div style="position: absolute; top: 15px; left: 25px; width: 65px; height: 65px; overflow: hidden; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.15);">
            <img src="https://haile-mart-pro.vercel.app/logo192.png" alt="Logo" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <h3 style="margin: 0; font-size: 20px; letter-spacing: 1px;">HẢI LÊ MART</h3>
            <span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">VIP MEMBER</span>
          </div>
          
          <div style="background: #ffffff; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <img src="${barcodeUrl}" alt="Barcode" style="max-width: 100%; height: 50px;" />
          </div>
          
          <table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 8px; border-collapse: collapse;">
            <tr>
              <td align="left" valign="bottom" style="width: 50%; padding: 0;">
                <p style="margin: 0; font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff;">Mã Thành Viên</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; letter-spacing: 1px; font-family: monospace; color: #ffffff;">${code}</p>
              </td>
              <td align="right" valign="bottom" style="width: 50%; padding: 0;">
                <p style="margin: 0; font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff;">Chủ thẻ</p>
                <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; text-transform: uppercase; color: #ffffff; white-space: nowrap;">${font.name}</p>
              </td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #64748b; font-size: 14px; line-height: 1.5;">Vui lòng xuất trình mã vạch này tại quầy thu ngân để tích điểm và nhận các ưu đãi đặc quyền dành riêng cho bạn.</p>
        </div>
      </div>
    `;

    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: email, subject: `💳 Thẻ VIP Đặc Quyền - ${font.name}`, html_message: htmlContent }); logAudit("GỬI THẺ VIP EMAIL", phone); toast.success("Đã gửi Thẻ VIP thành công!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false);
  };
  
  const shareToZalo = (phone: string) => { const cust = customersData[phone]; const code = cust.cardCode || phone; navigator.clipboard.writeText(`Chào ${cust.name},\nMã Thẻ VIP của bạn là: ${code}`).then(() => { toast.success(`Đang mở Zalo...`); logAudit("CHIA SẺ ZALO", phone); window.open(`https://zalo.me/${phone}`, '_blank') }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank') }) };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const code = e.target.value; setNewCode(code); const p = products.find((x: any) => x.product_code === code); if (p) { setNewName(cleanName(p.name)); setNewCategory(formatCategoryStr(p.category)); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) } };

  const syncPendingImports = async () => {
    if (!navigator.onLine) return;
    const pendingImports = await dbGet("mart_pending_imports") || [];
    if (pendingImports.length === 0) return;

    toast.loading("Đang đồng bộ dữ liệu Nhập Kho Offline...");
    let successCount = 0;

    for (const item of pendingImports) {
      try {
        if (item.action === "UPDATE_STOCK") {
          const baseCode = String(item.data.product_code).split('-')[0];
          
          // Khi có mạng lại, ép Cloud đồng bộ đồng loạt giá bán/quà tặng mới cho nhóm mã này
          await supabase.from("products").update({
            sale_price: item.data.sale_price,
            promo_price: item.data.promo_price,
            gift_info: item.data.gift_info,
            updated_at: new Date().toISOString()
          }).eq("product_code", baseCode);

          await supabase.from("products").update({
            sale_price: item.data.sale_price,
            promo_price: item.data.promo_price,
            gift_info: item.data.gift_info,
            updated_at: new Date().toISOString()
          }).like("product_code", `${baseCode}-%`);

          // Sau đó mới cộng dồn số tồn kho vào riêng lô mục tiêu
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
      logAudit("ĐỒNG BỘ KHO", `Đẩy ${successCount} lệnh lên Cloud`);
      fetchProducts(); 
    }
  };
  useEffect(() => {
    if (isOnline && isLoggedIn) {
      syncPendingImports();
    }
  }, [isOnline, isLoggedIn]);

 const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    try {
      const added = parseInt(newStock || "0"); 
      const impPrice = parseInt(newImportPrice); 
      const salePrice = parseInt(newPrice); 
      const promo = parseInt(newPromoPrice) || 0; 
      const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; 
      
      const inputCode = newCode.trim(); 
      // BỌC GIÁP: Luôn bóc tách mã gốc để tìm tất cả các lô (loại bỏ đuôi -xxxx)
      const baseCode = inputCode.split('-')[0]; 
      const formattedCat = formatCategoryStr(newCategory);
      
      const allVariants = products.filter(p => String(p.product_code).split('-')[0] === baseCode); 
      const exist = products.find(p => p.product_code === inputCode) || allVariants.find(p => p.product_code === baseCode); 
      
      const isNewBatch = exist && (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || ""));

      let finalProductCode = exist ? exist.product_code : baseCode;
      let finalProductName = newName;
      let finalStockToSave = added;

      if (isNewBatch) {
        finalProductCode = `${baseCode}-${Date.now().toString().slice(-4)}`;
        finalProductName = `${newName} [Lô mới]`;
        if (!window.confirm(`Sản phẩm bị lệch Giá vốn / Hạn sử dụng.\nHệ thống sẽ tạo LÔ MỚI (${finalProductCode})?\n\nChọn OK để tiếp tục.`)) {
           setLoading(false); return;
        }
      } else if (exist) {
        finalStockToSave = exist.stock + added;
      }

      const newProductData = { 
        product_code: finalProductCode, name: finalProductName, category: formattedCat, 
        import_price: impPrice, sale_price: salePrice, promo_price: promo, 
        gift_info: finalGiftInfo, stock: finalStockToSave, expiry_date: newExpiry || null 
      };

      // CẬP NHẬT GIAO DIỆN NGAY LẬP TỨC (OPTIMISTIC UPDATE) - CHUYỂN RA NGOÀI ĐỂ LUÔN CHẠY
      setProducts(prev => {
        let updated = prev.map(p => {
           const pBase = String(p.product_code).split('-')[0];
           if (pBase === baseCode) {
              const keepSuffix = p.name.includes('[Lô mới]') ? ' [Lô mới]' : '';
              return { 
                ...p, 
                name: newName + keepSuffix, category: formattedCat, 
                sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, 
                stock: (!isNewBatch && p.id === exist?.id) ? finalStockToSave : p.stock 
              };
           }
           return p;
        });
        if (isNewBatch || !exist) {
           updated = [{ id: `temp-${Date.now()}`, ...newProductData, created_at: new Date().toISOString() }, ...updated];
        }
        return updated;
      });

      if (navigator.onLine) {
        if (allVariants.length > 0) {
          const variantIds = allVariants.map(v => v.id);
          // ĐỒNG BỘ GIÁ BÁN CHO TOÀN BỘ CÁC LÔ TRÊN CLOUD
          await supabase.from("products").update({ 
            name: newName, category: formattedCat, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, updated_at: new Date().toISOString() 
          }).in("id", variantIds);

          if (isNewBatch) { 
            await supabase.from("products").insert([newProductData]); 
          } else if (exist) { 
            await supabase.from("products").update({ stock: finalStockToSave, updated_at: new Date().toISOString() }).eq("id", exist.id); 
          }
        } else { 
          await supabase.from("products").insert([newProductData]); 
        }

        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: finalProductName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
        logAudit("THÊM/SỬA SP", `Mã: ${finalProductCode}`);
        toast.success(`Đã lưu & đồng bộ giá!`);
        fetchProducts(); 
      } else {
        const pendingImports = await dbGet("mart_pending_imports") || [];
        pendingImports.push({ id: Date.now(), action: (exist && !isNewBatch) ? "UPDATE_STOCK" : "INSERT_NEW", targetId: (exist && !isNewBatch) ? exist.id : null, data: newProductData, addedStock: added });
        await dbSet("mart_pending_imports", pendingImports);

        if (added > 0) {
          const offlineLog = { id: Date.now(), shift, type: "NHẬP (OFFLINE)", name: finalProductName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') };
          setHistory(prev => [offlineLog, ...prev]);
          const currentHistory = await dbGet("mart_history") || [];
          await dbSet("mart_history", [offlineLog, ...currentHistory]);
        }
        logAudit("NHẬP KHO OFFLINE", `Mã: ${finalProductCode}`);
        toast.success(`Đã lưu Tạm! Đồng bộ tự động khi có mạng.`);
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
          
          // BỐC TÁCH MÃ GỐC ĐỂ TÌM TẤT CẢ BIẾN THỂ
          const baseCode = pCode.split('-')[0]; 
          const allVariants = products.filter(p => String(p.product_code).split('-')[0] === baseCode); 
          
          if (allVariants.length > 0) { 
            const needSync = allVariants.some(v => v.sale_price !== pSalePrice || v.promo_price !== pPromoPrice || v.gift_info !== pGift || cleanName(v.name) !== pName); 
            if (needSync) { 
                const variantIds = allVariants.map(v => v.id);
                
                // CẬP NHẬT GIAO DIỆN LẬP TỨC
                setProducts(prev => prev.map(x => {
                  if(variantIds.includes(x.id)) {
                    const keepSuffix = x.name.includes('[Lô mới]') ? ' [Lô mới]' : '';
                    return { ...x, name: pName + keepSuffix, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift };
                  }
                  return x;
                }));

                await supabase.from("products").update({ name: pName, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, updated_at: new Date().toISOString() }).in("id", variantIds); 
            } 
          }
          
          const exist = allVariants.find(p => p.product_code === pCode); 
          if (exist) { 
            if (exist.stock <= 0) { 
              await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, updated_at: new Date().toISOString() }).eq("id", exist.id); 
            } else { 
              if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { 
                const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; 
                await supabase.from("products").insert([{ product_code: batchCode, name: `${pName} [Lô mới]`, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
              } else { 
                await supabase.from("products").update({ stock: exist.stock + pStock, updated_at: new Date().toISOString() }).eq("id", exist.id); 
              } 
            } 
          } else { 
            await supabase.from("products").insert([{ product_code: pCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); 
          }
          if (pStock > 0) { importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') } as any); successCount++; }
        }
        if (importLogs.length > 0) { if(navigator.onLine) await supabase.from("history").insert(importLogs); setHistory(prev => [...importLogs, ...prev]); } 
        logAudit("NHẬP EXCEL", `Nhập ${successCount} mã`); toast.success(`Nhập thành công từ file!`); fetchProducts();
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
      setActualStockInput(updatedStock); toast.success(`Đã nạp số liệu thực tế!`); logAudit("KIỂM KHO BẰNG EXCEL", `Nạp ${count} mã`);
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
      if (!navigator.onLine) return toast.error("Mạng yếu!"); 
      let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD'; 
      const val = window.prompt(`Sửa ${label}:`, old || ""); 
      
      if (val !== null) { 
        let updateData: any = isText ? (field === 'category' ? formatCategoryStr(val) : val) : (parseInt(val) || 0); 
        if (field === 'gift_info' && val.trim() === '') updateData = null; 
        
        // ĐỒNG BỘ LÔ: Áp dụng cho Giá bán, Giá KM, Quà tặng, Tên, Danh mục
        if (field === 'sale_price' || field === 'promo_price' || field === 'gift_info' || field === 'name' || field === 'category') {
           const p = products.find(x => x.id === id);
           if (p) {
              const baseCode = String(p.product_code).split('-')[0];
              // Lọc ra tất cả các lô có chung mã gốc
              const variantIds = products.filter(x => String(x.product_code).split('-')[0] === baseCode).map(x => x.id);
              
              // Cập nhật giao diện lập tức (Optimistic Update)
              setProducts(prev => prev.map(x => variantIds.includes(x.id) ? { ...x, [field]: updateData } : x));
              
              // Đẩy lên Cloud đồng loạt
              await supabase.from("products").update({ [field]: updateData, updated_at: new Date().toISOString() }).in("id", variantIds);
           }
        } else {
           // Đổi tồn kho, giá vốn, HSD thì chỉ áp dụng độc lập cho đúng Lô đó
           setProducts(prev => prev.map(x => x.id === id ? { ...x, [field]: updateData } : x));
           await supabase.from("products").update({ [field]: updateData, updated_at: new Date().toISOString() }).eq("id", id); 
        }

        logAudit("SỬA SP", `ID ${id} - Đổi ${label}`); 
        toast.success("Cập nhật thành công!");
      } 
    }); 
  };

  const handlePrintBarcode = (p: any) => { const q = window.prompt(`SL tem in:`, "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode('barcode'); logAudit("IN TEM", p.name); } };
  const downloadSampleCSV = () => { try { const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,ĐK Tặng,Quà Tặng,Số Lượng,Hạn Sử Dụng\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,1,,100,2026-12-31"; const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Mau_Nhap_Kho.csv`; document.body.appendChild(link); link.click(); document.body.removeChild(link); } catch(e) {} };
  const exportToCSV = () => { let csv = "\uFEFFGiờ,Ca,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng,Lợi nhuận\n"; history.forEach(log => { csv += `${new Date(Math.floor(log.id)).toLocaleString('vi-VN')},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khách lẻ"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Bao_Cao_Ban_Hang.csv`; link.click(); logAudit("XUẤT EXCEL", "Lịch sử bán hàng"); };
  const exportAuditToCSV = () => { let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết\n"; auditLogs.forEach(log => { csv += `${log.time},${log.user_name},${log.shift},${log.action},"${(log.detail || "")}"\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `Nhat_Ky.csv`; link.click(); };
  
  const handleInventorySearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const term = String(inventorySearchTerm || "").trim().toLowerCase(); if (!term) return; const exactMatch = products.find(p => String(p.product_code || "").toLowerCase() === term); if (exactMatch) { const inputEl = document.getElementById(`inv-input-${exactMatch.id}`); if (inputEl) { inputEl.focus(); } } } };
  const handleInvInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const searchBox = document.getElementById('inv-search-box'); if (searchBox) { searchBox.focus(); setInventorySearchTerm(""); } } };
  const exportInventoryCSV = () => { let csv = "\uFEFFMã SP,Tên SP,Tồn hệ thống,Tồn thực tế\n"; products.forEach(p => { const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock; csv += `${p.product_code},"${cleanName(p.name)}",${p.stock},${actual}\n`; }); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `KiemKho.csv`; link.click(); logAudit("XUẤT KHO EXCEL", "File kiểm kho"); };
  
  const syncInventoryCheck = async () => {
    if(!navigator.onLine) return toast.error("Mạng yếu!"); if(!window.confirm("Xác nhận ghi đè?")) return;
    setLoading(true); let count = 0;
    try { for (const [id, actualQty] of Object.entries(actualStockInput)) { const p = products.find(x => String(x.id) === String(id)); if(p && p.stock !== actualQty) { await supabase.from("products").update({ stock: actualQty }).eq("id", p.id); logAudit("KIỂM KHO", `${p.name} -> ${actualQty}`); count++; } } toast.success(`Đồng bộ thành công!`); setShowInventoryModal(false); setActualStockInput({}); fetchProducts(); } 
    catch(err) {} finally { setLoading(false); }
  };
  
  const requestSort = (key: string) => { if (sortConfig && sortConfig.key === key) { if (sortConfig.direction === 'asc') setSortConfig({ key, direction: 'desc' }); else setSortConfig(null) } else { setSortConfig({ key, direction: 'asc' }) } };
  const toggleDateGroup = (dateStr: string) => setExpandedDates(prev => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => { 
    document.getElementById('search-barcode')?.focus(); 
    if (e.key === 'Enter') { 
      e.preventDefault(); const p = findProductByCode(barcodeInput); 
      if (p) { handleSelectSuggest(p); } else { 
        const matchedPhone = Object.keys(customersData || {}).find(phone => phone === barcodeInput.trim() || customersData[phone]?.cardCode === barcodeInput.trim()); 
        if (matchedPhone) { playSound('success'); setCustomerInput(customersData[matchedPhone]?.cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customersData[matchedPhone]?.name); setBarcodeInput(""); } 
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
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) { resetCheckout(); logAudit("HỦY GIỎ HÀNG", "Xóa sạch giỏ hiện tại"); } };

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

  const handleSendMarketingEmail = async () => {
    if (!marketingMsg) return toast.error("Nhập nội dung!"); if (!window.confirm("Gửi?")) return; setLoading(true); 
    const targetCustomers = Object.keys(customersData || {}).filter(phone => { const c = customersData[phone]; if (!c || !c.email) return false; if (marketingTier === "Tất cả") return true; return getCustomerTier(c.totalSpent || 0).name.includes(marketingTier); });
    if (targetCustomers.length === 0) { setLoading(false); return toast.error("Không tìm thấy khách hàng!"); }
    let successCount = 0;
    for (const phone of targetCustomers) { const c = customersData[phone]; const htmlContent = `<div><h1>HẢI LÊ MART</h1><p>${marketingMsg}</p></div>`; try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: c.email, subject: "💌 Ưu Đãi Đặc Quyền Từ Hải Lê Mart", html_message: htmlContent }); successCount++; } catch (error: any) {} }
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
      logAudit("TẠO PO", `Mã: ${poCode}`);
    } catch (err: any) { toast.error("Lỗi: " + err.message); } finally { setLoading(false); }
  };

  const handlePrintPO = (po: any, type: 'po_order' | 'po_receipt' | 'po_return') => { setPrintPOData(po); setPrintMode(type); logAudit("IN PHIẾU PO", po.po_code); };

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

  const renderModals = () => {
    return (
      <>
        <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
        {showHandoverModal && <HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} />}
        
        {/* MODAL CẤP DỮ LIỆU BÓC TÁCH CHI TIẾT */}
        <CashFlowModal 
          cashFlowModalInfo={cashFlowModalInfo} 
          setCashFlowModalInfo={setCashFlowModalInfo} 
          shift={shift} 
          todayStrStr={todayStrStr} 
          currentShiftCashFlow={{
            thu: cashFlowModalInfo === 'TIỀN MẶT' ? currentShiftCashFlow.thu_tien_mat : currentShiftCashFlow.thu_chuyen_khoan,
            chi: cashFlowModalInfo === 'TIỀN MẶT' ? currentShiftCashFlow.chi_tien_mat : currentShiftCashFlow.chi_chuyen_khoan
          }} 
          currentShiftStats={currentShiftStats} 
        />
        
        <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
        
        <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customersData} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} custAddress={custAddress} setCustAddress={setCustAddress}/>
        <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} onExportCSV={exportToCSV} handleExportCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
        <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} onImport={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
        <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customersData} handlePayDebt={handlePayDebt} />
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
          newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart} newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd} 
          newAdminPinInput={newAdminPinInput} setNewAdminPinInput={setNewAdminPinInput}
          saveSettings={saveSettings}
        />

        <CustomerModal 
          showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal}
          customers={customersData} setCustomers={setCustomers} logAudit={logAudit}
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
      
      <PrintManager printMode={printMode} lastOrder={lastOrder} shift={shift} role={role} customers={customersData} VAT_RATE={VAT_RATE} printBarcodeProduct={printBarcodeProduct} barcodeCount={barcodeCount} printCustomer={printCustomer} printPOData={printPOData} />
      {renderModals()}

      {!isLoggedIn ? (
        <Login setIsLoggedIn={setIsLoggedIn} setRole={setRole} shift={shift} setShift={setShift} startingCash={startingCash} setStartingCash={setStartingCash} installPrompt={installPrompt} handleInstallApp={handleInstallApp} />
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
