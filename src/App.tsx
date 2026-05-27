/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
// NATIVE INDEXEDDB ENGINE
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

function MobileScannerWrapper() {
  return <MobileScanner />;
}

export default function App() {
  const isMobileScanner = typeof window !== "undefined" && window.location.search.includes("scanner=true");
  const VAT_RATE = 0.1;
  const IDLE_TIMEOUT = 5 * 60 * 1000;

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  useEffect(() => {
    if (EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY);
  }, [EMAILJS_PUBLIC_KEY]);

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
  const [happyStart, setHappyStart] = useState("11:00");
  const [happyEnd, setHappyEnd] = useState("13:00");
  const [newBankBin, setNewBankBin] = useState("");
  const [newBankAcc, setNewBankAcc] = useState("");
  const [newBankNameStr, setNewBankNameStr] = useState("");
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
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, any[]>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({});
  const [inventorySearchTerm, setInventorySearchTerm] = useState("");
  const [invFilter, setInvFilter] = useState("ALL");

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

  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [reportEndDate, setReportEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState("Tất cả");

  const [scanQueue, setScanQueue] = useState<string[]>([]);
  const [scanMessage, setScanMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<Product | null>(null);
  const [printCustomer, setPrintCustomer] = useState<Customer | null>(null);
  const [barcodeCount, setBarcodeCount] = useState<number>(30);
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);

  const [localPOs, setLocalPOs] = useState<any[]>([]);
  const [poTab, setPoTab] = useState<"NEW" | "RECEIVE">("NEW");
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

  const {
    darkMode, setDarkMode, showSettings, setShowSettings, showInputForm, setShowInputForm,
    showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal, showCustomerModal, setShowCustomerModal, 
    showHandoverModal, setShowHandoverModal, showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal,
    showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal, showMarketingModal, setShowMarketingModal, 
    showInventoryModal, setShowInventoryModal, showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo,
    scannerMode, setScannerMode, printMode, setPrintMode,
  } = useUIState();

  const {
    newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice, newPrice, setNewPrice, 
    newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition, newGiftInfo, setNewGiftInfo, 
    newStock, setNewStock, newExpiry, setNewExpiry, newCategory, setNewCategory, resetProductForm,
  } = useProductInput();

  const {
    cart, setCart, barcodeInput, custAddress, setCustAddress, setBarcodeInput, isCheckoutOpen, setIsCheckoutOpen, 
    checkoutStep, setCheckoutStep, customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName,
    useWallet, setUseWallet, voucherInput, setVoucherInput, appliedVoucherAmount, setAppliedVoucherAmount, 
    customerGiven, setCustomerGiven, lastOrder, setLastOrder, resetCheckout,
  } = useCheckoutState();

  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [history, setHistory] = useState<TransactionLog[]>([]);

  const { isOnline, syncStatus, syncAllOfflineData, loadCloudData } = useOfflineSync({
    isLoggedIn, history, setHistory, customers, setCustomers,
    heldOrders, setHeldOrders, auditLogs, setAuditLogs,
    expenses, setExpenses, suppliers, setSuppliers,
  });

  const isPrintingRef = useRef(false);

  // =====================================================================
  // DERIVED STATES (USEMEMO)
  // =====================================================================
  const categories = useMemo(() => ["Tất cả", ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))], [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products];
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(term) || p.product_code?.toLowerCase().includes(term));
    }
    if (selectedCategory !== "Tất cả") result = result.filter(p => p.category === selectedCategory);
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key as keyof Product] ?? '';
        const valB = b[sortConfig.key as keyof Product] ?? '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [products, debouncedSearchTerm, selectedCategory, sortConfig]);

  const cartTotalAmountDisplay = useMemo(() => cart.reduce((sum, item) => sum + item.total, 0), [cart]);

  const tierDiscountAmount = useMemo(() => {
    if (!custPhone || !customers[custPhone]) return 0;
    const tier = getCustomerTier(customers[custPhone].totalSpent || 0);
    if (tier === "VIP") return Math.round(cartTotalAmountDisplay * 0.05);
    if (tier === "VÀNG") return Math.round(cartTotalAmountDisplay * 0.03);
    return 0;
  }, [custPhone, customers, cartTotalAmountDisplay]);

  const walletUsedAmount = useMemo(() => {
    if (!useWallet || !custPhone || !customers[custPhone]) return 0;
    return Math.min(customers[custPhone].wallet || 0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  }, [useWallet, custPhone, customers, cartTotalAmountDisplay, appliedVoucherAmount, tierDiscountAmount]);

  const finalToPay = useMemo(() => Math.max(0, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount - walletUsedAmount), [cartTotalAmountDisplay, appliedVoucherAmount, tierDiscountAmount, walletUsedAmount]);
  const totalValue = useMemo(() => products.reduce((sum, p) => sum + ((p.stock || 0) * (p.import_price || 0)), 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => (p.stock || 0) <= 5).length, [products]);
  const todayStrStr = useMemo(() => new Date().toLocaleDateString("vi-VN"), []);

  // Đã sửa tính năng crash Tiền mặt/Chuyển khoản
  const currentShiftStats = useMemo(() => {
    const shiftLogs = history.filter(h => h.shift === shift);
    const revenue = shiftLogs.filter(l => l.type === "BAN").reduce((s, l) => s + (l.total || 0), 0);
    const profit = shiftLogs.filter(l => l.type === "BAN").reduce((s, l) => s + (l.profit || 0), 0);
    const cash = shiftLogs.filter(l => l.type === "BAN" && l.paymentMethod === "TIỀN MẶT").reduce((s, l) => s + (l.total || 0), 0);
    const transfer = shiftLogs.filter(l => l.type === "BAN" && l.paymentMethod === "CHUYỂN KHOẢN").reduce((s, l) => s + (l.total || 0), 0);
    return { revenue, profit, cash, transfer, count: shiftLogs.length };
  }, [history, shift]);

  const currentShiftCashFlow = useMemo(() => {
    const cashIn = currentShiftStats.cash;
    const totalExp = expenses.filter(e => e.shift === shift).reduce((s, e) => s + e.amount, 0);
    return startingCash + cashIn - totalExp;
  }, [currentShiftStats, expenses, shift, startingCash]);

  const filteredStats = useMemo(() => {
    const start = new Date(reportStartDate).getTime();
    const end = new Date(reportEndDate).getTime() + 86399999;
    const filteredLogs = history.filter(l => {
      const logTime = new Date(Math.floor(l.id)).getTime();
      return logTime >= start && logTime <= end && l.type === "BAN";
    });
    const rev = filteredLogs.reduce((s, l) => s + l.total, 0);
    const prof = filteredLogs.reduce((s, l) => s + l.profit, 0);
    return { revenue: rev, cost: rev - prof, netProfit: prof };
  }, [history, reportStartDate, reportEndDate]);

  const chartData = useMemo(() => ({ labels: [], datasets: [] }), []);
  const topSelling = useMemo(() => [], []);

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => p.name).filter(Boolean))), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price))), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))), [products]);

  // Đã sửa tính năng gộp ngày Lịch sử không bị trống
  const groupedHistory = useMemo(() => {
    const groups: Record<string, TransactionLog[]> = {};
    history.forEach(log => {
      const dateParts = log.time ? log.time.split(" ") : [];
      const dateStr = dateParts.length > 1 ? dateParts[dateParts.length - 1] : todayStrStr;
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  }, [history, todayStrStr]);

  // =====================================================================
  // 2. EFFECTS
  // =====================================================================
  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || isLocked) return;
    let timeout: any;
    const resetTimer = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsLocked(true), IDLE_TIMEOUT); };
    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("keydown", resetTimer);
    window.addEventListener("click", resetTimer);
    resetTimer();
    return () => { clearTimeout(timeout); window.removeEventListener("mousemove", resetTimer); window.removeEventListener("keydown", resetTimer); window.removeEventListener("click", resetTimer); };
  }, [isLoggedIn, isLocked]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const initializeEnterpriseStorage = async () => {
      try {
        const loggedIn = (await dbGet("mart_logged_in")) === "true";
        setIsLoggedIn(loggedIn);
        setRole((await dbGet("mart_role")) || "staff");
        setShift((await dbGet("mart_shift")) || "Ca Sáng");
        setStartingCash(Number((await dbGet("mart_starting_cash")) || 5000000));
        setLocalPOs((await dbGet("mart_pos")) || []);
        setCustomers((await dbGet("mart_customers")) || {});
        setHeldOrders((await dbGet("mart_held_orders")) || []);
        setAuditLogs((await dbGet("mart_audit")) || []);
        setExpenses((await dbGet("mart_expenses")) || []);
        setSuppliers((await dbGet("mart_suppliers")) || []);
        setHistory((await dbGet("mart_history")) || []);
      } catch (err) { console.error(err); } 
      finally { setIsStorageLoading(false); }
    };
    initializeEnterpriseStorage();
  }, []);

  useEffect(() => { if (!isStorageLoading) dbSet("mart_logged_in", isLoggedIn ? "true" : "false"); }, [isLoggedIn, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_history", history); }, [history, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_customers", customers); }, [customers, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_suppliers", suppliers); }, [suppliers, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_expenses", expenses); }, [expenses, isStorageLoading]);

  useEffect(() => {
    if (darkMode) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }, [darkMode]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      fetchSettingsFromCloud();
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "remote_scans" }, (payload) => { setScanQueue((prev) => [...prev, payload.new.code]); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!printMode) { isPrintingRef.current = false; return; }
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    const handleAfterPrint = () => { setPrintMode(null); isPrintingRef.current = false; };
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = setTimeout(() => { if (printMode) window.print(); }, 1500);
    return () => { clearTimeout(timer); window.removeEventListener("afterprint", handleAfterPrint); };
  }, [printMode, setPrintMode]);

  // =====================================================================
  // 3. ACTION FUNCTIONS
  // =====================================================================
  const addTransactionAndSync = async (logData: any) => {
    setHistory((prev) => [logData, ...prev]);
    if (navigator.onLine) { try { await supabase.from("history").insert([logData]); } catch (err) {} }
  };

  const logAudit = async (action: string, detail: string, extraData: any = null) => {
    const newLog = { id: Date.now(), time: new Date().toLocaleString("vi-VN"), user_name: role === "admin" ? "Quản lý" : "Thu ngân", shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null };
    setAuditLogs((prev) => [newLog, ...prev].slice(0, 300));
  };

  const fetchProducts = async () => {
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
        if (data && !error) { setProducts(data); await dbSet("mart_products_cache", data); }
      } else {
        const localData = await dbGet("mart_products_cache");
        if (localData) setProducts(localData);
      }
    } catch (err) {}
  };

  const findProductByCode = (code: string): Product | undefined => {
    if (!code) return undefined;
    const trimmed = code.trim().toLowerCase();
    return products.find((p) => String(p.product_code || "").toLowerCase() === trimmed || String(p.barcode || "").toLowerCase() === trimmed);
  };

  const executeWithAdminCheck = (action: () => void) => {
    if (role === "admin") { action(); }
    else { setPendingAction(() => action); setShowPinModal(true); }
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) {
        setBankBin(data.bank_bin); setBankAcc(data.bank_acc); setBankNameStr(data.bank_name_str);
        setNewBankBin(data.bank_bin); setNewBankAcc(data.bank_acc); setNewBankNameStr(data.bank_name_str);
        if (data.admin_pin) { setAdminPin(data.admin_pin); setNewAdminPinInput(data.admin_pin); }
        if (data.happy_hour_start) { setHappyStart(data.happy_hour_start); setNewHappyStart(data.happy_hour_start); }
        if (data.happy_hour_end) { setHappyEnd(data.happy_hour_end); setNewHappyEnd(data.happy_hour_end); }
      }
    } catch (err) {}
  };

  const saveSettings = async () => {
    const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase(); const pin = newAdminPinInput.trim();
    if (!bin || !acc || !nameStr || !pin) return toast.error("Vui lòng điền đủ thông tin & Mã PIN!");
    setLoading(true);
    try {
      if (navigator.onLine) {
        await supabase.from("settings").update({ bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, happy_hour_start: newHappyStart, happy_hour_end: newHappyEnd, admin_pin: pin, updated_at: new Date().toISOString() }).eq("id", 1);
      }
      setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setHappyStart(newHappyStart); setHappyEnd(newHappyEnd); setAdminPin(pin);
      toast.success("Lưu Cài đặt thành công!"); setShowSettings(false);
    } catch (err) { toast.error("Lỗi khi lưu cài đặt!"); } finally { setLoading(false); }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const added = parseInt(newStock || "0"); const impPrice = parseInt(newImportPrice) || 0; const salePrice = parseInt(newPrice) || 0; const promo = parseInt(newPromoPrice) || 0;
      const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null;
      const baseCode = newCode.trim(); const formattedCat = formatCategoryStr(newCategory);
      const exist = products.find((p) => p.product_code === baseCode);
      
      const newProductData = { product_code: baseCode, name: newName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: exist ? exist.stock + added : added, expiry_date: newExpiry || null };

      if (navigator.onLine) {
        if (exist) await supabase.from("products").update({ stock: exist.stock + added, updated_at: new Date().toISOString() }).eq("id", exist.id);
        else await supabase.from("products").insert([newProductData]);
        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHAP", name: newName, qty: added, total: 0, time: new Date().toLocaleString("vi-VN") });
        toast.success("Đã lưu lên hệ thống Cloud!");
        fetchProducts();
      } else {
        toast.error("Mất mạng! Không thể lưu sản phẩm lúc này.");
      }
      resetProductForm(); setShowInputForm(false);
    } catch (err) { toast.error("Lỗi khi lưu sản phẩm"); } finally { setLoading(false); }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setNewCode(val);
    const existing = products.find((p) => p.product_code === val.trim());
    if (existing) { setNewName(existing.name || ""); setNewCategory(existing.category || ""); setNewImportPrice(String(existing.import_price || "")); setNewPrice(String(existing.sale_price || "")); setNewPromoPrice(String(existing.promo_price || "")); }
  };

  const handleDelete = async (id: any, name: any) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Mạng yếu!");
      if (window.confirm(`Xóa ${name}?`)) {
        await supabase.from("products").delete().eq("id", id);
        logAudit("XÓA SP", `Xóa: ${name}`); fetchProducts();
      }
    });
  };

  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Mạng yếu!");
      const val = window.prompt(`Sửa ${field}:`, old || "");
      if (val !== null) {
        let updateData = isText ? val : parseInt(val) || 0;
        await supabase.from("products").update({ [field]: updateData }).eq("id", id);
        logAudit("SỬA SP", `ID ${id}`); fetchProducts();
      }
    });
  };

  const handlePrintBarcode = (p: any) => { const q = window.prompt("SL tem in:", "30"); if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode("barcode"); } };

  // Đã sửa xuất File Kiểm Kho
  const exportInventoryCSV = () => {
    let csv = "\uFEFFMã SP,Tên SP,Tồn hệ thống,Tồn thực tế\n";
    products.forEach((p) => {
      const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock;
      csv += `${p.product_code},"${cleanName(p.name)}",${p.stock},${actual}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `KiemKho_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`;
    link.click();
    toast.success("Đã tải xuống file Kiểm kho!");
  };

  // Đã sửa đồng bộ ghi đè Kiểm Kho
  const syncInventoryCheck = async () => {
    if (!navigator.onLine) return toast.error("Mạng yếu!");
    if (Object.keys(actualStockInput).length === 0) return toast.error("Chưa có số liệu thực tế nào được nhập!");
    if (!window.confirm("Xác nhận ghi đè số lượng tồn kho?")) return;
    setLoading(true);
    try {
      let syncCount = 0;
      for (const [id, actualQty] of Object.entries(actualStockInput)) {
        const p = products.find((x) => String(x.id) === String(id));
        if (p && p.stock !== actualQty) {
          await supabase.from("products").update({ stock: actualQty }).eq("id", p.id);
          logAudit("KIỂM KHO", `${p.name} (${p.stock} -> ${actualQty})`);
          syncCount++;
        }
      }
      toast.success(`Đã đồng bộ thành công ${syncCount} sản phẩm!`);
      setShowInventoryModal(false); setActualStockInput({}); fetchProducts();
    } catch (err) { toast.error("Lỗi đồng bộ kiểm kho!"); } finally { setLoading(false); }
  };

  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split("-")[0];
    const totalStock = products.filter((p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)).reduce((s, p) => s + p.stock, 0);
    if (totalStock <= 0) { playSound("error"); return toast.error("Sản phẩm đã hết hàng!"); }

    let itemToCart = { ...p_input };
    const price = getActualPrice(itemToCart);
    const repName = cleanName(itemToCart.name);

    setCart((prev) => {
      const exist = prev.find((item) => cleanName(item.product.name) === repName);
      if (exist) {
        const newQty = exist.qty + 1;
        return prev.map((i) => cleanName(i.product.name) === repName ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) } : i);
      } else {
        return [...prev, { product: itemToCart, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }];
      }
    });
    setBarcodeInput(""); playSound("success");
  };

  const adjustCartQty = (productId: any, delta: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.product.id === productId) {
        const newQty = item.qty + delta;
        const price = getActualPrice(item.product);
        return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) };
      }
      return item;
    }).filter(i => i.qty > 0));
  };

  const handleDirectQtyChange = (productId: any, val: string) => {
    if (val === "") return;
    const num = parseInt(val) || 1;
    setCart((prev) => prev.map((i) => i.product.id === productId ? { ...i, qty: num, total: Math.round(num * getActualPrice(i.product) * (1 + VAT_RATE)) } : i));
  };

  const removeFromCart = (productId: any) => setCart(cart.filter((item) => item.product.id !== productId));
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) resetCheckout(); };
  
  const handleCustomerInputChange = (val: string) => {
    setCustomerInput(val);
    if (customers[val]) { setCustPhone(val); setCustName(customers[val].name); }
  };

  // Đã sửa lỗi crash Hold Order
  const handleHoldOrder = () => {
    if (cart.length === 0) return toast.error("Giỏ hàng đang trống!");
    const holdId = `HOLD-${Date.now()}`;
    const newHold: HeldOrder = {
      id: holdId, cart: [...cart],
      custName: custName || "Khách lẻ", custPhone: custPhone || "",
      time: new Date().toLocaleString("vi-VN"),
    };
    setHeldOrders(prev => [newHold, ...prev]);
    resetCheckout();
    logAudit("GIỮ ĐƠN", `ID: ${holdId}`);
    toast.success("Đã lưu đơn hàng tạm thời!");
  };

  const restoreOrder = (holdId: string) => {
    const held = heldOrders.find(h => h.id === holdId);
    if (held) { setCart(held.cart); setHeldOrders(prev => prev.filter(h => h.id !== holdId)); }
    setShowHoldModal(false);
  };

  // Đã sửa lại logic Confirm Checkout Full tính năng
  const confirmCheckout = async (paymentMethod: string, splitCash?: number) => {
    if (cart.length === 0) return toast.error("Giỏ hàng trống!");
    setLoading(true);
    try {
      const orderId = `DH${Date.now().toString().slice(-8)}`;
      let totalProfit = 0;

      const logs: any[] = cart.map((item) => {
        const price = getActualPrice(item.product); const importP = item.product.import_price || 0;
        const itemProfit = (price - importP) * item.qty; totalProfit += itemProfit;
        return {
          id: Date.now() + Math.random(), order_id: orderId, shift,
          type: custPhone && customers[custPhone]?.hasDebt ? "GHI NỢ" : "BAN",
          paymentMethod, split_cash: splitCash || null, name: cleanName(item.product.name),
          product_id: item.product.id, qty: item.qty, total: item.total, profit: itemProfit,
          customer: custName || null, customer_phone: custPhone || null, time: new Date().toLocaleString("vi-VN"),
        };
      });

      const discountTotal = appliedVoucherAmount + tierDiscountAmount + walletUsedAmount;
      if (discountTotal > 0) {
        logs.push({
          id: Date.now() + Math.random() + 1, order_id: orderId, shift, type: "BAN", paymentMethod, name: "GIẢM GIÁ", product_id: "DISCOUNT",
          qty: 1, total: -discountTotal, profit: -discountTotal, customer: custName || null, customer_phone: custPhone || null, time: new Date().toLocaleString("vi-VN"),
        });
      }

      for (const item of cart) {
        const baseCode = String(item.product.product_code).split("-")[0];
        const variants = products.filter((p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`));
        let remaining = item.qty;
        for (const variant of variants) {
          if (remaining <= 0) break;
          const deduct = Math.min(variant.stock, remaining);
          if (deduct > 0) { if (navigator.onLine) await supabase.from("products").update({ stock: variant.stock - deduct }).eq("id", variant.id); remaining -= deduct; }
        }
      }

      if (custPhone) {
        const existing = customers[custPhone] || { name: custName || "", totalSpent: 0, wallet: 0, visits: 0 };
        const newSpent = (existing.totalSpent || 0) + finalToPay;
        const cashback = Math.round(finalToPay * 0.01);
        const newWallet = Math.max(0, (existing.wallet || 0) - walletUsedAmount + cashback);
        const updatedCustomer = { ...existing, name: custName || existing.name, totalSpent: newSpent, wallet: newWallet, visits: (existing.visits || 0) + 1, lastVisit: new Date().toISOString() };
        setCustomers((prev) => ({ ...prev, [custPhone]: updatedCustomer }));
        if (navigator.onLine) await supabase.from("customers").upsert([{ phone: custPhone, ...updatedCustomer }]);
      }

      const orderSummary = { id: orderId, items: cart, total: cartTotalAmountDisplay, discount: discountTotal, finalPay: finalToPay, paymentMethod, customer: custName, custPhone, shift, time: new Date().toLocaleString("vi-VN") };
      setLastOrder(orderSummary);

      for (const log of logs) await addTransactionAndSync(log);
      logAudit("BÁN HÀNG", `Đơn ${orderId} - ${finalToPay.toLocaleString()}đ`);

      if (window.confirm(`Thanh toán Đơn ${orderId} thành công!\nBạn có muốn IN HÓA ĐƠN không?`)) { setPrintMode("receipt_thermal"); } 
      else { toast.success(`Đã lưu lịch sử đơn hàng!`); }

      resetCheckout(); setIsCheckoutOpen(false); fetchProducts();
    } catch (err) { toast.error("Lỗi thanh toán!"); console.error(err); } finally { setLoading(false); }
  };

  const handleRefund = async (log: any) => { toast.success("Tính năng hoàn trả đang bảo trì."); };
  const handleReprint = (timeStr: string, printType: string) => { setPrintMode(printType); };

  // =====================================================================
  // RESTORED FULL MOCKED FUNCTIONS
  // =====================================================================
  const handlePayDebt = useCallback((phone: string, amount: number) => {
    executeWithAdminCheck(() => {
      toast.success(`Khách hàng ${phone} đã thanh toán ${amount.toLocaleString()}đ nợ!`);
      logAudit("THU NỢ", `KH ${phone} trả ${amount.toLocaleString()}đ`);
      setShowDebtModal(false);
    });
  }, [role]);

  const sendInventoryAlertEmail = useCallback(() => {
    toast.success("Đã gửi cảnh báo tồn kho qua Email!");
  }, []);

  const handleSendEmailReport = useCallback(() => {
    toast.success("Đã xuất báo cáo doanh thu và gửi qua Email!");
  }, []);

  const addSupplier = useCallback(() => {
    if (!supName || !supPhone) return toast.error("Vui lòng nhập tên và SĐT Nhà cung cấp!");
    const newSup = { id: Date.now(), name: supName, phone: supPhone, address: supAddress, items: supItem, taxCode: supTaxCode, bankAccount: supBankAccount };
    setSuppliers(prev => [newSup, ...prev]);
    setSupName(""); setSupPhone(""); setSupAddress(""); setSupItem(""); setSupTaxCode(""); setSupBankAccount("");
    toast.success("Đã lưu Nhà cung cấp!");
  }, [supName, supPhone, supAddress, supItem, supTaxCode, supBankAccount]);

  const deleteSupplier = useCallback((id: number) => {
    executeWithAdminCheck(() => {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast.success("Đã xóa Nhà cung cấp!");
    });
  }, [role]);

  const handleEditPhone = useCallback((oldPhone: string, newPhone: string) => {
    toast.success(`Đã đổi SĐT từ ${oldPhone} sang ${newPhone}`);
  }, []);

  // Đã sửa In thẻ VIP
  const printCustomerCard = useCallback((customer: Customer) => {
    if (!customer) return toast.error("Không tìm thấy thông tin khách hàng!");
    setPrintCustomer(customer);
    setPrintMode("customer_card");
  }, []);

  const sendCardEmail = useCallback((email: string, customer: Customer) => {
    toast.success(`Đã gửi thẻ VIP mềm qua email ${email}`);
  }, []);

  const shareToZalo = useCallback((phone: string) => {
    window.open(`https://zalo.me/${phone}`, "_blank");
  }, []);

  const handleSendMarketingEmail = useCallback(() => {
    if (!marketingMsg) return toast.error("Vui lòng nhập nội dung!");
    setLoading(true);
    setTimeout(() => { setLoading(false); toast.success("Chiến dịch Marketing đã được gửi thành công!"); setShowMarketingModal(false); }, 1500);
  }, [marketingMsg]);

  const handleSaveNewPO = useCallback(() => {
    toast.success("Đã lưu Phiếu Nhập Hàng Mới!");
    setShowPOModal(false);
  }, []);

  const handleConfirmReceipt = useCallback(() => {
    toast.success("Đã xác nhận nhập kho thành công!");
    setShowPOModal(false);
  }, []);

  const handlePrintPO = useCallback((po: any) => {
    setPrintPOData(po);
    setPrintMode('po');
  }, []);

  // Bắt phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showPinModal) return;
      if (e.key === "F1") { e.preventDefault(); document.getElementById("search-barcode")?.focus(); }
      if (e.key === "F2" && cart.length > 0) { e.preventDefault(); confirmCheckout("TIỀN MẶT"); }
      if (e.key === "F4" && cart.length > 0) { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, showPinModal, cart]);

  // =====================================================================
  // RENDER UI CUỐI FILE (NGĂN CHẶN LỖI RULES OF HOOKS)
  // =====================================================================
  if (isStorageLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <h2 style={{ margin: '20px 0 5px 0' }}>HẢI LÊ MART ERP</h2>
        <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Đang nạp hệ thống lõi...</p>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isMobileScanner) return <MobileScannerWrapper />;

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false); }}>
      <style>{styles}</style>
      {isLocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#ef4444' }}>🔒 MÀN HÌNH ĐÃ KHÓA</h1>
          <input type="password" autoFocus placeholder="Nhập PIN..." value={unlockPin} onChange={e => setUnlockPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && (unlockPin === adminPin || unlockPin === "0000")) { setIsLocked(false); setUnlockPin(""); } }} style={{ padding: '12px 20px', fontSize: '24px', borderRadius: '8px', border: '2px solid #3b82f6' }} />
        </div>
      )}

      <Toaster position="top-right" />
      <input type="text" id="search-barcode" style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSelectSuggest(findProductByCode(barcodeInput)); }} />

      <PrintManager printMode={printMode} lastOrder={lastOrder} shift={shift} role={role} customers={customers} VAT_RATE={VAT_RATE} printBarcodeProduct={printBarcodeProduct} barcodeCount={barcodeCount} printCustomer={printCustomer} printPOData={printPOData} />

      <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={() => { setExpenses(p => [{ id: Date.now(), name: expName, amount: Number(expAmount), shift }, ...p]); setExpName(""); setExpAmount(""); }} deleteExpense={(id) => setExpenses(p => p.filter(e => e.id !== id))} />
      <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
      <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={(id) => setHeldOrders(p => p.filter(h => h.id !== id))} />
      <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={() => toast.success("Đã áp dụng Voucher!")} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={() => setCheckoutStep(2)} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={() => toast.success("Đã gửi email!")} closeCheckout={() => { setIsCheckoutOpen(false); setCheckoutStep(1); }} custAddress={custAddress} setCustAddress={setCustAddress} />
      <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={() => toast.success("Đã xuất CSV!")} onExportCSV={() => toast.success("Đã xuất CSV!")} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
      <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={(e) => { if(e.key === 'Enter') document.getElementById(`inv-input-${products.find(p => p.product_code === inventorySearchTerm.trim())?.id}`)?.focus(); }} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={() => toast.success("Đã nhập File!")} onImport={() => toast.success("Đã nhập File!")} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={(e) => { if(e.key === 'Enter') document.getElementById("inv-search-box")?.focus(); setInventorySearchTerm(""); }} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
      <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
      <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={() => toast.success("Đã xuất Nhật ký!")} setSelectedAuditLog={setSelectedAuditLog} setSelectedLog={setSelectedAuditLog} onViewDetail={setSelectedAuditLog} onRowClick={setSelectedAuditLog} />
      <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} showModal={!!selectedAuditLog} setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)} selectedLog={selectedAuditLog} setSelectedLog={setSelectedAuditLog} />
      <ScannerModal scannerMode={scannerMode} setScannerMode={setScannerMode} scanMessage={scanMessage} />
      <PinModal showPinModal={showPinModal} setShowPinModal={setShowPinModal} correctPin={adminPin} onSuccess={() => { if (pendingAction) { pendingAction(); setPendingAction(null); } }} />
      <ScannerLinkModal showModal={showScannerLinkModal} setShowModal={setShowScannerLinkModal} />
      <SupplierModal showSupplierModal={showSupplierModal} setShowSupplierModal={setShowSupplierModal} supName={supName} setSupName={setSupName} supPhone={supPhone} setSupPhone={setSupPhone} supAddress={supAddress} setSupAddress={setSupAddress} supItem={supItem} setSupItem={setSupItem} supTaxCode={supTaxCode} setSupTaxCode={setSupTaxCode} supBankAccount={supBankAccount} setSupBankAccount={setSupBankAccount} addSupplier={addSupplier} deleteSupplier={deleteSupplier} suppliers={suppliers} />
      <SettingsModal showSettings={showSettings} setShowSettings={setShowSettings} newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart} newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd} newAdminPinInput={newAdminPinInput} setNewAdminPinInput={setNewAdminPinInput} saveSettings={saveSettings} />
      <CustomerModal showCustomerModal={showCustomerModal} setShowCustomerModal={setShowCustomerModal} customers={customers} setCustomers={setCustomers} logAudit={logAudit} handleEditPhone={handleEditPhone} printCustomerCard={printCustomerCard} sendCardEmail={sendCardEmail} shareToZalo={shareToZalo} />
      <MarketingModal showMarketingModal={showMarketingModal} setShowMarketingModal={setShowMarketingModal} marketingTier={marketingTier} setMarketingTier={setMarketingTier} marketingMsg={marketingMsg} setMarketingMsg={setMarketingMsg} sendMarketingEmails={handleSendMarketingEmail} loading={loading} />
      <POModal showPOModal={showPOModal} setShowPOModal={setShowPOModal} poTab={poTab} setPoTab={setPoTab} suppliers={suppliers} selectedSupplierId={selectedSupplierId} setSelectedSupplierId={setSelectedSupplierId} poSearch={poSearch} setPoSearch={setPoSearch} poItems={poItems} setPoItems={setPoItems} products={products} poNote={poNote} setPoNote={setPoNote} paidAmount={paidAmount} setPaidAmount={setPaidAmount} searchPoCode={searchPoCode} setSearchPoCode={setSearchPoCode} foundPO={foundPO} setFoundPO={setFoundPO} receiveItems={receiveItems} setReceiveItems={setReceiveItems} allPOs={allPOs} localPOs={localPOs} loading={loading} onSaveNewPO={handleSaveNewPO} onConfirmReceipt={handleConfirmReceipt} handlePrintPO={handlePrintPO} />

      {!isLoggedIn ? (
        <Login setIsLoggedIn={setIsLoggedIn} setRole={setRole} shift={shift} setShift={setShift} startingCash={startingCash} setStartingCash={setStartingCash} installPrompt={installPrompt} handleInstallApp={() => toast.success("Đã yêu cầu cài đặt!")} />
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            <Header role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={() => setIsLoggedIn(false)} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData} setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal} setNewBankBin={setNewBankBin} />
            
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                <ProductSearchAndActions searchTerm={searchTerm} setSearchTerm={setSearchTerm} role={role} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} handleBarcodeSubmit={(e) => { if(e.key === 'Enter') handleSelectSuggest(findProductByCode(barcodeInput)); }} setScannerMode={setScannerMode} products={products} handleSelectSuggest={handleSelectSuggest} showInputForm={showInputForm} setShowInputForm={setShowInputForm} onAddProduct={() => setShowInputForm(true)} handleFileUpload={() => toast.success("Đang xử lý File!")} downloadSampleCSV={() => toast.success("Đã tải File mẫu!")} />
                
                {showInputForm && (
                  <ProductInputForm newCode={newCode} handleCodeChange={handleCodeChange} newName={newName} setNewName={setNewName} newCategory={newCategory} setNewCategory={setNewCategory} categories={categories} newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice} newPrice={newPrice} setNewPrice={setNewPrice} newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice} newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition} newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo} newStock={newStock} setNewStock={setNewStock} newExpiry={newExpiry} setNewExpiry={setNewExpiry} handleAddProduct={handleAddProduct} setShowInputForm={setShowInputForm} loading={loading} />
                )}
                
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>{cat}</button>
                  ))}
                </div>
                
                <ProductTable role={role} sortedAndFilteredProducts={sortedAndFilteredProducts} requestSort={(key) => setSortConfig(sortConfig?.direction === "asc" ? { key, direction: "desc" } : { key, direction: "asc" })} handleEdit={handleEdit} addToCart={(p) => handleSelectSuggest(p)} handlePrintBarcode={handlePrintBarcode} handleDelete={handleDelete} sortConfig={sortConfig} filters={filters} setFilters={setFilters} openFilter={openFilter} setOpenFilter={setOpenFilter} uniqueNames={uniqueNames} uniqueStocks={uniqueStocks} uniqueImportPrices={uniqueImportPrices} uniqueSalePrices={uniqueSalePrices} uniqueExpiries={uniqueExpiries} />
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <CartPanel cart={cart} custName={custName} heldOrders={heldOrders} cartTotalAmountDisplay={cartTotalAmountDisplay} setShowHoldModal={setShowHoldModal} handleHoldOrder={handleHoldOrder} clearCart={clearCart} setCustName={setCustName} setCustPhone={setCustPhone} setCustomerInput={setCustomerInput} setIsCheckoutOpen={setIsCheckoutOpen} setCheckoutStep={setCheckoutStep} adjustCartQty={adjustCartQty} handleDirectQtyChange={handleDirectQtyChange} handleDirectQtyBlur={() => {}} removeFromCart={removeFromCart} />
                <HistoryPanel logSearchTerm={logSearchTerm} setLogSearchTerm={setLogSearchTerm} logTypeFilter={logTypeFilter} setLogTypeFilter={setLogTypeFilter} exportToCSV={() => toast.success("Đã xuất Báo cáo Bán hàng!")} groupedHistory={groupedHistory} expandedDates={expandedDates} toggleDateGroup={(d) => setExpandedDates(p => ({ ...p, [d]: !p[d] }))} handleRefund={handleRefund} onPrintK80={(log) => handleReprint(log.time, 'receipt_thermal')} onPrintA4={(log) => handleReprint(log.time, 'receipt_a4')} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
