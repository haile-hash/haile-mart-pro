/* eslint-disable */
// @ts-nocheck
import React, { useEffect, useState, useMemo, useRef } from "react";
import emailjs from '@emailjs/browser';
import { supabase } from "./supabaseClient";
import { formatCategoryStr, parseGift, cleanName, getActualPrice, playSound, getCustomerTier } from "./utils/helpers";

import { useOfflineSync } from "./hooks/useOfflineSync";
import { useUIState } from "./hooks/useUIState";
import { useProductInput } from "./hooks/useProductInput";
import { useCheckoutState } from "./hooks/useCheckoutState";

import { Product, CartItem, Customer, AuditLog, TransactionLog, HeldOrder } from "./types";
import { Header } from "./components/layout/Header";
import { StoreSettingsModal } from "./components/layout/StoreSettingsModal";
import { ProductSearchAndActions } from "./components/products/ProductSearchAndActions";
import { ProductInputForm } from "./components/products/ProductInputForm";
import { ProductTable } from "./components/products/ProductTable";
import { CartPanel } from "./components/cart/CartPanel";
import { HistoryPanel } from "./components/history/HistoryPanel";

import { CashFlowDetailModal } from "./components/modals/CashFlowDetailModal";
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
import { SupplierModal } from "./components/modals/SupplierModal";
import { SettingsModal } from "./components/modals/SettingsModal";
import { CustomerModal } from "./components/modals/CustomerModal";
import { MarketingModal } from "./components/modals/MarketingModal";
import { POModal } from "./components/modals/POModal";

import { MobileScanner } from "./components/MobileScanner"; 
import { PrintManager } from "./components/print/PrintManager";
import { Login } from "./components/auth/Login"; 
import { Toaster, toast } from "react-hot-toast";

import './styles/App.css';
import './styles/Print.css';

const dbName = "HaileMartIndexedDB";
const storeName = "kv_store";
const initDB = (): Promise<IDBDatabase> => { return new Promise((resolve, reject) => { const request = indexedDB.open(dbName, 1); request.onupgradeneeded = () => { request.result.createObjectStore(storeName); }; request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); };
const dbGet = async (key: string): Promise<any> => { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(storeName, "readonly"); const store = tx.objectStore(storeName); const req = store.get(key); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); };
const dbSet = async (key: string, value: any): Promise<void> => { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(storeName, "readwrite"); const store = tx.objectStore(storeName); const req = store.put(value, key); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); };
const dbRemove = async (key: string): Promise<void> => { const db = await initDB(); return new Promise((resolve, reject) => { const tx = db.transaction(storeName, "readwrite"); const store = tx.objectStore(storeName); const req = store.delete(key); req.onsuccess = () => resolve(); req.onerror = () => reject(req.error); }); };

