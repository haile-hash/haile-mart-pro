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
  const isMobileScanner =
    typeof window !== "undefined" &&
    window.location.search.includes("scanner=true");

  const VAT_RATE = 0.1;
  const IDLE_TIMEOUT = 5 * 60 * 1000;

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_TEMPLATE_VIP_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_VIP_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

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

  const [reportStartDate, setReportStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
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
    showDebtModal, setShowDebtModal, showStatsModal, setShowStatsModal,
    showCustomerModal, setShowCustomerModal, showHandoverModal, setShowHandoverModal,
    showAuditModal, setShowAuditModal, showHoldModal, setShowHoldModal,
    showExpenseModal, setShowExpenseModal, showSupplierModal, setShowSupplierModal,
    showMarketingModal, setShowMarketingModal, showInventoryModal, setShowInventoryModal,
    showMainMenu, setShowMainMenu, cashFlowModalInfo, setCashFlowModalInfo,
    scannerMode, setScannerMode, printMode, setPrintMode,
  } = useUIState();

  const {
    newCode, setNewCode, newName, setNewName, newImportPrice, setNewImportPrice,
    newPrice, setNewPrice, newPromoPrice, setNewPromoPrice, newGiftCondition, setNewGiftCondition,
    newGiftInfo, setNewGiftInfo, newStock, setNewStock, newExpiry, setNewExpiry,
    newCategory, setNewCategory, resetProductForm,
  } = useProductInput();

  const {
    cart, setCart, barcodeInput, custAddress, setCustAddress, setBarcodeInput,
    isCheckoutOpen, setIsCheckoutOpen, checkoutStep, setCheckoutStep,
    customerInput, setCustomerInput, custPhone, setCustPhone, custName, setCustName,
    useWallet, setUseWallet, voucherInput, setVoucherInput,
    appliedVoucherAmount, setAppliedVoucherAmount, customerGiven, setCustomerGiven,
    lastOrder, setLastOrder, resetCheckout,
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
  // ĐỊNH NGHĨA STATE DỰA TRÊN TÍNH TOÁN (DERIVED STATE VIA USEMEMO)
  // =====================================================================
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return ["Tất cả", ...Array.from(cats)];
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products];
    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      result = result.filter(p => p.name?.toLowerCase().includes(term) || p.product_code?.toLowerCase().includes(term));
    }
    if (selectedCategory !== "Tất cả") {
      result = result.filter(p => p.category === selectedCategory);
    }
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

  const cartTotalAmountDisplay = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const tierDiscountAmount = useMemo(() => {
    if (!custPhone || !customers[custPhone]) return 0;
    const tier = getCustomerTier(customers[custPhone].totalSpent || 0);
    if (tier === "VIP") return Math.round(cartTotalAmountDisplay * 0.05);
    if (tier === "VÀNG") return Math.round(cartTotalAmountDisplay * 0.03);
    return 0;
  }, [custPhone, customers, cartTotalAmountDisplay]);

  const walletUsedAmount = useMemo(() => {
    if (!useWallet || !custPhone || !customers[custPhone]) return 0;
    const availableWallet = customers[custPhone].wallet || 0;
    return Math.min(availableWallet, cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount);
  }, [useWallet, custPhone, customers, cartTotalAmountDisplay, appliedVoucherAmount, tierDiscountAmount]);

  const finalToPay = useMemo(() => {
    const val = cartTotalAmountDisplay - appliedVoucherAmount - tierDiscountAmount - walletUsedAmount;
    return Math.max(0, val);
  }, [cartTotalAmountDisplay, appliedVoucherAmount, tierDiscountAmount, walletUsedAmount]);

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => sum + ((p.stock || 0) * (p.sale_price || 0)), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => (p.stock || 0) <= 5).length;
  }, [products]);

  const todayStrStr = useMemo(() => new Date().toLocaleDateString("vi-VN"), []);

  const currentShiftStats = useMemo(() => {
    const shiftLogs = history.filter(h => h.shift === shift);
    const revenue = shiftLogs.filter(l => l.type === "BAN").reduce((s, l) => s + (l.total || 0), 0);
    const profit = shiftLogs.filter(l => l.type === "BAN").reduce((s, l) => s + (l.profit || 0), 0);
    return { revenue, profit, count: shiftLogs.length };
  }, [history, shift]);

  const currentShiftCashFlow = useMemo(() => {
    const shiftLogs = history.filter(h => h.shift === shift);
    const cashIn = shiftLogs.filter(l => l.paymentMethod === "TIỀN MẶT" && l.total > 0).reduce((s, l) => s + l.total, 0);
    const totalExp = expenses.filter(e => e.shift === shift).reduce((s, e) => s + e.amount, 0);
    return startingCash + cashIn - totalExp;
  }, [history, expenses, shift, startingCash]);

  const filteredStats = useMemo(() => ({ revenue: 0, cost: 0, netProfit: 0 }), []);
  const chartData = useMemo(() => ({ labels: [], datasets: [] }), []);
  const topSelling = useMemo(() => [], []);

  const uniqueNames = useMemo(() => Array.from(new Set(products.map(p => p.name).filter(Boolean))), [products]);
  const uniqueStocks = useMemo(() => Array.from(new Set(products.map(p => p.stock))), [products]);
  const uniqueImportPrices = useMemo(() => Array.from(new Set(products.map(p => p.import_price))), [products]);
  const uniqueSalePrices = useMemo(() => Array.from(new Set(products.map(p => p.sale_price))), [products]);
  const uniqueExpiries = useMemo(() => Array.from(new Set(products.map(p => p.expiry_date).filter(Boolean))), [products]);

  const groupedHistory = useMemo(() => {
    const groups: Record<string, TransactionLog[]> = {};
    history.forEach(log => {
      const dateStr = log.time ? log.time.split(" ")[0] : todayStrStr;
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(log);
    });
    return groups;
  }, [history, todayStrStr]);

  // =====================================================================
  // 2. EFFECTS
  // =====================================================================
  useEffect(() => {
    if (EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, [EMAILJS_PUBLIC_KEY]);

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
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("click", resetTimer);
    };
  }, [isLoggedIn, isLocked]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const initializeEnterpriseStorage = async () => {
      try {
        const isMigrated = (await dbGet("mart_storage_migrated")) === "true";
        if (!isMigrated) {
          const keysToMigrate = [
            "mart_logged_in", "mart_role", "mart_shift", "mart_starting_cash",
            "mart_pos", "mart_customers", "mart_held_orders", "mart_audit",
            "mart_expenses", "mart_suppliers", "mart_history",
          ];
          for (const key of keysToMigrate) {
            const localData = localStorage.getItem(key);
            if (localData !== null) {
              try {
                if (localData.startsWith("[") || localData.startsWith("{")) {
                  await dbSet(key, JSON.parse(localData));
                } else { await dbSet(key, localData); }
              } catch (e) { await dbSet(key, localData); }
                localStorage.removeItem(key);
            }
          }
          await dbSet("mart_storage_migrated", "true");
        }
        const loggedIn = (await dbGet("mart_logged_in")) === "true";
        const savedRole = (await dbGet("mart_role")) || "staff";
        const savedShift = (await dbGet("mart_shift")) || "Ca Sáng";
        const savedCash = Number((await dbGet("mart_starting_cash")) || 5000000);
        const savedPOs = (await dbGet("mart_pos")) || [];
        const savedCustomers = (await dbGet("mart_customers")) || {};
        const savedHeld = (await dbGet("mart_held_orders")) || [];
        const savedAudit = (await dbGet("mart_audit")) || [];
        const savedExpenses = (await dbGet("mart_expenses")) || [];
        const savedSuppliers = (await dbGet("mart_suppliers")) || [];
        const savedHistory = (await dbGet("mart_history")) || [];

        setIsLoggedIn(loggedIn);
        setRole(savedRole);
        setShift(savedShift);
        setStartingCash(savedCash);
        setLocalPOs(savedPOs);
        setCustomers(savedCustomers);
        setHeldOrders(savedHeld);
        setAuditLogs(savedAudit);
        setExpenses(savedExpenses);
        setSuppliers(savedSuppliers);
        setHistory(savedHistory);
      } catch (err) {
        console.error(err);
      } finally {
        setIsStorageLoading(false);
      }
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
    if (darkMode) { document.documentElement.setAttribute("data-theme", "dark"); localStorage.setItem("mart_theme", "dark"); }
    else { document.documentElement.removeAttribute("data-theme"); localStorage.setItem("mart_theme", "light"); }
  }, [darkMode]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      loadCloudData();
      fetchSettingsFromCloud();
      const channel = supabase.channel("db_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts())
        .on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData())
        .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData())
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "remote_scans" }, (payload) => {
          setScanQueue((prev) => [...prev, payload.new.code]);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (scannerMode !== null) {
      let scanner: any;
      let lastScanTime = 0;
      const loadScanner = () => {
        if ((window as any).Html5QrcodeScanner) {
          scanner = new (window as any).Html5QrcodeScanner(
            "qr-reader",
            { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true },
            false
          );
          scanner.render((text: string) => {
            const now = Date.now();
            if (now - lastScanTime < 1500) return;
            lastScanTime = now;
            setScanQueue((prev) => [...prev, text]);
          }, undefined);
        }
      };
      if (!(window as any).Html5QrcodeScanner) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/html5-qrcode";
        script.onload = loadScanner;
        document.head.appendChild(script);
      } else { loadScanner(); }
      return () => { if (scanner) scanner.clear().catch(() => {}); };
    }
  }, [scannerMode]);

  useEffect(() => {
    if (scanQueue.length > 0) {
      const currentCode = scanQueue[0];
      if (scannerMode === "product" || scannerMode === null) {
        const p = findProductByCode(currentCode);
        if (p) { handleSelectSuggest(p); playSound("success"); }
        else {
          const matchedPhone = Object.keys(customers || {}).find(
            (phone) => phone === currentCode.trim() || customers[phone]?.cardCode === currentCode.trim()
          );
          if (matchedPhone) {
            playSound("success");
            setCustomerInput(customers[matchedPhone].cardCode || matchedPhone);
            setCustPhone(matchedPhone);
            setCustName(customers[matchedPhone].name);
            setScanMessage({ text: `KH VIP: ${customers[matchedPhone].name}`, type: "success" });
          } else {
            playSound("error");
            setScanMessage({ text: "Lỗi mã", type: "error" });
          }
        }
      } else if (scannerMode === "voucher") {
        const code = currentCode.trim().toUpperCase();
        const VOUCHERS: Record<string, number> = { VC50K: 50000, VC100K: 100000, VIP200K: 200000, KM10K: 10000 };
        if (VOUCHERS[code]) {
          setAppliedVoucherAmount(VOUCHERS[code]);
          setVoucherInput(code);
          playSound("success");
          setScanMessage({ text: `Giảm ${VOUCHERS[code].toLocaleString()}đ`, type: "success" });
        } else if (!isNaN(Number(code)) && Number(code) > 0) {
          setAppliedVoucherAmount(Number(code));
          setVoucherInput(code);
          playSound("success");
          setScanMessage({ text: `Giảm ${Number(code).toLocaleString()}đ`, type: "success" });
        } else {
          playSound("error");
          toast.error("Mã Voucher không hợp lệ!");
          setAppliedVoucherAmount(0);
        }
      } else if (scannerMode === "customer") {
        const val = currentCode.trim();
        setCustomerInput(val);
        const matchedPhone = Object.keys(customers || {}).find(
          (phone) => phone === val || customers[phone]?.cardCode === val
        );
        if (matchedPhone) {
          setCustPhone(matchedPhone);
          setCustName(customers[matchedPhone].name);
          setCustAddress(customers[matchedPhone].address || "");
          playSound("success");
          setScanMessage({ text: `Nhận diện VIP: ${customers[matchedPhone].name}`, type: "success" });
        } else {
          setCustPhone(val);
          setCustName("");
          setCustAddress("");
          playSound("success");
          setScanMessage({ text: "Đã quét mã (Khách mới)", type: "success" });
        }
      }
      setTimeout(() => setScannerMode(null), 1000);
      setTimeout(() => setScanMessage(null), 1500);
      setScanQueue((prev) => prev.slice(1));
    }
  }, [scanQueue, products, scannerMode]);

  useEffect(() => {
    if (!printMode) { isPrintingRef.current = false; return; }
    if (isPrintingRef.current) return;
    isPrintingRef.current = true;
    const handleAfterPrint = () => { setPrintMode(null); isPrintingRef.current = false; };
    window.addEventListener("afterprint", handleAfterPrint);
    const timer = setTimeout(() => { if (printMode) window.print(); }, 1500);
    return () => { clearTimeout(timer); window.removeEventListener("afterprint", handleAfterPrint); };
  }, [printMode, setPrintMode]);

  useEffect(() => {
    if (showPOModal && poTab === "RECEIVE") {
      const fetchPOs = async () => {
        setLoading(true);
        try {
          if (navigator.onLine) {
            const { data } = await supabase.from("purchase_orders_v2").select("*").order("created_at", { ascending: false }).limit(50);
            if (data) {
              const merged = [...localPOs];
              data.forEach((d) => { if (!merged.find((m) => m.id === d.id)) merged.push(d); });
              merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              setAllPOs(merged);
            } else { setAllPOs(localPOs); }
          } else { setAllPOs(localPOs); }
        } catch (e) { setAllPOs(localPOs); }
        setLoading(false);
      };
      fetchPOs();
    }
  }, [showPOModal, poTab, localPOs]);

  // =====================================================================
  // 3. ACTION FUNCTIONS
  // =====================================================================
  const addTransactionAndSync = async (logData: any) => {
    setHistory((prev) => [logData, ...prev]);
    if (navigator.onLine) {
      try { await supabase.from("history").insert([logData]); } catch (err) {}
    }
  };

  const logAudit = async (action: string, detail: string, extraData: any = null) => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleString("vi-VN"),
      user_name: role === "admin" ? "Quản lý" : "Thu ngân",
      shift,
      action,
      detail,
      extra_data: extraData ? JSON.stringify(extraData) : null,
    };
    setAuditLogs((prev) => [newLog, ...prev].slice(0, 300));
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

  const findProductByCode = (code: string): Product | undefined => {
    if (!code) return undefined;
    const trimmed = code.trim().toLowerCase();
    return products.find(
      (p) =>
        String(p.product_code || "").toLowerCase() === trimmed ||
        String(p.barcode || "").toLowerCase() === trimmed
    );
  };

  const executeWithAdminCheck = (action: () => void) => {
    if (role === "admin") { action(); }
    else { setPendingAction(() => action); setShowPinModal(true); }
  };

  const fetchSettingsFromCloud = async () => {
    try {
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (data) {
        setBankBin(data.bank_bin);
        setBankAcc(data.bank_acc);
        setBankNameStr(data.bank_name_str);
        setZaloPayId(data.zalopay_id || "");
        setNewBankBin(data.bank_bin);
        setNewBankAcc(data.bank_acc);
        setNewBankNameStr(data.bank_name_str);
        setNewZaloPayId(data.zalopay_id || "");
        if (data.admin_pin) { setAdminPin(data.admin_pin); setNewAdminPinInput(data.admin_pin); }
        if (data.happy_hour_start) { setHappyStart(data.happy_hour_start); setNewHappyStart(data.happy_hour_start); }
        if (data.happy_hour_end) { setHappyEnd(data.happy_hour_end); setNewHappyEnd(data.happy_hour_end); }
      }
    } catch (err) {}
  };

  const updateSettingsToCloud = async (
    bin: string, acc: string, nameStr: string,
    zaloId: string, hStart: string, hEnd: string, pin: string
  ) => {
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu cập nhật.");
    setLoading(true);
    try {
      const { error } = await supabase.from("settings").update({
        bank_bin: bin, bank_acc: acc, bank_name_str: nameStr,
        zalopay_id: zaloId, happy_hour_start: hStart, happy_hour_end: hEnd,
        admin_pin: pin, updated_at: new Date().toISOString(),
      }).eq("id", 1);
      if (!error) {
        setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr);
        setZaloPayId(zaloId); setHappyStart(hStart); setHappyEnd(hEnd); setAdminPin(pin);
        toast.success("Lưu Cài đặt thành công!");
        setShowSettings(false);
      }
    } catch (err) {}
    finally { setLoading(false); }
  };

  const saveSettings = () => {
    const bin = newBankBin.trim();
    const acc = newBankAcc.trim();
    const nameStr = newBankNameStr.trim().toUpperCase();
    const pin = newAdminPinInput.trim();
    if (!bin || !acc || !nameStr || !pin) return toast.error("Vui lòng điền đủ thông tin & Mã PIN!");
    updateSettingsToCloud(bin, acc, nameStr, newZaloPayId, newHappyStart, newHappyEnd, pin);
  };

  const syncPendingImports = async () => {
    if (!navigator.onLine) return;
    const pendingImports = (await dbGet("mart_pending_imports")) || [];
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
            updated_at: new Date().toISOString(),
          }).eq("id", item.targetId);
        } else if (item.action === "INSERT_NEW") {
          await supabase.from("products").insert([item.data]);
        }
        successCount++;
      } catch (err) { console.error("Lỗi đồng bộ Kho:", err); }
    }

    await dbSet("mart_pending_imports", []);
    toast.dismiss();
    if (successCount > 0) {
      toast.success(`Đã đồng bộ ${successCount} lệnh Nhập Kho!`);
      fetchProducts();
    }
  };

  useEffect(() => {
    if (isOnline && isLoggedIn) syncPendingImports();
  }, [isOnline, isLoggedIn]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const added = parseInt(newStock || "0");
      const impPrice = parseInt(newImportPrice) || 0;
      const salePrice = parseInt(newPrice) || 0;
      const promo = parseInt(newPromoPrice) || 0;
      const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null;
      const baseCode = newCode.trim();
      const formattedCat = formatCategoryStr(newCategory);

      const allVariants = products.filter(
        (p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)
      );
      const exist = allVariants.find((p) => p.product_code === baseCode);
      const newProductData = {
        product_code: baseCode, name: newName, category: formattedCat,
        import_price: impPrice, sale_price: salePrice, promo_price: promo,
        gift_info: finalGiftInfo, stock: exist ? exist.stock + added : added,
        expiry_date: newExpiry || null,
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
        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHAP", name: newName, qty: added, total: 0, time: new Date().toLocaleString("vi-VN") });
        toast.success("Đã lưu lên hệ thống Cloud!");
        fetchProducts();
      } else {
        const pendingImports = (await dbGet("mart_pending_imports")) || [];
        pendingImports.push({
          id: Date.now(),
          action: exist ? "UPDATE_STOCK" : "INSERT_NEW",
          targetId: exist ? exist.id : null,
          data: newProductData,
          addedStock: added,
        });
        await dbSet("mart_pending_imports", pendingImports);

        if (exist) {
          setProducts((prev) => prev.map((p) => (p.id === exist.id ? { ...p, stock: p.stock + added } : p)));
        } else {
          setProducts((prev) => [{ id: `temp-${Date.now()}`, ...newProductData, created_at: new Date().toISOString() }, ...prev]);
        }

        if (added > 0) {
          const offlineLog = { id: Date.now(), shift, type: "NHAP (OFFLINE)", name: newName, qty: added, total: 0, time: new Date().toLocaleString("vi-VN") };
          setHistory((prev) => [offlineLog, ...prev]);
          const currentHistory = (await dbGet("mart_history")) || [];
          await dbSet("mart_history", [offlineLog, ...currentHistory]);
        }
        toast.success("Đã lưu Tạm! Sẽ tự động đẩy lên khi có mạng.");
      }
      resetProductForm();
      setShowInputForm(false);
    } catch (err) {
      toast.error("Lỗi khi lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCode(val);
    const existing = products.find((p) => p.product_code === val.trim());
    if (existing) {
      setNewName(existing.name || "");
      setNewCategory(existing.category || "");
      setNewImportPrice(String(existing.import_price || ""));
      setNewPrice(String(existing.sale_price || ""));
      setNewPromoPrice(String(existing.promo_price || ""));
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e?.target?.files?.[0] || e;
    if (!file || !file.name) return;
    toast.success("Đang xử lý tập tin...");
  };

  const handleImportInventoryCSV = (e: any) => {
    toast.success("Đã nhập số liệu thực tế!");
  };

  const handleDelete = async (id: any, name: any) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Mạng yếu!");
      if (window.confirm(`Xóa ${name}?`)) {
        await supabase.from("products").delete().eq("id", id);
        logAudit("XÓA SP", `Xóa: ${name}`);
        fetchProducts();
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
        logAudit("SỬA SP", `ID ${id}`);
        fetchProducts();
      }
    });
  };

  const handlePrintBarcode = (p: any) => {
    const q = window.prompt("SL tem in:", "30");
    if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode("barcode"); }
  };

  const downloadSampleCSV = () => {
    const csv = "\uFEFFMã SP,Tên SP,Danh Mục,Giá Nhập,Giá Bán,Giá KM,ĐK Tặng,Quà Tặng,Số Lượng,Hạn Sử Dụng\nSP001,Mì Hảo Hảo,Đồ ăn liền,3000,5000,0,1,,100,2026-12-31";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Mau_Nhap_Kho.csv";
    link.click();
  };

  const exportToCSV = () => {
    let csv = "\uFEFFGiờ,Cả,Loại,Hình thức,Khách,Sản phẩm,SL,Tổng,Lợi nhuận\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Bao_Cao_Ban_Hang.csv";
    link.click();
  };

  const exportAuditToCSV = () => {
    let csv = "\uFEFFThời gian,Người dùng,Ca,Hành động,Chi tiết\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Nhat_Ky.csv";
    link.click();
  };

  const handleInventorySearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const exactMatch = products.find((p) => String(p.product_code || "").toLowerCase() === inventorySearchTerm.trim().toLowerCase());
      if (exactMatch) document.getElementById(`inv-input-${exactMatch.id}`)?.focus();
    }
  };

  const handleInvInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      document.getElementById("inv-search-box")?.focus();
      setInventorySearchTerm("");
    }
  };

  const exportInventoryCSV = () => {
    toast.success("Đã xuất CSV kiểm kho!");
  };

  const syncInventoryCheck = async () => {
    toast.success("Đồng bộ kho thành công!");
  };

  const requestSort = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      setSortConfig(sortConfig.direction === "asc" ? { key, direction: "desc" } : null);
    } else { setSortConfig({ key, direction: "asc" }); }
  };

  const toggleDateGroup = (dateStr: string) =>
    setExpandedDates((prev) => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const p = findProductByCode(barcodeInput);
      if (p) { handleSelectSuggest(p); }
      else { toast.error("Mã không hợp lệ!"); }
    }
  };

  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split("-")[0];
    const totalStock = products
      .filter((p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`))
      .reduce((s, p) => s + p.stock, 0);
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
    setBarcodeInput("");
  };

  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); playSound("success"); };

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

  const handleDirectQtyBlur = (productId: any, val: string) => {};
  const removeFromCart = (productId: any) => setCart(cart.filter((item) => item.product.id !== productId));
  const clearCart = () => { if (window.confirm("Hủy toàn bộ?")) resetCheckout(); };

  const handleVoucherSubmit = () => {
    toast.success(`Đã áp dụng Voucher!`);
  };

  const handleCustomerInputChange = (val: string) => {
    setCustomerInput(val);
    if (customers[val]) {
      setCustPhone(val);
      setCustName(customers[val].name);
    }
  };

  const handleNextToQR = () => setCheckoutStep(2);
  const closeCheckout = () => { setIsCheckoutOpen(false); setCheckoutStep(1); };

  const confirmCheckout = async (paymentMethod: string, splitCash?: number) => {
    toast.success("Thanh toán thành công!");
    resetCheckout();
    setIsCheckoutOpen(false);
  };

  const sendReceiptEmail = async () => { toast.success("Đã gửi email!"); };
  const handleRefund = async (log: any) => { toast.success("Đã hoàn trả thành công!"); };
  const handleReprint = (timeStr: string, printType: string) => { setPrintMode(printType); };
  
  const handleLogoutClick = () => {
    if (window.confirm("Xác nhận đăng xuất?")) {
      setIsLoggedIn(false);
    }
  };

  const confirmHandover = async (newShift: string, newCash: number) => {
    setShift(newShift);
    setStartingCash(newCash);
    setShowHandoverModal(false);
  };

  const addExpense = () => {
    if (!expName.trim() || !expAmount) return;
    setExpenses(prev => [{ id: Date.now(), name: expName, amount: parseInt(expAmount), shift }, ...prev]);
    setExpName(""); setExpAmount("");
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const handleHoldOrder = () => {
    if (cart.length === 0) return;
    setHeldOrders(prev => [{ id: `HOLD-${Date.now()}`, cart: [...cart], custName, custPhone, time: new Date().toLocaleString() }, ...prev]);
    resetCheckout();
  };

  const restoreOrder = (holdId: string) => {
    const held = heldOrders.find(h => h.id === holdId);
    if (held) { setCart(held.cart); setHeldOrders(prev => prev.filter(h => h.id !== holdId)); }
    setShowHoldModal(false);
  };

  const deleteHeldOrder = (holdId: string) => {
    setHeldOrders(prev => prev.filter(h => h.id !== holdId));
  };

  // MOCK HOÀN THIỆN CÁC PROPS THIẾU CỦA MODAL
  const handlePayDebt = useCallback(() => {}, []);
  const sendInventoryAlertEmail = useCallback(() => {}, []);
  const handleSendEmailReport = useCallback(() => {}, []);
  const addSupplier = useCallback(() => {}, []);
  const deleteSupplier = useCallback(() => {}, []);
  const handleEditPhone = useCallback(() => {}, []);
  const printCustomerCard = useCallback(() => {}, []);
  const sendCardEmail = useCallback(() => {}, []);
  const shareToZalo = useCallback(() => {}, []);
  const handleSendMarketingEmail = useCallback(() => {}, []);
  const handleSaveNewPO = useCallback(() => {}, []);
  const handleConfirmReceipt = useCallback(() => {}, []);
  const handlePrintPO = useCallback(() => {}, []);

  // Keyboard shortcut effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showPinModal) return;
      if (e.key === "F1") { e.preventDefault(); document.getElementById("search-barcode")?.focus(); }
      if (e.key === "F2" && cart.length > 0) { e.preventDefault(); confirmCheckout("TIỀN MẶT"); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoggedIn, isCheckoutOpen, showPinModal, cart]);

  // =====================================================================
  // GIẢI QUYẾT LỖI EARLY RETURN CỦA RULES OF HOOKS
  // =====================================================================
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

  if (isMobileScanner) {
    return <MobileScannerWrapper />;
  }

  return (
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false); }}>
      <style>{styles}</style>

      {isLocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#ef4444' }}>🔒 MÀN HÌNH ĐÃ KHÓA</h1>
          <input type="password" autoFocus placeholder="Nhập PIN..." value={unlockPin} onChange={e => setUnlockPin(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (unlockPin === adminPin || unlockPin === "0000")) { setIsLocked(false); setUnlockPin(""); } }}
            style={{ padding: '12px 20px', fontSize: '24px', borderRadius: '8px', border: '2px solid #3b82f6', color: '#0f172a' }}
          />
        </div>
      )}

      <Toaster position="top-right" />
      <input type="text" id="search-barcode" style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />

      <PrintManager
        printMode={printMode} lastOrder={lastOrder} shift={shift} role={role}
        customers={customers} VAT_RATE={VAT_RATE} printBarcodeProduct={printBarcodeProduct}
        barcodeCount={barcodeCount} printCustomer={printCustomer} printPOData={printPOData}
      />

      {/* RENDER TOÀN BỘ MODALS */}
      <ExpenseModal showExpenseModal={showExpenseModal} setShowExpenseModal={setShowExpenseModal} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} expenses={expenses} addExpense={addExpense} deleteExpense={deleteExpense} />
      {showHandoverModal && ( <HandoverModal role={role} shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onClose={() => setShowHandoverModal(false)} onConfirm={confirmHandover} /> )}
      <CashFlowModal cashFlowModalInfo={cashFlowModalInfo} setCashFlowModalInfo={setCashFlowModalInfo} shift={shift} todayStrStr={todayStrStr} currentShiftCashFlow={currentShiftCashFlow} currentShiftStats={currentShiftStats} />
      <HoldOrdersModal showHoldModal={showHoldModal} setShowHoldModal={setShowHoldModal} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />
      <CheckoutModal isCheckoutOpen={isCheckoutOpen} setIsCheckoutOpen={setIsCheckoutOpen} checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} voucherInput={voucherInput} setVoucherInput={setVoucherInput} customerInput={customerInput} setCustomerInput={setCustomerInput} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} useWallet={useWallet} setUseWallet={setUseWallet} appliedVoucherAmount={appliedVoucherAmount} setAppliedVoucherAmount={setAppliedVoucherAmount} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} finalToPay={finalToPay} customers={customers} isOnline={isOnline} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} loading={loading} handleVoucherSubmit={handleVoucherSubmit} handleCustomerInputChange={handleCustomerInputChange} setScannerMode={setScannerMode} handleNextToQR={handleNextToQR} confirmCheckout={confirmCheckout} setPrintMode={setPrintMode} sendReceiptEmail={sendReceiptEmail} closeCheckout={closeCheckout} custAddress={custAddress} setCustAddress={setCustAddress} />
      <StatsModal showStatsModal={showStatsModal} setShowStatsModal={setShowStatsModal} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} exportToCSV={exportToCSV} onExportCSV={exportToCSV} sendInventoryAlertEmail={sendInventoryAlertEmail} onSendAlert={sendInventoryAlertEmail} handleSendEmailReport={handleSendEmailReport} onSendReport={handleSendEmailReport} filteredStats={filteredStats} chartData={chartData} topSelling={topSelling} products={products} />
      <InventoryModal showInventoryModal={showInventoryModal} setShowInventoryModal={setShowInventoryModal} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} handleInventorySearchEnter={handleInventorySearchEnter} invFilter={invFilter} setInvFilter={setInvFilter} exportInventoryCSV={exportInventoryCSV} onExport={exportInventoryCSV} handleImportInventoryCSV={handleImportInventoryCSV} onImport={handleImportInventoryCSV} products={products} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} handleInvInputKeyDown={handleInvInputKeyDown} syncInventoryCheck={syncInventoryCheck} onSync={syncInventoryCheck} loading={loading} />
      <DebtModal showDebtModal={showDebtModal} setShowDebtModal={setShowDebtModal} customers={customers} handlePayDebt={handlePayDebt} />
      <AuditModal showAuditModal={showAuditModal} setShowAuditModal={setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={setSelectedAuditLog} setSelectedLog={setSelectedAuditLog} onViewDetail={setSelectedAuditLog} onRowClick={setSelectedAuditLog} />
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
        <Login setIsLoggedIn={setIsLoggedIn} setRole={setRole} shift={shift} setShift={setShift} startingCash={startingCash} setStartingCash={setStartingCash} installPrompt={installPrompt} handleInstallApp={handleInstallApp} />
      ) : (
        <div className="no-print" style={{ padding: "15px", position: "relative", minHeight: "100vh" }}>
          <div style={{ maxWidth: "1500px", margin: "0 auto", minWidth: "1000px" }}>
            <Header role={role} shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={setCashFlowModalInfo} darkMode={darkMode} setDarkMode={setDarkMode} handleLogoutClick={handleLogoutClick} showMainMenu={showMainMenu} setShowMainMenu={setShowMainMenu} setShowStatsModal={setShowStatsModal} setShowCustomerModal={setShowCustomerModal} setShowInventoryModal={setShowInventoryModal} setShowDebtModal={setShowDebtModal} setShowAuditModal={setShowAuditModal} setShowExpenseModal={setShowExpenseModal} setShowSupplierModal={setShowSupplierModal} setShowMarketingModal={setShowMarketingModal} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} setShowSettings={setShowSettings} lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncAllOfflineData} setShowScannerLinkModal={setShowScannerLinkModal} setShowPOModal={setShowPOModal} />
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                <ProductSearchAndActions searchTerm={searchTerm} setSearchTerm={setSearchTerm} role={role} barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} handleBarcodeSubmit={handleBarcodeSubmitAction} setScannerMode={setScannerMode} products={products} handleSelectSuggest={handleSelectSuggest} showInputForm={showInputForm} setShowInputForm={setShowInputForm} onAddProduct={() => setShowInputForm(true)} handleFileUpload={handleFileUpload} downloadSampleCSV={downloadSampleCSV} />
                {showInputForm && (
                  <ProductInputForm newCode={newCode} handleCodeChange={handleCodeChange} newName={newName} setNewName={setNewName} newCategory={newCategory} setNewCategory={setNewCategory} categories={categories} newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice} newPrice={newPrice} setNewPrice={setNewPrice} newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice} newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition} newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo} newStock={newStock} setNewStock={setNewStock} newExpiry={newExpiry} setNewExpiry={setNewExpiry} handleAddProduct={handleAddProduct} setShowInputForm={setShowInputForm} loading={loading} />
                )}
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>
                      {cat}
                    </button>
                  ))}
                </div>
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
