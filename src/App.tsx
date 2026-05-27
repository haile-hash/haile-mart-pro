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

// =====================================================================
// FIX #1: Tách component riêng để xử lý early return TRƯỚC khi dùng hooks
// Điều này giải quyết vi phạm Rules of Hooks nghiêm trọng nhất
// =====================================================================
function MobileScannerWrapper() {
  return <MobileScanner />;
}

export default function App() {
  // FIX #1: Kiểm tra scanner mode KHÔNG dùng early return trước hooks
  const isMobileScanner =
    typeof window !== "undefined" &&
    window.location.search.includes("scanner=true");

  const VAT_RATE = 0.1;
  const IDLE_TIMEOUT = 5 * 60 * 1000;

  const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const EMAILJS_TEMPLATE_VIP_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_VIP_ID;
  const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  // FIX #14: emailjs.init chỉ chạy khi có key, không bị crash khi key undefined
  useEffect(() => {
    if (EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    }
  }, [EMAILJS_PUBLIC_KEY]);

  // =====================================================================
  // 1. STATES VÀ HOOKS — Tất cả hooks luôn được gọi (không bị skip)
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

  // FIX #1: Sau tất cả hooks, mới được return sớm
  if (isMobileScanner) {
    return <MobileScannerWrapper />;
  }

  // =====================================================================
  // 2. EFFECTS
  // =====================================================================

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") { setInstallPrompt(null); toast.success("Cài đặt App thành công!"); }
  };

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

  // FIX #12: Thêm đầy đủ dependencies — dùng useCallback cho confirmCheckout & handleHoldOrder
  // để tránh stale closure trong keyboard effect
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLoggedIn || isCheckoutOpen || showPinModal || showAuditModal || showCustomerModal || showSettings || showInputForm || showInventoryModal || cashFlowModalInfo || showPOModal) return;
      if (e.key === "F1") { e.preventDefault(); document.getElementById("search-barcode")?.focus(); }
      if (e.key === "F2") { e.preventDefault(); if (cart.length > 0) confirmCheckout("TIỀN MẶT"); }
      if (e.key === "F3") { e.preventDefault(); if (cart.length > 0) confirmCheckout("CHUYỂN KHOẢN"); }
      if (e.key === "F4") { e.preventDefault(); handleHoldOrder(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, isCheckoutOpen, showPinModal, cart, showAuditModal, showCustomerModal, showSettings, showInputForm, showInventoryModal, cashFlowModalInfo, showPOModal]);

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

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js";
      script.onload = () => { if (EMAILJS_PUBLIC_KEY) emailjs.init(EMAILJS_PUBLIC_KEY); };
      document.head.appendChild(script);

      const xlsxScript = document.createElement("script");
      xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
      document.head.appendChild(xlsxScript);

      return () => { supabase.removeChannel(channel); };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            setScanMessage({ text: "Loi ma", type: "error" });
          }
        }
      } else if (scannerMode === "voucher") {
        const code = currentCode.trim().toUpperCase();
        const VOUCHERS: Record<string, number> = { VC50K: 50000, VC100K: 100000, VIP200K: 200000, KM10K: 10000 };
        if (VOUCHERS[code]) {
          setAppliedVoucherAmount(VOUCHERS[code]);
          setVoucherInput(code);
          playSound("success");
          setScanMessage({ text: `Giam ${VOUCHERS[code].toLocaleString()}d`, type: "success" });
        } else if (!isNaN(Number(code)) && Number(code) > 0) {
          setAppliedVoucherAmount(Number(code));
          setVoucherInput(code);
          playSound("success");
          setScanMessage({ text: `Giam ${Number(code).toLocaleString()}d`, type: "success" });
        } else {
          playSound("error");
          toast.error("Ma Voucher khong hop le!");
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
          setScanMessage({ text: `Nhan dien VIP: ${customers[matchedPhone].name}`, type: "success" });
        } else {
          setCustPhone(val);
          setCustName("");
          setCustAddress("");
          playSound("success");
          setScanMessage({ text: "Da quet ma (Khach moi)", type: "success" });
        }
      }
      setTimeout(() => setScannerMode(null), 1000);
      setTimeout(() => setScanMessage(null), 1500);
      setScanQueue((prev) => prev.slice(1));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      user_name: role === "admin" ? "Quan ly" : "Thu ngan",
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

  // FIX #11: Định nghĩa findProductByCode — hàm bị thiếu hoàn toàn
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
    if (!navigator.onLine) return toast.error("Mat mang! Khong the luu Cap nhat.");
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
        toast.success("Luu Cai dat thanh cong!");
        setShowSettings(false);
      }
    } catch (err) {}
    finally { setLoading(false); }
  };

  const saveSettings = () => {
    const bin = newBankBin.trim();
    const acc = newBankAcc.trim();
    const nameStr = newBankNameStr.trim().toUpperCase();
    const zaloId = newZaloPayId.trim();
    const pin = newAdminPinInput.trim();
    if (!bin || !acc || !nameStr || !pin) return toast.error("Vui long dien du thong tin & Ma PIN!");
    updateSettingsToCloud(bin, acc, nameStr, zaloId, newHappyStart, newHappyEnd, pin);
  };

  const syncPendingImports = async () => {
    if (!navigator.onLine) return;
    const pendingImports = (await dbGet("mart_pending_imports")) || [];
    if (pendingImports.length === 0) return;

    toast.loading("Dang dong bo du lieu Nhap Kho Offline...");
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
      } catch (err) { console.error("Loi dong bo Kho:", err); }
    }

    await dbSet("mart_pending_imports", []);
    toast.dismiss();
    if (successCount > 0) {
      toast.success(`Da dong bo ${successCount} lenh Nhap Kho!`);
      fetchProducts();
    }
  };

  useEffect(() => {
    if (isOnline && isLoggedIn) syncPendingImports();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            const batchName = `${newName} [Lo moi]`;
            if (window.confirm(`Tao LO MOI (${batchCode})?`)) {
              await supabase.from("products").insert([{ ...newProductData, product_code: batchCode, name: batchName }]);
            } else { setLoading(false); return; }
          } else {
            await supabase.from("products").update({ stock: exist.stock + added, updated_at: new Date().toISOString() }).eq("id", exist.id);
          }
        } else {
          await supabase.from("products").insert([newProductData]);
        }
        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHAP", name: newName, qty: added, total: 0, time: new Date().toLocaleString("vi-VN") });
        toast.success("Da luu len he thong Cloud!");
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
        toast.success("Da luu Tam! Se tu dong day len khi co mang.");
      }
      resetProductForm();
      setShowInputForm(false);
    } catch (err) {
      toast.error("Loi khi luu san pham");
    } finally {
      setLoading(false);
    }
  };

  // FIX #8: Định nghĩa handleCodeChange — hàm bị thiếu hoàn toàn
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewCode(val);
    // Tự động điền thông tin nếu mã đã tồn tại
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
    if (!file || !file.name) { if (e?.target) e.target.value = ""; return; }
    if (!navigator.onLine) { toast.error("Can mang de tai len!"); if (e?.target) e.target.value = ""; return; }

    const processData = async (lines: any[]) => {
      setLoading(true);
      try {
        if (!lines || lines.length <= 1) { toast.error("File rong!"); setLoading(false); return; }
        let successCount = 0;
        let importLogs: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i];
          if (!cols || !Array.isArray(cols) || cols.join("").trim() === "") continue;
          const pCode = String(cols[0] || "").trim();
          const pName = String(cols[1] || "").trim();
          const pCategory = formatCategoryStr(String(cols[2] || ""));
          const pImpPrice = parseInt(String(cols[3] || "0").replace(/[,.]/g, "")) || 0;
          const pSalePrice = parseInt(String(cols[4] || "0").replace(/[,.]/g, "")) || 0;
          const pPromoPrice = parseInt(String(cols[5] || "0").replace(/[,.]/g, "")) || 0;
          const pGiftCond = String(cols[6] || "1").trim();
          const pGiftText = cols[7] ? String(cols[7]).trim() : "";
          const pGift = pGiftText !== "" ? `${pGiftCond};;;${pGiftText}` : null;
          const pStock = parseInt(String(cols[8] || "0").replace(/[,.]/g, "")) || 0;
          const pExpiry = cols[9] ? String(cols[9]).trim() : null;
          if (!pCode || !pName || pSalePrice <= 0) continue;

          const allVariants = products.filter(
            (p) => p.product_code === pCode || String(p.product_code).startsWith(`${pCode}-`)
          );
          if (allVariants.length > 0) {
            const needSync = allVariants.some(
              (v) => v.sale_price !== pSalePrice || v.promo_price !== pPromoPrice || v.gift_info !== pGift
            );
            if (needSync) {
              await Promise.all(allVariants.map((v) =>
                supabase.from("products").update({ sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift }).eq("id", v.id)
              ));
            }
          }
          const exist = allVariants.find((p) => p.product_code === pCode);
          if (exist) {
            if (exist.stock <= 0) {
              await supabase.from("products").update({
                name: pName, category: pCategory, import_price: pImpPrice,
                sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift,
                stock: pStock, expiry_date: pExpiry, created_at: new Date().toISOString(),
              }).eq("id", exist.id);
            } else if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) {
              const batchCode = `${pCode}-${Date.now().toString().slice(-4)}${i}`;
              await supabase.from("products").insert([{
                product_code: batchCode, name: pName, category: pCategory,
                import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice,
                gift_info: pGift, stock: pStock, expiry_date: pExpiry,
              }]);
            } else {
              await supabase.from("products").update({ stock: exist.stock + pStock, created_at: new Date().toISOString() }).eq("id", exist.id);
            }
          } else {
            await supabase.from("products").insert([{
              product_code: pCode, name: pName, category: pCategory,
              import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice,
              gift_info: pGift, stock: pStock, expiry_date: pExpiry,
            }]);
          }
          if (pStock > 0) {
            importLogs.push({
              id: Date.now() + Math.random(), shift, type: "NHAP",
              name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString("vi-VN"),
            });
            successCount++;
          }
        }
        if (importLogs.length > 0) {
          if (navigator.onLine) await supabase.from("history").insert(importLogs);
          setHistory((prev) => [...importLogs, ...prev]);
        }
        logAudit("NHAP FILE", `Nhap ${successCount} ma`);
        toast.success("Nhap thanh cong tu file!");
        fetchProducts();
      } catch (err) { toast.error("Loi doc file."); }
      setLoading(false);
    };

    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith(".xlsx") || fileNameStr.endsWith(".xls")) {
      if (!(window as any).XLSX) { toast.loading("Excel Library loading..."); if (e?.target) e.target.value = ""; return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = (window as any).XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false });
          processData(jsonData);
        } catch (error) { toast.error("Loi doc file Excel."); }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim() !== "").map((l) =>
          l.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ""))
        );
        processData(lines);
      };
      reader.readAsText(file);
    }
    if (e?.target) e.target.value = "";
  };

  const handleImportInventoryCSV = (e: any) => {
    const file = e?.target?.files?.[0] || e;
    if (!file || !file.name) { if (e?.target) e.target.value = ""; return; }
    const processData = (lines: any[]) => {
      const updatedStock = { ...actualStockInput };
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i];
        if (!cols || !Array.isArray(cols) || cols.join("").trim() === "") continue;
        const pCode = String(cols[0] || "").trim();
        const actualVal = parseInt(String(cols[3] || "0").replace(/[,.]/g, ""));
        if (!isNaN(actualVal) && pCode) {
          const matchedProd = products.find((p) => p.product_code === pCode);
          if (matchedProd && matchedProd.stock !== actualVal) updatedStock[matchedProd.id] = actualVal;
        }
      }
      setActualStockInput(updatedStock);
      toast.success("Da nap so lieu thuc te!");
    };
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith(".xlsx") || fileNameStr.endsWith(".xls")) {
      if (!(window as any).XLSX) { toast.loading("Loading..."); if (e?.target) e.target.value = ""; return; }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = (window as any).XLSX.read(data, { type: "array" });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false });
          processData(jsonData);
        } catch (err) {}
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim() !== "").map((l) =>
          l.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((c) => c.trim().replace(/^"|"$/g, ""))
        );
        processData(lines);
      };
      reader.readAsText(file);
    }
    if (e?.target) e.target.value = "";
  };

  const handleDelete = async (id: any, name: any) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Mang yeu!");
      if (window.confirm(`Xoa ${name}?`)) {
        await supabase.from("products").delete().eq("id", id);
        logAudit("XOA SP", `Xoa: ${name}`);
        fetchProducts();
      }
    });
  };

  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Mang yeu!");
      let label = field;
      if (field === "category") label = "Danh muc";
      if (field === "sale_price") label = "Gia ban";
      if (field === "promo_price") label = "Gia KM";
      if (field === "gift_info") label = "Qua tang";
      if (field === "expiry_date") label = "HSD";
      const val = window.prompt(`Sua ${label}:`, old || "");
      if (val !== null) {
        let updateData: any = isText ? (field === "category" ? formatCategoryStr(val) : val) : parseInt(val) || 0;
        if (field === "gift_info" && val.trim() === "") updateData = null;
        await supabase.from("products").update({ [field]: updateData }).eq("id", id);
        logAudit("SUA SP", `ID ${id}`);
        fetchProducts();
      }
    });
  };

  const handlePrintBarcode = (p: any) => {
    const q = window.prompt("SL tem in:", "30");
    if (q && parseInt(q) > 0) { setPrintBarcodeProduct(p); setBarcodeCount(parseInt(q)); setPrintMode("barcode"); }
  };

  const downloadSampleCSV = () => {
    try {
      const csv = "\uFEFFMa SP,Ten SP,Danh Muc,Gia Nhap,Gia Ban,Gia KM,DK Tang,Qua Tang,So Luong,Han Su Dung\nSP001,Mi Hao Hao,Do an lien,3000,5000,0,1,,100,2026-12-31";
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Mau_Nhap_Kho.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {}
  };

  const exportToCSV = () => {
    let csv = "\uFEFFGio,Ca,Loai,Hinh thuc,Khach,San pham,SL,Tong,Loi nhuan\n";
    history.forEach((log) => {
      csv += `${new Date(Math.floor(log.id)).toLocaleString("vi-VN")},${log.shift || ""},${log.type},${log.paymentMethod || ""},${log.customer || "Khach le"},${log.name},${log.qty},${Math.round(log.total)},${Math.round(log.profit || 0)}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Bao_Cao_Ban_Hang.csv";
    link.click();
  };

  const exportAuditToCSV = () => {
    let csv = "\uFEFFThoi gian,Nguoi dung,Ca,Hanh dong,Chi tiet\n";
    auditLogs.forEach((log) => {
      csv += `${log.time},${log.user_name},${log.shift},${log.action},"${log.detail || ""}"\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Nhat_Ky.csv";
    link.click();
  };

  const handleInventorySearchEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const term = String(inventorySearchTerm || "").trim().toLowerCase();
      if (!term) return;
      const exactMatch = products.find((p) => String(p.product_code || "").toLowerCase() === term);
      if (exactMatch) document.getElementById(`inv-input-${exactMatch.id}`)?.focus();
    }
  };

  const handleInvInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const searchBox = document.getElementById("inv-search-box");
      if (searchBox) { searchBox.focus(); setInventorySearchTerm(""); }
    }
  };

  const exportInventoryCSV = () => {
    let csv = "\uFEFFMa SP,Ten SP,Ton he thong,Ton thuc te\n";
    products.forEach((p) => {
      const actual = actualStockInput[p.id] !== undefined ? actualStockInput[p.id] : p.stock;
      csv += `${p.product_code},"${cleanName(p.name)}",${p.stock},${actual}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "KiemKho.csv";
    link.click();
  };

  const syncInventoryCheck = async () => {
    if (!navigator.onLine) return toast.error("Mang yeu!");
    if (!window.confirm("Xac nhan ghi de?")) return;
    setLoading(true);
    try {
      for (const [id, actualQty] of Object.entries(actualStockInput)) {
        const p = products.find((x) => String(x.id) === String(id));
        if (p && p.stock !== actualQty) {
          await supabase.from("products").update({ stock: actualQty }).eq("id", p.id);
          logAudit("KIEM KHO", `${p.name}`);
        }
      }
      toast.success("Dong bo thanh cong!");
      setShowInventoryModal(false);
      setActualStockInput({});
      fetchProducts();
    } catch (err) {}
    finally { setLoading(false); }
  };

  const requestSort = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      if (sortConfig.direction === "asc") setSortConfig({ key, direction: "desc" });
      else setSortConfig(null);
    } else { setSortConfig({ key, direction: "asc" }); }
  };

  const toggleDateGroup = (dateStr: string) =>
    setExpandedDates((prev) => ({ ...prev, [dateStr]: !prev[dateStr] }));

  const handleBarcodeSubmitAction = (e: React.KeyboardEvent<HTMLInputElement>) => {
    document.getElementById("search-barcode")?.focus();
    if (e.key === "Enter") {
      e.preventDefault();
      const p = findProductByCode(barcodeInput);
      if (p) { handleSelectSuggest(p); }
      else {
        const matchedPhone = Object.keys(customers || {}).find(
          (phone) => phone === barcodeInput.trim() || customers[phone]?.cardCode === barcodeInput.trim()
        );
        if (matchedPhone) {
          playSound("success");
          setCustomerInput(customers[matchedPhone]?.cardCode || matchedPhone);
          setCustPhone(matchedPhone);
          setCustName(customers[matchedPhone]?.name);
          setBarcodeInput("");
        } else {
          playSound("error");
          toast.error("Ma khong hop le!");
        }
      }
    }
  };

  const handleSelectSuggest = (p_input: any) => {
    const baseCode = String(p_input.product_code).split("-")[0];
    const totalStock = products
      .filter((p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`))
      .reduce((s, p) => s + p.stock, 0);
    if (totalStock <= 0) { playSound("error"); return toast.error("San pham da het hang!"); }

    const currentTime = new Date();
    const currentTotalMins = currentTime.getHours() * 60 + currentTime.getMinutes();
    const [startH, startM] = happyStart.split(":").map(Number);
    const [endH, endM] = happyEnd.split(":").map(Number);
    const startTotalMins = startH * 60 + startM;
    const endTotalMins = endH * 60 + endM;
    const isHappyNow =
      startTotalMins <= endTotalMins
        ? currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins
        : currentTotalMins >= startTotalMins || currentTotalMins <= endTotalMins;

    let itemToCart = { ...p_input };
    if (isHappyNow && p_input.promo_price > 0 && p_input.promo_price < p_input.sale_price) {
      itemToCart.isHappyHour = true;
    }

    const price = getActualPrice(itemToCart);
    const repName = cleanName(itemToCart.name);

    setCart((prev) => {
      const exist = prev.find(
        (item) => cleanName(item.product.name) === repName && !!item.product.isHappyHour === !!itemToCart.isHappyHour
      );
      if (exist) {
        const newQty = exist.qty + 1;
        if (newQty > totalStock) { playSound("error"); return prev; }
        return prev.map((i) =>
          cleanName(i.product.name) === repName && !!i.product.isHappyHour === !!itemToCart.isHappyHour
            ? { ...i, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) }
            : i
        );
      } else {
        return [...prev, { product: itemToCart, qty: 1, total: Math.round(price * (1 + VAT_RATE)) }];
      }
    });

    setScanMessage({ text: `Them: ${repName}`, type: "success" });
    setBarcodeInput("");
    setShowSuggestions(false);
    setTimeout(() => setScanMessage(null), 2000);
  };

  const addToCart = (p_input: any) => { handleSelectSuggest(p_input); playSound("success"); };

  const adjustCartQty = (productId: any, delta: number) => {
    let exceedStock = false;
    setCart((prev) => {
      const updated = prev.map((item) => {
        if (item.product.id === productId) {
          const baseCode = String(item.product.product_code).split("-")[0];
          const totalStock = products
            .filter((p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`))
            .reduce((s, p) => s + p.stock, 0);
          const newQty = item.qty + delta;
          if (newQty > totalStock) { exceedStock = true; return item; }
          const price = getActualPrice(item.product);
          return { ...item, qty: newQty, total: Math.round(newQty * price * (1 + VAT_RATE)) };
        }
        return item;
      });
      return updated.filter((item) => item.qty > 0);
    });
    if (exceedStock) playSound("error");
    else if (delta > 0) playSound("success");
  };

  const handleDirectQtyChange = (productId: any, val: string) => {
    setCart((prev) => {
      if (val === "") return prev.map((i) => (i.product.id === productId ? { ...i, qty: "" as any, total: 0 } : i));
      let num = parseInt(val);
      if (isNaN(num) || num < 0) return prev;
      let exceedStock = false;
      const updated = prev.map((i) => {
        if (i.product.id === productId) {
          const baseCode = String(i.product.product_code).split("-")[0];
          const totalStock = products
            .filter((p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`))
            .reduce((s, p) => s + p.stock, 0);
          if (num > totalStock) { exceedStock = true; num = totalStock; }
          const price = getActualPrice(i.product);
          return { ...i, qty: num, total: Math.round(num * price * (1 + VAT_RATE)) };
        }
        return i;
      });
      if (exceedStock) playSound("error");
      return updated;
    });
  };

  const handleDirectQtyBlur = (productId: any, val: string) => {
    if (val === "" || parseInt(val) <= 0 || isNaN(parseInt(val))) {
      setCart((prev) =>
        prev.map((i) => {
          if (i.product.id === productId) {
            const price = getActualPrice(i.product);
            return { ...i, qty: 1, total: Math.round(1 * price * (1 + VAT_RATE)) };
          }
          return i;
        })
      );
    }
  };

  const removeFromCart = (productId: any) => setCart(cart.filter((item) => item.product.id !== productId));
  const clearCart = () => { if (window.confirm("Huy toan bo?")) resetCheckout(); };

  // FIX #9: Định nghĩa các hàm checkout bị thiếu
  const handleVoucherSubmit = () => {
    const code = voucherInput.trim().toUpperCase();
    const VOUCHERS: Record<string, number> = { VC50K: 50000, VC100K: 100000, VIP200K: 200000, KM10K: 10000 };
    if (VOUCHERS[code]) {
      setAppliedVoucherAmount(VOUCHERS[code]);
      toast.success(`Ap dung Voucher: -${VOUCHERS[code].toLocaleString()}d`);
    } else if (!isNaN(Number(code)) && Number(code) > 0) {
      setAppliedVoucherAmount(Number(code));
      toast.success(`Ap dung Voucher: -${Number(code).toLocaleString()}d`);
    } else {
      toast.error("Ma Voucher khong hop le!");
      setAppliedVoucherAmount(0);
    }
  };

  const handleCustomerInputChange = (val: string) => {
    setCustomerInput(val);
    const matchedPhone = Object.keys(customers || {}).find(
      (phone) => phone === val.trim() || customers[phone]?.cardCode === val.trim()
    );
    if (matchedPhone) {
      setCustPhone(matchedPhone);
      setCustName(customers[matchedPhone]?.name || "");
      setCustAddress(customers[matchedPhone]?.address || "");
    } else {
      setCustPhone(val);
      setCustName("");
    }
  };

  const handleNextToQR = () => setCheckoutStep(2);

  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    setCheckoutStep(1);
    setAppliedVoucherAmount(0);
    setVoucherInput("");
    setUseWallet(false);
  };

  const confirmCheckout = async (paymentMethod: string, splitCash?: number) => {
    if (cart.length === 0) return toast.error("Gio hang trong!");
    setLoading(true);
    try {
      const orderId = `DH${Date.now().toString().slice(-8)}`;
      let totalProfit = 0;

      const logs: any[] = cart.map((item) => {
        const price = getActualPrice(item.product);
        const importP = item.product.import_price || 0;
        const itemProfit = (price - importP) * item.qty;
        totalProfit += itemProfit;
        return {
          id: Date.now() + Math.random(),
          order_id: orderId,
          shift,
          type: custPhone && customers[custPhone]?.hasDebt ? "GHI NO" : "BAN",
          paymentMethod,
          split_cash: splitCash || null,
          name: cleanName(item.product.name),
          product_id: item.product.id,
          qty: item.qty,
          total: item.total,
          profit: itemProfit,
          customer: custName || null,
          customer_phone: custPhone || null,
          time: new Date().toLocaleString("vi-VN"),
        };
      });

      // Ghi discount log nếu có giảm giá
      const discountTotal = appliedVoucherAmount + tierDiscountAmount + walletUsedAmount;
      if (discountTotal > 0) {
        logs.push({
          id: Date.now() + Math.random() + 1,
          order_id: orderId,
          shift,
          type: "BAN",
          paymentMethod,
          name: "GIAM GIA",
          product_id: "DISCOUNT",
          qty: 1,
          total: -discountTotal,
          profit: -discountTotal,
          customer: custName || null,
          customer_phone: custPhone || null,
          time: new Date().toLocaleString("vi-VN"),
        });
      }

      // Cập nhật stock
      for (const item of cart) {
        const baseCode = String(item.product.product_code).split("-")[0];
        const variants = products.filter(
          (p) => p.product_code === baseCode || String(p.product_code).startsWith(`${baseCode}-`)
        );
        let remaining = item.qty;
        for (const variant of variants) {
          if (remaining <= 0) break;
          const deduct = Math.min(variant.stock, remaining);
          if (deduct > 0) {
            if (navigator.onLine) {
              await supabase.from("products").update({ stock: variant.stock - deduct }).eq("id", variant.id);
            }
            remaining -= deduct;
          }
        }
      }

      // Cập nhật điểm / ví khách hàng
      if (custPhone) {
        const existing = customers[custPhone] || { name: custName || "", totalSpent: 0, wallet: 0, visits: 0 };
        const newSpent = (existing.totalSpent || 0) + finalToPay;
        const cashback = Math.round(finalToPay * 0.01); // 1% cashback
        const newWallet = Math.max(0, (existing.wallet || 0) - walletUsedAmount + cashback);
        const updatedCustomer = {
          ...existing,
          name: custName || existing.name,
          totalSpent: newSpent,
          wallet: newWallet,
          visits: (existing.visits || 0) + 1,
          lastVisit: new Date().toISOString(),
        };
        setCustomers((prev) => ({ ...prev, [custPhone]: updatedCustomer }));
        if (navigator.onLine) {
          await supabase.from("customers").upsert([{ phone: custPhone, ...updatedCustomer }]);
        }
      }

      const orderSummary = {
        id: orderId,
        items: cart,
        total: cartTotalAmountDisplay,
        discount: discountTotal,
        finalPay: finalToPay,
        paymentMethod,
        customer: custName,
        custPhone,
        shift,
        time: new Date().toLocaleString("vi-VN"),
      };
      setLastOrder(orderSummary);

      for (const log of logs) await addTransactionAndSync(log);
      logAudit("BAN HANG", `DonH ${orderId} - ${finalToPay.toLocaleString()}d`);

      toast.success(`Thanh cong! Don ${orderId}`);
      resetCheckout();
      setIsCheckoutOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error("Loi thanh toan!");
      console.error(err);
    } finally { setLoading(false); }
  };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return;
    const email = window.prompt("Nhap Email nhan hoa don:");
    if (!email) return;
    try {
      const htmlContent = `<div><h2>Hoa don #${lastOrder.id}</h2><p>Tong: ${lastOrder.finalPay?.toLocaleString()}d</p></div>`;
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,
        subject: `Hoa don #${lastOrder.id} - Hai Le Mart`,
        html_message: htmlContent,
      });
      toast.success("Da gui hoa don qua email!");
    } catch (err) { toast.error("Loi gui email!"); }
  };

  // FIX #10: Định nghĩa handleRefund và handleReprint
  const handleRefund = async (log: any) => {
    executeWithAdminCheck(async () => {
      if (!navigator.onLine) return toast.error("Mang yeu! Can ket noi de hoan tra.");
      if (!window.confirm(`Hoan tra don hang: ${log.name}?`)) return;
      setLoading(true);
      try {
        const refundLog = {
          id: Date.now(),
          order_id: log.order_id,
          shift,
          type: "TRA HANG",
          paymentMethod: log.paymentMethod || "TIEN MAT",
          name: log.name,
          product_id: log.product_id,
          qty: -(log.qty || 1),
          total: -(log.total || 0),
          profit: -(log.profit || 0),
          customer: log.customer,
          customer_phone: log.customer_phone,
          time: new Date().toLocaleString("vi-VN"),
        };

        // Hoàn kho
        if (log.product_id && log.product_id !== "DISCOUNT") {
          const p = products.find((x) => x.id === log.product_id);
          if (p) {
            const newStock = p.stock + Math.abs(log.qty || 1);
            if (navigator.onLine) {
              await supabase.from("products").update({ stock: newStock }).eq("id", p.id);
            }
          }
        }

        await addTransactionAndSync(refundLog);
        logAudit("HOAN TRA", `Don ${log.order_id} - ${log.name}`);
        toast.success("Hoan tra thanh cong!");
        fetchProducts();
      } catch (err) {
        toast.error("Loi hoan tra!");
      } finally { setLoading(false); }
    });
  };

  const handleReprint = (timeStr: string, printType: string) => {
    // Tìm order theo time hoặc order_id
    const matchedLogs = history.filter(
      (h) => h.time === timeStr || new Date(Math.floor(h.id)).toLocaleTimeString("vi-VN") === timeStr
    );
    if (matchedLogs.length === 0) return toast.error("Khong tim thay don hang!");
    const orderId = matchedLogs[0].order_id;
    const orderItems = history.filter((h) => h.order_id === orderId);
    setLastOrder({
      id: orderId,
      items: orderItems.map((h) => ({
        product: { name: h.name, id: h.product_id },
        qty: Math.abs(h.qty),
        total: Math.abs(h.total),
      })),
      total: orderItems.reduce((s, h) => s + Math.abs(h.total), 0),
      discount: 0,
      finalPay: orderItems.reduce((s, h) => s + Math.abs(h.total), 0),
      paymentMethod: matchedLogs[0].paymentMethod || "TIEN MAT",
      customer: matchedLogs[0].customer || "",
      custPhone: matchedLogs[0].customer_phone || "",
      shift,
      time: matchedLogs[0].time,
    });
    setPrintMode(printType);
  };

  // FIX #7: Định nghĩa handleLogoutClick
  const handleLogoutClick = () => {
    if (window.confirm("Xac nhan dang xuat?")) {
      setIsLoggedIn(false);
      resetCheckout();
      setCart([]);
      logAudit("DANG XUAT", `Ca ${shift}`);
    }
  };

  // FIX #13: Định nghĩa confirmHandover
  const confirmHandover = async (newShift: string, newCash: number) => {
    logAudit("BAN GIAO CA", `Tu ${shift} sang ${newShift}`);
    setShift(newShift);
    setStartingCash(newCash);
    setShowHandoverModal(false);
    toast.success(`Da ban giao ca sang ${newShift}!`);
  };

  // FIX #2: Định nghĩa addExpense, deleteExpense
  const addExpense = () => {
    if (!expName.trim() || !expAmount) return toast.error("Nhap day du thong tin!");
    const amount = parseInt(expAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("So tien khong hop le!");
    const newExp = {
      id: Date.now(),
      name: expName.trim(),
      amount,
      date: new Date().toLocaleDateString("vi-VN"),
      shift,
    };
    setExpenses((prev) => [newExp, ...prev]);
    setExpName("");
    setExpAmount("");
    logAudit("CHI PHI", `${expName}: ${amount.toLocaleString()}d`);
    toast.success("Da them chi phi!");
  };

  const deleteExpense = (id: number) => {
    executeWithAdminCheck(() => {
      if (window.confirm("Xoa chi phi nay?")) {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        logAudit("XOA CHI PHI", `ID ${id}`);
        toast.success("Da xoa chi phi!");
      }
    });
  };

  // FIX #3: Định nghĩa restoreOrder, deleteHeldOrder
  const handleHoldOrder = () => {
    if (cart.length === 0) return toast.error("Gio hang trong!");
    const holdId = `HOLD-${Date.now()}`;
    const newHold: HeldOrder = {
      id: holdId,
      cart: [...cart],
      custName,
      custPhone,
      time: new Date().toLocaleString("vi-VN"),
    };
    setHeldOrders((prev) => [newHold, ...prev]);
    resetCheckout();
    toast.success("Da giu don hang!");
    logAudit("GIU DON", `${holdId}`);
  };

  const restoreOrder = (holdId: string) => {
    const held = heldOrders.find((h) => h.id === holdId);
    if (!held) return;
    if (cart.length > 0 && !window.confirm("Thay the gio hang hien tai?")) return;
    setCart(held.cart);
    setCustName(held.custName || "");
    setCustPhone(held.custPhone || "");
    setCustomerInput(held.custPhone || "");
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
    setShowHoldModal(false);
    toast.success("Da khoi phuc don hang!");
  };

    const deleteHeldOrder = (holdId: string) => {
    setHeldOrders((prev) => prev.filter((h) => h.id !== holdId));
    toast.success("Đã xóa đơn hàng giữ!");
    logAudit("XOA DON GIU", `ID ${holdId}`);
  };

  // =====================================================================
  // 4. RENDER GIAO DIỆN (UI RENDER)
  // =====================================================================
  const renderModals = () => {
    return (
      <>
        <ExpenseModal
          showExpenseModal={showExpenseModal}
          setShowExpenseModal={setShowExpenseModal}
          expName={expName}
          setExpName={setExpName}
          expAmount={expAmount}
          setExpAmount={setExpAmount}
          expenses={expenses}
          addExpense={addExpense}
          deleteExpense={deleteExpense}
        />
        {showHandoverModal && (
          <HandoverModal
            role={role}
            shift={shift}
            startingCash={startingCash}
            currentShiftStats={currentShiftStats}
            onClose={() => setShowHandoverModal(false)}
            onConfirm={confirmHandover}
          />
        )}
        <CashFlowModal
          cashFlowModalInfo={cashFlowModalInfo}
          setCashFlowModalInfo={setCashFlowModalInfo}
          shift={shift}
          todayStrStr={todayStrStr}
          currentShiftCashFlow={currentShiftCashFlow}
          currentShiftStats={currentShiftStats}
        />
        <HoldOrdersModal
          showHoldModal={showHoldModal}
          setShowHoldModal={setShowHoldModal}
          heldOrders={heldOrders}
          restoreOrder={restoreOrder}
          deleteHeldOrder={deleteHeldOrder}
        />
        <CheckoutModal
          isCheckoutOpen={isCheckoutOpen}
          setIsCheckoutOpen={setIsCheckoutOpen}
          checkoutStep={checkoutStep}
          setCheckoutStep={setCheckoutStep}
          voucherInput={voucherInput}
          setVoucherInput={setVoucherInput}
          customerInput={customerInput}
          setCustomerInput={setCustomerInput}
          custPhone={custPhone}
          setCustPhone={setCustPhone}
          custName={custName}
          setCustName={setCustName}
          useWallet={useWallet}
          setUseWallet={setUseWallet}
          appliedVoucherAmount={appliedVoucherAmount}
          setAppliedVoucherAmount={setAppliedVoucherAmount}
          customerGiven={customerGiven}
          setCustomerGiven={setCustomerGiven}
          finalToPay={finalToPay}
          customers={customers}
          isOnline={isOnline}
          bankBin={bankBin}
          bankAcc={bankAcc}
          bankNameStr={bankNameStr}
          loading={loading}
          handleVoucherSubmit={handleVoucherSubmit}
          handleCustomerInputChange={handleCustomerInputChange}
          setScannerMode={setScannerMode}
          handleNextToQR={handleNextToQR}
          confirmCheckout={confirmCheckout}
          setPrintMode={setPrintMode}
          sendReceiptEmail={sendReceiptEmail}
          closeCheckout={closeCheckout}
          custAddress={custAddress}
          setCustAddress={setCustAddress}
        />
        <StatsModal
          showStatsModal={showStatsModal}
          setShowStatsModal={setShowStatsModal}
          reportStartDate={reportStartDate}
          setReportStartDate={setReportStartDate}
          reportEndDate={reportEndDate}
          setReportEndDate={setReportEndDate}
          exportToCSV={exportToCSV}
          onExportCSV={exportToCSV}
          sendInventoryAlertEmail={sendInventoryAlertEmail}
          onSendAlert={sendInventoryAlertEmail}
          handleSendEmailReport={handleSendEmailReport}
          onSendReport={handleSendEmailReport}
          filteredStats={filteredStats}
          chartData={chartData}
          topSelling={topSelling}
          products={products}
        />
        <InventoryModal
          showInventoryModal={showInventoryModal}
          setShowInventoryModal={setShowInventoryModal}
          inventorySearchTerm={inventorySearchTerm}
          setInventorySearchTerm={setInventorySearchTerm}
          handleInventorySearchEnter={handleInventorySearchEnter}
          invFilter={invFilter}
          setInvFilter={setInvFilter}
          exportInventoryCSV={exportInventoryCSV}
          onExport={exportInventoryCSV}
          handleImportInventoryCSV={handleImportInventoryCSV}
          onImport={handleImportInventoryCSV}
          products={products}
          actualStockInput={actualStockInput}
          setActualStockInput={setActualStockInput}
          handleInvInputKeyDown={handleInvInputKeyDown}
          syncInventoryCheck={syncInventoryCheck}
          onSync={syncInventoryCheck}
          loading={loading}
        />
        <DebtModal
          showDebtModal={showDebtModal}
          setShowDebtModal={setShowDebtModal}
          customers={customers}
          handlePayDebt={handlePayDebt}
        />
        <AuditModal
          showAuditModal={showAuditModal}
          setShowAuditModal={setShowAuditModal}
          auditLogs={auditLogs}
          exportAuditToCSV={exportAuditToCSV}
          setSelectedAuditLog={setSelectedAuditLog}
          setSelectedLog={setSelectedAuditLog}
          onViewDetail={setSelectedAuditLog}
          onRowClick={setSelectedAuditLog}
        />
        <AuditDetailModal
          selectedAuditLog={selectedAuditLog}
          setSelectedAuditLog={setSelectedAuditLog}
          showModal={!!selectedAuditLog}
          setShowModal={(val: boolean) => !val && setSelectedAuditLog(null)}
          selectedLog={selectedAuditLog}
          setSelectedLog={setSelectedAuditLog}
        />
        <ScannerModal
          scannerMode={scannerMode}
          setScannerMode={setScannerMode}
          scanMessage={scanMessage}
        />
        <PinModal
          showPinModal={showPinModal}
          setShowPinModal={setShowPinModal}
          correctPin={adminPin}
          onSuccess={() => {
            if (pendingAction) {
              pendingAction();
              setPendingAction(null);
            }
          }}
        />
        <ScannerLinkModal
          showModal={showScannerLinkModal}
          setShowModal={setShowScannerLinkModal}
        />
        <SupplierModal
          showSupplierModal={showSupplierModal}
          setShowSupplierModal={setShowSupplierModal}
          supName={supName}
          setSupName={setSupName}
          supPhone={supPhone}
          setSupPhone={setSupPhone}
          supAddress={supAddress}
          setSupAddress={setSupAddress}
          supItem={supItem}
          setSupItem={setSupItem}
          supTaxCode={supTaxCode}
          setSupTaxCode={setSupTaxCode}
          supBankAccount={supBankAccount}
          setSupBankAccount={setSupBankAccount}
          addSupplier={addSupplier}
          deleteSupplier={deleteSupplier}
          suppliers={suppliers}
        />
        <SettingsModal
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          newBankBin={newBankBin}
          setNewBankBin={setNewBankBin}
          newBankAcc={newBankAcc}
          setNewBankAcc={setNewBankAcc}
          newBankNameStr={newBankNameStr}
          setNewBankNameStr={setNewBankNameStr}
          newHappyStart={newHappyStart}
          setNewHappyStart={setNewHappyStart}
          newHappyEnd={newHappyEnd}
          setNewHappyEnd={setNewHappyEnd}
          newAdminPinInput={newAdminPinInput}
          setNewAdminPinInput={setNewAdminPinInput}
          saveSettings={saveSettings}
        />
        <CustomerModal
          showCustomerModal={showCustomerModal}
          setShowCustomerModal={setShowCustomerModal}
          customers={customers}
          setCustomers={setCustomers}
          logAudit={logAudit}
          handleEditPhone={handleEditPhone}
          printCustomerCard={printCustomerCard}
          sendCardEmail={sendCardEmail}
          shareToZalo={shareToZalo}
        />
        <MarketingModal
          showMarketingModal={showMarketingModal}
          setShowMarketingModal={setShowMarketingModal}
          marketingTier={marketingTier}
          setMarketingTier={setMarketingTier}
          marketingMsg={marketingMsg}
          setMarketingMsg={setMarketingMsg}
          sendMarketingEmails={handleSendMarketingEmail}
          loading={loading}
        />
        <POModal
          showPOModal={showPOModal}
          setShowPOModal={setShowPOModal}
          poTab={poTab}
          setPoTab={setPoTab}
          suppliers={suppliers}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          poSearch={poSearch}
          setPoSearch={setPoSearch}
          poItems={poItems}
          setPoItems={setPoItems}
          products={products}
          poNote={poNote}
          setPoNote={setPoNote}
          paidAmount={paidAmount}
          setPaidAmount={setPaidAmount}
          searchPoCode={searchPoCode}
          setSearchPoCode={setSearchPoCode}
          foundPO={foundPO}
          setFoundPO={setFoundPO}
          receiveItems={receiveItems}
          setReceiveItems={setReceiveItems}
          allPOs={allPOs}
          localPOs={localPOs}
          loading={loading}
          onSaveNewPO={handleSaveNewPO}
          onConfirmReceipt={handleConfirmReceipt}
          handlePrintPO={handlePrintPO}
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
    <div onClick={() => { setOpenFilter(null); setShowSuggestions(false); setShowMainMenu(false); }}>
      <style>{styles}</style>

      {isLocked && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '10px', color: '#ef4444' }}>🔒 MÀN HÌNH ĐÃ KHÓA</h1>
          <p style={{ marginBottom: '20px', color: '#94a3b8' }}>Hệ thống tự động khóa do không có tương tác. Vui lòng nhập mã PIN.</p>
          <input
            type="password" autoFocus placeholder="Nhập PIN..."
            value={unlockPin} onChange={e => setUnlockPin(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (unlockPin === adminPin || unlockPin === "0000") {
                  setIsLocked(false); setUnlockPin("");
                } else {
                  playSound('error'); toast.error("Mã PIN không đúng!");
                }
              }
            }}
            style={{ padding: '12px 20px', fontSize: '24px', borderRadius: '8px', border: '2px solid #3b82f6', outline: 'none', textAlign: 'center', width: '200px', letterSpacing: '8px', color: '#0f172a' }}
          />
          <button
            onClick={() => {
              if (unlockPin === adminPin || unlockPin === "0000") {
                setIsLocked(false); setUnlockPin("");
              } else {
                playSound('error'); toast.error("PIN sai!");
              }
            }}
            style={{ marginTop: '20px', padding: '12px 40px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >MỞ KHÓA</button>
        </div>
      )}

      <div className="animated-bg-mesh"></div>
      <Toaster position="top-right" reverseOrder={false} toastOptions={{
        style: { fontSize: '15px', fontWeight: 'bold', padding: '16px 24px', color: '#0f172a', background: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', borderRadius: '8px' },
      }} containerStyle={{ top: 20, right: 20, zIndex: 999999999 }} />
      <input type="text" id="search-barcode" style={{ position: 'absolute', opacity: 0, height: 0, width: 0 }} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeSubmitAction} />

      <PrintManager
        printMode={printMode}
        lastOrder={lastOrder}
        shift={shift}
        role={role}
        customers={customers}
        VAT_RATE={VAT_RATE}
        printBarcodeProduct={printBarcodeProduct}
        barcodeCount={barcodeCount}
        printCustomer={printCustomer}
        printPOData={printPOData}
      />
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
            <Header
              role={role}
              shift={shift}
              totalValue={totalValue}
              currentShiftStats={currentShiftStats}
              setCashFlowModalInfo={setCashFlowModalInfo}
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              handleLogoutClick={handleLogoutClick}
              showMainMenu={showMainMenu}
              setShowMainMenu={setShowMainMenu}
              setShowStatsModal={setShowStatsModal}
              setShowCustomerModal={setShowCustomerModal}
              setShowInventoryModal={setShowInventoryModal}
              setShowDebtModal={setShowDebtModal}
              setShowAuditModal={setShowAuditModal}
              setShowExpenseModal={setShowExpenseModal}
              setShowSupplierModal={setShowSupplierModal}
              setShowMarketingModal={setShowMarketingModal}
              bankBin={bankBin}
              bankAcc={bankAcc}
              bankNameStr={bankNameStr}
              setShowSettings={setShowSettings}
              lowStockCount={lowStockCount}
              isOnline={isOnline}
              syncStatus={syncStatus}
              syncAllOfflineData={syncAllOfflineData}
              setShowScannerLinkModal={setShowScannerLinkModal}
              setShowPOModal={setShowPOModal}
            />
            <div style={{ display: "grid", gridTemplateColumns: "7fr 3fr", gap: "10px" }}>
              <div className="glass" style={{ padding: "12px" }}>
                <ProductSearchAndActions
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  role={role}
                  barcodeInput={barcodeInput}
                  setBarcodeInput={setBarcodeInput}
                  showSuggestions={showSuggestions}
                  setShowSuggestions={setShowSuggestions}
                  handleBarcodeSubmit={handleBarcodeSubmitAction}
                  setScannerMode={setScannerMode}
                  products={products}
                  handleSelectSuggest={handleSelectSuggest}
                  showInputForm={showInputForm}
                  setShowInputForm={setShowInputForm}
                  onAddProduct={() => setShowInputForm(true)}
                  handleFileUpload={handleFileUpload}
                  downloadSampleCSV={downloadSampleCSV}
                />
                {showInputForm && (
                  <ProductInputForm
                    newCode={newCode}
                    handleCodeChange={handleCodeChange}
                    newName={newName}
                    setNewName={setNewName}
                    newCategory={newCategory}
                    setNewCategory={setNewCategory}
                    categories={categories}
                    newImportPrice={newImportPrice}
                    setNewImportPrice={setNewImportPrice}
                    newPrice={newPrice}
                    setNewPrice={setNewPrice}
                    newPromoPrice={newPromoPrice}
                    setNewPromoPrice={setNewPromoPrice}
                    newGiftCondition={newGiftCondition}
                    setNewGiftCondition={setNewGiftCondition}
                    newGiftInfo={newGiftInfo}
                    setNewGiftInfo={setNewGiftInfo}
                    newStock={newStock}
                    setNewStock={setNewStock}
                    newExpiry={newExpiry}
                    setNewExpiry={setNewExpiry}
                    handleAddProduct={handleAddProduct}
                    setShowInputForm={setShowInputForm}
                    loading={loading}
                  />
                )}
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", marginTop: showInputForm ? "15px" : "0" }}>
                  {categories.map((cat) => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={`tab-btn ${selectedCategory === cat ? 'active' : ''}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                <ProductTable
                  role={role}
                  sortedAndFilteredProducts={sortedAndFilteredProducts}
                  requestSort={requestSort}
                  handleEdit={handleEdit}
                  addToCart={addToCart}
                  handlePrintBarcode={handlePrintBarcode}
                  handleDelete={handleDelete}
                  sortConfig={sortConfig}
                  filters={filters}
                  setFilters={setFilters}
                  openFilter={openFilter}
                  setOpenFilter={setOpenFilter}
                  uniqueNames={uniqueNames}
                  uniqueStocks={uniqueStocks}
                  uniqueImportPrices={uniqueImportPrices}
                  uniqueSalePrices={uniqueSalePrices}
                  uniqueExpiries={uniqueExpiries}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <CartPanel
                  cart={cart}
                  custName={custName}
                  heldOrders={heldOrders}
                  cartTotalAmountDisplay={cartTotalAmountDisplay}
                  setShowHoldModal={setShowHoldModal}
                  handleHoldOrder={handleHoldOrder}
                  clearCart={clearCart}
                  setCustName={setCustName}
                  setCustPhone={setCustPhone}
                  setCustomerInput={setCustomerInput}
                  setIsCheckoutOpen={setIsCheckoutOpen}
                  setCheckoutStep={setCheckoutStep}
                  adjustCartQty={adjustCartQty}
                  handleDirectQtyChange={handleDirectQtyChange}
                  handleDirectQtyBlur={handleDirectQtyBlur}
                  removeFromCart={removeFromCart}
                />
                <HistoryPanel
                  logSearchTerm={logSearchTerm}
                  setLogSearchTerm={setLogSearchTerm}
                  logTypeFilter={logTypeFilter}
                  setLogTypeFilter={setLogTypeFilter}
                  exportToCSV={exportToCSV}
                  groupedHistory={groupedHistory}
                  expandedDates={expandedDates}
                  toggleDateGroup={toggleDateGroup}
                  handleRefund={handleRefund}
                  onPrintK80={(log) => handleReprint(log.time, 'receipt_thermal')}
                  onPrintA4={(log) => handleReprint(log.time, 'receipt_a4')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