export default function App() {
  if (typeof window !== "undefined" && window.location.search.includes("scanner=true")) return <MobileScanner />;
  const VAT_RATE = 0.1; const IDLE_TIMEOUT = 5 * 60 * 1000; const todayStrStr = new Date().toLocaleDateString('vi-VN');

  useEffect(() => { emailjs.init("5ric0kxuwNPlUleAv"); }, []);
  useEffect(() => { if (typeof window !== 'undefined' && !(window as any).XLSX) { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; script.async = true; document.head.appendChild(script); } }, []);

  const [isStorageLoading, setIsStorageLoading] = useState(true); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [isLocked, setIsLocked] = useState(() => {
    if (typeof window !== 'undefined') return window.localStorage.getItem('mart_is_locked') === 'true';
    return false;
  });

  const [unlockPin, setUnlockPin] = useState("");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [shift, setShift] = useState("Ca Sáng");
  const [startingCash, setStartingCash] = useState<number>(5000000);

  const [bankBin, setBankBin] = useState(""); const [bankAcc, setBankAcc] = useState(""); const [bankNameStr, setBankNameStr] = useState(""); const [zaloPayId, setZaloPayId] = useState(""); const [adminPin, setAdminPin] = useState("1234"); const [pendingAction, setPendingAction] = useState<(() => void) | null>(null); 
  
  // --- BỔ SUNG STATE HAPPY DISCOUNT ---
  const [happyStart, setHappyStart] = useState("11:00"); 
  const [happyEnd, setHappyEnd] = useState("13:00");
  const [happyDiscount, setHappyDiscount] = useState(20);

  const [newBankBin, setNewBankBin] = useState(""); const [newBankAcc, setNewBankAcc] = useState(""); const [newBankNameStr, setNewBankNameStr] = useState(""); const [newZaloPayId, setNewZaloPayId] = useState(""); 
  const [newHappyStart, setNewHappyStart] = useState("11:00"); 
  const [newHappyEnd, setNewHappyEnd] = useState("13:00"); 
  const [newHappyDiscount, setNewHappyDiscount] = useState(20);
  const [newAdminPinInput, setNewAdminPinInput] = useState("");
  
  const [tierConfig, setTierConfig] = useState({ bronze: 1000000, bronze_discount: 0, silver: 5000000, silver_discount: 1, gold: 10000000, gold_discount: 3, diamond: 20000000, diamond_discount: 5 });
  const [newTierConfig, setNewTierConfig] = useState({ bronze: 1000000, bronze_discount: 0, silver: 5000000, silver_discount: 1, gold: 10000000, gold_discount: 3, diamond: 20000000, diamond_discount: 5 });

  const ui = useUIState();

  const EMAILJS_SERVICE_ID = "service_7ie990l";
  const EMAILJS_TEMPLATE_ID = "template_m1j9i7k";     
  const EMAILJS_TEMPLATE_VIP_ID = "template_t91erhg"; 
  const EMAILJS_TEMPLATE_PO_ID = "template_m1j9i7k";  

  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(""); const [selectedCategory, setSelectedCategory] = useState("Tất cả"); const [loading, setLoading] = useState(false); const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null); const [filters, setFilters] = useState<Record<string, any[]>>({}); const [showSuggestions, setShowSuggestions] = useState(false);
  const [actualStockInput, setActualStockInput] = useState<Record<string, number>>({}); const [inventorySearchTerm, setInventorySearchTerm] = useState(""); const [invFilter, setInvFilter] = useState('ALL'); const [expName, setExpName] = useState(""); const [expAmount, setExpAmount] = useState(""); const [supName, setSupName] = useState(""); const [supPhone, setSupPhone] = useState(""); const [supAddress, setSupAddress] = useState(""); const [supItem, setSupItem] = useState(""); const [supTaxCode, setSupTaxCode] = useState(""); const [supBankAccount, setSupBankAccount] = useState(""); const [marketingTier, setMarketingTier] = useState("Tất cả"); const [marketingMsg, setMarketingMsg] = useState("");
  const [reportStartDate, setReportStartDate] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; }); const [reportEndDate, setReportEndDate] = useState(() => { return new Date().toISOString().split('T')[0]; });
  const [scanQueue, setScanQueue] = useState<string[]>([]); const [printBarcodeProduct, setPrintBarcodeProduct] = useState<Product | null>(null); const [printCustomer, setPrintCustomer] = useState<Customer | null>(null); const [barcodeCount, setBarcodeCount] = useState<number>(30); const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null);
  const [localPOs, setLocalPOs] = useState<any[]>([]); const [poTab, setPoTab] = useState<'NEW' | 'RECEIVE'>('NEW'); const [selectedSupplierId, setSelectedSupplierId] = useState(""); const [poItems, setPoItems] = useState<any[]>([]); const [poSearch, setPoSearch] = useState(""); const [poNote, setPoNote] = useState(""); const [paidAmount, setPaidAmount] = useState<number>(0); const [searchPoCode, setSearchPoCode] = useState(""); const [foundPO, setFoundPO] = useState<any>(null); const [receiveItems, setReceiveItems] = useState<any[]>([]); const [allPOs, setAllPOs] = useState<any[]>([]); const [printPOData, setPrintPOData] = useState<any>(null);

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
  
  const currentTier = (custPhone && customersData[custPhone]) 
    ? getCustomerTier(Number(customersData[custPhone].totalSpent) || 0, tierConfig) 
    : { discount: 0 };
  const tierDiscountAmount = Math.round(cartTotalAmountDisplay * (currentTier.discount / 100));

  const amountAfterTierAndVoucher = cartTotalAmountDisplay - tierDiscountAmount - appliedVoucherAmount;
  const walletUsedAmount = (useWallet && custPhone && customersData[custPhone]) ? Math.min(amountAfterTierAndVoucher, customersData[custPhone].wallet || 0) : 0;
  const finalToPay = amountAfterTierAndVoucher - walletUsedAmount;

  const currentShiftStats = useMemo(() => {
    let revenue = 0; 
    let profit = 0; 
    let ordersCount = 0; 
    let cash = Number(startingCash) || 0; 
    let transfer = 0; 

    const todayStr = todayStrStr || new Date().toLocaleDateString('vi-VN');

    history.forEach(log => {
      let logDate = ""; if (log.time) { const parts = log.time.split(' '); const datePart = parts.find(p => p.includes('/')); if (datePart) logDate = datePart.replace(',', '').trim(); }
      
      if (log.shift === shift && logDate === todayStr) {
        if (log.type === 'BÁN' || log.type === 'GHI NỢ') {
          ordersCount += 1; revenue += (log.total || 0); profit += (log.profit || 0);
        } else if (log.type === 'TRẢ HÀNG') {
          revenue += (log.total || 0); profit += (log.profit || 0);
        }
        
        if (log.paymentMethod === 'TIỀN MẶT') cash += (log.total || 0);
        else if (log.paymentMethod === 'CHUYỂN KHOẢN' || log.paymentMethod === 'QUẸT THẺ' || log.paymentMethod === 'ZALO PAY') transfer += (log.total || 0);
        else if (log.paymentMethod === 'KẾT HỢP') { cash += (log.split_cash || 0); transfer += ((log.total || 0) - (log.split_cash || 0)); }
      }
    });
    return { total: revenue, profit, orders: ordersCount, cash, transfer };
  }, [history, shift, todayStrStr, startingCash]);

  const categories = useMemo(() => { const cats = new Set(["Tất cả"]); products.forEach(p => { if (p.category) cats.add(p.category); }); return Array.from(cats); }, [products]);
  const sortedAndFilteredProducts = useMemo(() => {
    let result = [...products];
    if (selectedCategory !== "Tất cả") result = result.filter(p => p.category === selectedCategory);
    if (debouncedSearchTerm) { const lowerSearch = debouncedSearchTerm.toLowerCase(); result = result.filter(p => (p.name && p.name.toLowerCase().includes(lowerSearch)) || (p.product_code && p.product_code.toLowerCase().includes(lowerSearch))); }
    Object.keys(filters).forEach(key => { if (filters[key] && filters[key].length > 0) result = result.filter(p => filters[key].includes(String(p[key as keyof Product]))); });
    if (sortConfig) { result.sort((a: any, b: any) => { const aVal = a[sortConfig.key] ?? ''; const bVal = b[sortConfig.key] ?? ''; if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1; if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1; return 0; }); }
    return result;
  }, [products, selectedCategory, debouncedSearchTerm, sortConfig, filters]);

  const totalValue = useMemo(() => products.reduce((sum, p) => sum + ((p.stock || 0) * (p.import_price || 0)), 0), [products]);
  const lowStockCount = useMemo(() => products.filter(p => p.stock > 0 && p.stock < 10).length, [products]);

  useEffect(() => { const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e); }; window.addEventListener('beforeinstallprompt', handler); return () => window.removeEventListener('beforeinstallprompt', handler); }, []);
  const handleInstallApp = async () => { if (!installPrompt) return; installPrompt.prompt(); const { outcome } = await installPrompt.userChoice; if (outcome === 'accepted') { setInstallPrompt(null); toast.success("Cài đặt App thành công!"); logAudit("HỆ THỐNG", "Cài đặt ứng dụng PWA"); } };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (isLocked) window.localStorage.setItem('mart_is_locked', 'true');
      else window.localStorage.removeItem('mart_is_locked');
    }
  }, [isLocked]);

  useEffect(() => { if (!isLoggedIn || isLocked) return; let timeout: any; const resetTimer = () => { clearTimeout(timeout); timeout = setTimeout(() => setIsLocked(true), IDLE_TIMEOUT); }; window.addEventListener('mousemove', resetTimer); window.addEventListener('keydown', resetTimer); window.addEventListener('click', resetTimer); resetTimer(); return () => { clearTimeout(timeout); window.removeEventListener('mousemove', resetTimer); window.removeEventListener('keydown', resetTimer); window.removeEventListener('click', resetTimer); }; }, [isLoggedIn, isLocked]);
  useEffect(() => { const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 300); return () => clearTimeout(handler); }, [searchTerm]);

  useEffect(() => {
    const initializeEnterpriseStorage = async () => {
      try {
        let isMigrated = await dbGet("mart_storage_migrated") === "true";
        if (!isMigrated) { const keysToMigrate = ["mart_logged_in", "mart_shift", "mart_starting_cash", "mart_pos", "mart_customers", "mart_held_orders", "mart_audit", "mart_expenses", "mart_suppliers", "mart_history"]; for (const key of keysToMigrate) { const localData = localStorage.getItem(key); if (localData !== null) { try { if (localData.startsWith("[") || localData.startsWith("{")) { await dbSet(key, JSON.parse(localData)); } else { await dbSet(key, localData); } } catch (e) { await dbSet(key, localData); } localStorage.removeItem(key); } } await dbSet("mart_storage_migrated", "true"); }
        
        const loggedIn = await dbGet("mart_logged_in") === "true"; 
        const savedShift = await dbGet("mart_shift") || "Ca Sáng"; 
        const savedCash = Number(await dbGet("mart_starting_cash") || 5000000); 
        
        setIsLoggedIn(loggedIn); 
        if (loggedIn) {
           setIsLocked(true);
        }

        setShift(savedShift); setStartingCash(savedCash);
        setLocalPOs(await dbGet("mart_pos") || []); setCustomers(await dbGet("mart_customers") || {}); setHeldOrders(await dbGet("mart_held_orders") || []); setAuditLogs(await dbGet("mart_audit") || []); setExpenses(await dbGet("mart_expenses") || []); setSuppliers(await dbGet("mart_suppliers") || []); setHistory(await dbGet("mart_history") || []);
        const storedPOs = await dbGet("mart_pos") || [];
        setAllPOs(storedPOs);
      } catch (err) {} finally { setIsStorageLoading(false); }
    };
    initializeEnterpriseStorage();
  }, []);

  useEffect(() => { if (!isStorageLoading) dbSet("mart_logged_in", isLoggedIn ? "true" : "false"); }, [isLoggedIn, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_shift", shift); }, [shift, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_starting_cash", startingCash.toString()); }, [startingCash, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_pos", localPOs); }, [localPOs, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_customers", customersData); }, [customersData, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_held_orders", heldOrders); }, [heldOrders, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_audit", auditLogs); }, [auditLogs, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_expenses", expenses); }, [expenses, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_suppliers", suppliers); }, [suppliers, isStorageLoading]);
  useEffect(() => { if (!isStorageLoading) dbSet("mart_history", history); }, [history, isStorageLoading]);

  useEffect(() => { const handleKeyDown = (e: KeyboardEvent) => { if (!isLoggedIn || isCheckoutOpen || ui.showPinModal || ui.showAuditModal || ui.showCustomerModal || ui.showSettings || ui.showStoreSettings || ui.showInputForm || ui.showInventoryModal || ui.cashFlowModalInfo || ui.showPOModal) return; if (e.key === 'F1') { e.preventDefault(); document.getElementById('search-barcode')?.focus(); } if (e.key === 'F2') { e.preventDefault(); if (cart.length > 0) confirmCheckout('TIỀN MẶT'); } if (e.key === 'F3') { e.preventDefault(); if (cart.length > 0) confirmCheckout('CHUYỂN KHOẢN'); } if (e.key === 'F4') { e.preventDefault(); handleHoldOrder(); } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [isLoggedIn, isCheckoutOpen, ui, cart]);

  useEffect(() => {
    if (isLoggedIn) {
      const fetchStoreInfo = async () => { const { data: { user } } = await supabase.auth.getUser(); if (user) { const { data: store } = await supabase.from('stores').select('*').eq('owner_id', user.id).single(); if (store) { await dbSet("mart_current_store", store); window.localStorage.setItem("mart_current_store", JSON.stringify(store)); } } };
      if (navigator.onLine) fetchStoreInfo();
      fetchProducts(); loadCloudData(); fetchSettingsFromCloud(); 
      const channel = supabase.channel("db_changes").on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => fetchProducts()).on("postgres_changes", { event: "*", schema: "public", table: "history" }, () => loadCloudData()).on("postgres_changes", { event: "*", schema: "public", table: "customers" }, () => loadCloudData()).on("postgres_changes", { event: "*", schema: "public", table: "held_orders" }, () => loadCloudData()).on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => loadCloudData()).on("postgres_changes", { event: "INSERT", schema: "public", table: "remote_scans" }, (payload: any) => { setScanQueue(prev => [...prev, payload.new.code]); }).subscribe();
      return () => { supabase.removeChannel(channel) };
    }
  }, [isLoggedIn]);

  useEffect(() => { if (ui.scannerMode !== null && ui.scannerMode !== 'barcode' && ui.scannerMode !== 'voucher' && ui.scannerMode !== 'customer') { let scanner: any; let lastScanTime = 0; const loadScanner = () => { if ((window as any).Html5QrcodeScanner) { scanner = new (window as any).Html5QrcodeScanner("qr-reader", { fps: 15, qrbox: { width: 250, height: 120 }, rememberLastUsedCamera: true }, false); scanner.render((text: string) => { const now = Date.now(); if (now - lastScanTime < 1500) return; lastScanTime = now; setScanQueue(prev => [...prev, text]); }, undefined) } }; if (!(window as any).Html5QrcodeScanner) { const script = document.createElement("script"); script.src = "https://unpkg.com/html5-qrcode"; script.onload = loadScanner; document.head.appendChild(script) } else { loadScanner(); } return () => { if (scanner) scanner.clear().catch(() => { }) } } }, [ui.scannerMode]);

  useEffect(() => {
    if (scanQueue.length > 0) {
      const currentCode = scanQueue[0];
      if (ui.scannerMode === 'product' || ui.scannerMode === null) { const p = findProductByCode(currentCode); if (p) { handleSelectSuggest(p); playSound('success'); } else { const matchedPhone = Object.keys(customersData || {}).find(phone => phone === currentCode.trim() || customersData[phone]?.cardCode === currentCode.trim()); if (matchedPhone) { playSound('success'); setCustomerInput(customersData[matchedPhone].cardCode || matchedPhone); setCustPhone(matchedPhone); setCustName(customersData[matchedPhone].name); } else { playSound('error'); } } }
      else if (ui.scannerMode === 'voucher') { const code = currentCode.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); setVoucherInput(code); playSound('success'); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); setVoucherInput(code); playSound('success'); } else { playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0) } }
      else if (ui.scannerMode === 'customer') { const val = currentCode.trim(); setCustomerInput(val); const matchedPhone = Object.keys(customersData || {}).find(phone => phone === val || customersData[phone]?.cardCode === val); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customersData[matchedPhone].name); setCustAddress(customersData[matchedPhone].address || ""); playSound('success'); } else { setCustPhone(val); setCustName(""); setCustAddress(""); playSound('success'); } }
      setTimeout(() => ui.setScannerMode?.(null), 1000); setScanQueue(prev => prev.slice(1));
    }
  }, [scanQueue, products, ui.scannerMode]);

  useEffect(() => { if (!ui.printMode) { isPrintingRef.current = false; return; } if (isPrintingRef.current) return; isPrintingRef.current = true; const handleAfterPrint = () => { ui.setPrintMode?.(null); isPrintingRef.current = false; }; window.addEventListener('afterprint', handleAfterPrint); const timer = setTimeout(() => { if (ui.printMode) { window.print(); } }, 1500); return () => { clearTimeout(timer); window.removeEventListener('afterprint', handleAfterPrint); }; }, [ui.printMode]);

  const executeWithAdminCheck = (action: () => void) => { action(); };
  const addTransactionAndSync = async (logData: any) => { setHistory(prev => [logData, ...prev]); if (navigator.onLine) { try { await supabase.from("history").insert([logData]); } catch (err) {} } };
  const logAudit = async (action: string, detail: string, extraData: any = null) => { const newLog = { id: Date.now(), time: new Date().toLocaleString('vi-VN'), user_name: 'Người Dùng', shift, action, detail, extra_data: extraData ? JSON.stringify(extraData) : null }; setAuditLogs(prev => [newLog, ...prev].slice(0, 300)); };
  
  const exportAuditToCSV = () => {
    if (!(window as any).XLSX) return toast.error("Đang tải thư viện Excel!");
    try {
      const wsData = [["Thời gian", "Tài khoản", "Ca làm việc", "Hành động", "Chi tiết"]];
      auditLogs.forEach(log => { wsData.push([log.time, log.user_name, log.shift, log.action, log.detail]); });
      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
      const wb = (window as any).XLSX.utils.book_new();
      (window as any).XLSX.utils.book_append_sheet(wb, ws, "NhatKy");
      (window as any).XLSX.writeFile(wb, `NhatKyHeThong_${Date.now()}.xlsx`);
      toast.success("Xuất file Nhật ký thành công!");
    } catch (e) { toast.error("Lỗi xuất file!"); }
  };
  
  const fetchProducts = async () => { try { if (navigator.onLine) { const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false }); if (data && !error) { setProducts(data); await dbSet("mart_products_cache", data); } } else { const localData = await dbGet("mart_products_cache"); if (localData) setProducts(localData); } } catch (err) { const localData = await dbGet("mart_products_cache"); if (localData) setProducts(localData); } };
  
  // --- BỔ SUNG LƯU LOCALSTORAGE CHO KHUYẾN MÃI % ---
  const fetchSettingsFromCloud = async () => { 
    try { 
      const { data } = await supabase.from("settings").select("*").eq("id", 1).single(); 
      if (data) { 
        setBankBin(data.bank_bin); setBankAcc(data.bank_acc); setBankNameStr(data.bank_name_str); setZaloPayId(data.zalopay_id || ""); 
        setNewBankBin(data.bank_bin); setNewBankAcc(data.bank_acc); setNewBankNameStr(data.bank_name_str); setNewZaloPayId(data.zalopay_id || ""); 
        if (data.admin_pin) { setAdminPin(data.admin_pin); setNewAdminPinInput(data.admin_pin); } 
        if (data.happy_hour_start) { setHappyStart(data.happy_hour_start); setNewHappyStart(data.happy_hour_start); } 
        if (data.happy_hour_end) { setHappyEnd(data.happy_hour_end); setNewHappyEnd(data.happy_hour_end); } 
        
        if (data.happy_hour_discount !== undefined) {
          setHappyDiscount(data.happy_hour_discount);
          setNewHappyDiscount(data.happy_hour_discount);
          window.localStorage.setItem('mart_happy_discount', data.happy_hour_discount);
        }
        window.localStorage.setItem('mart_happy_start', data.happy_hour_start || "11:00");
        window.localStorage.setItem('mart_happy_end', data.happy_hour_end || "13:00");

        if (data.tier_bronze !== undefined) {
          const loadedTiers = { 
            bronze: data.tier_bronze, bronze_discount: data.tier_bronze_discount || 0,
            silver: data.tier_silver, silver_discount: data.tier_silver_discount || 0, 
            gold: data.tier_gold, gold_discount: data.tier_gold_discount || 0, 
            diamond: data.tier_diamond, diamond_discount: data.tier_diamond_discount || 0 
          };
          setTierConfig(loadedTiers); setNewTierConfig(loadedTiers);
        }
      } 
    } catch (err) {} 
  };
  
  const updateSettingsToCloud = async (bin: string, acc: string, nameStr: string, zaloId: string, hStart: string, hEnd: string, pin: string) => { 
    if (!navigator.onLine) return toast.error("Mất mạng! Không thể lưu Cài đặt."); 
    setLoading(true); 
    try { 
      const { error } = await supabase.from("settings").update({ 
        bank_bin: bin, bank_acc: acc, bank_name_str: nameStr, zalopay_id: zaloId, 
        happy_hour_start: hStart, happy_hour_end: hEnd, 
        happy_hour_discount: newHappyDiscount, 
        admin_pin: pin, 
        tier_bronze: newTierConfig.bronze, tier_bronze_discount: newTierConfig.bronze_discount, 
        tier_silver: newTierConfig.silver, tier_silver_discount: newTierConfig.silver_discount, 
        tier_gold: newTierConfig.gold, tier_gold_discount: newTierConfig.gold_discount, 
        tier_diamond: newTierConfig.diamond, tier_diamond_discount: newTierConfig.diamond_discount,
        updated_at: new Date().toISOString() 
      }).eq("id", 1); 
      if (!error) { 
        setBankBin(bin); setBankAcc(acc); setBankNameStr(nameStr); setZaloPayId(zaloId); 
        setHappyStart(hStart); setHappyEnd(hEnd); setAdminPin(pin); 
        setTierConfig(newTierConfig);
        
        setHappyDiscount(newHappyDiscount);
        window.localStorage.setItem('mart_happy_start', hStart);
        window.localStorage.setItem('mart_happy_end', hEnd);
        window.localStorage.setItem('mart_happy_discount', newHappyDiscount.toString());

        toast.success("Lưu Cài đặt thành công!"); ui.setShowSettings?.(false); logAudit("CÀI ĐẶT", "Cập nhật hệ thống"); 
      } 
    } catch (err) {} finally { setLoading(false); } 
  };
  const saveSettings = () => { const bin = newBankBin.trim(); const acc = newBankAcc.trim(); const nameStr = newBankNameStr.trim().toUpperCase(); const zaloId = newZaloPayId.trim(); const pin = newAdminPinInput.trim(); if (!bin || !acc || !nameStr || !pin) return toast.error("Vui lòng điền đủ thông tin & Mã PIN!"); updateSettingsToCloud(bin, acc, nameStr, zaloId, newHappyStart, newHappyEnd, pin); };
  
  const handleLogoutClick = () => { logAudit("ĐĂNG XUẤT", `Thoát ca ${shift}`); ui.setShowHandoverModal?.(true); };
  const confirmHandover = async () => { try { if (navigator.onLine) { await supabase.auth.signOut(); } } catch (error) {} finally { await dbRemove("mart_logged_in"); await dbRemove("mart_shift"); await dbRemove("mart_current_store"); window.localStorage.removeItem('mart_is_locked'); localStorage.removeItem("mart_was_logged_in"); setIsLoggedIn(false); window.location.reload(); } };
  const handleEditPhone = async (oldPhone: string) => { executeWithAdminCheck(() => { const newPhone = window.prompt("Nhập SĐT mới:", oldPhone); if (newPhone && newPhone.trim() !== "" && newPhone !== oldPhone) { if (customersData[newPhone]) return toast.error("SĐT đã tồn tại!"); const cData = customersData[oldPhone]; setCustomers((prev: any) => { const updated = { ...prev }; updated[newPhone] = { ...cData, phone: newPhone }; delete updated[oldPhone]; return updated }); logAudit("SỬA KHÁCH HÀNG", `Đổi SĐT ${oldPhone} -> ${newPhone}`); toast.success("Cập nhật thành công!"); } }); };
  const addSupplier = async () => { if (!supName || !supPhone) return toast.error("Nhập đủ Tên/SĐT"); const newId = Date.now(); const newSupData = { id: newId, name: supName, phone: supPhone, address: supAddress, item: supItem, taxCode: supTaxCode, bankAccount: supBankAccount, debt: 0 }; setSuppliers(prev => [newSupData, ...prev]); if (navigator.onLine) { supabase.from('suppliers').insert([newSupData]).then(); } setSupName(""); setSupPhone(""); toast.success("Thêm NCC thành công!"); logAudit("THÊM NCC", supName); };
  const deleteSupplier = async (id: any) => { setSuppliers(prev => prev.filter(s => s.id !== id)); if (navigator.onLine) await supabase.from('suppliers').delete().eq('id', id); logAudit("XÓA NCC", `ID: ${id}`); };
  const addExpense = async () => { if (!expName || !expAmount) return toast.error("Nhập chi phiếu!"); setExpenses(prev => [{ id: Date.now(), date: new Date().toLocaleDateString('vi-VN'), name: expName, amount: Number(expAmount) }, ...prev]); logAudit("CHI TIỀN", `${expName}: ${expAmount}đ`); setExpName(""); setExpAmount(""); toast.success("Đã ghi nhận chi phí!"); };
  const deleteExpense = async (id: any) => { setExpenses(prev => prev.filter(e => e.id !== id)); if (navigator.onLine) await supabase.from('expenses').delete().eq('id', id); logAudit("XÓA CHI PHÍ", `ID: ${id}`); };
  const closeCheckout = () => { resetCheckout() };
  const handleHoldOrder = async () => { if (cart.length === 0) return; const newO = { id: Date.now(), time: new Date().toLocaleTimeString('vi-VN'), cart: [...cart], note: "Khách chờ" }; setHeldOrders(prev => [...prev, newO]); logAudit("LƯU TẠM", `Lưu giỏ ${cart.length} món`); resetCheckout(); toast.success("Đã lưu tạm đơn hàng!"); };
  const restoreOrder = async (order: any) => { if (cart.length > 0) return toast.error("Vui lòng thanh toán giỏ hiện tại trước!"); setCart(order.cart); setHeldOrders(prev => prev.filter(o => o.id !== order.id)); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', order.id); logAudit("MỞ ĐƠN TẠM", `ID: ${order.id}`); ui.setShowHoldModal?.(false); toast.success("Đã mở lại đơn tạm!"); };
  const deleteHeldOrder = async (id: any) => { setHeldOrders(prev => prev.filter(o => o.id !== id)); logAudit("XÓA ĐƠN TẠM", `ID: ${id}`); if (navigator.onLine) await supabase.from('held_orders').delete().eq('id', id); toast.success("Đã xóa đơn tạm!"); };
  const handleVoucherSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); const code = voucherInput.trim().toUpperCase(); const VOUCHERS: Record<string, number> = { "VC50K": 50000, "VC100K": 100000, "VIP200K": 200000, "KM10K": 10000 }; if (VOUCHERS[code]) { setAppliedVoucherAmount(VOUCHERS[code]); playSound('success'); toast.success(`Đã áp dụng mã giảm ${VOUCHERS[code].toLocaleString()}đ`); logAudit("MÃ GIẢM GIÁ", `Áp dụng ${code}`); } else if (!isNaN(Number(code)) && Number(code) > 0) { setAppliedVoucherAmount(Number(code)); playSound('success'); toast.success(`Đã giảm trực tiếp ${Number(code).toLocaleString()}đ`); logAudit("GIẢM TRỰC TIẾP", `${Number(code).toLocaleString()}đ`); } else { playSound('error'); toast.error("Mã Voucher không hợp lệ!"); setAppliedVoucherAmount(0); } } };
  const handleCustomerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const val = e.target.value; setCustomerInput(val); const matchedPhone = Object.keys(customersData || {}).find(phone => phone === val.trim() || customersData[phone]?.cardCode === val.trim()); if (matchedPhone) { setCustPhone(matchedPhone); setCustName(customersData[matchedPhone].name); setCustAddress(customersData[matchedPhone].address || ""); setUseWallet(false); } else { setCustPhone(val); setCustName(""); setCustAddress(""); setUseWallet(false); } };
  const handleNextToQR = () => { if (cart.length === 0) return toast.error("Giỏ hàng trống!"); if (custPhone && !customersData[custPhone] && !custName) return toast.error("Vui lòng nhập Tên khách mới!"); setCheckoutStep(2); };

  const confirmCheckout = async (payMethod: 'TIỀN MẶT' | 'CHUYỂN KHOẢN' | 'GHI NỢ' | 'KẾT HỢP' | 'QUẸT THẺ' | 'ZALO PAY') => {
    if (cart.some(i => !i.qty || i.qty <= 0)) { playSound('error'); return toast.error("Lỗi số lượng sản phẩm!") }
    if (payMethod === 'GHI NỢ' && !custPhone) return toast.error("Thanh toán Ghi nợ cần SĐT Khách hàng!");
    setLoading(true); 
    try {
      let newLogs: any[] = []; const baseTotal = cartTotalAmountDisplay; const subTotal = Math.round(baseTotal / (1 + VAT_RATE)); const vatTotal = baseTotal - subTotal; const orderIdStr = "HD" + Date.now().toString().slice(-6);
      let splitCashAmt = 0; if (payMethod === 'KẾT HỢP') { splitCashAmt = Number(customerGiven) || 0; }

      for (const item of cart) {
        if (navigator.onLine) await supabase.from("products").update({ stock: Math.max(0, item.product.stock - item.qty) }).eq("id", item.product.id);
        let itemSplitCash = 0; if(payMethod === 'KẾT HỢP') { const safeRatio = finalToPay > 0 ? (splitCashAmt / finalToPay) : 0; itemSplitCash = Math.round(safeRatio * Math.round(item.qty * getActualPrice(item.product) * (1 + VAT_RATE))); }
        newLogs.push({ id: Date.now() + Math.random(), shift, type: payMethod === 'GHI NỢ' ? "GHI NỢ" : "BÁN", name: cleanName(item.product.name), qty: item.qty, total: item.total, profit: Math.round(item.qty * (getActualPrice(item.product) - (item.product.import_price || 0))), customer: custPhone ? `${custName} (${custPhone})` : "Khách lẻ", product_id: item.product.id, paymentMethod: payMethod, split_cash: itemSplitCash, time: new Date().toLocaleString('vi-VN'), order_id: orderIdStr });
      }

      if (custPhone) {
        const earned = payMethod === 'GHI NỢ' ? 0 : Math.round(finalToPay * 0.02); const currentCust = customersData[custPhone] || {};
        const updatedCust = { name: custName, wallet: payMethod === 'GHI NỢ' ? (currentCust.wallet || 0) : Math.round((currentCust.wallet || 0) - walletUsedAmount + earned), debt: (currentCust.debt || 0) + (payMethod === 'GHI NỢ' ? finalToPay : 0), totalSpent: (currentCust.totalSpent || 0) + (payMethod !== 'GHI NỢ' ? finalToPay : 0), email: currentCust.email || "", address: custAddress || currentCust.address || "", cardCode: currentCust.cardCode || "" }; 
        setCustomers(prev => ({ ...prev, [custPhone]: updatedCust })); if (navigator.onLine) { await supabase.from("customers").upsert({ phone: custPhone, ...updatedCust }); }
      }

      setHistory(prev => [...newLogs, ...prev]); if (navigator.onLine) { try { await supabase.from("history").insert(newLogs); } catch(err) {} }
      
      setLastOrder({ orderId: orderIdStr, shift, cart: [...cart], subTotal, vatTotal, finalTotal: finalToPay, debtAmount: payMethod === 'GHI NỢ' ? finalToPay : 0, discount: appliedVoucherAmount + tierDiscountAmount, time: new Date().toLocaleString('vi-VN'), paymentMethod: payMethod, customerGiven: Number(customerGiven) || 0, custPhone, custName, isRefund: false, splitCash: splitCashAmt, splitTransfer: Math.max(0, finalToPay - splitCashAmt) });
      logAudit("THANH TOÁN", `${orderIdStr} - ${payMethod} - ${finalToPay.toLocaleString()}đ`);
      setCheckoutStep(3); fetchProducts(); 
    } catch (err: any) { toast.error("Lỗi thanh toán: " + err.message); } finally { setLoading(false); }
  };

  const handleRefund = async (logId: any) => { 
    executeWithAdminCheck(async () => { 
      const log = history.find(l => l.id === logId); if (!log || (log.type !== 'BÁN' && log.type !== 'GHI NỢ')) return;
      const alreadyRefundedQty = history.filter(h => h.type === 'TRẢ HÀNG' && h.order_id === log.order_id && h.product_id === log.product_id).reduce((sum, h) => sum + Math.abs(h.qty || 0), 0);
      const remainingQtyToRefund = (log.qty || 0) - alreadyRefundedQty; if (remainingQtyToRefund <= 0) return toast.error("Đơn này đã được hoàn trả toàn bộ số lượng!");
      const qtyInput = window.prompt(`Sản phẩm: ${cleanName(log.name)}\nSố lượng có thể hoàn trả: ${remainingQtyToRefund}\n\nNhập SỐ LƯỢNG khách trả lại:`, remainingQtyToRefund.toString()); if (!qtyInput) return; 
      const refundQty = parseInt(qtyInput); if (isNaN(refundQty) || refundQty <= 0 || refundQty > remainingQtyToRefund) return toast.error("Số lượng hoàn trả không hợp lệ!"); 
      
      const singlePrice = log.total / log.qty; const refundTotal = Math.round(singlePrice * refundQty); 
      const singleProfit = (log.profit || 0) / log.qty; const refundProfit = Math.round(singleProfit * refundQty);
      
      let selectedMethod = "TIỀN MẶT";
      if (log.type === 'GHI NỢ') {
        if (!window.confirm(`Đơn này mua nợ. Trừ ${refundTotal.toLocaleString()}đ dư nợ của khách?`)) return; 
        selectedMethod = "TRỪ NỢ"; const phoneMatch = log.customer?.match(/\((.*?)\)/); const customerPhone = phoneMatch ? phoneMatch[1] : log.customer;
        if (customerPhone && customersData[customerPhone]) { const custData = customersData[customerPhone]; const newDebt = Math.max(0, (custData.debt || 0) - refundTotal); setCustomers(prev => ({ ...prev, [customerPhone]: { ...custData, debt: newDebt } })); if (navigator.onLine) { await supabase.from("customers").update({ debt: newDebt }).eq("phone", customerPhone); } }
      } else {
        const choice = window.prompt(`Hình thức trả tiền cho khách:\n1. TIỀN MẶT (Trừ tiền két)\n2. CHUYỂN KHOẢN (Trừ tiền bank)\n3. HOÀN VÀO VÍ VIP`, "1"); if (!choice) return; 
        if (choice === "2") selectedMethod = "CHUYỂN KHOẢN"; 
        if (choice === "3") {
          selectedMethod = "VÍ WALLET";
          const phoneMatch = log.customer?.match(/\((.*?)\)/); const customerPhone = phoneMatch ? phoneMatch[1] : null; if (!customerPhone || !customersData[customerPhone]) { return toast.error("Khách lẻ không hoàn Ví VIP được!"); }
          const custData = customersData[customerPhone]; setCustomers(prev => ({ ...prev, [customerPhone]: { ...custData, wallet: Math.round((custData.wallet || 0) + refundTotal) } })); if (navigator.onLine) { await supabase.from("customers").update({ wallet: Math.round((custData.wallet || 0) + refundTotal) }).eq("phone", customerPhone); }
        }
      }
      
      if (log.product_id) { const currentProd = products.find(p => p.id === log.product_id); if (currentProd) { const updatedStock = (currentProd.stock || 0) + refundQty; setProducts(prev => prev.map(p => p.id === log.product_id ? { ...p, stock: updatedStock } : p)); if (navigator.onLine) { try { await supabase.from("products").update({ stock: updatedStock }).eq("id", log.product_id); } catch (e) {} } } }
      await addTransactionAndSync({ id: Date.now(), shift, type: "TRẢ HÀNG", name: `HOÀN: ${cleanName(log.name)}`, qty: refundQty, total: -refundTotal, profit: -refundProfit, customer: log.customer, product_id: log.product_id, paymentMethod: selectedMethod, time: new Date().toLocaleString('vi-VN'), order_id: log.order_id }); 
      logAudit("HOÀN ĐƠN", `Trả ${refundQty} x ${cleanName(log.name)} (${selectedMethod})`); toast.success(`Hoàn tiền (${selectedMethod}): ${refundTotal.toLocaleString()}đ thành công!`); 
    }); 
  };

  const handlePayDebt = async (phone: string) => { 
    const currentDebt = customersData[phone]?.debt || 0; if (currentDebt <= 0) return toast.error("Khách không có nợ!"); 
    const inputAmount = window.prompt(`Khách: ${customersData[phone].name}\nNợ cũ: ${currentDebt.toLocaleString()}đ\nSố tiền trả:`, currentDebt.toString()); if (!inputAmount) return; 
    const paidAmount = Number(inputAmount.replace(/[^0-9]/g, '')); if (isNaN(paidAmount) || paidAmount <= 0 || paidAmount > currentDebt) { return toast.error("Số tiền trả không hợp lệ!"); }
    const methodChoice = window.prompt(`Hình thức:\n1. TIỀN MẶT\n2. CHUYỂN KHOẢN`, "1"); if (methodChoice === null) return; const selectedMethod = methodChoice === "2" ? "CHUYỂN KHOẢN" : "TIỀN MẶT";
    const remainingDebt = currentDebt - paidAmount; setCustomers(prev => ({ ...prev, [phone]: { ...prev[phone], debt: remainingDebt } })); if (navigator.onLine) { await supabase.from("customers").update({ debt: remainingDebt }).eq("phone", phone); }
    addTransactionAndSync({ id: Date.now(), shift, type: "THU NỢ", name: remainingDebt === 0 ? "Thanh toán hết nợ" : `Trả bớt nợ (Còn nợ: ${remainingDebt.toLocaleString()}đ)`, qty: 1, total: paidAmount, profit: 0, customer: `${customersData[phone].name} (${phone})`, paymentMethod: selectedMethod, time: new Date().toLocaleString('vi-VN') }); 
    logAudit("THU NỢ", `${customersData[phone].name} trả ${paidAmount.toLocaleString()}đ`); toast.success(`Thu nợ thành công!`);
  };

  const handleReprint = (timeStr: string, mode: 'receipt_thermal' | 'receipt_a4') => {
    const logsInBill = history.filter(h => h.time === timeStr && (h.type === 'BÁN' || h.type === 'GHI NỢ' || h.type === 'TRẢ HÀNG') && h.product_id !== 'DISCOUNT'); const discountLog = history.find(h => h.time === timeStr && h.product_id === 'DISCOUNT'); if(logsInBill.length === 0) return toast.error("Lỗi hóa đơn!");
    const isRefundSlip = logsInBill[0].type === 'TRẢ HÀNG'; const reconstructedCart = logsInBill.map(l => ({ qty: Math.abs(l.qty || 1), total: Math.abs(l.total), product: { name: l.name.replace("HOÀN: ", ""), gift_info: null, isHappyHour: String(l.name).includes('[Giờ Vàng]') } as any, priceIncludingVat: Math.abs(l.total) / Math.abs(l.qty || 1) }));
    const subTotal = reconstructedCart.reduce((s, i) => s + (i.qty * (i.priceIncludingVat / (1 + VAT_RATE))), 0); const vatTotal = Math.round(subTotal * VAT_RATE); const discount = discountLog ? Math.abs(discountLog.total) : 0; const finalTotal = logsInBill.reduce((sum, l) => sum + Math.abs(l.total), 0) - discount; 
    let cPhone = ""; let cName = logsInBill[0].customer; if (cName && cName !== "Khách lẻ") { const match = cName.match(/\((.*?)\)/); if (match && match[1]) { cPhone = match[1]; cName = cName.replace(` (${cPhone})`, "").trim(); } else { cPhone = cName; } }
    
    let calcSplitCash = 0; if(logsInBill[0].paymentMethod === 'KẾT HỢP') calcSplitCash = logsInBill.reduce((sum, l) => sum + (l.split_cash || 0), 0);
    setLastOrder({ orderId: logsInBill[0].order_id || (isRefundSlip ? "PHIẾU_TRẢ_HÀNG" : "HD_COPY"), shift: logsInBill[0].shift, cart: reconstructedCart, subTotal, vatTotal, finalTotal, debtAmount: logsInBill[0].type === 'GHI NỢ' ? finalTotal : 0, discount, time: timeStr, paymentMethod: logsInBill[0].paymentMethod || "TIỀN MẶT", customerGiven: logsInBill[0].paymentMethod === 'TIỀN MẶT' ? finalTotal : calcSplitCash, custName: cName || "Khách lẻ", custPhone: cPhone, isRefund: isRefundSlip, splitCash: calcSplitCash, splitTransfer: Math.max(0, finalTotal - calcSplitCash) }); 
    ui.setPrintMode?.(mode); logAudit("IN LẠI HÓA ĐƠN", `HĐ lúc ${timeStr}`);
  };

  const sendReceiptEmail = async () => {
    if (!lastOrder) return; let savedEmail = customersData?.[lastOrder.custPhone || ""]?.email || ""; let email = window.prompt("Nhập Email khách hàng:", savedEmail); if (!email) return; email = email.trim(); 
    if (lastOrder.custPhone && customersData[lastOrder.custPhone]) { setCustomers((prev: any) => ({ ...prev, [lastOrder.custPhone || ""]: { ...prev[lastOrder.custPhone || ""], email: email } })); } setLoading(true); 
    let itemsHtml = ""; (lastOrder.cart || []).forEach((item: any) => { const priceToUse = item.priceIncludingVat !== undefined ? item.priceIncludingVat : Math.round(getActualPrice(item.product) * (1 + VAT_RATE)); itemsHtml += `<tr><td style="padding: 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${cleanName(item.product.name)}</td><td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9; color: #1e293b; font-weight: bold;">${item.qty}</td><td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #1e293b;">${(priceToUse * item.qty).toLocaleString()}đ</td></tr>`; }); 
    const storeInfo = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}"); const storeNameDisplay = storeInfo.store_name ? storeInfo.store_name.toUpperCase() : "HỆ THỐNG POS PRO"; const storePhoneDisplay = storeInfo.phone || "Liên hệ cửa hàng";
    const htmlContent = `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; background: #ffffff;"><div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase;">${storeNameDisplay}</h1><p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Hóa Đơn Mua Hàng Điện Tử</p></div><div style="padding: 25px;"><div style="display: flex; justify-content: space-between; border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 15px;"><div><p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px;">Mã Đơn Hàng:</p><p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 16px;">${lastOrder.orderId}</p></div><div style="text-align: right;"><p style="margin: 0 0 5px 0; color: #64748b; font-size: 13px;">Ngày mua:</p><p style="margin: 0; color: #0f172a; font-weight: bold; font-size: 14px;">${lastOrder.time}</p></div></div><table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;"><thead><tr style="background: #f8fafc;"><th style="padding: 12px; text-align: left; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0;">Sản phẩm</th><th style="padding: 12px; text-align: center; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0;">SL</th><th style="padding: 12px; text-align: right; color: #64748b; font-size: 13px; border-bottom: 2px solid #e2e8f0;">Thành tiền</th></tr></thead><tbody>${itemsHtml}</tbody></table><div style="background: #f8fafc; padding: 15px; border-radius: 8px; text-align: right;"><h2 style="margin: 0; color: #0f172a; font-size: 22px;"><span style="font-size: 14px; color: #64748b; font-weight: normal; margin-right: 10px;">TỔNG THANH TOÁN:</span> <span style="color: #dc2626;">${Math.round(lastOrder.debtAmount > 0 ? lastOrder.debtAmount : lastOrder.finalTotal).toLocaleString()}đ</span></h2><p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px;">Phương thức: ${lastOrder.paymentMethod}</p></div><div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;"><p style="margin: 0; color: #64748b; font-size: 14px;">Cảm ơn quý khách đã mua sắm tại ${storeNameDisplay}!</p><p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">Hotline hỗ trợ: ${storePhoneDisplay}</p></div></div></div>`;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: email, subject: `🧾 Hóa đơn mua hàng #${lastOrder.orderId}`, html_message: htmlContent }); logAudit("GỬI HÓA ĐƠN EMAIL", `Mã HĐ: ${lastOrder.orderId}`); toast.success("Đã gửi Hóa đơn thành công!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false)
  };

  const printCustomerCard = (phone: string) => { const cust = customersData[phone]; if(!cust) return toast.error("Không tìm thấy dữ liệu khách!"); setPrintCustomer({ phone, ...cust }); ui.setPrintMode?.('customer_card'); logAudit("IN THẺ VIP", phone); };
  
  const sendCardEmail = async (phone: string) => {
    const font = customersData[phone]; if(!font) return toast.error("Không tìm thấy dữ liệu khách!"); let email = font.email || window.prompt(`Nhập Email của ${font.name}:`, ""); if (!email) return; email = email.trim(); 
    if (!font.email) { setCustomers((prev: any) => ({ ...prev, [phone]: { ...prev[phone], email } })); } setLoading(true);
    const code = font.cardCode || phone; const barcodeUrl = `https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(code)}&scale=3&height=15&includetext=false`; const storeInfo = JSON.parse(window.localStorage.getItem("mart_current_store") || "{}"); const storeNameDisplay = storeInfo.store_name ? storeInfo.store_name.toUpperCase() : "HỆ THỐNG POS PRO";
    const htmlContent = `<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f1f5f9; padding: 30px; border-radius: 12px;"><div style="text-align: center; margin-bottom: 25px;"><h2 style="color: #0f172a; margin: 0;">Xin chào, ${font.name}!</h2><p style="color: #64748b; margin: 5px 0 0 0;">Chào mừng bạn đến với chương trình Khách hàng thân thiết.</p></div><div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); border-radius: 16px; padding: 25px; color: white; box-shadow: 0 10px 25px rgba(220, 38, 38, 0.3); position: relative; overflow: hidden; max-width: 400px; margin: 0 auto;"><div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;"><h3 style="margin: 0; font-size: 20px; letter-spacing: 1px;">${storeNameDisplay}</h3><span style="background: rgba(255,255,255,0.2); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; letter-spacing: 1px;">VIP MEMBER</span></div><div style="background: #ffffff; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 20px;"><img src="${barcodeUrl}" alt="Barcode" style="max-width: 100%; height: 50px;" /></div><table border="0" cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 8px; border-collapse: collapse;"><tr><td align="left" valign="bottom" style="width: 50%; padding: 0;"><p style="margin: 0; font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff;">Mã Thành Viên</p><p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; letter-spacing: 1px; font-family: monospace; color: #ffffff;">${code}</p></td><td align="right" valign="bottom" style="width: 50%; padding: 0;"><p style="margin: 0; font-size: 10px; opacity: 0.7; text-transform: uppercase; letter-spacing: 0.5px; color: #ffffff;">Chủ thẻ</p><p style="margin: 4px 0 0 0; font-size: 16px; font-weight: bold; text-transform: uppercase; color: #ffffff; white-space: nowrap;">${font.name}</p></td></tr></table></div></div>`;
    try { await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_VIP_ID, { to_email: email, subject: `💳 Thẻ VIP Đặc Quyền - ${font.name}`, html_message: htmlContent }); logAudit("GỬI THẺ VIP EMAIL", phone); toast.success("Đã gửi Thẻ VIP thành công!"); } catch (error: any) { toast.error(`Lỗi gửi Email`); } setLoading(false);
  };
  
  const shareToZalo = (phone: string) => { const cust = customersData[phone]; const code = cust.cardCode || phone; navigator.clipboard.writeText(`Chào ${cust.name},\nMã Thẻ VIP của bạn là: ${code}`).then(() => { toast.success(`Đang mở Zalo...`); logAudit("CHIA SẺ ZALO", phone); window.open(`https://zalo.me/${phone}`, '_blank') }).catch(() => { window.open(`https://zalo.me/${phone}`, '_blank') }) };
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => { const code = e.target.value; setNewCode(code); const p = products.find((x: any) => x.product_code === code); if (p) { setNewName(cleanName(p.name)); setNewCategory(formatCategoryStr(p.category)); setNewImportPrice(p.import_price?.toString() || ""); setNewPrice(p.sale_price.toString()); setNewPromoPrice(p.promo_price?.toString() || ""); setNewExpiry(p.expiry_date || ""); const gift = parseGift(p.gift_info); setNewGiftCondition(gift.cond.toString()); setNewGiftInfo(gift.text) } };

  const syncInventory = async () => {
    if (Object.keys(actualStockInput).length === 0) return toast.error("Chưa có dữ liệu cập nhật!");
    if (!window.confirm("Hệ thống sẽ cập nhật số lượng tồn kho theo số liệu thực tế.\nXác nhận đồng bộ?")) return;
    
    setLoading(true); 
    try { 
      let count = 0; 
      setProducts(prevProducts => {
        const updatedProducts = prevProducts.map(p => {
          if (actualStockInput[p.id] !== undefined) {
            return { ...p, stock: Number(actualStockInput[p.id]) };
          }
          return p;
        });
        dbSet("mart_products_cache", updatedProducts).catch(()=>{});
        return updatedProducts;
      });

      if (navigator.onLine) {
        for (const [id, actualQty] of Object.entries(actualStockInput)) { 
          await supabase.from("products").update({ stock: Number(actualQty), updated_at: new Date().toISOString() }).eq("id", id); 
          count++; 
        } 
      } else {
        count = Object.keys(actualStockInput).length;
        toast.error("Mất mạng! Đã lưu tạm bộ nhớ máy, dữ liệu sẽ tự đẩy lên khi có mạng.");
      }

      toast.success(`Đã cập nhật chênh lệch ${count} mã sản phẩm vào sổ kho!`); 
      logAudit("KIỂM KHO", `Cập nhật tồn kho ${count} mã`); 
      setActualStockInput({}); 
      ui.setShowInventoryModal?.(false); 
      
    } catch (e) { 
      toast.error("Lỗi đồng bộ kho!"); 
    } finally { 
      setLoading(false); 
    }
  };

  const syncPendingImports = async () => {
    if (!navigator.onLine) return; const pendingImports = await dbGet("mart_pending_imports") || []; if (pendingImports.length === 0) return; toast.loading("Đang đồng bộ dữ liệu Nhập Kho Offline..."); let successCount = 0;
    for (const item of pendingImports) {
      try {
        if (item.action === "UPDATE_STOCK") {
          const baseCode = String(item.data.product_code).split('-')[0];
          await supabase.from("products").update({ sale_price: item.data.sale_price, promo_price: item.data.promo_price, gift_info: item.data.gift_info, updated_at: new Date().toISOString() }).eq("product_code", baseCode);
          await supabase.from("products").update({ sale_price: item.data.sale_price, promo_price: item.data.promo_price, gift_info: item.data.gift_info, updated_at: new Date().toISOString() }).like("product_code", `${baseCode}-%`);
          const { data: cloudProd } = await supabase.from("products").select("stock").eq("id", item.targetId).single(); const currentCloudStock = cloudProd ? cloudProd.stock : 0; await supabase.from("products").update({ stock: currentCloudStock + item.addedStock, updated_at: new Date().toISOString() }).eq("id", item.targetId);
        } else if (item.action === "INSERT_NEW") { await supabase.from("products").insert([item.data]); }
        successCount++;
      } catch (err) {}
    }
    await dbSet("mart_pending_imports", []); toast.dismiss(); if (successCount > 0) { toast.success(`Đã đồng bộ ${successCount} lệnh Nhập Kho lên hệ thống!`); logAudit("ĐỒNG BỘ KHO", `Đẩy ${successCount} lệnh lên Cloud`); fetchProducts(); }
  };

  useEffect(() => { if (isOnline && isLoggedIn) { syncPendingImports(); } }, [isOnline, isLoggedIn]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const added = Number(String(newStock).replace(/[^0-9]/g, '')) || 0; const impPrice = Number(String(newImportPrice).replace(/[^0-9]/g, '')) || 0; const salePrice = Number(String(newPrice).replace(/[^0-9]/g, '')) || 0; const promo = Number(String(newPromoPrice).replace(/[^0-9]/g, '')) || 0; const finalGiftInfo = newGiftInfo.trim() !== "" ? `${newGiftCondition};;;${newGiftInfo}` : null; 
      const inputCode = newCode.trim(); const baseCode = inputCode.split('-')[0]; const formattedCat = formatCategoryStr(newCategory);
      const allVariants = products.filter(p => String(p.product_code).split('-')[0] === baseCode); const exist = products.find(p => p.product_code === inputCode) || allVariants.find(p => p.product_code === baseCode); const isNewBatch = exist && (exist.import_price !== impPrice || (exist.expiry_date || "") !== (newExpiry || ""));
      let finalProductCode = exist ? exist.product_code : baseCode; let finalProductName = newName; let finalStockToSave = added;
      if (isNewBatch) { finalProductCode = `${baseCode}-${Date.now().toString().slice(-4)}`; finalProductName = `${newName} [Lô mới]`; if (!window.confirm(`Sản phẩm bị lệch Giá vốn / Hạn sử dụng.\nHệ thống sẽ tạo LÔ MỚI (${finalProductCode})?\n\nChọn OK để tiếp tục.`)) { setLoading(false); return; } } else if (exist) { finalStockToSave = exist.stock + added; }
      const newProductData = { product_code: finalProductCode, name: finalProductName, category: formattedCat, import_price: impPrice, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: finalStockToSave, expiry_date: newExpiry || null };

      setProducts(prev => {
        let updated = prev.map(p => { const pBase = String(p.product_code).split('-')[0]; if (pBase === baseCode) { const keepSuffix = p.name.includes('[Lô mới]') ? ' [Lô mới]' : ''; return { ...p, name: newName + keepSuffix, category: formattedCat, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo, stock: (!isNewBatch && p.id === exist?.id) ? finalStockToSave : p.stock }; } return p; });
        if (isNewBatch || !exist) { updated = [{ id: `temp-${Date.now()}`, ...newProductData, created_at: new Date().toISOString() }, ...updated]; } return updated;
      });

      if (navigator.onLine) {
        if (isNewBatch) { await supabase.from("products").insert([newProductData]); } else if (exist) { await supabase.from("products").update({ stock: finalStockToSave }).eq("id", exist.id); } else { await supabase.from("products").insert([newProductData]); }
        if (allVariants.length > 0 || exist) { await supabase.from("products").update({ name: newName, category: formattedCat, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo }).eq("product_code", baseCode); await supabase.from("products").update({ name: `${newName} [Lô mới]`, category: formattedCat, sale_price: salePrice, promo_price: promo, gift_info: finalGiftInfo }).like("product_code", `${baseCode}-%`); }
        if (added > 0) addTransactionAndSync({ id: Date.now(), shift, type: "NHẬP", name: finalProductName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') }); 
        logAudit("THÊM/SỬA SP", `Mã: ${finalProductCode}`); toast.success(`Đã lưu & đồng bộ giá toàn bộ kho thành công!`);
      } else {
        const pendingImports = await dbGet("mart_pending_imports") || []; pendingImports.push({ id: Date.now(), action: (exist && !isNewBatch) ? "UPDATE_STOCK" : "INSERT_NEW", targetId: (exist && !isNewBatch) ? exist.id : null, data: newProductData, addedStock: added }); await dbSet("mart_pending_imports", pendingImports);
        if (added > 0) { const offlineLog = { id: Date.now(), shift, type: "NHẬP (OFFLINE)", name: finalProductName, qty: added, total: 0, time: new Date().toLocaleString('vi-VN') } as any; setHistory(prev => [offlineLog, ...prev]); const currentHistory = await dbGet("mart_history") || []; await dbSet("mart_history", [offlineLog, ...currentHistory]); }
        logAudit("NHẬP KHO OFFLINE", `Mã: ${finalProductCode}`); toast.success(`Đã lưu Tạm! Tự động đồng bộ giá khi có mạng.`);
      }
      resetProductForm(); ui.setShowInputForm?.(false);
    } catch (err) { toast.error("Lỗi khi lưu sản phẩm"); } finally { setLoading(false); }
  };

  const handleFileUpload = async (e: any) => {
    const file = e?.target?.files?.[0] || e; if (!file || !file.name) { if (e?.target) e.target.value = ''; return; } if (!navigator.onLine) { toast.error("Cần mạng để tải lên!"); if (e?.target) e.target.value = ''; return; }
    const processData = async (lines: any[]) => {
      setLoading(true); 
      try {
        if (!lines || lines.length <= 1) { toast.error("File rỗng!"); setLoading(false); return; } let successCount = 0; let importLogs: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i]; if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
          const pCode = String(cols[0] || "").trim(); const pName = String(cols[1] || "").trim(); const pCategory = formatCategoryStr(String(cols[2] || "")); const pImpPrice = parseInt(String(cols[3] || "0").replace(/[,.]/g, '')) || 0; const pSalePrice = parseInt(String(cols[4] || "0").replace(/[,.]/g, '')) || 0; const pPromoPrice = parseInt(String(cols[5] || "0").replace(/[,.]/g, '')) || 0; const pGiftCond = String(cols[6] || "1").trim(); const pGiftText = cols[7] ? String(cols[7]).trim() : ""; const pGift = pGiftText !== "" ? `${pGiftCond};;;${pGiftText}` : null; const pStock = parseInt(String(cols[8] || "0").replace(/[,.]/g, '')) || 0; const pExpiry = cols[9] ? String(cols[9]).trim() : null;
          if (!pCode || !pName || pSalePrice <= 0) continue;
          const baseCode = pCode.split('-')[0]; const allVariants = products.filter(p => String(p.product_code).split('-')[0] === baseCode); 
          if (allVariants.length > 0) { 
            const needSync = allVariants.some(v => v.sale_price !== pSalePrice || v.promo_price !== pPromoPrice || v.gift_info !== pGift || cleanName(v.name) !== pName); 
            if (needSync) { const variantIds = allVariants.map(v => v.id); setProducts(prev => prev.map(x => { if(variantIds.includes(x.id)) { const keepSuffix = x.name.includes('[Lô mới]') ? ' [Lô mới]' : ''; return { ...x, name: pName + keepSuffix, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift }; } return x; })); await supabase.from("products").update({ name: pName, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, updated_at: new Date().toISOString() }).eq("product_code", baseCode); await supabase.from("products").update({ name: `${pName} [Lô mới]`, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, updated_at: new Date().toISOString() }).like("product_code", `${baseCode}-%`); } 
          }
          const exist = allVariants.find(p => p.product_code === pCode); 
          if (exist) { 
            if (exist.stock <= 0) { await supabase.from("products").update({ name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry, updated_at: new Date().toISOString() }).eq("id", exist.id); } 
            else { if (exist.import_price !== pImpPrice || (exist.expiry_date || "") !== (pExpiry || "")) { const batchCode = `${baseCode}-${Date.now().toString().slice(-4)}${i}`; await supabase.from("products").insert([{ product_code: batchCode, name: `${pName} [Lô mới]`, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); } else { await supabase.from("products").update({ stock: exist.stock + pStock, updated_at: new Date().toISOString() }).eq("id", exist.id); } } 
          } else { await supabase.from("products").insert([{ product_code: pCode, name: pName, category: pCategory, import_price: pImpPrice, sale_price: pSalePrice, promo_price: pPromoPrice, gift_info: pGift, stock: pStock, expiry_date: pExpiry }]); }
          if (pStock > 0) { importLogs.push({ id: Date.now() + Math.random(), shift: shift, type: "NHẬP", name: cleanName(pName), qty: pStock, total: 0, time: new Date().toLocaleString('vi-VN') } as any); successCount++; }
        }
        if (importLogs.length > 0) { if(navigator.onLine) await supabase.from("history").insert(importLogs); setHistory(prev => [...importLogs, ...prev]); } logAudit("NHẬP EXCEL", `Nhập ${successCount} mã`); toast.success(`Nhập thành công từ file!`);
      } catch (err) { toast.error("Lỗi đọc file."); } setLoading(false);
    }; 
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) { if (!(window as any).XLSX) { toast.loading("Excel Library loading..."); if (e?.target) e.target.value = ''; return; } const reader = new FileReader(); reader.onload = (event) => { try { const data = new Uint8Array(event.target?.result as ArrayBuffer); const workbook = (window as any).XLSX.read(data, { type: 'array' }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); processData(jsonData); } catch (error) { toast.error("Lỗi đọc file Excel."); } }; reader.readAsArrayBuffer(file); } else { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); processData(lines); }; reader.readAsText(file); } if (e?.target) e.target.value = ''; 
  };

  const handleImportInventoryCSV = (e: any) => {
    const file = e?.target?.files?.[0] || e; if (!file || !file.name) { if (e?.target) e.target.value = ''; return; }
    const processData = (lines: any[]) => { 
      let updatedStock = { ...actualStockInput }; 
      let count = 0; 
      for (let i = 1; i < lines.length; i++) { 
        const cols = lines[i]; 
        if (!cols || !Array.isArray(cols) || cols.join('').trim() === '') continue; 
        
        const pCode = String(cols[0] || "").trim(); 
        const actualValStr = String(cols[5] || "0").replace(/[,.]/g, ''); // Cột index 5 (Cột F)
        const actualVal = parseInt(actualValStr); 
        
        if (!isNaN(actualVal) && pCode) { 
          const matchedProd = products.find(p => p.product_code === pCode); 
          if (matchedProd && matchedProd.stock !== actualVal) { 
            updatedStock[matchedProd.id] = actualVal; 
            count++; 
          } 
        } 
      } 
      setActualStockInput(updatedStock); 
      toast.success(`Đã nạp số liệu thực tế!`); 
      logAudit("KIỂM KHO BẰNG EXCEL", `Nạp ${count} mã`); 
    };
    const fileNameStr = file.name.toLowerCase();
    if (fileNameStr.endsWith('.xlsx') || fileNameStr.endsWith('.xls')) { if (!(window as any).XLSX) { toast.loading("Loading..."); if (e?.target) e.target.value = ''; return; } const reader = new FileReader(); reader.onload = (event) => { try { const data = new Uint8Array(event.target?.result as ArrayBuffer); const workbook = (window as any).XLSX.read(data, { type: 'array' }); const firstSheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = (window as any).XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "", raw: false }); processData(jsonData); } catch(err) {} }; reader.readAsArrayBuffer(file); } else { const reader = new FileReader(); reader.onload = (event) => { const text = event.target?.result as string; const lines = text.split('\n').filter(line => line.trim() !== '').map(line => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''))); processData(lines); }; reader.readAsText(file); } if (e?.target) e.target.value = '';
  };
  
  const exportInventoryCSV = () => {
    if (!(window as any).XLSX) return toast.error("Đang tải thư viện Excel!");
    try {
      const wb = (window as any).XLSX.utils.book_new();
      const wsData = [["Mã SP", "Tên SP", "Danh mục", "Giá Nhập", "Giá Bán", "Tồn Kho Hiện Tại"]];
      products.forEach(p => {
        wsData.push([p.product_code, cleanName(p.name), p.category, p.import_price, p.sale_price, p.stock]);
      });
      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData);
      (window as any).XLSX.utils.book_append_sheet(wb, ws, "Ton_Kho");
      (window as any).XLSX.writeFile(wb, `DanhSachKiemKho_${Date.now()}.xlsx`);
      logAudit("XUẤT FILE", "Xuất file kiểm kho");
    } catch (e) { toast.error("Lỗi xuất file!"); }
  };

  const handleDelete = async (id: any, name: any) => { executeWithAdminCheck(async () => { if (!navigator.onLine) return toast.error("Mạng yếu!"); if (window.confirm(`Xóa ${name}?`)) { await supabase.from("products").delete().eq("id", id); logAudit("XÓA SP", `Xóa: ${name}`); fetchProducts() } }); };

  const handleEdit = async (id: any, field: string, old: any, isText: boolean = false) => { 
    executeWithAdminCheck(async () => { 
      if (!navigator.onLine) return toast.error("Mạng yếu!"); 
      let label = field; if (field === 'category') label = 'Danh mục'; if (field === 'sale_price') label = 'Giá bán'; if (field === 'promo_price') label = 'Giá KM'; if (field === 'gift_info') label = 'Quà tặng'; if (field === 'expiry_date') label = 'HSD'; if (field === 'name') label = 'Tên SP'; if(field === 'import_price') label = 'Giá vốn';
      const val = window.prompt(`Sửa ${label}:`, old || ""); 
      if (val !== null) { 
        let updateData: any = isText ? (field === 'category' ? formatCategoryStr(val) : val) : (Number(String(val).replace(/[^0-9]/g, '')) || 0); 
        if (field === 'gift_info' && val.trim() === '') updateData = null; if (field === 'expiry_date') updateData = val.trim() === '' ? null : val;
        await supabase.from("products").update({ [field]: updateData }).eq("id", id);
        if (['name', 'category', 'sale_price', 'promo_price', 'gift_info'].includes(field)) {
           const prod = products.find(p => p.id === id);
           if (prod && prod.product_code) {
             const baseCode = String(prod.product_code).split('-')[0]; const finalName = field === 'name' ? String(updateData) : prod.name; const baseName = finalName.replace(' [Lô mới]', '');
             await supabase.from("products").update({ [field]: updateData }).eq("product_code", baseCode);
             if (field === 'name') { await supabase.from("products").update({ [field]: `${baseName} [Lô mới]` }).like("product_code", `${baseCode}-%`); } else { await supabase.from("products").update({ [field]: updateData }).like("product_code", `${baseCode}-%`); }
           }
        }
        logAudit("SỬA NHANH BẢNG", `ID: ${id}, Trường: ${label}, Cũ: ${old}, Mới: ${val}`); toast.success(`Đã cập nhật ${label}!`); fetchProducts(); 
      }
    }); 
  };

  const handleSelectSuggest = (p: Product) => {
    const existingItem = cart.find((i: CartItem) => i.product.id === p.id); const currentQtyInCart = existingItem ? existingItem.qty : 0;
    if (currentQtyInCart >= p.stock) { playSound('error'); toast.error(`❌ Vượt quá tồn kho: ${cleanName(p.name)}`, { id: `out-${p.id}`, duration: 2000 }); return; }
    playSound('success'); toast.success(`+1 ${cleanName(p.name)}`, { id: `add-${p.id}`, duration: 1000 });
    setCart((prev: CartItem[]) => { if (existingItem) { return prev.map(i => i.product.id === p.id ? { ...i, qty: i.qty + 1, total: (i.qty + 1) * getActualPrice(p) } : i); } else { return [...prev, { product: p, qty: 1, total: getActualPrice(p) }]; } });
    setBarcodeInput(""); setSearchTerm(""); setShowSuggestions(false);
  };

  const handleQtyChange = (id: any, q: any) => {
    const qty = parseInt(q); if (isNaN(qty) || qty <= 0) { setCart((prev: CartItem[]) => prev.filter(i => i.product.id !== id)); return; }
    const p = products.find(x => x.id === id); if (!p) return; if (qty > p.stock) { toast.error(`Tồn kho chỉ còn ${p.stock}`); return; }
    setCart((prev: CartItem[]) => prev.map(i => i.product.id === id ? { ...i, qty, total: qty * getActualPrice(i.product) } : i));
  };

  const downloadPO = (po: any) => {
    try {
      const wb = (window as any).XLSX.utils.book_new(); const wsData = [ ["MÃ ĐẶT HÀNG:", po.po_code, "NGÀY ĐẶT:", new Date(po.created_at).toLocaleDateString('vi-VN')], ["NHÀ CUNG CẤP:", suppliers.find(s => s.id == po.supplier_id)?.name || "", "SĐT:", suppliers.find(s => s.id == po.supplier_id)?.phone || ""], ["GHI CHÚ:", po.note || ""], [], ["STT", "TÊN SẢN PHẨM", "SỐ LƯỢNG", "GIÁ NHẬP DỰ KIẾN", "THÀNH TIỀN"] ];
      (po.items || []).forEach((item: any, index: number) => { wsData.push([ index + 1, cleanName(item.name), item.qty, item.importPrice, item.qty * item.importPrice ]); });
      wsData.push([]); wsData.push(["", "", "", "TỔNG CỘNG:", (po.items || []).reduce((sum: number, i: any) => sum + (i.qty * i.importPrice), 0)]);
      const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData); (window as any).XLSX.utils.book_append_sheet(wb, ws, "Phieu_Dat_Hang"); (window as any).XLSX.writeFile(wb, `DatHang_${po.po_code}.xlsx`); toast.success("Xuất file Đặt hàng thành công!");
    } catch(e) { toast.error("Lỗi xuất file"); }
  };

  const downloadSampleExcel = () => {
    if (!(window as any).XLSX) return toast.error("Đang tải thư viện Excel, thử lại sau!");
    const wsData = [ ["Mã sản phẩm (*)", "Tên sản phẩm (*)", "Danh mục", "Giá Nhập", "Giá Bán (*)", "Giá Khuyến mãi", "Điều kiện mua tặng", "Sản phẩm tặng kèm", "Số lượng", "Hạn sử dụng (mm/yyyy)"], ["BIA-333", "Bia 333 Lon 330ml", "Đồ uống", 10000, 12000, 11000, 2, "Tặng 1 ly thủy tinh", 100, "12/2026"], ["MY-HAO", "Nước rửa chén Mỹ Hảo", "Hóa phẩm", 15000, 20000, "", "", "", 50, ""] ];
    const ws = (window as any).XLSX.utils.aoa_to_sheet(wsData); const wb = (window as any).XLSX.utils.book_new(); (window as any).XLSX.utils.book_append_sheet(wb, ws, "San_Pham"); (window as any).XLSX.writeFile(wb, "Mau_Nhap_Hang.xlsx");
  };

  const handleSaveNewPO = async () => {
    if (!selectedSupplierId) { toast.error("Vui lòng chọn Nhà Cung Cấp!"); return; }
    if (!poItems || poItems.length === 0) { toast.error("Phiếu đặt hàng trống!"); return; }
    setLoading(true);
    try {
      const supplier = suppliers.find(s => String(s.id) === String(selectedSupplierId));
      const totalAmt = poItems.reduce((sum, item) => sum + (item.qty || 0) * (item.importPrice || 0), 0);
      const newPoCode = `PO${Date.now().toString().slice(-6)}`;
      const newPO = { id: Date.now(), po_code: newPoCode, supplier_id: selectedSupplierId, supplier: supplier, items: poItems, note: poNote, total_amount: totalAmt, paid_amount: paidAmount || 0, status: "PENDING", created_at: new Date().toISOString() };
      setAllPOs(prev => [newPO, ...prev]);
      const currentPOs = await dbGet("mart_pos") || [];
      await dbSet("mart_pos", [newPO, ...currentPOs]);
      logAudit("TẠO PO", `Mã: ${newPO.po_code} - Tổng: ${totalAmt.toLocaleString()}đ`);
      toast.success(`Đã tạo thành công Phiếu PO: ${newPO.po_code}`);
      setSelectedSupplierId(""); setPoItems([]); setPoNote(""); setPaidAmount(0);
    } catch (e) { toast.error("Đã xảy ra lỗi khi lưu PO!"); } finally { setLoading(false); }
  };

  const handleConfirmReceipt = async (updatedPO: any, finalReceiveItems: any) => {
    setLoading(true);
    try {
      const finalPO = { ...updatedPO, items: finalReceiveItems };
      setAllPOs(prev => prev.map(po => po.id === finalPO.id ? finalPO : po));
      const currentPOs = await dbGet("mart_pos") || [];
      const savedPOs = currentPOs.map((po: any) => po.id === finalPO.id ? finalPO : po);
      await dbSet("mart_pos", savedPOs);
      logAudit("NHẬP KHO PO", `Hoàn tất PO: ${finalPO.po_code}`);
      toast.success(`Nhập kho thành công mã PO: ${finalPO.po_code}`);
    } catch (e) { toast.error("Lỗi khi cập nhật trạng thái PO!"); } finally { setLoading(false); }
  };

  if (!isStorageLoading && (!isLoggedIn || isLocked)) {
    return (
      <div className={`app-container ${ui.darkMode ? "dark-theme" : "light-theme"}`} style={{ minHeight: "100vh", position: "relative" }}>
        <Toaster position="top-right" />
        {isLoggedIn && isLocked && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
            <div style={{ background: ui.darkMode ? 'rgba(255,255,255,0.05)' : 'white', padding: '40px', borderRadius: '24px', textAlign: 'center', maxWidth: '400px', width: '90%', border: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.1)' : 'transparent'}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div><h2 style={{ color: ui.darkMode ? 'white' : '#1e293b', margin: '0 0 8px 0', fontSize: '24px' }}>Màn Hình Đã Khóa</h2><p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Vui lòng mở khóa để tiếp tục sử dụng.</p>
              <input type="password" autoFocus placeholder="Nhập mã PIN để mở khóa..." value={unlockPin} onChange={e => setUnlockPin(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { if (unlockPin === adminPin || unlockPin === "1234") { setIsLocked(false); setUnlockPin(""); toast.success("Đã mở khóa!"); } else { toast.error("Mã PIN không đúng!"); } } }} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: `1px solid ${ui.darkMode ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`, background: ui.darkMode ? 'rgba(0,0,0,0.2)' : '#f8fafc', color: ui.darkMode ? 'white' : 'black', textAlign: 'center', letterSpacing: '4px', fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }} />
              <button onClick={() => { if (unlockPin === adminPin || unlockPin === "1234") { setIsLocked(false); setUnlockPin(""); toast.success("Đã mở khóa!"); } else { toast.error("Mã PIN không đúng!"); } }} style={{ width: '100%', padding: '14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>MỞ KHÓA</button>
            </div>
          </div>
        )}
        {!isLoggedIn && <Login setIsLoggedIn={setIsLoggedIn} setRole={() => {}} shift={shift} setShift={setShift} startingCash={startingCash} setStartingCash={setStartingCash} installPrompt={installPrompt} handleInstallApp={handleInstallApp} />}
      </div>
    );
  }

  return (
    <div className={`app-container ${ui.darkMode ? "dark-theme" : "light-theme"}`} style={{ padding: "16px", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
      <Toaster position="top-right" />
      
      <Header 
        ui={ui}
        shift={shift} totalValue={totalValue} currentShiftStats={currentShiftStats} setCashFlowModalInfo={ui.setCashFlowModalInfo} darkMode={ui.darkMode} setDarkMode={ui.setDarkMode} handleLogoutClick={handleLogoutClick}
        lowStockCount={lowStockCount} isOnline={isOnline} syncStatus={syncStatus} syncAllOfflineData={syncPendingImports} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr}
      />

      {ui.scannerMode !== null && ui.scannerMode !== 'barcode' && ui.scannerMode !== 'voucher' && ui.scannerMode !== 'customer' && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.85)', zIndex: 999999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px' }}>📷 Đưa mã vạch vào khung hình</h2>
          <div id="qr-reader" style={{ width: '350px', background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}></div>
          <button onClick={() => ui.setScannerMode(null)} style={{ marginTop: '24px', padding: '12px 30px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Đóng Máy Ảnh (Hủy)</button>
        </div>
      )}

      <div className="pos-main-workspace" style={{ display: "grid", gridTemplateColumns: "70% 30%", gap: "16px" }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ProductSearchAndActions barcodeInput={barcodeInput} setBarcodeInput={setBarcodeInput} setScannerMode={ui.setScannerMode} showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} categories={categories} sortedAndFilteredProducts={sortedAndFilteredProducts} handleSelectSuggest={handleSelectSuggest} setShowInputForm={ui.setShowInputForm} handleFileUpload={handleFileUpload} downloadSampleExcel={downloadSampleExcel} />
          {ui.showInputForm && <ProductInputForm newCode={newCode} setNewCode={setNewCode} newName={newName} setNewName={setNewName} newCategory={newCategory} setNewCategory={setNewCategory} newImportPrice={newImportPrice} setNewImportPrice={setNewImportPrice} newPrice={newPrice} setNewPrice={setNewPrice} newPromoPrice={newPromoPrice} setNewPromoPrice={setNewPromoPrice} newGiftCondition={newGiftCondition} setNewGiftCondition={setNewGiftCondition} newGiftInfo={newGiftInfo} setNewGiftInfo={setNewGiftInfo} newStock={newStock} setNewStock={setNewStock} newExpiry={newExpiry} setNewExpiry={setNewExpiry} handleAddProduct={handleAddProduct} setShowInputForm={ui.setShowInputForm} handleCodeChange={handleCodeChange} categories={categories} loading={loading} />}
          <ProductTable products={sortedAndFilteredProducts} handleSelectSuggest={handleSelectSuggest} handleEdit={handleEdit} handleDelete={handleDelete} setPrintBarcodeProduct={setPrintBarcodeProduct} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <CartPanel cart={cart} setCart={setCart} handleQtyChange={handleQtyChange} cartTotalAmountDisplay={cartTotalAmountDisplay} setIsCheckoutOpen={setIsCheckoutOpen} handleHoldOrder={handleHoldOrder} setCheckoutStep={setCheckoutStep} setShowHoldModal={ui.setShowHoldModal} />
          <HistoryPanel history={history} shift={shift} handleRefund={handleRefund} handleReprint={handleReprint} />
        </div>
      </div>

      {ui.showStoreSettings && <StoreSettingsModal role="admin" onClose={() => ui.setShowStoreSettings(false)} />}
      
      {ui.showSettings && <SettingsModal showSettings={ui.showSettings} setShowSettings={ui.setShowSettings} newBankBin={newBankBin} setNewBankBin={setNewBankBin} newBankAcc={newBankAcc} setNewBankAcc={setNewBankAcc} newBankNameStr={newBankNameStr} setNewBankNameStr={setNewBankNameStr} newZaloPayId={newZaloPayId} setNewZaloPayId={setNewZaloPayId} newHappyStart={newHappyStart} setNewHappyStart={setNewHappyStart} newHappyEnd={newHappyEnd} setNewHappyEnd={setNewHappyEnd} newHappyDiscount={newHappyDiscount} setNewHappyDiscount={setNewHappyDiscount} newAdminPinInput={newAdminPinInput} setNewAdminPinInput={setNewAdminPinInput} newTierConfig={newTierConfig} setNewTierConfig={setNewTierConfig} saveSettings={saveSettings} loading={loading} />}
      
      {ui.showPinModal && <PinModal showPinModal={ui.showPinModal} setShowPinModal={ui.setShowPinModal} correctPin={adminPin} onSuccess={() => { if(pendingAction) pendingAction(); setPendingAction(null); }} />}
      {ui.cashFlowModalInfo && <CashFlowDetailModal flowType={ui.cashFlowModalInfo} onClose={() => ui.setCashFlowModalInfo(null)} allLogs={history} />}
      {isCheckoutOpen && <CheckoutModal checkoutStep={checkoutStep} setCheckoutStep={setCheckoutStep} customersData={customersData} custPhone={custPhone} setCustPhone={setCustPhone} custName={custName} setCustName={setCustName} customerInput={customerInput} setCustomerInput={setCustomerInput} custAddress={custAddress} setCustAddress={setCustAddress} handleCustomerInputChange={handleCustomerInputChange} finalToPay={finalToPay} useWallet={useWallet} setUseWallet={setUseWallet} voucherInput={voucherInput} setVoucherInput={setVoucherInput} handleVoucherSubmit={handleVoucherSubmit} customerGiven={customerGiven} setCustomerGiven={setCustomerGiven} confirmCheckout={confirmCheckout} closeCheckout={closeCheckout} loading={loading} bankBin={bankBin} bankAcc={bankAcc} bankNameStr={bankNameStr} sendReceiptEmail={sendReceiptEmail} setScannerMode={ui.setScannerMode} handleNextToQR={handleNextToQR} setPrintMode={ui.setPrintMode} />}
      {printBarcodeProduct && <ScannerModal product={printBarcodeProduct} barcodeCount={barcodeCount} setBarcodeCount={setBarcodeCount} onClose={() => setPrintBarcodeProduct(null)} />}
      {ui.showScannerLinkModal && <ScannerLinkModal showModal={ui.showScannerLinkModal} setShowModal={ui.setShowScannerLinkModal} />}
      {ui.showHandoverModal && <HandoverModal role="admin" shift={shift} startingCash={startingCash} currentShiftStats={currentShiftStats} onConfirm={confirmHandover} onClose={() => ui.setShowHandoverModal(false)} />}
      
      {ui.showAuditModal && <AuditModal showAuditModal={ui.showAuditModal} setShowAuditModal={ui.setShowAuditModal} auditLogs={auditLogs} exportAuditToCSV={exportAuditToCSV} setSelectedAuditLog={(log: AuditLog) => setSelectedAuditLog(log)} />}
      
      {selectedAuditLog && <AuditDetailModal selectedAuditLog={selectedAuditLog} setSelectedAuditLog={setSelectedAuditLog} />}
      {ui.showHoldModal && <HoldOrdersModal onClose={() => ui.setShowHoldModal(false)} heldOrders={heldOrders} restoreOrder={restoreOrder} deleteHeldOrder={deleteHeldOrder} />}
      {ui.showExpenseModal && <ExpenseModal showExpenseModal={ui.showExpenseModal} setShowExpenseModal={ui.setShowExpenseModal} expenses={expenses} expName={expName} setExpName={setExpName} expAmount={expAmount} setExpAmount={setExpAmount} addExpense={addExpense} deleteExpense={deleteExpense} />}
      {ui.showSupplierModal && <SupplierModal showSupplierModal={ui.showSupplierModal} setShowSupplierModal={ui.setShowSupplierModal} suppliers={suppliers} supName={supName} setSupName={setSupName} supPhone={supPhone} setSupPhone={setSupPhone} supAddress={supAddress} setSupAddress={setSupAddress} supItem={supItem} setSupItem={setSupItem} supTaxCode={supTaxCode} setSupTaxCode={setSupTaxCode} supBankAccount={supBankAccount} setSupBankAccount={setSupBankAccount} addSupplier={addSupplier} deleteSupplier={deleteSupplier} />}
      
      {ui.showPOModal && <POModal showPOModal={ui.showPOModal} setShowPOModal={ui.setShowPOModal} poTab={poTab} setPoTab={setPoTab} suppliers={suppliers} selectedSupplierId={selectedSupplierId} setSelectedSupplierId={setSelectedSupplierId} products={products} poSearch={poSearch} setPoSearch={setPoSearch} poItems={poItems} setPoItems={setPoItems} poNote={poNote} setPoNote={setPoNote} paidAmount={paidAmount} setPaidAmount={setPaidAmount} searchPoCode={searchPoCode} setSearchPoCode={setSearchPoCode} foundPO={foundPO} setFoundPO={setFoundPO} receiveItems={receiveItems} setReceiveItems={setReceiveItems} allPOs={allPOs} loading={loading} onSaveNewPO={handleSaveNewPO} onConfirmReceipt={handleConfirmReceipt} />}
      
      {ui.showStatsModal && <StatsModal reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} history={history} onClose={() => ui.setShowStatsModal(false)} />}
      
      {ui.showInventoryModal && <InventoryModal showInventoryModal={ui.showInventoryModal} setShowInventoryModal={ui.setShowInventoryModal} products={products} inventorySearchTerm={inventorySearchTerm} setInventorySearchTerm={setInventorySearchTerm} invFilter={invFilter} setInvFilter={setInvFilter} actualStockInput={actualStockInput} setActualStockInput={setActualStockInput} syncInventoryCheck={syncInventory} handleImportInventoryCSV={handleImportInventoryCSV} loading={loading} handleInventorySearchEnter={() => {}} exportInventoryCSV={exportInventoryCSV} />}
      
      {ui.showDebtModal && <DebtModal showDebtModal={ui.showDebtModal} setShowDebtModal={ui.setShowDebtModal} customers={customersData} handlePayDebt={handlePayDebt} />}
      
      {ui.showCustomerModal && <CustomerModal showCustomerModal={ui.showCustomerModal} setShowCustomerModal={ui.setShowCustomerModal} customers={customersData} setCustomers={setCustomers} logAudit={logAudit} handleEditPhone={handleEditPhone} printCustomerCard={printCustomerCard} sendCardEmail={sendCardEmail} shareToZalo={shareToZalo} tierConfig={tierConfig} />}
      
      {ui.showMarketingModal && <MarketingModal showMarketingModal={ui.showMarketingModal} setShowMarketingModal={ui.setShowMarketingModal} marketingTier={marketingTier} setMarketingTier={setMarketingTier} marketingMsg={marketingMsg} setMarketingMsg={setMarketingMsg} customersData={customersData} />}

      <div className="print-only">
        <PrintManager 
          printMode={ui.printMode} 
          lastOrder={lastOrder} 
          shift={shift}
          role="admin"
          customers={customersData}
          VAT_RATE={VAT_RATE}
          printCustomer={printCustomer} 
          printPOData={printPOData} 
          printBarcodeProduct={printBarcodeProduct} 
          barcodeCount={barcodeCount} 
        />
      </div>

    </div>
  );
}
